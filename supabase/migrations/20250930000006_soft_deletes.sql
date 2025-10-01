-- =========================================
-- Soft Delete Implementation
-- Migration: 20250930000006
-- Adds deleted_at for data recovery
-- =========================================

-- =========================================
-- Add deleted_at columns to all tables
-- =========================================

alter table exercises add column deleted_at timestamptz;
alter table workouts add column deleted_at timestamptz;
alter table workout_groups add column deleted_at timestamptz;
alter table workout_items add column deleted_at timestamptz;
alter table cycles add column deleted_at timestamptz;
alter table sessions add column deleted_at timestamptz;
alter table session_groups add column deleted_at timestamptz;
alter table session_items add column deleted_at timestamptz;
alter table sets add column deleted_at timestamptz;

-- Create indexes on deleted_at for efficient filtering
create index idx_exercises_not_deleted on exercises(id) where deleted_at is null;
create index idx_workouts_not_deleted on workouts(id) where deleted_at is null;
create index idx_workout_groups_not_deleted on workout_groups(id) where deleted_at is null;
create index idx_workout_items_not_deleted on workout_items(id) where deleted_at is null;
create index idx_cycles_not_deleted on cycles(id) where deleted_at is null;
create index idx_sessions_not_deleted on sessions(id) where deleted_at is null;
create index idx_session_groups_not_deleted on session_groups(id) where deleted_at is null;
create index idx_session_items_not_deleted on session_items(id) where deleted_at is null;
create index idx_sets_not_deleted on sets(id) where deleted_at is null;

-- =========================================
-- Update RLS Policies to Exclude Soft-Deleted Records
-- =========================================

-- Exercises
drop policy if exists "Users can view own and system exercises" on exercises;
create policy "Users can view own and system exercises"
  on exercises for select
  using (
    deleted_at is null
    and (user_id is null or user_id = auth.uid())
  );

drop policy if exists "Users can update own exercises" on exercises;
create policy "Users can update own exercises"
  on exercises for update
  using (user_id = auth.uid() and deleted_at is null)
  with check (user_id = auth.uid() and deleted_at is null);

-- Workouts
drop policy if exists "Users can view own workouts" on workouts;
create policy "Users can view own workouts"
  on workouts for select
  using (user_id = auth.uid() and deleted_at is null);

drop policy if exists "Users can update own workouts" on workouts;
create policy "Users can update own workouts"
  on workouts for update
  using (user_id = auth.uid() and deleted_at is null)
  with check (user_id = auth.uid() and deleted_at is null);

-- Workout Groups
drop policy if exists "Users can view own workout groups" on workout_groups;
create policy "Users can view own workout groups"
  on workout_groups for select
  using (user_id = auth.uid() and deleted_at is null);

drop policy if exists "Users can update own workout groups" on workout_groups;
create policy "Users can update own workout groups"
  on workout_groups for update
  using (user_id = auth.uid() and deleted_at is null)
  with check (user_id = auth.uid() and deleted_at is null);

-- Workout Items
drop policy if exists "Users can view own workout items" on workout_items;
create policy "Users can view own workout items"
  on workout_items for select
  using (user_id = auth.uid() and deleted_at is null);

drop policy if exists "Users can update own workout items" on workout_items;
create policy "Users can update own workout items"
  on workout_items for update
  using (user_id = auth.uid() and deleted_at is null)
  with check (user_id = auth.uid() and deleted_at is null);

-- Cycles
drop policy if exists "Users can view own cycles" on cycles;
create policy "Users can view own cycles"
  on cycles for select
  using (user_id = auth.uid() and deleted_at is null);

drop policy if exists "Users can update own cycles" on cycles;
create policy "Users can update own cycles"
  on cycles for update
  using (user_id = auth.uid() and deleted_at is null)
  with check (user_id = auth.uid() and deleted_at is null);

-- Sessions
drop policy if exists "Users can view own sessions" on sessions;
create policy "Users can view own sessions"
  on sessions for select
  using (user_id = auth.uid() and deleted_at is null);

drop policy if exists "Users can update own sessions" on sessions;
create policy "Users can update own sessions"
  on sessions for update
  using (user_id = auth.uid() and deleted_at is null)
  with check (user_id = auth.uid() and deleted_at is null);

-- Session Groups
drop policy if exists "Users can view own session groups" on session_groups;
create policy "Users can view own session groups"
  on session_groups for select
  using (user_id = auth.uid() and deleted_at is null);

drop policy if exists "Users can update own session groups" on session_groups;
create policy "Users can update own session groups"
  on session_groups for update
  using (user_id = auth.uid() and deleted_at is null)
  with check (user_id = auth.uid() and deleted_at is null);

-- Session Items
drop policy if exists "Users can view own session items" on session_items;
create policy "Users can view own session items"
  on session_items for select
  using (user_id = auth.uid() and deleted_at is null);

drop policy if exists "Users can update own session items" on session_items;
create policy "Users can update own session items"
  on session_items for update
  using (user_id = auth.uid() and deleted_at is null)
  with check (user_id = auth.uid() and deleted_at is null);

-- Sets
drop policy if exists "Users can view own sets" on sets;
create policy "Users can view own sets"
  on sets for select
  using (user_id = auth.uid() and deleted_at is null);

