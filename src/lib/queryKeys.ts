/**
 * TanStack Query Key Hierarchy
 *
 * Centralized query key definitions for type-safe cache invalidation.
 * Follow TanStack Query best practices with hierarchical arrays.
 *
 * @see https://tanstack.com/query/latest/docs/react/guides/query-keys
 */

export const queryKeys = {
  // ============================================
  // WORKOUTS
  // ============================================
  workouts: {
    all: ['workouts'] as const,
    lists: () => [...queryKeys.workouts.all, 'list'] as const,
    list: () => [...queryKeys.workouts.lists()] as const,
    details: () => [...queryKeys.workouts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.workouts.details(), id] as const,
    previews: () => [...queryKeys.workouts.all, 'preview'] as const,
    preview: (id: string) => [...queryKeys.workouts.previews(), id] as const,
    histories: () => [...queryKeys.workouts.all, 'history'] as const,
    history: (id: string) => [...queryKeys.workouts.histories(), id] as const,
  },

  // ============================================
  // SESSIONS
  // ============================================
  sessions: {
    all: ['sessions'] as const,
    lists: () => [...queryKeys.sessions.all, 'list'] as const,
    list: () => [...queryKeys.sessions.lists()] as const,
    details: () => [...queryKeys.sessions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.sessions.details(), id] as const,
    active: () => [...queryKeys.sessions.all, 'active'] as const,
  },

  // ============================================
  // EXERCISES
  // ============================================
  exercises: {
    all: ['exercises'] as const,
    lists: () => [...queryKeys.exercises.all, 'list'] as const,
    list: () => [...queryKeys.exercises.lists()] as const,
    details: () => [...queryKeys.exercises.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.exercises.details(), id] as const,
    histories: () => [...queryKeys.exercises.all, 'history'] as const,
    history: (id: string) => [...queryKeys.exercises.histories(), id] as const,
  },

  // ============================================
  // CYCLES
  // ============================================
  cycles: {
    all: ['cycles'] as const,
    lists: () => [...queryKeys.cycles.all, 'list'] as const,
    list: () => [...queryKeys.cycles.lists()] as const,
    details: () => [...queryKeys.cycles.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.cycles.details(), id] as const,
    active: () => [...queryKeys.cycles.all, 'active'] as const,
  },
} as const;

/**
 * Type-safe query key extraction
 * Usage: type WorkoutDetailKey = QueryKey<typeof queryKeys.workouts.detail>
 */
export type QueryKey<T extends (...args: any[]) => readonly any[]> = ReturnType<T>;
