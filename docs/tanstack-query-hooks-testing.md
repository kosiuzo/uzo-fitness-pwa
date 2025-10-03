# TanStack Query Hooks - Implementation & Testing Summary

**Date**: 2025-10-02
**Status**: ✅ Complete
**Test Coverage**: 30 tests passing

---

## Overview

Comprehensive test suite for all TanStack Query hooks that wrap Supabase JSON RPC functions. All 5 read RPCs from the spec are fully implemented with extensive test coverage.

---

## Implemented Hooks

### 1. Workout Hooks ([useWorkouts.ts](../src/hooks/useWorkouts.ts))

#### `useWorkouts()`
- **RPC**: `workout_list_json()`
- **Purpose**: Fetch all workouts for workout library view
- **Query Key**: `['workouts', 'list']`
- **Cache Time**: 5 minutes (stale: 1min)
- **Tests**: ✅ 3 tests

#### `useWorkoutDetail(workoutId)`
- **RPC**: `workout_detail_json(p_workout_id UUID)`
- **Purpose**: Full workout editor payload with groups and items
- **Query Key**: `['workouts', 'detail', workoutId]`
- **Cache Time**: 5 minutes (stale: 1min)
- **Features**: Effective rest calculation, conditional fetching
- **Tests**: ✅ 4 tests

#### `useWorkoutHistory(workoutId)`
- **RPC**: `workout_history_json(p_workout_id UUID)`
- **Purpose**: All sessions for a specific workout
- **Query Key**: `['workouts', 'history', workoutId]`
- **Cache Time**: 30 minutes (stale: 5min)
- **Tests**: ✅ 4 tests

### 2. Session Hooks ([useSessions.ts](../src/hooks/useSessions.ts))

#### `useSessionDetail(sessionId, { isActive })`
- **RPC**: `session_detail_json(p_session_id UUID)`
- **Purpose**: Complete session data with groups, items, and logged sets
- **Query Key**: `['sessions', 'detail', sessionId]`
- **Cache Time**:
  - Active: 10s stale, 15s refetch interval
  - Finished: 30min stale, no refetch
- **Features**: Volume totals, superset support, conditional config
- **Tests**: ✅ 7 tests

### 3. Exercise Hooks ([useExercises.ts](../src/hooks/useExercises.ts))

#### `useExercises()`
- **RPC**: `exercise_list_json()`
- **Purpose**: All exercises in user's library with usage stats
- **Query Key**: `['exercises', 'list']`
- **Cache Time**: 10 minutes (stale: 2min)
- **Features**: Usage stats, category grouping
- **Tests**: ✅ 5 tests

#### `useExerciseHistory(exerciseId)`
- **RPC**: `exercise_history_json(p_exercise_id UUID)`
- **Purpose**: Historical performance data for one exercise
- **Query Key**: `['exercises', 'history', exerciseId]`
- **Cache Time**: 30 minutes (stale: 5min)
- **Features**: Progressive overload tracking, volume progression
- **Tests**: ✅ 7 tests

---

## Test Coverage Details

### Test Files

| File | Tests | Coverage |
|------|-------|----------|
| `useWorkouts.test.tsx` | 11 | Workout list, detail, history |
| `useSessions.test.tsx` | 7 | Active/finished sessions, volume calc |
| `useExercises.test.tsx` | 12 | Exercise list, history, progressive overload |
| **Total** | **30** | **All read RPCs** |

### Test Scenarios Covered

✅ **Success Cases**
- Successful data fetching
- Empty data handling (empty arrays, null values)
- Complex data structures (supersets, trisets, circuits)

✅ **Error Handling**
- RPC errors with RPCError class
- Network failures
- Invalid IDs

✅ **Conditional Fetching**
- Enabled when ID present
- Disabled when ID empty/undefined
- Prevents unnecessary API calls

✅ **Data Validation**
- Volume calculations (set → item → group → session)
- Effective rest inheritance (item vs group)
- Progressive overload tracking
- Set number sequencing

✅ **Cache Behavior**
- Active session polling (15s intervals)
- Finished session caching (30min)
- List caching (1-5min)

---

## Testing Infrastructure

### Vitest Configuration ([vitest.config.ts](../vitest.config.ts))
```typescript
{
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.js'],
}
```

### Test Setup ([src/test/setup.js](../src/test/setup.js))
- Global mocks for Supabase client
- Environment variable mocks
- React Testing Library cleanup
- Jest-DOM matchers

