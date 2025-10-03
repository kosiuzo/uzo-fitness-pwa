// Type re-exports and aliases for Supabase RPC JSON payloads
// Keep these in sync with src/types/rpc.ts

export type {
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
} from '../../types/rpc';

// Optional alias names matching "*Json" style
export type WorkoutListJson = import('../../types/rpc').WorkoutListResponse;
export type WorkoutDetailJson = import('../../types/rpc').WorkoutDetailResponse;
export type WorkoutHistoryJson = import('../../types/rpc').WorkoutHistoryResponse;
export type SessionDetailJson = import('../../types/rpc').SessionDetailResponse;
export type ExerciseListJson = import('../../types/rpc').ExerciseListResponse;
export type ExerciseHistoryJson = import('../../types/rpc').ExerciseHistoryResponse;

