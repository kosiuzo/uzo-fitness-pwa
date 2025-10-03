/**
 * useSessions Hooks Tests
 *
 * Tests for session query hook:
 * - useSessionDetail (session_detail_json)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSessionDetail } from '../../hooks/useSessions';
import * as rpc from '../../lib/rpc';
import type { SessionDetailResponse } from '../../types/rpc';

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

describe('useSessionDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches active session detail successfully', async () => {
    const mockSession: SessionDetailResponse = {
      id: 'session-1',
      title: 'Push A – Session 1',
      workoutId: 'workout-1',
      startedAt: '2025-10-02T14:00:00Z',
      finishedAt: null, // Active session
      totalVolume: 500.5,
      groups: [
        {
          id: 'group-1',
          name: 'Group A',
          groupType: 'single',
          restSeconds: 90,
          position: 1,
          groupVolume: 500.5,
          items: [
            {
              id: 'item-1',
              exerciseId: 'ex-1',
              exerciseName: 'Flat Bench Press',
              groupPosition: 1,
              targetSets: 4,
              targetReps: 8,
              targetWeight: 30,
              restSeconds: 90,
              sets: [
                {
                  id: 'set-1',
                  reps: 8,
                  weight: 30,
                  volume: 240,
                  setNumber: 1,
                  completedAt: '2025-10-02T14:05:00Z',
                },
                {
                  id: 'set-2',
                  reps: 8,
                  weight: 30,
                  volume: 240,
                  setNumber: 2,
                  completedAt: '2025-10-02T14:07:30Z',
                },
              ],
              setsCompleted: 2,
              itemVolume: 480,
            },
          ],
        },
      ],
    };

    vi.mocked(rpc.sessionDetailJson).mockResolvedValue(mockSession);

    const { result } = renderHook(
      () => useSessionDetail('session-1', { isActive: true }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockSession);
    expect(result.current.data?.finishedAt).toBeNull();
    expect(result.current.data?.groups).toHaveLength(1);
    expect(result.current.data?.groups[0].items[0].sets).toHaveLength(2);
    expect(rpc.sessionDetailJson).toHaveBeenCalledWith('session-1');
  });

  it('fetches finished session detail successfully', async () => {
    const mockSession: SessionDetailResponse = {
      id: 'session-1',
      title: 'Push A – Completed',
      workoutId: 'workout-1',
      startedAt: '2025-10-01T14:00:00Z',
      finishedAt: '2025-10-01T15:30:00Z', // Finished session
      totalVolume: 1250.5,
      groups: [
        {
          id: 'group-1',
          name: 'Group A',
          groupType: 'superset',
          restSeconds: 120,
          position: 1,
          groupVolume: 1250.5,
          items: [
            {
              id: 'item-1',
              exerciseId: 'ex-1',
              exerciseName: 'Flat Bench Press',
              groupPosition: 1,
              targetSets: 4,
              targetReps: 8,
              targetWeight: 30,
              restSeconds: 120,
              sets: [
                {
                  id: 'set-1',
                  reps: 8,
                  weight: 30,
                  volume: 240,
                  setNumber: 1,
                  completedAt: '2025-10-01T14:05:00Z',
                },
                {
                  id: 'set-2',
                  reps: 8,
                  weight: 30,
                  volume: 240,
                  setNumber: 2,
                  completedAt: '2025-10-01T14:07:30Z',
                },
                {
                  id: 'set-3',
                  reps: 7,
                  weight: 30,
                  volume: 210,
                  setNumber: 3,
                  completedAt: '2025-10-01T14:10:00Z',
                },
                {
                  id: 'set-4',
                  reps: 6,
                  weight: 30,
                  volume: 180,
                  setNumber: 4,
                  completedAt: '2025-10-01T14:12:30Z',
                },
              ],
              setsCompleted: 4,
              itemVolume: 870,
            },
            {
              id: 'item-2',
              exerciseId: 'ex-2',
              exerciseName: 'Incline Dumbbell Press',
              groupPosition: 2,
              targetSets: 3,
              targetReps: 10,
              targetWeight: 12.5,
              restSeconds: 120,
              sets: [
                {
                  id: 'set-5',
                  reps: 10,
                  weight: 12.5,
                  volume: 125,
                  setNumber: 1,
                  completedAt: '2025-10-01T14:15:00Z',
                },
                {
                  id: 'set-6',
                  reps: 9,
                  weight: 12.5,
                  volume: 112.5,
                  setNumber: 2,
                  completedAt: '2025-10-01T14:18:00Z',
                },
                {
                  id: 'set-7',
                  reps: 9,
                  weight: 12.5,
                  volume: 112.5,
                  setNumber: 3,
                  completedAt: '2025-10-01T14:21:00Z',
                },
              ],
              setsCompleted: 3,
              itemVolume: 350,
            },
          ],
        },
      ],
    };

    vi.mocked(rpc.sessionDetailJson).mockResolvedValue(mockSession);

    const { result } = renderHook(
      () => useSessionDetail('session-1', { isActive: false }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.finishedAt).not.toBeNull();
    expect(result.current.data?.totalVolume).toBe(1250.5);
    expect(result.current.data?.groups[0].items).toHaveLength(2);
  });

  it('does not fetch when sessionId is empty', () => {
    const { result } = renderHook(() => useSessionDetail(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(rpc.sessionDetailJson).not.toHaveBeenCalled();
  });

  it('handles session detail error', async () => {
    const mockError = new rpc.RPCError('PGRST116', 'Session not found');
    vi.mocked(rpc.sessionDetailJson).mockRejectedValue(mockError);

    const { result } = renderHook(() => useSessionDetail('invalid-id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(mockError);
  });

  it('correctly calculates volume totals', async () => {
    const mockSession: SessionDetailResponse = {
      id: 'session-1',
      title: 'Volume Test',
      workoutId: 'workout-1',
      startedAt: '2025-10-02T14:00:00Z',
      finishedAt: null,
      totalVolume: 600, // Should match sum of all set volumes
      groups: [
        {
          id: 'group-1',
          name: 'Test Group',
          groupType: 'single',
          restSeconds: 90,
          position: 1,
          groupVolume: 600,
          items: [
            {
              id: 'item-1',
              exerciseId: 'ex-1',
              exerciseName: 'Test Exercise',
              groupPosition: 1,
              targetSets: 3,
              targetReps: 10,
              targetWeight: 20,
              restSeconds: 90,
              sets: [
                {
                  id: 'set-1',
                  reps: 10,
                  weight: 20,
                  volume: 200,
                  setNumber: 1,
                  completedAt: '2025-10-02T14:05:00Z',
                },
                {
                  id: 'set-2',
                  reps: 10,
                  weight: 20,
                  volume: 200,
                  setNumber: 2,
                  completedAt: '2025-10-02T14:07:30Z',
                },
                {
                  id: 'set-3',
                  reps: 10,
                  weight: 20,
                  volume: 200,
                  setNumber: 3,
                  completedAt: '2025-10-02T14:10:00Z',
                },
              ],
              setsCompleted: 3,
              itemVolume: 600,
            },
          ],
        },
      ],
    };

    vi.mocked(rpc.sessionDetailJson).mockResolvedValue(mockSession);

    const { result } = renderHook(() => useSessionDetail('session-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const session = result.current.data!;
    const item = session.groups[0].items[0];

    // Verify set volumes sum to item volume
    const setsVolume = item.sets.reduce((sum, set) => sum + set.volume, 0);
    expect(item.itemVolume).toBe(setsVolume);

    // Verify group volume matches item volume
    expect(session.groups[0].groupVolume).toBe(item.itemVolume);

    // Verify total volume matches group volume
    expect(session.totalVolume).toBe(session.groups[0].groupVolume);
  });

  it('handles superset with multiple exercises', async () => {
    const mockSession: SessionDetailResponse = {
      id: 'session-1',
      title: 'Superset Test',
      workoutId: 'workout-1',
      startedAt: '2025-10-02T14:00:00Z',
      finishedAt: null,
      totalVolume: 750,
      groups: [
        {
          id: 'group-1',
          name: 'Superset A',
          groupType: 'superset',
          restSeconds: 120,
          position: 1,
          groupVolume: 750,
          items: [
            {
              id: 'item-1',
              exerciseId: 'ex-1',
              exerciseName: 'Exercise 1',
              groupPosition: 1,
              targetSets: 3,
              targetReps: 10,
              targetWeight: 15,
              restSeconds: 120,
              sets: [
                {
                  id: 'set-1',
                  reps: 10,
                  weight: 15,
                  volume: 150,
                  setNumber: 1,
                  completedAt: '2025-10-02T14:05:00Z',
                },
                {
                  id: 'set-2',
                  reps: 10,
                  weight: 15,
                  volume: 150,
                  setNumber: 2,
                  completedAt: '2025-10-02T14:10:00Z',
                },
              ],
              setsCompleted: 2,
              itemVolume: 300,
            },
            {
              id: 'item-2',
              exerciseId: 'ex-2',
              exerciseName: 'Exercise 2',
              groupPosition: 2,
              targetSets: 3,
              targetReps: 10,
              targetWeight: 15,
              restSeconds: 120,
              sets: [
                {
                  id: 'set-3',
                  reps: 10,
                  weight: 15,
                  volume: 150,
                  setNumber: 1,
                  completedAt: '2025-10-02T14:06:30Z',
                },
                {
                  id: 'set-4',
                  reps: 10,
                  weight: 15,
                  volume: 150,
                  setNumber: 2,
                  completedAt: '2025-10-02T14:11:30Z',
                },
                {
                  id: 'set-5',
                  reps: 10,
                  weight: 15,
                  volume: 150,
                  setNumber: 3,
                  completedAt: '2025-10-02T14:13:00Z',
                },
              ],
              setsCompleted: 3,
              itemVolume: 450,
            },
          ],
        },
      ],
    };

    vi.mocked(rpc.sessionDetailJson).mockResolvedValue(mockSession);

    const { result } = renderHook(() => useSessionDetail('session-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const group = result.current.data?.groups[0];
    expect(group?.groupType).toBe('superset');
    expect(group?.items).toHaveLength(2);
    expect(group?.items[0].groupPosition).toBe(1);
    expect(group?.items[1].groupPosition).toBe(2);
    expect(group?.groupVolume).toBe(750);
  });

  it('handles empty session (no sets logged)', async () => {
    const mockSession: SessionDetailResponse = {
      id: 'session-1',
      title: 'Empty Session',
      workoutId: 'workout-1',
      startedAt: '2025-10-02T14:00:00Z',
      finishedAt: null,
      totalVolume: 0,
      groups: [
        {
          id: 'group-1',
          name: 'Group A',
          groupType: 'single',
          restSeconds: 90,
          position: 1,
          groupVolume: 0,
          items: [
            {
              id: 'item-1',
              exerciseId: 'ex-1',
              exerciseName: 'Exercise',
              groupPosition: 1,
              targetSets: 4,
              targetReps: 8,
              targetWeight: 30,
              restSeconds: 90,
              sets: [],
              setsCompleted: 0,
              itemVolume: 0,
            },
          ],
        },
      ],
    };

    vi.mocked(rpc.sessionDetailJson).mockResolvedValue(mockSession);

    const { result } = renderHook(() => useSessionDetail('session-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.totalVolume).toBe(0);
    expect(result.current.data?.groups[0].items[0].sets).toEqual([]);
    expect(result.current.data?.groups[0].items[0].setsCompleted).toBe(0);
  });
});
