/**
 * useExercises Mutation Hooks Tests
 *
 * Tests for exercise write hooks:
 * - useAddExercise
 * - useUpdateExercise
 * - useDeleteExercise
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAddExercise, useUpdateExercise, useDeleteExercise } from '../../hooks/useExercises';
import { queryKeys } from '../../lib/queryKeys';
import * as rpc from '../../lib/rpc';

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

describe('Exercise mutation hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useAddExercise calls RPC and invalidates list', async () => {
    const { queryClient, wrapper } = createClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.mocked(rpc.addExercise).mockResolvedValue('ex-123');

    const { result } = renderHook(() => useAddExercise(), { wrapper });

    const params = { p_name: 'Bulgarian Split Squat', p_category: 'strength' as const };
    const id = await result.current.mutateAsync(params);
    expect(id).toBe('ex-123');
    expect(rpc.addExercise).toHaveBeenCalledWith(params);
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.exercises.lists() })
    );
  });

  it('useUpdateExercise invalidates detail and lists', async () => {
    const { queryClient, wrapper } = createClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.mocked(rpc.updateExercise).mockResolvedValue();

    const { result } = renderHook(() => useUpdateExercise(), { wrapper });

    const params = {
      p_exercise_id: 'ex-5',
      p_name: 'Updated Name',
      p_category: 'cardio' as const,
      p_description: 'desc',
    };
    await result.current.mutateAsync(params);

    expect(rpc.updateExercise).toHaveBeenCalledWith(params);
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.exercises.detail('ex-5') })
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.exercises.lists() })
    );
  });

  it('useDeleteExercise invalidates lists and detail', async () => {
    const { queryClient, wrapper } = createClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.mocked(rpc.deleteExercise).mockResolvedValue();

    const { result } = renderHook(() => useDeleteExercise(), { wrapper });

    await result.current.mutateAsync('ex-9');

    expect(rpc.deleteExercise).toHaveBeenCalledWith('ex-9');
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.exercises.lists() })
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.exercises.detail('ex-9') })
    );
  });
});

