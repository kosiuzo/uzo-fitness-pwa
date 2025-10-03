/**
 * Type-Safe Supabase RPC Client Wrapper
 *
 * Provides typed methods for all server RPCs defined in docs/v1-spec.md Section 3.
 * Leverages a generic callRPC<T> helper for consistent error handling and typing.
 */

import { supabase } from '../../config/supabase';
import { RPCError } from '../rpc';
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
} from './types';

async function callRPC<T>(rpcName: string, params?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(rpcName, params);
  if (error) {
    throw new RPCError(error.code, error.message, error.details, error.hint);
  }
  return data as T;
}

// ============================================
// READ RPCs
// ============================================

export async function workoutListJson(): Promise<WorkoutListResponse> {
  return callRPC<WorkoutListResponse>('workout_list_json');
}

export async function workoutDetailJson(workoutId: string): Promise<WorkoutDetailResponse> {
  return callRPC<WorkoutDetailResponse>('workout_detail_json', { p_workout_id: workoutId });
}

export async function workoutHistoryJson(workoutId: string): Promise<WorkoutHistoryResponse> {
  return callRPC<WorkoutHistoryResponse>('workout_history_json', { p_workout_id: workoutId });
}

export async function sessionDetailJson(sessionId: string): Promise<SessionDetailResponse> {
  return callRPC<SessionDetailResponse>('session_detail_json', { p_session_id: sessionId });
}

export async function exerciseListJson(): Promise<ExerciseListResponse> {
  return callRPC<ExerciseListResponse>('exercise_list_json');
}

export async function exerciseHistoryJson(exerciseId: string): Promise<ExerciseHistoryResponse> {
  return callRPC<ExerciseHistoryResponse>('exercise_history_json', { p_exercise_id: exerciseId });
}

// ============================================
// WRITE RPCs
// ============================================

export async function addWorkout(params: AddWorkoutParams): Promise<string> {
  return callRPC<string>('add_workout', params);
}

export async function updateWorkout(params: UpdateWorkoutParams): Promise<void> {
  await callRPC<void>('update_workout', params);
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  await callRPC<void>('delete_workout', { p_workout_id: workoutId });
}

export async function addWorkoutGroup(params: AddWorkoutGroupParams): Promise<string> {
  return callRPC<string>('add_workout_group', params);
}

export async function reorderWorkoutGroups(params: ReorderWorkoutGroupsParams): Promise<void> {
  await callRPC<void>('reorder_workout_groups', params);
}

export async function addWorkoutItem(params: AddWorkoutItemParams): Promise<string> {
  return callRPC<string>('add_workout_item', params);
}

export async function startSession(params: StartSessionParams): Promise<string> {
  return callRPC<string>('start_session', params);
}

export async function logSet(params: LogSetParams): Promise<string> {
  return callRPC<string>('log_set', params);
}

export async function finishSession(params: FinishSessionParams): Promise<void> {
  await callRPC<void>('finish_session', params);
}

// Optional: namespaced export for ergonomic imports
export const supaRpc = {
  // READ
  workoutListJson,
  workoutDetailJson,
  workoutHistoryJson,
  sessionDetailJson,
  exerciseListJson,
  exerciseHistoryJson,
  // WRITE
  addWorkout,
  updateWorkout,
  deleteWorkout,
  addWorkoutGroup,
  reorderWorkoutGroups,
  addWorkoutItem,
  startSession,
  logSet,
  finishSession,
};

export type SupaRpc = typeof supaRpc;

