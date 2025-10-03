/**
 * useWorkouts Mutation Hooks Tests
 *
 * Tests for workout write hooks:
 * - useAddWorkout
 * - useUpdateWorkout
 * - useDeleteWorkout
 * - useAddWorkoutGroup
 * - useReorderWorkoutGroups (optimistic update + rollback)
 * - useAddWorkoutItem
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useAddWorkout,
  useUpdateWorkout,
  useDeleteWorkout,
  useAddWorkoutGroup,
  useReorderWorkoutGroups,
  useAddWorkoutItem,
} from '../../hooks/useWorkouts';
import { queryKeys } from '../../lib/queryKeys';
import * as rpc from '../../lib/rpc';
import type { WorkoutDetailResponse } from '../../types/rpc';

// Mock RPC layer
vi.mock('../../lib/rpc');

function createClientWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}

describe('Workout mutation hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useAddWorkout calls RPC and invalidates workouts list', async () => {
    const { queryClient, wrapper } = createClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    vi.mocked(rpc.addWorkout).mockResolvedValue('workout-123');

    const { result } = renderHook(() => useAddWorkout(), { wrapper });

    const params = { p_name: 'New Workout', p_description: 'Desc' };
    let newId: string | undefined;
    await act(async () => {
      newId = await result.current.mutateAsync(params);
    });

    expect(newId).toBe('workout-123');
    expect(rpc.addWorkout).toHaveBeenCalledWith(params);
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.workouts.lists() })
    );
  });

  it('useUpdateWorkout invalidates detail and lists', async () => {
    const { queryClient, wrapper } = createClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.mocked(rpc.updateWorkout).mockResolvedValue();

    const { result } = renderHook(() => useUpdateWorkout(), { wrapper });

    const params = {
      p_workout_id: 'w1',
      p_name: 'Updated',
      p_description: 'New',
    };
    await act(async () => {
      await result.current.mutateAsync(params);
    });

    expect(rpc.updateWorkout).toHaveBeenCalledWith(params);
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.workouts.detail('w1') })
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.workouts.lists() })
    );
  });

  it('useDeleteWorkout invalidates lists, detail, and cycles', async () => {
    const { queryClient, wrapper } = createClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.mocked(rpc.deleteWorkout).mockResolvedValue();

    const { result } = renderHook(() => useDeleteWorkout(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('w2');
    });

    expect(rpc.deleteWorkout).toHaveBeenCalledWith('w2');
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.workouts.lists() })
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.workouts.detail('w2') })
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.cycles.all })
    );
  });

  it('useAddWorkoutGroup invalidates workout detail', async () => {
    const { queryClient, wrapper } = createClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.mocked(rpc.addWorkoutGroup).mockResolvedValue('group-1');

    const { result } = renderHook(() => useAddWorkoutGroup(), { wrapper });

    const params = {
      p_workout_id: 'w1',
      p_name: 'Group A',
      p_group_type: 'single' as const,
      p_rest_seconds: 90,
    };
    let gid: string | undefined;
    await act(async () => {
      gid = await result.current.mutateAsync(params);
    });
    expect(gid).toBe('group-1');
    expect(rpc.addWorkoutGroup).toHaveBeenCalledWith(params);
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.workouts.detail('w1') })
    );
  });

  it('useReorderWorkoutGroups applies optimistic update and invalidates on settle', async () => {
    const { queryClient, wrapper } = createClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.mocked(rpc.reorderWorkoutGroups).mockResolvedValue();

    // Seed cache with workout detail having 3 groups
    const workoutId = 'w-optimistic';
    const initial: WorkoutDetailResponse = {
      id: workoutId,
      name: 'Wo',
      description: null,
      createdAt: '2025-10-02T00:00:00Z',
      updatedAt: '2025-10-02T00:00:00Z',
      groups: [
        { id: 'g1', name: 'A', groupType: 'single', restSeconds: 60, position: 1, items: [] },
        { id: 'g2', name: 'B', groupType: 'single', restSeconds: 60, position: 2, items: [] },
        { id: 'g3', name: 'C', groupType: 'single', restSeconds: 60, position: 3, items: [] },
      ],
    };
    queryClient.setQueryData(queryKeys.workouts.detail(workoutId), initial);

    const { result } = renderHook(() => useReorderWorkoutGroups(), { wrapper });

    // Move g2 to the end
    await act(async () => {
      result.current.mutate({
        p_workout_id: workoutId,
        p_moved_group_id: 'g2',
        p_before_group_id: null,
      });
    });

    // Wait for optimistic state to apply
    await waitFor(() => {
      const cur = queryClient.getQueryData<WorkoutDetailResponse>(
        queryKeys.workouts.detail(workoutId)
      );
      expect(cur).toBeTruthy();
      expect(cur!.groups.map((g) => g.id)).toEqual(['g1', 'g3', 'g2']);
    });

    const optimistic = queryClient.getQueryData<WorkoutDetailResponse>(
      queryKeys.workouts.detail(workoutId)
    )!;
    expect(optimistic.groups.map((g) => g.id)).toEqual(['g1', 'g3', 'g2']);
    expect(optimistic.groups[2].position).toBe(3);

    // Wait for onSettled invalidation
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: queryKeys.workouts.detail(workoutId) })
      );
    });
  });

  it('useReorderWorkoutGroups rolls back on error', async () => {
    const { queryClient, wrapper } = createClientWrapper();
    const error = new rpc.RPCError('XX', 'fail');
    vi.mocked(rpc.reorderWorkoutGroups).mockRejectedValue(error);

    const workoutId = 'w-rollback';
    const initial: WorkoutDetailResponse = {
      id: workoutId,
      name: 'Wo',
      description: null,
      createdAt: '2025-10-02T00:00:00Z',
      updatedAt: '2025-10-02T00:00:00Z',
      groups: [
        { id: 'g1', name: 'A', groupType: 'single', restSeconds: 60, position: 1, items: [] },
        { id: 'g2', name: 'B', groupType: 'single', restSeconds: 60, position: 2, items: [] },
        { id: 'g3', name: 'C', groupType: 'single', restSeconds: 60, position: 3, items: [] },
      ],
    };
    queryClient.setQueryData(queryKeys.workouts.detail(workoutId), initial);

    const { result } = renderHook(() => useReorderWorkoutGroups(), { wrapper });

    await act(async () => {
      await result.current
        .mutateAsync({
          p_workout_id: workoutId,
          p_moved_group_id: 'g2',
          p_before_group_id: 'g1',
        })
        .catch(() => {});
    });

    const final = queryClient.getQueryData<WorkoutDetailResponse>(
      queryKeys.workouts.detail(workoutId)
    )!;
    // Should roll back to original order
    expect(final.groups.map((g) => g.id)).toEqual(['g1', 'g2', 'g3']);
  });

  it('useAddWorkoutItem invalidates workout detail with provided workoutId', async () => {
    const { queryClient, wrapper } = createClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.mocked(rpc.addWorkoutItem).mockResolvedValue('item-1');

    const { result } = renderHook(() => useAddWorkoutItem(), { wrapper });

    const variables = {
      workoutId: 'w3',
      p_workout_group_id: 'g9',
      p_exercise_id: 'ex1',
      p_target_sets: 4,
      p_target_reps: 8,
      p_target_weight: 30,
      p_rest_seconds: null,
    };

    let id: string | undefined;
    await act(async () => {
      id = await result.current.mutateAsync(variables);
    });
    expect(id).toBe('item-1');
    expect(rpc.addWorkoutItem).toHaveBeenCalledWith({
      p_workout_group_id: 'g9',
      p_exercise_id: 'ex1',
      p_target_sets: 4,
      p_target_reps: 8,
      p_target_weight: 30,
      p_rest_seconds: null,
    });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.workouts.detail('w3') })
    );
  });
});
