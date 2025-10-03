/**
 * Workout Query and Mutation Hooks
 *
 * React Query hooks for workout-related operations.
 * Implements query key strategy and cache invalidation from spec Section 5.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { workoutQueryConfig } from '../lib/queryConfig';
import * as rpc from '../lib/rpc';
import type {
  WorkoutListResponse,
  WorkoutDetailResponse,
  WorkoutHistoryResponse,
  AddWorkoutParams,
  UpdateWorkoutParams,
  AddWorkoutGroupParams,
  ReorderWorkoutGroupsParams,
  AddWorkoutItemParams,
} from '../types/rpc';

// ============================================
// QUERY HOOKS (Read Operations)
// ============================================

/**
 * Fetch all workouts
 *
 * @example
 * ```tsx
 * function WorkoutList() {
 *   const { data: workouts, isLoading } = useWorkouts();
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return workouts.map(w => <WorkoutCard key={w.id} workout={w} />);
 * }
 * ```
 */
export function useWorkouts(
  options?: Partial<UseQueryOptions<WorkoutListResponse>>
) {
  return useQuery({
    queryKey: queryKeys.workouts.list(),
    queryFn: () => rpc.workoutListJson(),
    ...workoutQueryConfig.list,
    ...options,
  });
}

/**
 * Fetch single workout detail
 *
 * @example
 * ```tsx
 * function WorkoutEditor({ workoutId }: { workoutId: string }) {
 *   const { data: workout } = useWorkoutDetail(workoutId);
 *
 *   return (
 *     <div>
 *       <h1>{workout?.name}</h1>
 *       {workout?.groups.map(g => <GroupEditor key={g.id} group={g} />)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useWorkoutDetail(
  workoutId: string,
  options?: Partial<UseQueryOptions<WorkoutDetailResponse>>
) {
  return useQuery({
    queryKey: queryKeys.workouts.detail(workoutId),
    queryFn: () => rpc.workoutDetailJson(workoutId),
    ...workoutQueryConfig.detail,
    enabled: !!workoutId, // Don't fetch if no ID
    ...options,
  });
}

/**
 * Fetch workout history (all sessions)
 *
 * @example
 * ```tsx
 * function WorkoutHistory({ workoutId }: { workoutId: string }) {
 *   const { data: history } = useWorkoutHistory(workoutId);
 *
 *   return history?.sessions.map(s => (
 *     <SessionCard key={s.id} session={s} />
 *   ));
 * }
 * ```
 */
export function useWorkoutHistory(
  workoutId: string,
  options?: Partial<UseQueryOptions<WorkoutHistoryResponse>>
) {
  return useQuery({
    queryKey: queryKeys.workouts.history(workoutId),
    queryFn: () => rpc.workoutHistoryJson(workoutId),
    ...workoutQueryConfig.history,
    enabled: !!workoutId,
    ...options,
  });
}

// ============================================
// MUTATION HOOKS (Write Operations)
// ============================================

/**
 * Create new workout
 *
 * **Invalidates**: workouts.lists()
 *
 * @example
 * ```tsx
 * function CreateWorkoutForm() {
 *   const createWorkout = useAddWorkout();
 *
 *   const handleSubmit = (data) => {
 *     createWorkout.mutate(
 *       { p_name: data.name, p_description: data.description },
 *       {
 *         onSuccess: (workoutId) => {
 *           navigate(`/workouts/${workoutId}`);
 *         }
 *       }
 *     );
 *   };
 * }
 * ```
 */
export function useAddWorkout(
  options?: UseMutationOptions<string, rpc.RPCError, AddWorkoutParams>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params) => rpc.addWorkout(params),
    onSuccess: (workoutId, variables, context) => {
      // Invalidate workout list
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.lists() });

      // Call user's onSuccess if provided
      options?.onSuccess?.(workoutId, variables, context);
    },
    ...options,
  });
}

/**
 * Update existing workout
 *
 * **Invalidates**: workouts.detail(id), workouts.lists()
 *
 * @example
 * ```tsx
 * const updateWorkout = useUpdateWorkout();
 *
 * updateWorkout.mutate({
 *   p_workout_id: workoutId,
 *   p_name: 'Updated Name',
 *   p_description: 'New description'
 * });
 * ```
 */
export function useUpdateWorkout(
  options?: UseMutationOptions<void, rpc.RPCError, UpdateWorkoutParams>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params) => rpc.updateWorkout(params),
    onSuccess: (data, variables, context) => {
      // Invalidate specific workout
      queryClient.invalidateQueries({
        queryKey: queryKeys.workouts.detail(variables.p_workout_id),
      });
      // Invalidate list (name might have changed)
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.lists() });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Delete workout (soft delete)
 *
 * **Invalidates**: workouts.lists(), workouts.detail(id), cycles.all
 *
 * @example
 * ```tsx
 * const deleteWorkout = useDeleteWorkout();
 *
 * const handleDelete = async () => {
 *   if (confirm('Delete this workout?')) {
 *     await deleteWorkout.mutateAsync(workoutId);
 *     navigate('/workouts');
 *   }
 * };
 * ```
 */
