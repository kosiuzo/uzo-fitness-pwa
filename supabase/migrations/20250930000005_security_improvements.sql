-- =========================================
-- Security Improvements and Hardening
-- Migration: 20250930000005
-- Addresses findings from security audit
-- =========================================

-- =========================================
-- FIX M1: Exercise Insert Policy
-- Remove ability for users to create system exercises (NULL user_id)
-- =========================================

-- Drop existing policy
drop policy if exists "Users can insert own exercises" on exercises;

-- Create stricter policy - only allow authenticated users to create their own exercises
create policy "Users can insert own exercises"
  on exercises for insert
  with check (user_id = auth.uid());

-- Note: System exercises should be created via admin-only function or direct SQL by superuser

-- =========================================
-- FIX M2: Secure Views with RLS
-- Add security_invoker to ensure views respect RLS policies
-- =========================================

-- Drop and recreate v_cycle_progress with security_invoker
drop view if exists v_cycle_progress;

create view v_cycle_progress
with (security_invoker = true) as
select
  c.id as cycle_id,
  c.user_id,
  c.name,
  c.started_at,
  (c.started_at + (c.duration_weeks || ' weeks')::interval) as target_end,
  c.ended_at,
  count(distinct s.id) as sessions_done
from cycles c
left join sessions s on s.cycle_id = c.id
where c.user_id = auth.uid()  -- Filter by current user
group by c.id, c.user_id, c.name, c.started_at, c.duration_weeks, c.ended_at;

-- Drop and recreate v_exercise_history with security_invoker
drop view if exists v_exercise_history;

create view v_exercise_history
with (security_invoker = true) as
select
  si.user_id,
  si.exercise_id,
  e.name as exercise_name,
  s.date::date as day,
  coalesce(sum(st.reps * st.weight), 0)::numeric(10,2) as total_volume,
  count(st.id) as sets_completed,
  max(st.created_at) as last_logged_at,
  s.id as session_id,
  s.title as session_title
from session_items si
join sessions s   on s.id = si.session_id
join exercises e  on e.id = si.exercise_id
left join sets st on st.session_item_id = si.id
where si.user_id = auth.uid()  -- Filter by current user
group by si.user_id, si.exercise_id, e.name, s.date::date, s.id, s.title
order by day desc;

-- =========================================
-- FIX M3: Validate User Ownership in Position Triggers
-- Add user_id checks to prevent cross-user data access
-- =========================================

-- Fix workout item position trigger
create or replace function set_workout_item_position()
returns trigger
language plpgsql
as $$
declare
  gpos numeric(10,4);
begin
  -- Validate user owns the group
  select position into gpos
  from workout_groups
  where id = NEW.group_id
    and user_id = NEW.user_id;

  if gpos is null then
    raise exception 'Group not found or access denied';
  end if;

  NEW.position := gpos + (NEW.group_position / 1000.0);
  return NEW;
end;
$$;

-- Fix session item position trigger
create or replace function set_session_item_position()
returns trigger
language plpgsql
as $$
declare
  gpos numeric(10,4);
begin
  -- Validate user owns the group
  select position into gpos
  from session_groups
  where id = NEW.group_id
    and user_id = NEW.user_id;

  if gpos is null then
    raise exception 'Group not found or access denied';
  end if;

  NEW.position := gpos + (NEW.group_position / 1000.0);
  return NEW;
end;
$$;

-- =========================================
-- FIX L1: Add Text Field Length Constraints
-- Prevent unbounded text storage and potential DoS
-- =========================================

-- Exercises table
alter table exercises
  add constraint exercises_name_length check (length(name) <= 200),
  add constraint exercises_instructions_length check (length(instructions) <= 10000);

-- Workouts table
alter table workouts
  add constraint workouts_name_length check (length(name) <= 200),
  add constraint workouts_notes_length check (length(notes) <= 5000);

-- Workout groups table
alter table workout_groups
  add constraint workout_groups_name_length check (length(name) <= 100);

-- Workout items table
alter table workout_items
  add constraint workout_items_superset_note_length check (length(superset_note) <= 1000);

-- Cycles table
alter table cycles
  add constraint cycles_name_length check (length(name) <= 200);

-- Sessions table
alter table sessions
  add constraint sessions_title_length check (length(title) <= 200);

-- Session groups table
alter table session_groups
  add constraint session_groups_name_length check (length(name) <= 100);

-- =========================================
-- FIX L2: Add Missing Foreign Key Indexes
-- Improve query performance for foreign key lookups
-- =========================================

-- Workout items
create index if not exists idx_workout_items_exercise on workout_items(exercise_id);

-- Session items
create index if not exists idx_session_items_exercise on session_items(exercise_id);

-- Sets
create index if not exists idx_sets_session_item on sets(session_item_id);

-- Additional performance indexes
create index if not exists idx_workout_groups_workout on workout_groups(workout_id);
create index if not exists idx_session_groups_session on session_groups(session_id);

-- =========================================
-- ADDITIONAL IMPROVEMENTS
-- Business logic validation
-- =========================================

-- Ensure cycle end date is after start date (if set)
alter table cycles
  add constraint cycles_dates_valid
  check (ended_at is null or ended_at > started_at);

-- Ensure session duration is reasonable (< 24 hours)
alter table sessions
  add constraint sessions_duration_reasonable
  check (duration_seconds is null or duration_seconds between 0 and 86400);

-- Ensure weight values are reasonable (0 to 1000 lbs/kg)
alter table workout_items
  add constraint workout_items_weight_reasonable
  check (weight is null or weight between 0 and 1000);

alter table session_items
  add constraint session_items_weight_reasonable
  check (planned_weight is null or planned_weight between 0 and 1000);

alter table sets
  add constraint sets_weight_reasonable
  check (weight between 0 and 1000);

-- Ensure rest times are reasonable (1 second to 30 minutes)
alter table workout_groups
  drop constraint if exists workout_groups_rest_seconds_check,
  add constraint workout_groups_rest_seconds_reasonable
  check (rest_seconds between 1 and 1800);

alter table session_groups
  drop constraint if exists session_groups_rest_seconds_check,
  add constraint session_groups_rest_seconds_reasonable
  check (rest_seconds between 1 and 1800);

alter table workout_items
  drop constraint if exists workout_items_item_rest_seconds_check,
  add constraint workout_items_rest_reasonable
  check (item_rest_seconds is null or item_rest_seconds between 1 and 1800);

alter table session_items
  drop constraint if exists session_items_item_rest_seconds_check,
  add constraint session_items_rest_reasonable
  check (item_rest_seconds is null or item_rest_seconds between 1 and 1800);

-- =========================================
-- ADMIN HELPER FUNCTION
-- Secure function to create system exercises
-- =========================================

create or replace function create_system_exercise(
  p_name text,
  p_category exercise_category,
  p_instructions text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_exercise_id uuid;
begin
  -- Only allow service role to create system exercises
  if current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' then
    raise exception 'Only service role can create system exercises';
  end if;

  insert into exercises (user_id, name, category, instructions)
  values (null, p_name, p_category, p_instructions)
  returning id into new_exercise_id;

  return new_exercise_id;
end;
$$;

-- Grant execute to service role only
revoke all on function create_system_exercise from public;
grant execute on function create_system_exercise to service_role;

comment on function create_system_exercise is
  'Admin-only function to create system exercises visible to all users';
