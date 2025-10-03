/**
 * TanStack Query Configuration
 *
 * Entity-specific cache configurations based on data volatility.
 * Aligns with enhanced spec Section 4.3 cache strategy.
 */

import type { UseQueryOptions } from '@tanstack/react-query';

/**
 * Cache configuration for workouts (change infrequently)
 */
export const workoutQueryConfig = {
  list: {
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  },
  detail: {
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  },
  preview: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
  },
  history: {
    staleTime: 1000 * 60 * 30, // 30 minutes (historical data rarely changes)
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    refetchOnWindowFocus: false,
  },
} satisfies Record<string, Partial<UseQueryOptions>>;

/**
 * Cache configuration for sessions
 */
export const sessionQueryConfig = {
  /**
   * Active session - highly dynamic, poll frequently
   */
  active: {
    staleTime: 1000 * 10, // 10 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 15, // Poll every 15 seconds during active session
    refetchOnWindowFocus: true,
  },
  /**
   * Finished session - static historical data
   */
  detail: {
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    refetchOnWindowFocus: false,
  },
  list: {
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  },
} satisfies Record<string, Partial<UseQueryOptions>>;

/**
 * Cache configuration for exercises (change infrequently)
 */
export const exerciseQueryConfig = {
  list: {
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  },
  detail: {
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  },
  history: {
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    refetchOnWindowFocus: false,
  },
} satisfies Record<string, Partial<UseQueryOptions>>;

/**
 * Cache configuration for cycles
 */
export const cycleQueryConfig = {
  list: {
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  },
  detail: {
    staleTime: 1000 * 60 * 5, // 5 minutes (includes progress tracking)
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: true, // Update progress when user returns
  },
  active: {
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: true,
  },
} satisfies Record<string, Partial<UseQueryOptions>>;

/**
 * Global default configuration
 * Applied to all queries unless overridden
 */
export const defaultQueryConfig = {
  staleTime: 1000 * 60 * 5, // 5 minutes default
  gcTime: 1000 * 60 * 30, // 30 minutes default
  retry: 1, // Retry failed requests once
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
} satisfies Partial<UseQueryOptions>;
