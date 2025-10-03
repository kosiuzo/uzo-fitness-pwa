/**
 * useSessions Mutation Hooks Tests
 *
 * Tests for session write hooks:
 * - useStartSession (invalidations + prefetch)
 * - useLogSet (optimistic update + rollback + invalidation)
 * - useFinishSession (invalidations incl. optional keys)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStartSession, useLogSet, useFinishSession } from '../../hooks/useSessions';
import { queryKeys } from '../../lib/queryKeys';
import * as rpc from '../../lib/rpc';
import type { SessionDetailResponse } from '../../types/rpc';

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

describe('Session mutation hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useStartSession invalidates active list, invalidates cycle detail when provided, and prefetches session detail', async () => {
    const { queryClient, wrapper } = createClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery');

    vi.mocked(rpc.startSession).mockResolvedValue('session-123');
    vi.mocked(rpc.sessionDetailJson).mockResolvedValue({} as any);

    const { result } = renderHook(() => useStartSession(), { wrapper });

    const vars = { p_cycle_id: 'c1', p_workout_id: 'w1', p_title: 'Day 1' };
    let sessionId: string | undefined;
    await act(async () => {
      sessionId = await result.current.mutateAsync(vars);
    });
    expect(sessionId).toBe('session-123');
    expect(rpc.startSession).toHaveBeenCalledWith(vars);

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: queryKeys.sessions.active() })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: queryKeys.cycles.detail('c1') })
      );
      expect(prefetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: queryKeys.sessions.detail('session-123') })
      );
    });
  });

  it('useLogSet performs optimistic update and invalidates on settle', async () => {
    const { queryClient, wrapper } = createClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // Resolve log_set
    vi.mocked(rpc.logSet).mockResolvedValue('set-111');

    // Seed a session with one item with 1 set
    const sessionId = 's1';
    const itemId = 'si1';
    const initial: SessionDetailResponse = {
      id: sessionId,
      title: 'S',
      workoutId: 'w1',
      startedAt: '2025-10-02T00:00:00Z',
      finishedAt: null,
      totalVolume: 100,
      groups: [
        {
          id: 'g1',
          name: 'A',
          groupType: 'single',
          restSeconds: 60,
          position: 1,
          groupVolume: 100,
          items: [
            {
              id: itemId,
              exerciseId: 'ex1',
              exerciseName: 'Bench',
              groupPosition: 'A1',
              targetSets: 3,
              targetReps: 8,
              targetWeight: 30,
              restSeconds: 60,
              setsCompleted: 1,
              itemVolume: 100,
              sets: [
                {
                  id: 'set-1',
                  reps: 10,
                  weight: 10,
                  volume: 100,
                  setNumber: 1,
                  completedAt: '2025-10-02T00:00:00Z',
                },
              ],
            },
          ],
        },
      ],
    };

    queryClient.setQueryData(queryKeys.sessions.detail(sessionId), initial);

    const { result } = renderHook(() => useLogSet(), { wrapper });

    // Trigger optimistic update
    await act(async () => {
      result.current.mutate({
        sessionId,
        p_session_item_id: itemId,
        p_reps: 8,
        p_weight: 30,
      });
    });

    // Verify optimistic cache changes (wait for onMutate)
    await vi.waitUntil(() => {
      const cur = queryClient.getQueryData<SessionDetailResponse>(
        queryKeys.sessions.detail(sessionId)
      );
      return !!cur && cur.groups[0].items[0].sets.length === 2;
    });

    const optimistic = queryClient.getQueryData<SessionDetailResponse>(
      queryKeys.sessions.detail(sessionId)
    )!;
    const item = optimistic.groups[0].items[0];
    expect(item.sets).toHaveLength(2);
    expect(item.setsCompleted).toBe(2);
    expect(item.itemVolume).toBeGreaterThan(100);
    expect(optimistic.totalVolume).toBeGreaterThan(100);

    // Wait for settle -> invalidation
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: queryKeys.sessions.detail(sessionId) })
      );
    });
  });

  it('useLogSet rolls back on error', async () => {
    const { queryClient, wrapper } = createClientWrapper();
    const error = new rpc.RPCError('XX', 'fail');
    vi.mocked(rpc.logSet).mockRejectedValue(error);

    const sessionId = 's2';
    const itemId = 'it2';
    const initial: SessionDetailResponse = {
      id: sessionId,
      title: 'S',
      workoutId: null,
      startedAt: '2025-10-02T00:00:00Z',
      finishedAt: null,
      totalVolume: 0,
      groups: [
        {
          id: 'g1',
          name: 'A',
          groupType: 'single',
          restSeconds: 60,
          position: 1,
          groupVolume: 0,
          items: [
            {
              id: itemId,
              exerciseId: 'ex1',
              exerciseName: 'Bench',
              groupPosition: 'A1',
              targetSets: 3,
              targetReps: 8,
              targetWeight: 30,
              restSeconds: 60,
              setsCompleted: 0,
              itemVolume: 0,
              sets: [],
            },
          ],
        },
      ],
    };
    queryClient.setQueryData(queryKeys.sessions.detail(sessionId), initial);

    const { result } = renderHook(() => useLogSet(), { wrapper });
    await act(async () => {
      await result.current
        .mutateAsync({ sessionId, p_session_item_id: itemId, p_reps: 8, p_weight: 30 })
        .catch(() => {});
    });

    const final = queryClient.getQueryData<SessionDetailResponse>(
      queryKeys.sessions.detail(sessionId)
    )!;
    // Should roll back to original state
    expect(final.groups[0].items[0].sets).toHaveLength(0);
    expect(final.totalVolume).toBe(0);
  });

  it('useFinishSession invalidates session detail, active list, optional workout history and cycle detail, and exercise histories', async () => {
    const { queryClient, wrapper } = createClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.mocked(rpc.finishSession).mockResolvedValue();

    const { result } = renderHook(() => useFinishSession(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        p_session_id: 's3',
        workoutId: 'w3',
        cycleId: 'c3',
      });
    });

    await waitFor(() => {
      // Always
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: queryKeys.sessions.detail('s3') })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: queryKeys.sessions.active() })
      );
      // Optional keys
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: queryKeys.workouts.history('w3') })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: queryKeys.cycles.detail('c3') })
      );
      // Exercise histories
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: queryKeys.exercises.histories() })
      );
    });
  });
});
