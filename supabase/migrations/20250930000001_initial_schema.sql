-- =========================================
-- Initial Schema: Fitness Tracker
-- Migration: 20250930000001
-- =========================================

-- =========================================
-- Enums
-- =========================================
create type exercise_category as enum ('strength','cardio','mobility','balance');
create type group_type as enum ('single','superset','triset','circuit');

-- =========================================
-- Library Tables
-- =========================================

-- Exercises library (shared across all users)
create table exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  category exercise_category not null default 'strength',
  instructions text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Unique constraint: name must be unique per user (or globally if user_id is null for system exercises)
  constraint exercises_name_unique unique (user_id, name)
);

-- Indexes for exercises
create index idx_exercises_user on exercises(user_id);
create index idx_exercises_category on exercises(category);
create index idx_exercises_name on exercises(name);

-- =========================================
-- Workouts (reusable "days")
-- =========================================
create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint workouts_name_unique unique (user_id, name)
);

create index idx_workouts_user on workouts(user_id);
create index idx_workouts_created on workouts(created_at desc);

-- Groups within a workout; own the default rest for that block
create table workout_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id uuid not null references workouts(id) on delete cascade,
  name text not null,
  group_type group_type not null default 'single',
  position numeric(10,4) not null check (position > 0),
  rest_seconds int not null check (rest_seconds > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint workout_groups_name_unique unique (workout_id, name)
);

create index idx_workout_groups_user on workout_groups(user_id);
create index idx_workout_groups_order on workout_groups(workout_id, position);

-- Exercises inside a workout group
create table workout_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id uuid not null references workouts(id) on delete cascade,
  group_id uuid not null references workout_groups(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete restrict,

  group_position numeric(10,4) not null check (group_position > 0),
  position numeric(14,6) not null,

  set_count int not null check (set_count > 0),
  reps int not null check (reps > 0),
  weight numeric(8,2),
  item_rest_seconds int check (item_rest_seconds > 0),
  superset_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_workout_items_user on workout_items(user_id);
create index idx_workout_items_groupord on workout_items(group_id, group_position);
create index idx_workout_items_flatpos on workout_items(workout_id, position);

-- =========================================
-- Cycles (do workout X for N weeks)
-- =========================================
create table cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id uuid not null references workouts(id) on delete restrict,
  name text not null,
  duration_weeks int not null check (duration_weeks between 1 and 52),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_cycles_user on cycles(user_id);
create index idx_cycles_started on cycles(started_at desc);

-- =========================================
-- Sessions (actual training days)
-- =========================================
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cycle_id uuid references cycles(id) on delete set null,
  workout_id uuid references workouts(id) on delete set null,
  title text not null,
  date timestamptz not null default now(),
  duration_seconds int check (duration_seconds >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_sessions_user on sessions(user_id);
create index idx_sessions_date on sessions(date desc);
create index idx_sessions_cycle on sessions(cycle_id);

-- Session groups (copied from workout_groups)
create table session_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  name text not null,
  group_type group_type not null,
  position numeric(10,4) not null check (position > 0),
  rest_seconds int not null check (rest_seconds > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint session_groups_name_unique unique (session_id, name)
);

create index idx_session_groups_user on session_groups(user_id);
create index idx_session_groups_order on session_groups(session_id, position);

-- Session items (copied from workout_items)
create table session_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  group_id uuid not null references session_groups(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete restrict,

  group_position numeric(10,4) not null check (group_position > 0),
  position numeric(14,6) not null,

  planned_sets int check (planned_sets > 0),
  planned_reps int check (planned_reps > 0),
  planned_weight numeric(8,2),
  item_rest_seconds int check (item_rest_seconds > 0),
  rest_seconds int not null check (rest_seconds > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_session_items_user on session_items(user_id);
create index idx_session_items_groupord on session_items(group_id, group_position);
create index idx_session_items_flatpos on session_items(session_id, position);

-- =========================================
-- Completed sets (history source of truth)
-- =========================================
create table sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_item_id uuid not null references session_items(id) on delete cascade,
  set_index int not null default 1 check (set_index >= 1),
  reps int not null check (reps >= 0),
  weight numeric(8,2) not null check (weight >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_sets_user on sets(user_id);
create index idx_sets_item_time on sets(session_item_id, created_at desc);
