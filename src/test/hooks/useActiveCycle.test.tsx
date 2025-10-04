import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useActiveCycle } from '../../hooks/useCycles';
import { supabase } from '../../config/supabase';

// Mock Supabase
vi.mock('../../config/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('useActiveCycle', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('returns null when no active cycle exists', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        is: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }, // No rows returned
              }),
            }),
          }),
        }),
      }),
    });

    (supabase.from as any).mockImplementation(mockFrom);

    const { result } = renderHook(() => useActiveCycle(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeNull();
  });

  it('fetches and transforms active cycle data correctly', async () => {
    const mockCycle = {
      id: 'cycle-1',
      name: 'Summer Strength',
      workout_id: 'workout-1',
      duration_weeks: 12,
      started_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
      ended_at: null,
    };

    const mockWorkout = {
      name: 'Push Pull Legs',
    };

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'cycles') {
        return {
          select: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockCycle,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'workouts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockWorkout,
                error: null,
              }),
            }),
          }),
        };
      }
    });

    (supabase.from as any).mockImplementation(mockFrom);

    const { result } = renderHook(() => useActiveCycle(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      id: 'cycle-1',
      name: 'Summer Strength',
      workoutId: 'workout-1',
      workoutName: 'Push Pull Legs',
      durationWeeks: 12,
      startedAt: mockCycle.started_at,
      currentWeek: 3, // 14 days = 2 weeks completed + currently in week 3
      daysInCurrentWeek: 0, // 14 % 7 = 0
    });
  });

  it('calculates current week correctly at various time points', async () => {
    const testCases = [
      { daysAgo: 0, expectedWeek: 1, expectedDaysInWeek: 0 },
      { daysAgo: 3, expectedWeek: 1, expectedDaysInWeek: 3 },
      { daysAgo: 7, expectedWeek: 2, expectedDaysInWeek: 0 },
      { daysAgo: 10, expectedWeek: 2, expectedDaysInWeek: 3 },
      { daysAgo: 21, expectedWeek: 4, expectedDaysInWeek: 0 },
    ];

    for (const testCase of testCases) {
      const mockCycle = {
        id: 'cycle-1',
        name: 'Test Cycle',
        workout_id: 'workout-1',
        duration_weeks: 12,
        started_at: new Date(Date.now() - testCase.daysAgo * 24 * 60 * 60 * 1000).toISOString(),
        ended_at: null,
      };

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'cycles') {
          return {
            select: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: mockCycle,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'workouts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { name: 'Test Workout' },
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      (supabase.from as any).mockImplementation(mockFrom);

      queryClient.clear();
      const { result } = renderHook(() => useActiveCycle(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.currentWeek).toBe(testCase.expectedWeek);
      expect(result.current.data?.daysInCurrentWeek).toBe(testCase.expectedDaysInWeek);
    }
  });

  it('caps current week at duration_weeks', async () => {
    const mockCycle = {
      id: 'cycle-1',
      name: 'Test Cycle',
      workout_id: 'workout-1',
      duration_weeks: 4,
      started_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), // 100 days ago
      ended_at: null,
    };

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'cycles') {
        return {
          select: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockCycle,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'workouts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { name: 'Test Workout' },
                error: null,
              }),
            }),
          }),
        };
      }
    });

    (supabase.from as any).mockImplementation(mockFrom);

    const { result } = renderHook(() => useActiveCycle(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.currentWeek).toBe(4); // Capped at duration_weeks
  });

  it('throws error on database failure', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        is: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST301', message: 'Database error' },
              }),
            }),
          }),
        }),
      }),
    });

    (supabase.from as any).mockImplementation(mockFrom);

    const { result } = renderHook(() => useActiveCycle(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});
