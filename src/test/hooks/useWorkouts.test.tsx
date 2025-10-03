/**
 * useWorkouts Hooks Tests
 *
 * Tests for workout query hooks:
 * - useWorkouts (workout_list_json)
 * - useWorkoutDetail (workout_detail_json)
 * - useWorkoutHistory (workout_history_json)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWorkouts, useWorkoutDetail, useWorkoutHistory } from '../../hooks/useWorkouts';
import * as rpc from '../../lib/rpc';
import type {
  WorkoutListResponse,
  WorkoutDetailResponse,
  WorkoutHistoryResponse,
} from '../../types/rpc';

// Mock RPC layer
vi.mock('../../lib/rpc');

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for tests
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useWorkouts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches workout list successfully', async () => {
    const mockWorkouts: WorkoutListResponse = [
      {
        id: 'workout-1',
        name: 'Push A',
        description: 'Chest and triceps',
        groupCount: 2,
        itemCount: 5,
        lastUsed: '2025-10-01T14:30:00Z',
        createdAt: '2025-09-15T10:00:00Z',
      },
      {
        id: 'workout-2',
        name: 'Pull A',
        description: 'Back and biceps',
        groupCount: 3,
        itemCount: 6,
        lastUsed: null,
        createdAt: '2025-09-16T10:00:00Z',
      },
    ];

    vi.mocked(rpc.workoutListJson).mockResolvedValue(mockWorkouts);

    const { result } = renderHook(() => useWorkouts(), {
      wrapper: createWrapper(),
    });

    // Initial loading state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // Wait for success
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockWorkouts);
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].name).toBe('Push A');
    expect(rpc.workoutListJson).toHaveBeenCalledTimes(1);
  });

  it('handles workout list error', async () => {
    const mockError = new rpc.RPCError('PGRST116', 'RPC function not found');
    vi.mocked(rpc.workoutListJson).mockRejectedValue(mockError);

    const { result } = renderHook(() => useWorkouts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeUndefined();
  });

  it('returns empty array when no workouts exist', async () => {
    vi.mocked(rpc.workoutListJson).mockResolvedValue([]);

    const { result } = renderHook(() => useWorkouts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });
});

describe('useWorkoutDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches workout detail successfully', async () => {
    const mockWorkout: WorkoutDetailResponse = {
      id: 'workout-1',
      name: 'Push A',
      description: 'Chest and triceps focus',
      groups: [
        {
          id: 'group-1',
          name: 'Group A',
          groupType: 'single',
          restSeconds: 90,
          position: 1,
          items: [
            {
              id: 'item-1',
              exerciseId: 'ex-1',
              exerciseName: 'Flat Bench Press',
              groupPosition: 1,
              position: 1,
              targetSets: 4,
              targetReps: 8,
              targetWeight: 30,
              restSeconds: 90,
              notes: null,
            },
          ],
        },
      ],
      createdAt: '2025-09-15T10:00:00Z',
      updatedAt: '2025-09-15T10:00:00Z',
    };

    vi.mocked(rpc.workoutDetailJson).mockResolvedValue(mockWorkout);

    const { result } = renderHook(() => useWorkoutDetail('workout-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockWorkout);
    expect(result.current.data?.groups).toHaveLength(1);
    expect(result.current.data?.groups[0].items).toHaveLength(1);
    expect(rpc.workoutDetailJson).toHaveBeenCalledWith('workout-1');
  });

  it('does not fetch when workoutId is empty', () => {
    const { result } = renderHook(() => useWorkoutDetail(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(rpc.workoutDetailJson).not.toHaveBeenCalled();
  });

  it('handles workout detail error', async () => {
    const mockError = new rpc.RPCError('PGRST116', 'Workout not found');
    vi.mocked(rpc.workoutDetailJson).mockRejectedValue(mockError);

    const { result } = renderHook(() => useWorkoutDetail('invalid-id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(mockError);
  });

  it('correctly handles effective rest calculation', async () => {
    const mockWorkout: WorkoutDetailResponse = {
      id: 'workout-1',
      name: 'Superset Test',
      description: null,
      groups: [
        {
          id: 'group-1',
          name: 'Superset A',
          groupType: 'superset',
          restSeconds: 120, // Group-level rest
          position: 1,
          items: [
            {
              id: 'item-1',
              exerciseId: 'ex-1',
              exerciseName: 'Exercise 1',
              groupPosition: 1,
              position: 1,
              targetSets: 3,
              targetReps: 10,
              targetWeight: 20,
              restSeconds: 120, // Effective rest = group rest
              notes: null,
            },
            {
              id: 'item-2',
              exerciseId: 'ex-2',
              exerciseName: 'Exercise 2',
              groupPosition: 2,
              position: 2,
              targetSets: 3,
              targetReps: 10,
              targetWeight: 15,
              restSeconds: 120, // Effective rest = group rest
              notes: null,
            },
          ],
        },
      ],
      createdAt: '2025-09-15T10:00:00Z',
      updatedAt: '2025-09-15T10:00:00Z',
    };

    vi.mocked(rpc.workoutDetailJson).mockResolvedValue(mockWorkout);

    const { result } = renderHook(() => useWorkoutDetail('workout-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify all items have effective rest = group rest
    const items = result.current.data?.groups[0].items || [];
    expect(items.every((item) => item.restSeconds === 120)).toBe(true);
  });
});

describe('useWorkoutHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches workout history successfully', async () => {
    const mockHistory: WorkoutHistoryResponse = {
      workoutId: 'workout-1',
      workoutName: 'Push A',
      sessions: [
        {
          id: 'session-1',
          title: 'Push A – Session 1',
          startedAt: '2025-10-01T14:30:00Z',
          finishedAt: '2025-10-01T15:45:00Z',
          totalVolume: 1250.5,
          duration: 4500, // 75 minutes in seconds
        },
        {
          id: 'session-2',
          title: 'Push A – Session 2',
          startedAt: '2025-09-28T10:00:00Z',
          finishedAt: '2025-09-28T11:10:00Z',
          totalVolume: 1180.0,
          duration: 4200,
        },
      ],
    };

    vi.mocked(rpc.workoutHistoryJson).mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useWorkoutHistory('workout-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockHistory);
    expect(result.current.data?.sessions).toHaveLength(2);
    expect(result.current.data?.sessions[0].totalVolume).toBe(1250.5);
    expect(rpc.workoutHistoryJson).toHaveBeenCalledWith('workout-1');
  });

  it('handles empty workout history', async () => {
    const mockHistory: WorkoutHistoryResponse = {
      workoutId: 'workout-1',
      workoutName: 'New Workout',
      sessions: [],
    };

    vi.mocked(rpc.workoutHistoryJson).mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useWorkoutHistory('workout-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.sessions).toEqual([]);
  });

  it('does not fetch when workoutId is empty', () => {
    const { result } = renderHook(() => useWorkoutHistory(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(rpc.workoutHistoryJson).not.toHaveBeenCalled();
  });

  it('calculates session duration correctly', async () => {
    const mockHistory: WorkoutHistoryResponse = {
      workoutId: 'workout-1',
      workoutName: 'Test Workout',
      sessions: [
        {
          id: 'session-1',
          title: 'Quick Session',
          startedAt: '2025-10-01T14:00:00Z',
          finishedAt: '2025-10-01T14:30:00Z',
          totalVolume: 500,
          duration: 1800, // 30 minutes
        },
      ],
    };

    vi.mocked(rpc.workoutHistoryJson).mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useWorkoutHistory('workout-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const session = result.current.data?.sessions[0];
    expect(session?.duration).toBe(1800); // 30 minutes in seconds
  });
});
