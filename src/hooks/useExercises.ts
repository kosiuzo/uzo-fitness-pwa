/**
 * Exercise Query and Mutation Hooks
 *
 * React Query hooks for exercise library management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { exerciseQueryConfig } from '../lib/queryConfig';
import * as rpc from '../lib/rpc';
import type {
  ExerciseListResponse,
  ExerciseHistoryResponse,
  AddExerciseParams,
} from '../types/rpc';

// ============================================
// QUERY HOOKS (Read Operations)
// ============================================

/**
 * Fetch all exercises in library
 *
 * @example
 * ```tsx
 * function ExerciseLibrary() {
 *   const { data: exercises, isLoading } = useExercises();
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return exercises.map(ex => (
 *     <ExerciseCard key={ex.id} exercise={ex} />
 *   ));
 * }
 * ```
 */
export function useExercises(
  options?: Partial<UseQueryOptions<ExerciseListResponse>>
) {
  return useQuery({
    queryKey: queryKeys.exercises.list(),
    queryFn: () => rpc.exerciseListJson(),
    ...exerciseQueryConfig.list,
    ...options,
  });
}

/**
 * Fetch exercise history across all sessions
 *
 * @example
 * ```tsx
 * function ExerciseProgressChart({ exerciseId }: { exerciseId: string }) {
 *   const { data: history } = useExerciseHistory(exerciseId);
 *
 *   const chartData = history?.sessions.map(s => ({
 *     date: s.sessionDate,
 *     volume: s.totalVolume,
 *     maxWeight: s.maxWeight
 *   }));
 *
 *   return <LineChart data={chartData} />;
 * }
 * ```
 */
export function useExerciseHistory(
  exerciseId: string,
  options?: Partial<UseQueryOptions<ExerciseHistoryResponse>>
) {
  return useQuery({
    queryKey: queryKeys.exercises.history(exerciseId),
    queryFn: () => rpc.exerciseHistoryJson(exerciseId),
    ...exerciseQueryConfig.history,
    enabled: !!exerciseId,
    ...options,
  });
}

// ============================================
// MUTATION HOOKS (Write Operations)
// ============================================

/**
 * Add new exercise to library
 *
 * **Invalidates**: exercises.lists()
 *
 * @example
 * ```tsx
 * const addExercise = useAddExercise();
 *
 * addExercise.mutate({
 *   p_name: 'Bulgarian Split Squat',
 *   p_category: 'strength',
 *   p_description: 'Single-leg squat variation'
 * });
 * ```
 */
export function useAddExercise(
  options?: UseMutationOptions<string, rpc.RPCError, AddExerciseParams>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params) => rpc.addExercise(params),
    onSuccess: (exerciseId, variables, context) => {
      // Invalidate exercise list
      queryClient.invalidateQueries({ queryKey: queryKeys.exercises.lists() });

      options?.onSuccess?.(exerciseId, variables, context);
    },
    ...options,
  });
}

/**
 * Update existing exercise
 *
 * **Invalidates**: exercises.detail(id), exercises.lists()
 *
 * @example
 * ```tsx
 * const updateExercise = useUpdateExercise();
 *
 * updateExercise.mutate({
 *   p_exercise_id: exerciseId,
 *   p_name: 'Updated Name',
 *   p_category: 'cardio'
 * });
 * ```
 */
export function useUpdateExercise(
  options?: UseMutationOptions<
    void,
    rpc.RPCError,
    {
      p_exercise_id: string;
      p_name: string;
      p_category?: 'strength' | 'cardio' | 'mobility' | 'balance';
      p_description?: string | null;
    }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params) => rpc.updateExercise(params),
    onSuccess: (data, variables, context) => {
      // Invalidate specific exercise
      queryClient.invalidateQueries({
        queryKey: queryKeys.exercises.detail(variables.p_exercise_id),
      });
      // Invalidate list (name might have changed)
      queryClient.invalidateQueries({ queryKey: queryKeys.exercises.lists() });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Delete exercise (soft delete)
 *
 * **Invalidates**: exercises.lists(), exercises.detail(id)
 *
 * **Warning**: This doesn't prevent exercise from appearing in historical sessions
 * (sessions preserve exercise name at snapshot time).
 *
 * @example
 * ```tsx
 * const deleteExercise = useDeleteExercise();
 *
 * const handleDelete = async () => {
 *   if (confirm('Delete this exercise? It will still appear in past sessions.')) {
 *     await deleteExercise.mutateAsync(exerciseId);
 *   }
 * };
 * ```
 */
export function useDeleteExercise(
  options?: UseMutationOptions<void, rpc.RPCError, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (exerciseId) => rpc.deleteExercise(exerciseId),
    onSuccess: (data, exerciseId, context) => {
      // Invalidate exercise list
      queryClient.invalidateQueries({ queryKey: queryKeys.exercises.lists() });
      // Invalidate specific exercise
      queryClient.invalidateQueries({
        queryKey: queryKeys.exercises.detail(exerciseId),
      });

      options?.onSuccess?.(data, exerciseId, context);
    },
    ...options,
  });
}
