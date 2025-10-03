/**
 * Typed RPC Function Layer
 *
 * Type-safe wrappers around Supabase RPC calls.
 * Pure functions that return promises - no React hooks here.
 *
 * Architecture:
 * - Each RPC function maps 1:1 with a Supabase RPC
 * - Type safety enforced via rpc.ts types
 * - Error handling via RPCError class
 * - Testable without React context
 */

import { supabase } from '../config/supabase';
import type {
  WorkoutListResponse,
  WorkoutDetailResponse,
  WorkoutHistoryResponse,
  SessionDetailResponse,
  ExerciseListResponse,
  ExerciseHistoryResponse,
  AddWorkoutParams,
  UpdateWorkoutParams,
  AddWorkoutGroupParams,
  ReorderWorkoutGroupsParams,
  AddWorkoutItemParams,
  StartSessionParams,
  LogSetParams,
  FinishSessionParams,
  AddExerciseParams,
} from '../types/rpc';

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Custom error class for RPC failures
 * Wraps Supabase PostgrestError with additional context
 */
export class RPCError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
    public hint?: string
  ) {
    super(message);
    this.name = 'RPCError';
  }
}

/**
 * Generic RPC caller with error handling
 * @internal
 */
async function callRPC<T>(
  rpcName: string,
  params?: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase.rpc(rpcName, params);

  if (error) {
    throw new RPCError(
      error.code,
      error.message,
      error.details,
      error.hint
    );
  }

  return data as T;
}

// ============================================
// WORKOUT READ RPCs
// ============================================

/**
 * Fetch all workouts for current user
 * @returns Array of workout summaries
 */
export async function workoutListJson(): Promise<WorkoutListResponse> {
  return callRPC<WorkoutListResponse>('workout_list_json');
}

/**
 * Fetch complete workout detail with groups and items
 * @param workoutId - UUID of workout
 * @returns Full workout structure with effective rest calculated
 */
export async function workoutDetailJson(
  workoutId: string
): Promise<WorkoutDetailResponse> {
  return callRPC<WorkoutDetailResponse>('workout_detail_json', {
    p_workout_id: workoutId,
  });
}

/**
 * Fetch workout history (all sessions for this workout)
 * @param workoutId - UUID of workout
 * @returns List of sessions with volume totals
 */
export async function workoutHistoryJson(
  workoutId: string
): Promise<WorkoutHistoryResponse> {
  return callRPC<WorkoutHistoryResponse>('workout_history_json', {
    p_workout_id: workoutId,
  });
}

// ============================================
// SESSION READ RPCs
// ============================================

/**
 * Fetch complete session detail with all sets
 * @param sessionId - UUID of session
 * @returns Session with groups, items, and logged sets
 */
export async function sessionDetailJson(
  sessionId: string
): Promise<SessionDetailResponse> {
  return callRPC<SessionDetailResponse>('session_detail_json', {
    p_session_id: sessionId,
  });
}

// ============================================
// EXERCISE READ RPCs
// ============================================

/**
 * Fetch all exercises in user's library
 * @returns Array of exercises with usage stats
 */
export async function exerciseListJson(): Promise<ExerciseListResponse> {
  return callRPC<ExerciseListResponse>('exercise_list_json');
}

/**
 * Fetch exercise history across all sessions
 * @param exerciseId - UUID of exercise
 * @returns Historical performance data for this exercise
 */
export async function exerciseHistoryJson(
  exerciseId: string
): Promise<ExerciseHistoryResponse> {
  return callRPC<ExerciseHistoryResponse>('exercise_history_json', {
    p_exercise_id: exerciseId,
  });
}

// ============================================
// WORKOUT WRITE RPCs
// ============================================

/**
 * Create new workout
 * @returns UUID of created workout
 */
export async function addWorkout(params: AddWorkoutParams): Promise<string> {
  return callRPC<string>('add_workout', params);
}

/**
 * Update existing workout
 */
export async function updateWorkout(params: UpdateWorkoutParams): Promise<void> {
  await callRPC<void>('update_workout', params);
}

/**
 * Soft delete workout
 */
export async function deleteWorkout(workoutId: string): Promise<void> {
  await callRPC<void>('delete_workout', { p_workout_id: workoutId });
}

/**
 * Add group to workout
 * @returns UUID of created group
 */
export async function addWorkoutGroup(
  params: AddWorkoutGroupParams
): Promise<string> {
  return callRPC<string>('add_workout_group', params);
}

/**
 * Reorder workout groups
 * @param params.p_before_group_id - Group to move before (null = move to end)
 */
export async function reorderWorkoutGroups(
  params: ReorderWorkoutGroupsParams
): Promise<void> {
  await callRPC<void>('reorder_workout_groups', params);
}

/**
 * Add exercise item to workout group
 * @returns UUID of created item
 */
export async function addWorkoutItem(
  params: AddWorkoutItemParams
): Promise<string> {
  return callRPC<string>('add_workout_item', params);
}

// ============================================
// SESSION WRITE RPCs
// ============================================

/**
 * Start new workout session
 * Creates immutable snapshot of workout structure
 * @returns UUID of created session
 */
export async function startSession(params: StartSessionParams): Promise<string> {
  return callRPC<string>('start_session', params);
}

/**
 * Log a set for a session item
 * @returns UUID of logged set
 */
export async function logSet(params: LogSetParams): Promise<string> {
  return callRPC<string>('log_set', params);
}

/**
 * Finish session and calculate total volume
 */
export async function finishSession(params: FinishSessionParams): Promise<void> {
  await callRPC<void>('finish_session', params);
}

// ============================================
// EXERCISE WRITE RPCs
// ============================================

/**
 * Add new exercise to library
 * @returns UUID of created exercise
 */
export async function addExercise(params: AddExerciseParams): Promise<string> {
  return callRPC<string>('add_exercise', params);
}

/**
 * Update existing exercise
 */
export async function updateExercise(params: {
  p_exercise_id: string;
  p_name: string;
  p_category?: 'strength' | 'cardio' | 'mobility' | 'balance';
  p_description?: string | null;
}): Promise<void> {
  await callRPC<void>('update_exercise', params);
}

/**
 * Soft delete exercise
 */
export async function deleteExercise(exerciseId: string): Promise<void> {
  await callRPC<void>('delete_exercise', { p_exercise_id: exerciseId });
}
