/**
 * Session Query and Mutation Hooks
 *
 * React Query hooks for session execution and tracking.
 * Includes optimistic updates for set logging (critical UX path).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { sessionQueryConfig } from '../lib/queryConfig';
import * as rpc from '../lib/rpc';
import type {
  SessionDetailResponse,
  StartSessionParams,
  LogSetParams,
  FinishSessionParams,
  SetLog,
} from '../types/rpc';

// ============================================
// QUERY HOOKS (Read Operations)
// ============================================

/**
 * Fetch session detail
 *
 * Use with isActive=true for polling during active workout
 *
 * @example
 * ```tsx
 * // Active session (polls every 15s)
 * const { data: session } = useSessionDetail(sessionId, { isActive: true });
 *
 * // Finished session (cached 30min)
 * const { data: session } = useSessionDetail(sessionId, { isActive: false });
 * ```
 */
export function useSessionDetail(
  sessionId: string,
  options?: Partial<UseQueryOptions<SessionDetailResponse>> & {
    isActive?: boolean;
  }
) {
  const { isActive, ...queryOptions } = options || {};

  return useQuery({
    queryKey: queryKeys.sessions.detail(sessionId),
    queryFn: () => rpc.sessionDetailJson(sessionId),
    // Use active config if session is in progress
    ...(isActive ? sessionQueryConfig.active : sessionQueryConfig.detail),
    enabled: !!sessionId,
    ...queryOptions,
  });
}

// ============================================
// MUTATION HOOKS (Write Operations)
// ============================================

/**
 * Start new workout session
 *
 * **Invalidates**: sessions.active(), cycles.detail(cycleId)?
 *
 * @example
 * ```tsx
 * const startSession = useStartSession();
 *
 * // From workout
 * startSession.mutate(
 *   { p_workout_id: workoutId },
 *   {
 *     onSuccess: (sessionId) => {
 *       navigate(`/sessions/${sessionId}`);
 *     }
 *   }
 * );
 *
 * // From cycle
 * startSession.mutate({
 *   p_cycle_id: cycleId,
 *   p_workout_id: workoutId,
 *   p_title: 'Push A – Week 1'
 * });
 *
 * // Freestyle
 * startSession.mutate({
 *   p_title: 'Quick Arm Workout'
 * });
 * ```
 */
export function useStartSession(
  options?: UseMutationOptions<string, rpc.RPCError, StartSessionParams>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params) => rpc.startSession(params),
    onSuccess: (sessionId, variables, context) => {
      // Invalidate active sessions
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.active(),
      });

      // If part of cycle, invalidate cycle progress
      if (variables.p_cycle_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.cycles.detail(variables.p_cycle_id),
        });
      }

      // Prefetch session detail for smooth navigation
      queryClient.prefetchQuery({
        queryKey: queryKeys.sessions.detail(sessionId),
        queryFn: () => rpc.sessionDetailJson(sessionId),
      });

      options?.onSuccess?.(sessionId, variables, context);
    },
    ...options,
  });
}

/**
 * Log a set during active session
 *
 * **Invalidates**: sessions.detail(sessionId)
 * **Optimistic Update**: Yes (critical for gym UX)
 *
 * @example
 * ```tsx
 * const logSet = useLogSet();
 *
 * logSet.mutate({
 *   sessionId: sessionId,
 *   sessionItemId: itemId,
 *   reps: 8,
 *   weight: 30
 * });
 * ```
 */
export function useLogSet(
  options?: UseMutationOptions<
    string,
    rpc.RPCError,
    LogSetParams & { sessionId: string }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, ...params }) => rpc.logSet(params),
    // Optimistic update for instant feedback
    onMutate: async (variables) => {
      const queryKey = queryKeys.sessions.detail(variables.sessionId);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousSession = queryClient.getQueryData<SessionDetailResponse>(queryKey);

      // Optimistically add the set
      if (previousSession) {
        queryClient.setQueryData<SessionDetailResponse>(queryKey, (old) => {
          if (!old) return old;

          // Find the session item to add set to
          const updatedGroups = old.groups.map((group) => ({
            ...group,
            items: group.items.map((item) => {
              if (item.id === variables.p_session_item_id) {
                const newSetNumber = item.sets.length + 1;
                const volume = variables.p_reps * variables.p_weight;

                const newSet: SetLog = {
                  id: `optimistic-${Date.now()}`, // Temporary ID
                  reps: variables.p_reps,
                  weight: variables.p_weight,
                  volume,
                  setNumber: newSetNumber,
                  completedAt: new Date().toISOString(),
                };

                return {
                  ...item,
                  sets: [...item.sets, newSet],
                  setsCompleted: item.setsCompleted + 1,
                  itemVolume: item.itemVolume + volume,
                };
              }
              return item;
            }),
          }));

          // Recalculate group and total volumes
          const groupsWithVolumes = updatedGroups.map((group) => ({
            ...group,
            groupVolume: group.items.reduce((sum, item) => sum + item.itemVolume, 0),
          }));

          const totalVolume = groupsWithVolumes.reduce(
            (sum, group) => sum + group.groupVolume,
            0
          );

          return {
            ...old,
            groups: groupsWithVolumes,
            totalVolume,
          };
        });
      }

      return { previousSession };
    },
    // Rollback on error
    onError: (error, variables, context) => {
      if (context?.previousSession) {
        queryClient.setQueryData(
          queryKeys.sessions.detail(variables.sessionId),
          context.previousSession
        );
      }

      options?.onError?.(error, variables, context);
    },
    // Always refetch to get server-generated ID and accurate totals
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(variables.sessionId),
      });

      options?.onSettled?.(data, error, variables, context);
    },
    ...options,
  });
}

/**
 * Finish active session
 *
 * **Invalidates**: sessions.detail(id), sessions.active(), workouts.history(workoutId)?, cycles.detail(cycleId)?, exercises.histories()
 *
 * @example
 * ```tsx
 * const finishSession = useFinishSession();
 *
 * const handleFinish = async () => {
 *   await finishSession.mutateAsync({
 *     sessionId: sessionId,
 *     workoutId: workoutId, // For invalidation
 *     cycleId: cycleId // For invalidation
 *   });
 *   navigate(`/sessions/${sessionId}/summary`);
 * };
 * ```
 */
export function useFinishSession(
  options?: UseMutationOptions<
    void,
    rpc.RPCError,
    FinishSessionParams & {
      workoutId?: string;
      cycleId?: string;
    }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, workoutId, cycleId, ...params }) =>
      rpc.finishSession(params),
    onSuccess: (data, variables, context) => {
      // Invalidate session detail
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(variables.p_session_id),
      });

      // Invalidate active sessions
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.active(),
      });

      // If workout-based, invalidate workout history
      if (variables.workoutId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.workouts.history(variables.workoutId),
        });
      }

      // If cycle-based, invalidate cycle progress
      if (variables.cycleId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.cycles.detail(variables.cycleId),
        });
      }

      // Invalidate all exercise histories (session affects multiple exercises)
      queryClient.invalidateQueries({
        queryKey: queryKeys.exercises.histories(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}
