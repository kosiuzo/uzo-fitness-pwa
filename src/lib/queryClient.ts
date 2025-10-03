/**
 * TanStack Query Client Configuration
 *
 * Global QueryClient instance with default configuration.
 * Used by QueryClientProvider in App.tsx.
 */

import { QueryClient } from '@tanstack/react-query';
import { defaultQueryConfig } from './queryConfig';

/**
 * Global QueryClient instance
 *
 * @example
 * ```tsx
 * import { QueryClientProvider } from '@tanstack/react-query';
 * import { queryClient } from './lib/queryClient';
 *
 * function App() {
 *   return (
 *     <QueryClientProvider client={queryClient}>
 *       <YourApp />
 *     </QueryClientProvider>
 *   );
 * }
 * ```
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      ...defaultQueryConfig,
      // Throw errors to error boundaries instead of returning error state
      useErrorBoundary: false, // Set to true if using error boundaries
    },
    mutations: {
      // Don't retry mutations by default (they often have side effects)
      retry: 0,
      // Throw errors to error boundaries
      useErrorBoundary: false,
    },
  },
});

/**
 * Utility: Clear all query cache
 * Useful for logout or data reset scenarios
 */
export function clearAllQueries() {
  queryClient.clear();
}

/**
 * Utility: Invalidate all queries (force refetch)
 * Useful after bulk operations or data migrations
 */
export function refetchAllQueries() {
  return queryClient.invalidateQueries();
}
