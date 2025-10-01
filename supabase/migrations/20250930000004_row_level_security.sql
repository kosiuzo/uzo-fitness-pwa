-- =========================================
-- Row Level Security (RLS) Policies
-- Migration: 20250930000004
-- =========================================

-- Enable RLS on all tables
alter table exercises enable row level security;
alter table workouts enable row level security;
alter table workout_groups enable row level security;
alter table workout_items enable row level security;
alter table cycles enable row level security;
alter table sessions enable row level security;
alter table session_groups enable row level security;
alter table session_items enable row level security;
alter table sets enable row level security;

-- =========================================
-- Exercises Policies
-- =========================================

-- Users can view their own exercises and system exercises (user_id IS NULL)
create policy "Users can view own and system exercises"
  on exercises for select
  using (
    user_id is null
    or user_id = auth.uid()
  );

-- Users can insert their own exercises
create policy "Users can insert own exercises"
  on exercises for insert
  with check (
    user_id = auth.uid()
    or user_id is null
  );

-- Users can update their own exercises
create policy "Users can update own exercises"
  on exercises for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Users can delete their own exercises
create policy "Users can delete own exercises"
  on exercises for delete
  using (user_id = auth.uid());

-- =========================================
-- Workouts Policies
-- =========================================

create policy "Users can view own workouts"
  on workouts for select
  using (user_id = auth.uid());

create policy "Users can insert own workouts"
  on workouts for insert
  with check (user_id = auth.uid());

create policy "Users can update own workouts"
  on workouts for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own workouts"
  on workouts for delete
  using (user_id = auth.uid());

-- =========================================
-- Workout Groups Policies
-- =========================================

create policy "Users can view own workout groups"
  on workout_groups for select
  using (user_id = auth.uid());

create policy "Users can insert own workout groups"
  on workout_groups for insert
  with check (user_id = auth.uid());

create policy "Users can update own workout groups"
  on workout_groups for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own workout groups"
  on workout_groups for delete
  using (user_id = auth.uid());

-- =========================================
-- Workout Items Policies
-- =========================================

create policy "Users can view own workout items"
  on workout_items for select
  using (user_id = auth.uid());

create policy "Users can insert own workout items"
  on workout_items for insert
  with check (user_id = auth.uid());

create policy "Users can update own workout items"
  on workout_items for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own workout items"
  on workout_items for delete
  using (user_id = auth.uid());

-- =========================================
-- Cycles Policies
-- =========================================

create policy "Users can view own cycles"
  on cycles for select
  using (user_id = auth.uid());

create policy "Users can insert own cycles"
  on cycles for insert
  with check (user_id = auth.uid());

create policy "Users can update own cycles"
  on cycles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own cycles"
  on cycles for delete
  using (user_id = auth.uid());

-- =========================================
-- Sessions Policies
-- =========================================

create policy "Users can view own sessions"
  on sessions for select
  using (user_id = auth.uid());

create policy "Users can insert own sessions"
  on sessions for insert
  with check (user_id = auth.uid());

create policy "Users can update own sessions"
  on sessions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own sessions"
  on sessions for delete
  using (user_id = auth.uid());

-- =========================================
-- Session Groups Policies
-- =========================================

create policy "Users can view own session groups"
  on session_groups for select
  using (user_id = auth.uid());

create policy "Users can insert own session groups"
  on session_groups for insert
  with check (user_id = auth.uid());

create policy "Users can update own session groups"
  on session_groups for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own session groups"
  on session_groups for delete
  using (user_id = auth.uid());

-- =========================================
-- Session Items Policies
-- =========================================

create policy "Users can view own session items"
  on session_items for select
  using (user_id = auth.uid());

create policy "Users can insert own session items"
  on session_items for insert
  with check (user_id = auth.uid());

create policy "Users can update own session items"
  on session_items for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own session items"
  on session_items for delete
  using (user_id = auth.uid());

-- =========================================
-- Sets Policies
-- =========================================

create policy "Users can view own sets"
  on sets for select
  using (user_id = auth.uid());

create policy "Users can insert own sets"
  on sets for insert
  with check (user_id = auth.uid());

create policy "Users can update own sets"
  on sets for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own sets"
  on sets for delete
  using (user_id = auth.uid());