### Test Utilities
```typescript
// QueryClient wrapper
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

---

## Example Test Patterns

### Basic Success Test
```typescript
it('fetches workout detail successfully', async () => {
  const mockWorkout = { /* ... */ };
  vi.mocked(rpc.workoutDetailJson).mockResolvedValue(mockWorkout);

  const { result } = renderHook(
    () => useWorkoutDetail('workout-1'),
    { wrapper: createWrapper() }
  );

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toEqual(mockWorkout);
});
```

### Conditional Fetching Test
```typescript
it('does not fetch when workoutId is empty', () => {
  const { result } = renderHook(
    () => useWorkoutDetail(''),
    { wrapper: createWrapper() }
  );

  expect(result.current.fetchStatus).toBe('idle');
  expect(rpc.workoutDetailJson).not.toHaveBeenCalled();
});
```

### Error Handling Test
```typescript
it('handles workout detail error', async () => {
  const mockError = new rpc.RPCError('PGRST116', 'Not found');
  vi.mocked(rpc.workoutDetailJson).mockRejectedValue(mockError);

  const { result } = renderHook(
    () => useWorkoutDetail('invalid-id'),
    { wrapper: createWrapper() }
  );

  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(result.current.error).toEqual(mockError);
});
```

---

## Query Key Hierarchy

All hooks follow the hierarchical query key strategy from spec Section 4:

```typescript
queryKeys = {
  workouts: {
    all: ['workouts'],
    lists: () => ['workouts', 'list'],
    list: () => ['workouts', 'list'],
    details: () => ['workouts', 'detail'],
    detail: (id) => ['workouts', 'detail', id],
    histories: () => ['workouts', 'history'],
    history: (id) => ['workouts', 'history', id],
  },
  sessions: {
    all: ['sessions'],
    details: () => ['sessions', 'detail'],
    detail: (id) => ['sessions', 'detail', id],
  },
  exercises: {
    all: ['exercises'],
    lists: () => ['exercises', 'list'],
    list: () => ['exercises', 'list'],
    histories: () => ['exercises', 'history'],
    history: (id) => ['exercises', 'history', id],
  },
}
```

---

## Cache Invalidation Strategy

Mutation hooks automatically invalidate relevant queries:

| Mutation | Invalidates |
|----------|-------------|
| `useAddWorkout` | `workouts.lists()` |
| `useUpdateWorkout` | `workouts.detail(id)`, `workouts.lists()` |
| `useDeleteWorkout` | `workouts.lists()`, `workouts.detail(id)` |
| `useLogSet` | `sessions.detail(id)` |
| `useFinishSession` | `sessions.detail(id)`, `workouts.history(id)`, `exercises.histories()` |

---

## Running Tests

```bash
# Run all hook tests
npm run test src/test/hooks/

# Run specific test file
npm run test src/test/hooks/useWorkouts.test.tsx

# Run with coverage
npm run test:coverage src/test/hooks/

# Run in watch mode
npm run test src/test/hooks/ -- --watch
```

### Expected Output
```
✓ src/test/hooks/useSessions.test.tsx (7 tests) 334ms
✓ src/test/hooks/useWorkouts.test.tsx (11 tests) 497ms
✓ src/test/hooks/useExercises.test.tsx (12 tests) 603ms

Test Files  3 passed (3)
Tests       30 passed (30)
Duration    1.15s
```

---

## Implementation Status

| Hook | RPC | Implementation | Tests | Status |
|------|-----|----------------|-------|--------|
| `useWorkouts` | `workout_list_json` | ✅ | ✅ 3 | Complete |
| `useWorkoutDetail` | `workout_detail_json` | ✅ | ✅ 4 | Complete |
| `useWorkoutHistory` | `workout_history_json` | ✅ | ✅ 4 | Complete |
| `useSessionDetail` | `session_detail_json` | ✅ | ✅ 7 | Complete |
| `useExercises` | `exercise_list_json` | ✅ | ✅ 5 | Complete |
| `useExerciseHistory` | `exercise_history_json` | ✅ | ✅ 7 | Complete |

**Total**: 6/6 read RPCs implemented with 30/30 tests passing ✅

---

## Notes

1. **workout_preview_session_json** mentioned in `/sc:implement` command does not exist in the spec (v1-spec.md Section 3.1). This was confirmed and skipped.

2. All hooks use the existing `.ts` files from the previous TanStack Query implementation. Tests were added as new `.tsx` files.

3. Test files use `.tsx` extension to support JSX syntax in test wrappers.

4. Mocks are configured in `src/test/setup.js` to prevent Supabase client initialization during tests.

5. Local Supabase instance available at `http://localhost:54321` but not used in unit tests (tests use mocks). Integration tests could use the local instance via `.env.local`.

---

## Next Steps

Potential enhancements:
1. Add integration tests using local Supabase instance
2. Add mutation hook tests (useLogSet, useStartSession, etc.)
3. Add E2E tests with Playwright MCP for complete user flows
4. Generate test coverage report
5. Add performance benchmarks for query hooks

---

**Last Updated**: 2025-10-02
**Commit**: c864dee - test(hooks): add comprehensive tests for TanStack Query read hooks
