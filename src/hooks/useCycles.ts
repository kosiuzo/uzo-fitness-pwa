/**
 * Cycle Query Hooks
 *
 * React Query hooks for cycle-related operations.
 * Manages multi-week workout programs.
 */

import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '../config/supabase';

// ============================================
// TYPES
// ============================================

export interface ActiveCycle {
  id: string;
  name: string;
  workoutId: string;
  workoutName: string;
  durationWeeks: number;
  startedAt: string;
  currentWeek: number;
  daysInCurrentWeek: number;
}

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Fetch active cycle (if any exists)
 *
 * An active cycle is one where ended_at is null.
 * Returns null if no active cycle exists.
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { data: activeCycle, isLoading } = useActiveCycle();
 *
 *   if (isLoading) return <Spinner />;
 *   if (!activeCycle) return <p>No active cycle</p>;
 *
 *   return <ActiveCycleCard cycle={activeCycle} />;
 * }
 * ```
 */
export function useActiveCycle(
  options?: Omit<UseQueryOptions<ActiveCycle | null>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ActiveCycle | null>({
    queryKey: ['cycles', 'active'],
    queryFn: async () => {
      // Get active cycle (where ended_at is null)
      const { data: cycle, error: cycleError } = await supabase
        .from('cycles')
        .select(`
          id,
          name,
          workout_id,
          duration_weeks,
          started_at,
          ended_at
        `)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      // No active cycle is a valid state, not an error
      if (cycleError && cycleError.code === 'PGRST116') {
        return null;
      }

      if (cycleError) {
        throw cycleError;
      }

      if (!cycle) {
        return null;
      }

      // Get workout name
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .select('name')
        .eq('id', cycle.workout_id)
        .single();

      if (workoutError) {
        throw workoutError;
      }

      // Calculate current week (1-indexed)
      const startDate = new Date(cycle.started_at);
      const today = new Date();
      const daysSinceStart = Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const currentWeek = Math.min(
        Math.floor(daysSinceStart / 7) + 1,
        cycle.duration_weeks
      );

      // Calculate days in current week (0-7)
      const daysInCurrentWeek = daysSinceStart % 7;

      return {
        id: cycle.id,
        name: cycle.name,
        workoutId: cycle.workout_id,
        workoutName: workout.name,
        durationWeeks: cycle.duration_weeks,
        startedAt: cycle.started_at,
        currentWeek,
        daysInCurrentWeek,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    ...options,
  });
}
