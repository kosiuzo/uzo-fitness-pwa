/**
 * RPC Response Type Definitions
 *
 * TypeScript types for JSON RPC responses from Supabase.
 * These match the structure returned by server-side JSON RPCs.
 *
 * Note: These are hand-written to match the RPC implementations.
 * Keep in sync with supabase/migrations/*_rpc_functions.sql
 */

// ============================================
// WORKOUT TYPES
// ============================================

export interface WorkoutItem {
  id: string;
  exerciseId: string;
  exerciseName: string;
  groupPosition: string; // e.g., "A1", "B2"
  position: number;
  targetSets: number | null;
  targetReps: number | null;
  targetWeight: number | null;
  restSeconds: number; // Effective rest (resolved from override or group default)
  notes: string | null;
}

export interface WorkoutGroup {
  id: string;
  name: string;
  groupType: 'single' | 'superset' | 'triset' | 'circuit';
  restSeconds: number;
  position: number;
  items: WorkoutItem[];
}

export interface WorkoutDetailResponse {
  id: string;
  name: string;
  description: string | null;
  groups: WorkoutGroup[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutListItem {
  id: string;
  name: string;
  description: string | null;
  groupCount: number;
  itemCount: number;
  lastUsed: string | null;
  createdAt: string;
}

export type WorkoutListResponse = WorkoutListItem[];

export interface WorkoutHistorySession {
  id: string;
  title: string;
  startedAt: string;
  finishedAt: string;
  totalVolume: number;
  duration: number; // seconds
}

export interface WorkoutHistoryResponse {
  workoutId: string;
  workoutName: string;
  sessions: WorkoutHistorySession[];
}

// ============================================
// SESSION TYPES
// ============================================

export interface SetLog {
  id: string;
  reps: number;
  weight: number;
  volume: number;
  setNumber: number;
  completedAt: string;
}

export interface SessionItem {
  id: string;
  exerciseId: string;
  exerciseName: string;
  groupPosition: string;
  targetSets: number | null;
  targetReps: number | null;
  targetWeight: number | null;
  restSeconds: number;
  sets: SetLog[];
  setsCompleted: number;
  itemVolume: number;
}

export interface SessionGroup {
  id: string;
  name: string;
  groupType: 'single' | 'superset' | 'triset' | 'circuit';
  restSeconds: number;
  position: number;
  items: SessionItem[];
  groupVolume: number;
}

export interface SessionDetailResponse {
  id: string;
  title: string;
  workoutId: string | null;
  startedAt: string;
  finishedAt: string | null;
  totalVolume: number;
  groups: SessionGroup[];
}

// ============================================
// EXERCISE TYPES
// ============================================

export interface ExerciseListItem {
  id: string;
  name: string;
  category: 'strength' | 'cardio' | 'mobility' | 'balance';
  description: string | null;
  timesUsed: number;
  lastUsed: string | null;
}

export type ExerciseListResponse = ExerciseListItem[];

export interface ExerciseHistorySet {
  reps: number;
  weight: number;
  volume: number;
}

export interface ExerciseHistorySession {
  sessionId: string;
  sessionDate: string;
  sessionTitle: string;
  setsPerformed: number;
  totalVolume: number;
  maxWeight: number;
  avgReps: number;
  sets: ExerciseHistorySet[];
}

export interface ExerciseHistoryResponse {
  exerciseId: string;
  exerciseName: string;
  sessions: ExerciseHistorySession[];
}

// ============================================
// CYCLE TYPES
// ============================================

export interface CycleListItem {
  id: string;
  name: string;
  workoutId: string;
  workoutName: string;
  durationWeeks: number;
  startDate: string;
  sessionsCompleted: number;
  createdAt: string;
}

export type CycleListResponse = CycleListItem[];

export interface CycleDetailResponse {
  id: string;
  name: string;
  workoutId: string;
  workoutName: string;
  durationWeeks: number;
  startDate: string;
  sessionsCompleted: number;
  lastSessionDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// RPC PARAMETER TYPES
// ============================================

export interface AddWorkoutParams {
  p_name: string;
  p_description?: string | null;
}

export interface UpdateWorkoutParams {
  p_workout_id: string;
  p_name: string;
  p_description?: string | null;
}

export interface AddWorkoutGroupParams {
  p_workout_id: string;
  p_name: string;
  p_group_type?: 'single' | 'superset' | 'triset' | 'circuit';
  p_rest_seconds?: number;
}

export interface ReorderWorkoutGroupsParams {
  p_workout_id: string;
  p_moved_group_id: string;
  p_before_group_id?: string | null;
}

export interface ReorderWorkoutItemsParams {
  p_workout_group_id: string;
  p_moved_item_id: string;
  p_before_item_id?: string | null;
}

export interface AddWorkoutItemParams {
  p_workout_group_id: string;
  p_exercise_id: string;
  p_target_sets?: number | null;
  p_target_reps?: number | null;
  p_target_weight?: number | null;
  p_rest_seconds?: number | null;
}

export interface StartSessionParams {
  p_cycle_id?: string | null;
  p_workout_id?: string | null;
  p_title?: string | null;
}

export interface LogSetParams {
  p_session_item_id: string;
  p_reps: number;
  p_weight: number;
}

export interface FinishSessionParams {
  p_session_id: string;
}

export interface AddExerciseParams {
  p_name: string;
  p_category?: 'strength' | 'cardio' | 'mobility' | 'balance';
  p_description?: string | null;
}