drop policy if exists "Users can update own sets" on sets;
create policy "Users can update own sets"
  on sets for update
  using (user_id = auth.uid() and deleted_at is null)
  with check (user_id = auth.uid() and deleted_at is null);

-- =========================================
-- Update Views to Exclude Soft-Deleted Records
-- =========================================

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
left join sessions s on s.cycle_id = c.id and s.deleted_at is null
where c.user_id = auth.uid()
  and c.deleted_at is null
group by c.id, c.user_id, c.name, c.started_at, c.duration_weeks, c.ended_at;

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
join sessions s on s.id = si.session_id and s.deleted_at is null
join exercises e on e.id = si.exercise_id and e.deleted_at is null
left join sets st on st.session_item_id = si.id and st.deleted_at is null
where si.user_id = auth.uid()
  and si.deleted_at is null
group by si.user_id, si.exercise_id, e.name, s.date::date, s.id, s.title
order by day desc;

-- =========================================
-- Soft Delete Helper Functions
-- =========================================

-- Generic soft delete function
create or replace function soft_delete(
  table_name text,
  record_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  rows_affected int;
begin
  -- Validate table name to prevent SQL injection
  if table_name not in (
    'exercises', 'workouts', 'workout_groups', 'workout_items',
    'cycles', 'sessions', 'session_groups', 'session_items', 'sets'
  ) then
    raise exception 'Invalid table name';
  end if;

  -- Execute soft delete
  execute format(
    'update %I set deleted_at = now() where id = $1 and user_id = $2 and deleted_at is null',
    table_name
  ) using record_id, auth.uid();

  get diagnostics rows_affected = row_count;
  return rows_affected > 0;
end;
$$;

-- Restore soft-deleted record
create or replace function restore_deleted(
  table_name text,
  record_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  rows_affected int;
begin
  -- Validate table name
  if table_name not in (
    'exercises', 'workouts', 'workout_groups', 'workout_items',
    'cycles', 'sessions', 'session_groups', 'session_items', 'sets'
  ) then
    raise exception 'Invalid table name';
  end if;

  -- Restore record
  execute format(
    'update %I set deleted_at = null where id = $1 and user_id = $2 and deleted_at is not null',
    table_name
  ) using record_id, auth.uid();

  get diagnostics rows_affected = row_count;
  return rows_affected > 0;
end;
$$;

-- Permanent delete (hard delete) - use with caution
create or replace function permanent_delete(
  table_name text,
  record_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  rows_affected int;
begin
  -- Validate table name
  if table_name not in (
    'exercises', 'workouts', 'workout_groups', 'workout_items',
    'cycles', 'sessions', 'session_groups', 'session_items', 'sets'
  ) then
    raise exception 'Invalid table name';
  end if;

  -- Only allow deletion of already soft-deleted records
  execute format(
    'delete from %I where id = $1 and user_id = $2 and deleted_at is not null',
    table_name
  ) using record_id, auth.uid();

  get diagnostics rows_affected = row_count;
  return rows_affected > 0;
end;
$$;

-- View deleted records for recovery
create or replace function view_deleted_records(
  table_name text
)
returns table(
  id uuid,
  name text,
  deleted_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Validate table name
  if table_name not in ('exercises', 'workouts', 'cycles', 'sessions') then
    raise exception 'Invalid table name. Only exercises, workouts, cycles, and sessions are supported';
  end if;

  -- Return deleted records
  return query execute format(
    'select id, name::text, deleted_at from %I where user_id = $1 and deleted_at is not null order by deleted_at desc',
    table_name
  ) using auth.uid();
end;
$$;

-- Cleanup old soft-deleted records (admin function)
create or replace function cleanup_old_deleted_records(
  older_than_days int default 90
)
returns table(
  table_name text,
  records_deleted bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  table_names text[] := array[
    'exercises', 'workouts', 'workout_groups', 'workout_items',
    'cycles', 'sessions', 'session_groups', 'session_items', 'sets'
  ];
  t text;
  deleted_count bigint;
begin
  -- Only allow service role to run cleanup
  if current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' then
    raise exception 'Only service role can cleanup old deleted records';
  end if;

  foreach t in array table_names loop
    execute format(
      'delete from %I where deleted_at < now() - interval ''%s days''',
      t, older_than_days
    );

    get diagnostics deleted_count = row_count;

    if deleted_count > 0 then
      table_name := t;
      records_deleted := deleted_count;
      return next;
    end if;
  end loop;
end;
$$;

-- Grant permissions
grant execute on function soft_delete to authenticated;
grant execute on function restore_deleted to authenticated;
grant execute on function permanent_delete to authenticated;
grant execute on function view_deleted_records to authenticated;
grant execute on function cleanup_old_deleted_records to service_role;

-- Add helpful comments
comment on function soft_delete is 'Soft delete a record by setting deleted_at timestamp';
comment on function restore_deleted is 'Restore a soft-deleted record by clearing deleted_at';
comment on function permanent_delete is 'Permanently delete a soft-deleted record (cannot be undone)';
comment on function view_deleted_records is 'View soft-deleted records for potential recovery';
comment on function cleanup_old_deleted_records is 'Admin function to permanently delete old soft-deleted records';
