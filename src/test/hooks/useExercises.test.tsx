/**
 * useExercises Hooks Tests
 *
 * Tests for exercise query hooks:
 * - useExercises (exercise_list_json)
 * - useExerciseHistory (exercise_history_json)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useExercises, useExerciseHistory } from '../../hooks/useExercises';
import * as rpc from '../../lib/rpc';
import type {
  ExerciseListResponse,
  ExerciseHistoryResponse,
} from '../../types/rpc';

// Mock RPC layer
vi.mock('../../lib/rpc');

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useExercises', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches exercise list successfully', async () => {
    const mockExercises: ExerciseListResponse = [
      {
        id: 'ex-1',
        name: 'Flat Bench Press',
        category: 'strength',
        description: 'Barbell bench press on flat bench',
        timesUsed: 15,
        lastUsed: '2025-10-01T14:30:00Z',
      },
      {
        id: 'ex-2',
        name: 'Pull-ups',
        category: 'strength',
        description: null,
        timesUsed: 8,
        lastUsed: '2025-09-28T10:00:00Z',
      },
      {
        id: 'ex-3',
        name: 'Jump Rope',
        category: 'cardio',
        description: 'Double unders',
        timesUsed: 0,
        lastUsed: null,
      },
    ];

    vi.mocked(rpc.exerciseListJson).mockResolvedValue(mockExercises);

    const { result } = renderHook(() => useExercises(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockExercises);
    expect(result.current.data).toHaveLength(3);
    expect(result.current.data[0].name).toBe('Flat Bench Press');
    expect(result.current.data[2].timesUsed).toBe(0);
    expect(rpc.exerciseListJson).toHaveBeenCalledTimes(1);
  });

  it('handles exercise list error', async () => {
    const mockError = new rpc.RPCError('PGRST116', 'RPC function not found');
    vi.mocked(rpc.exerciseListJson).mockRejectedValue(mockError);

    const { result } = renderHook(() => useExercises(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(mockError);
  });

  it('returns empty array when no exercises exist', async () => {
    vi.mocked(rpc.exerciseListJson).mockResolvedValue([]);

    const { result } = renderHook(() => useExercises(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it('correctly shows usage stats', async () => {
    const mockExercises: ExerciseListResponse = [
      {
        id: 'ex-1',
        name: 'Squat',
        category: 'strength',
        description: 'Back squat',
        timesUsed: 25,
        lastUsed: '2025-10-02T09:00:00Z',
      },
      {
        id: 'ex-2',
        name: 'Deadlift',
        category: 'strength',
        description: 'Conventional deadlift',
        timesUsed: 20,
        lastUsed: '2025-10-01T10:00:00Z',
      },
      {
        id: 'ex-3',
        name: 'Plank',
        category: 'balance',
        description: 'Core stability',
        timesUsed: 0,
        lastUsed: null, // Never used
      },
    ];

    vi.mocked(rpc.exerciseListJson).mockResolvedValue(mockExercises);

    const { result } = renderHook(() => useExercises(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const exercises = result.current.data!;
    expect(exercises[0].timesUsed).toBe(25);
    expect(exercises[2].lastUsed).toBeNull();
  });

  it('groups exercises by category correctly', async () => {
    const mockExercises: ExerciseListResponse = [
      {
        id: 'ex-1',
        name: 'Bench Press',
        category: 'strength',
        description: null,
        timesUsed: 10,
        lastUsed: '2025-10-01T14:30:00Z',
      },
      {
        id: 'ex-2',
        name: 'Running',
        category: 'cardio',
        description: null,
        timesUsed: 5,
        lastUsed: '2025-09-25T08:00:00Z',
      },
      {
        id: 'ex-3',
        name: 'Stretching',
        category: 'mobility',
        description: null,
        timesUsed: 3,
        lastUsed: '2025-09-20T07:00:00Z',
      },
      {
        id: 'ex-4',
        name: 'Balance Board',
        category: 'balance',
        description: null,
        timesUsed: 1,
        lastUsed: '2025-09-15T18:00:00Z',
      },
    ];

    vi.mocked(rpc.exerciseListJson).mockResolvedValue(mockExercises);

    const { result } = renderHook(() => useExercises(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const exercises = result.current.data!;
    const categories = exercises.map((e) => e.category);
    expect(categories).toContain('strength');
    expect(categories).toContain('cardio');
    expect(categories).toContain('mobility');
    expect(categories).toContain('balance');
  });
});

describe('useExerciseHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches exercise history successfully', async () => {
    const mockHistory: ExerciseHistoryResponse = {
      exerciseId: 'ex-1',
      exerciseName: 'Flat Bench Press',
      sessions: [
        {
          sessionId: 'session-1',
          sessionDate: '2025-10-01T14:00:00Z',
          sessionTitle: 'Push A – Session 1',
          setsPerformed: 4,
          totalVolume: 960,
          maxWeight: 30,
          avgReps: 8,
          sets: [
            { reps: 8, weight: 30, volume: 240 },
            { reps: 8, weight: 30, volume: 240 },
            { reps: 8, weight: 30, volume: 240 },
            { reps: 8, weight: 30, volume: 240 },
          ],
        },
        {
          sessionId: 'session-2',
          sessionDate: '2025-09-28T10:00:00Z',
          sessionTitle: 'Push A – Session 2',
          setsPerformed: 4,
          totalVolume: 900,
          maxWeight: 30,
          avgReps: 7.5,
          sets: [
            { reps: 8, weight: 30, volume: 240 },
            { reps: 8, weight: 30, volume: 240 },
            { reps: 7, weight: 30, volume: 210 },
            { reps: 7, weight: 30, volume: 210 },
          ],
        },
      ],
    };

    vi.mocked(rpc.exerciseHistoryJson).mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useExerciseHistory('ex-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockHistory);
    expect(result.current.data?.sessions).toHaveLength(2);
    expect(result.current.data?.sessions[0].totalVolume).toBe(960);
    expect(rpc.exerciseHistoryJson).toHaveBeenCalledWith('ex-1');
  });

  it('handles empty exercise history', async () => {
    const mockHistory: ExerciseHistoryResponse = {
      exerciseId: 'ex-1',
      exerciseName: 'New Exercise',
      sessions: [],
    };

    vi.mocked(rpc.exerciseHistoryJson).mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useExerciseHistory('ex-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.sessions).toEqual([]);
  });

  it('does not fetch when exerciseId is empty', () => {
    const { result } = renderHook(() => useExerciseHistory(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(rpc.exerciseHistoryJson).not.toHaveBeenCalled();
  });

  it('handles exercise history error', async () => {
    const mockError = new rpc.RPCError('PGRST116', 'Exercise not found');
    vi.mocked(rpc.exerciseHistoryJson).mockRejectedValue(mockError);

    const { result } = renderHook(() => useExerciseHistory('invalid-id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(mockError);
  });

  it('shows progressive overload across sessions', async () => {
    const mockHistory: ExerciseHistoryResponse = {
      exerciseId: 'ex-1',
      exerciseName: 'Squat',
      sessions: [
        {
          sessionId: 'session-3',
          sessionDate: '2025-10-01T09:00:00Z',
          sessionTitle: 'Legs – Week 3',
          setsPerformed: 3,
          totalVolume: 900,
          maxWeight: 100,
          avgReps: 3,
          sets: [
            { reps: 3, weight: 100, volume: 300 },
            { reps: 3, weight: 100, volume: 300 },
            { reps: 3, weight: 100, volume: 300 },
          ],
        },
        {
          sessionId: 'session-2',
          sessionDate: '2025-09-24T09:00:00Z',
          sessionTitle: 'Legs – Week 2',
          setsPerformed: 3,
          totalVolume: 855,
          maxWeight: 95,
          avgReps: 3,
          sets: [
            { reps: 3, weight: 95, volume: 285 },
            { reps: 3, weight: 95, volume: 285 },
            { reps: 3, weight: 95, volume: 285 },
          ],
        },
        {
          sessionId: 'session-1',
          sessionDate: '2025-09-17T09:00:00Z',
          sessionTitle: 'Legs – Week 1',
          setsPerformed: 3,
          totalVolume: 810,
          maxWeight: 90,
          avgReps: 3,
          sets: [
            { reps: 3, weight: 90, volume: 270 },
            { reps: 3, weight: 90, volume: 270 },
            { reps: 3, weight: 90, volume: 270 },
          ],
        },
      ],
    };

    vi.mocked(rpc.exerciseHistoryJson).mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useExerciseHistory('ex-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const sessions = result.current.data!.sessions;

    // Verify progressive overload (most recent first)
    expect(sessions[0].maxWeight).toBe(100);
    expect(sessions[1].maxWeight).toBe(95);
    expect(sessions[2].maxWeight).toBe(90);

    // Verify volume progression
    expect(sessions[0].totalVolume).toBeGreaterThan(sessions[1].totalVolume);
    expect(sessions[1].totalVolume).toBeGreaterThan(sessions[2].totalVolume);
  });

  it('calculates volume correctly for sets with varying reps', async () => {
    const mockHistory: ExerciseHistoryResponse = {
      exerciseId: 'ex-1',
      exerciseName: 'Dumbbell Curl',
      sessions: [
        {
          sessionId: 'session-1',
          sessionDate: '2025-10-01T16:00:00Z',
          sessionTitle: 'Arms',
          setsPerformed: 4,
          totalVolume: 750,
          maxWeight: 15,
          avgReps: 12.5,
          sets: [
            { reps: 15, weight: 15, volume: 225 }, // Warm-up
            { reps: 12, weight: 15, volume: 180 },
            { reps: 12, weight: 15, volume: 180 },
            { reps: 11, weight: 15, volume: 165 }, // Fatigue
          ],
        },
      ],
    };

    vi.mocked(rpc.exerciseHistoryJson).mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useExerciseHistory('ex-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const session = result.current.data!.sessions[0];

    // Verify volume calculation
    const calculatedVolume = session.sets.reduce(
      (sum, set) => sum + set.volume,
      0
    );
    expect(session.totalVolume).toBe(calculatedVolume);

    // Verify average reps
    expect(session.avgReps).toBe(12.5);
  });

  it('shows multiple sessions for same exercise across different workouts', async () => {
    const mockHistory: ExerciseHistoryResponse = {
      exerciseId: 'ex-1',
      exerciseName: 'Pull-ups',
      sessions: [
        {
          sessionId: 'session-1',
          sessionDate: '2025-10-01T10:00:00Z',
          sessionTitle: 'Pull A',
          setsPerformed: 3,
          totalVolume: 300,
          maxWeight: 0, // Bodyweight
          avgReps: 10,
          sets: [
            { reps: 10, weight: 0, volume: 100 },
            { reps: 10, weight: 0, volume: 100 },
            { reps: 10, weight: 0, volume: 100 },
          ],
        },
        {
          sessionId: 'session-2',
          sessionDate: '2025-09-30T09:00:00Z',
          sessionTitle: 'Full Body',
          setsPerformed: 2,
          totalVolume: 180,
          maxWeight: 0,
          avgReps: 9,
          sets: [
            { reps: 10, weight: 0, volume: 100 },
            { reps: 8, weight: 0, volume: 80 },
          ],
        },
        {
          sessionId: 'session-3',
          sessionDate: '2025-09-28T14:00:00Z',
          sessionTitle: 'Freestyle',
          setsPerformed: 1,
          totalVolume: 70,
          maxWeight: 0,
          avgReps: 7,
          sets: [{ reps: 7, weight: 0, volume: 70 }],
        },
      ],
    };

    vi.mocked(rpc.exerciseHistoryJson).mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useExerciseHistory('ex-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const sessions = result.current.data!.sessions;

    // Verify same exercise appears in different workout types
    expect(sessions[0].sessionTitle).toBe('Pull A');
    expect(sessions[1].sessionTitle).toBe('Full Body');
    expect(sessions[2].sessionTitle).toBe('Freestyle');

    // All sessions should have same exercise
    expect(result.current.data!.exerciseId).toBe('ex-1');
    expect(result.current.data!.exerciseName).toBe('Pull-ups');
  });
});