export function useDeleteWorkout(
  options?: UseMutationOptions<void, rpc.RPCError, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workoutId) => rpc.deleteWorkout(workoutId),
    onSuccess: (data, workoutId, context) => {
      // Invalidate workout list
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.lists() });
      // Invalidate specific workout
      queryClient.invalidateQueries({
        queryKey: queryKeys.workouts.detail(workoutId),
      });
      // Invalidate cycles (might reference deleted workout)
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.all });

      options?.onSuccess?.(data, workoutId, context);
    },
    ...options,
  });
}

/**
 * Add group to workout
 *
 * **Invalidates**: workouts.detail(workoutId)
 *
 * @example
 * ```tsx
 * const addGroup = useAddWorkoutGroup();
 *
 * addGroup.mutate({
 *   p_workout_id: workoutId,
 *   p_name: 'Group B',
 *   p_group_type: 'superset',
 *   p_rest_seconds: 120
 * });
 * ```
 */
export function useAddWorkoutGroup(
  options?: UseMutationOptions<string, rpc.RPCError, AddWorkoutGroupParams>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params) => rpc.addWorkoutGroup(params),
    onSuccess: (groupId, variables, context) => {
      // Invalidate workout detail (structure changed)
      queryClient.invalidateQueries({
        queryKey: queryKeys.workouts.detail(variables.p_workout_id),
      });

      options?.onSuccess?.(groupId, variables, context);
    },
    ...options,
  });
}

/**
 * Reorder workout groups
 *
 * **Invalidates**: workouts.detail(workoutId)
 * **Optimistic Update**: Yes (for smooth drag-and-drop UX)
 *
 * @example
 * ```tsx
 * const reorderGroups = useReorderWorkoutGroups();
 *
 * // Move Group B before Group C
 * reorderGroups.mutate({
 *   p_workout_id: workoutId,
 *   p_moved_group_id: groupBId,
 *   p_before_group_id: groupCId
 * });
 *
 * // Move to end
 * reorderGroups.mutate({
 *   p_workout_id: workoutId,
 *   p_moved_group_id: groupBId,
 *   p_before_group_id: null
 * });
 * ```
 */
export function useReorderWorkoutGroups(
  options?: UseMutationOptions<void, rpc.RPCError, ReorderWorkoutGroupsParams>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params) => rpc.reorderWorkoutGroups(params),
    // Optimistic update for smooth UX
    onMutate: async (variables) => {
      const queryKey = queryKeys.workouts.detail(variables.p_workout_id);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousWorkout = queryClient.getQueryData<WorkoutDetailResponse>(queryKey);

      // Optimistically update cache
      if (previousWorkout) {
        queryClient.setQueryData<WorkoutDetailResponse>(queryKey, (old) => {
          if (!old) return old;

          // Find the group to move
          const movedGroupIndex = old.groups.findIndex(
            (g) => g.id === variables.p_moved_group_id
          );
          if (movedGroupIndex === -1) return old;

          const movedGroup = old.groups[movedGroupIndex];
          const newGroups = old.groups.filter((_, i) => i !== movedGroupIndex);

          // Insert at new position
          if (variables.p_before_group_id) {
            const beforeIndex = newGroups.findIndex(
              (g) => g.id === variables.p_before_group_id
            );
            newGroups.splice(beforeIndex, 0, movedGroup);
          } else {
            // Move to end
            newGroups.push(movedGroup);
          }

          // Update positions
          const groupsWithNewPositions = newGroups.map((g, index) => ({
            ...g,
            position: index + 1,
          }));

          return {
            ...old,
            groups: groupsWithNewPositions,
          };
        });
      }

      return { previousWorkout };
    },
    // Rollback on error
    onError: (error, variables, context) => {
      if (context?.previousWorkout) {
        queryClient.setQueryData(
          queryKeys.workouts.detail(variables.p_workout_id),
          context.previousWorkout
        );
      }

      options?.onError?.(error, variables, context);
    },
    // Always refetch to ensure consistency
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workouts.detail(variables.p_workout_id),
      });

      options?.onSettled?.(data, error, variables, context);
    },
    ...options,
  });
}

/**
 * Add exercise item to workout group
 *
 * **Invalidates**: workouts.detail(workoutId)
 *
 * @example
 * ```tsx
 * const addItem = useAddWorkoutItem();
 *
 * addItem.mutate({
 *   p_workout_group_id: groupId,
 *   p_exercise_id: exerciseId,
 *   p_target_sets: 4,
 *   p_target_reps: 8,
 *   p_target_weight: 30,
 *   p_rest_seconds: null // Inherit from group
 * });
 * ```
 */
export function useAddWorkoutItem(
  options?: UseMutationOptions<string, rpc.RPCError, AddWorkoutItemParams & { workoutId: string }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workoutId, ...params }) => rpc.addWorkoutItem(params),
    onSuccess: (itemId, variables, context) => {
      // Invalidate workout detail
      queryClient.invalidateQueries({
        queryKey: queryKeys.workouts.detail(variables.workoutId),
      });

      options?.onSuccess?.(itemId, variables, context);
    },
    ...options,
  });
}
