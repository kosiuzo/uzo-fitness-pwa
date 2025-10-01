-- =========================================
-- RPC Functions and Views
-- Migration: 20250930000003
-- =========================================

-- =========================================
-- Helper: start a session (copies groups/items; triggers set positions)
-- =========================================
create or replace function start_session(p_cycle uuid, p_workout uuid, p_title text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_session uuid;
  calling_user uuid;
begin
  calling_user := auth.uid();

  if calling_user is null then
    raise exception 'Not authenticated';
  end if;

  -- Verify user owns the workout
  if not exists (
    select 1 from workouts
    where id = p_workout and user_id = calling_user
  ) then
    raise exception 'Workout not found or access denied';
  end if;

  -- Create session
  insert into sessions (user_id, cycle_id, workout_id, title)
  values (calling_user, p_cycle, p_workout, p_title)
  returning id into new_session;

  -- Copy groups
  insert into session_groups (user_id, session_id, name, group_type, position, rest_seconds)
  select calling_user, new_session, wg.name, wg.group_type, wg.position, wg.rest_seconds
  from workout_groups wg
  where wg.workout_id = p_workout;

  -- Copy items
  insert into session_items (
    user_id, session_id, group_id, exercise_id,
    group_position, position,
    planned_sets, planned_reps, planned_weight,
    item_rest_seconds, rest_seconds
  )
  select
    calling_user,
    new_session,
    sg.id as group_id,
    wi.exercise_id,
    wi.group_position,
    0, -- placeholder; BEFORE trigger computes flat position
    wi.set_count, wi.reps, wi.weight,
    wi.item_rest_seconds,
    coalesce(wi.item_rest_seconds, sg.rest_seconds)
  from workout_items wi
  join workout_groups wg on wg.id = wi.group_id
  join session_groups sg on sg.session_id = new_session and sg.name = wg.name
  where wg.workout_id = p_workout
  order by wg.position, wi.group_position;

  return new_session;
end;
$$;

-- =========================================
-- Workout editor payload: groups + items, ordered, with effective rest
-- =========================================
create or replace function workout_detail_json(p_workout uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with
w as (
  select w.id, w.name, w.notes, count(wg.id) as groups_count
  from workouts w
  left join workout_groups wg on wg.workout_id = w.id
  where w.id = p_workout
    and w.user_id = auth.uid()
  group by w.id
),
grp as (
  select wg.id, wg.name, wg.group_type, wg.rest_seconds, wg.position
  from workout_groups wg
  where wg.workout_id = p_workout
    and wg.user_id = auth.uid()
  order by wg.position
),
it as (
  select
    wi.id,
    wi.group_id,
    e.id    as exercise_id,
    e.name  as exercise_name,
    wi.set_count, wi.reps, wi.weight,
    wi.group_position, wi.position,
    wi.item_rest_seconds,
    coalesce(wi.item_rest_seconds, wg.rest_seconds) as rest_seconds_effective
  from workout_items wi
  join workout_groups wg on wg.id = wi.group_id
  join exercises     e  on e.id  = wi.exercise_id
  where wg.workout_id = p_workout
    and wi.user_id = auth.uid()
  order by wi.position
),
item_json as (
  select
    it.group_id,
    jsonb_build_object(
      'workout_item_id',       it.id,
      'exercise_id',           it.exercise_id,
      'exercise_name',         it.exercise_name,
      'set_count',             it.set_count,
      'reps',                  it.reps,
      'weight',                it.weight,
      'group_position',        it.group_position,
      'position',              it.position,
      'item_rest_seconds',     it.item_rest_seconds,
      'rest_seconds_effective',it.rest_seconds_effective
    ) as item_obj
  from it
),
group_json as (
  select
    g.id,
    jsonb_build_object(
      'workout_group_id', g.id,
      'name',             g.name,
      'group_type',       g.group_type,
      'rest_seconds',     g.rest_seconds,
      'position',         g.position,
      'items',            coalesce(jsonb_agg(ij.item_obj order by (ij.item_obj->>'group_position')::numeric), '[]'::jsonb),
      'totals',           jsonb_build_object('items', count(ij.item_obj))
    ) as group_obj,
    g.position
  from grp g
  left join item_json ij on ij.group_id = g.id
  group by g.id, g.name, g.group_type, g.rest_seconds, g.position
)
select jsonb_build_object(
  'workout', (select jsonb_build_object('id', id, 'name', name, 'notes', notes, 'groups_count', groups_count) from w),
  'groups',  coalesce(jsonb_agg(group_obj order by position), '[]'::jsonb),
  'meta',    jsonb_build_object(
               'next_group_position', coalesce((select max(position)::numeric + 1 from grp), 1),
               'next_group_name',     chr(64 + coalesce((select count(*)::int from grp), 0) + 1),
               'has_missing_exercises', false
             )
)
from group_json;
$$;

-- =========================================
-- Session preview payload (no writes): how a session would look if started now
-- =========================================
create or replace function workout_preview_session_json(p_workout uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with
grp as (
  select wg.id, wg.name, wg.group_type, wg.position, wg.rest_seconds
  from workout_groups wg
  where wg.workout_id = p_workout
    and wg.user_id = auth.uid()
  order by wg.position
),
it as (
  select
    wi.id,
    wi.group_id,
    e.name as exercise_name,
    wi.group_position,
    wi.set_count as planned_sets,
    wi.reps       as planned_reps,
    wi.weight     as planned_weight,
    coalesce(wi.item_rest_seconds, wg.rest_seconds) as rest_seconds,
    wi.position
  from workout_items wi
  join workout_groups wg on wg.id = wi.group_id
  join exercises e on e.id = wi.exercise_id
  where wg.workout_id = p_workout
    and wi.user_id = auth.uid()
  order by wi.position
),
items_json as (
  select
    it.group_id,
    jsonb_build_object(
      'exercise_name',  it.exercise_name,
      'planned_sets',   it.planned_sets,
      'planned_reps',   it.planned_reps,
      'planned_weight', it.planned_weight,
      'rest_seconds',   it.rest_seconds
    ) as item_obj,
    it.group_position
  from it
)
select jsonb_build_object(
  'workout', (select jsonb_build_object('id', w.id, 'name', w.name, 'notes', w.notes)
              from workouts w
              where w.id = p_workout
                and w.user_id = auth.uid()),
  'groups',
  coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', g.name,
        'group_type', g.group_type,
        'rest_seconds', g.rest_seconds,
        'items', coalesce(
          (select jsonb_agg(item_obj order by group_position)
           from items_json ij where ij.group_id = g.id),
          '[]'::jsonb
        )
      )
      order by g.position
    ),
    '[]'::jsonb
  )
)
from grp g;
$$;

-- =========================================
-- Views (handy for dashboards/history)
-- =========================================
create or replace view v_cycle_progress as
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
group by c.id, c.user_id, c.name, c.started_at, c.duration_weeks, c.ended_at;

create or replace view v_exercise_history as
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
group by si.user_id, si.exercise_id, e.name, s.date::date, s.id, s.title
order by day desc;
