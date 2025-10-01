-- =========================================
-- Enums
-- =========================================
create type exercise_category as enum ('strength','cardio','mobility','balance');
create type group_type        as enum ('single','superset','triset','circuit');

-- =========================================
-- Library
-- =========================================
create table exercises (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  category     exercise_category not null default 'strength',
  instructions text not null default '',
  created_at   timestamptz not null default now()
);

-- =========================================
-- Workouts (reusable “days”)
-- =========================================
create table workouts (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  notes      text not null default '',
  created_at timestamptz not null default now()
);

-- Groups within a workout; own the default rest for that block
create table workout_groups (
  id           uuid primary key default gen_random_uuid(),
  workout_id   uuid not null references workouts(id) on delete cascade,
  name         text not null,                        -- e.g., "A", "B", "Finisher"
  group_type   group_type not null default 'single',
  position     numeric(10,4) not null,              -- drag-reorder with midpoints
  rest_seconds int not null check (rest_seconds > 0),
  created_at   timestamptz not null default now(),
  unique (workout_id, name)
);

-- Exercises inside a workout group
create table workout_items (
  id                 uuid primary key default gen_random_uuid(),
  workout_id         uuid not null references workouts(id) on delete cascade,
  group_id           uuid not null references workout_groups(id) on delete cascade,
  exercise_id        uuid not null references exercises(id) on delete restrict,

  -- Nested order (inside the group)
  group_position     numeric(10,4) not null check (group_position > 0),

  -- Flat order (auto-set by trigger; do not hand-edit)
  position           numeric(14,6) not null,        -- computed: group.position + group_position/1000

  set_count          int not null check (set_count > 0),
  reps               int not null check (reps > 0),
  weight             numeric(8,2),
  item_rest_seconds  int,                           -- optional override; else use group rest
  superset_note      text,
  created_at         timestamptz not null default now()
);

create index idx_workout_groups_order    on workout_groups (workout_id, position);
create index idx_workout_items_groupord  on workout_items (group_id, group_position);
create index idx_workout_items_flatpos   on workout_items (workout_id, position);

-- =========================================
-- Cycles (do workout X for N weeks)
-- =========================================
create table cycles (
  id              uuid primary key default gen_random_uuid(),
  workout_id      uuid not null references workouts(id) on delete restrict,
  name            text not null,                          -- e.g., "Push A — 2 weeks"
  duration_weeks  int  not null check (duration_weeks between 1 and 52),
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  created_at      timestamptz not null default now()
);

-- =========================================
-- Sessions (actual training days)
-- =========================================
create table sessions (
  id               uuid primary key default gen_random_uuid(),
  cycle_id         uuid references cycles(id)   on delete set null,
  workout_id       uuid references workouts(id) on delete set null,
  title            text not null,               -- default to workout name
  date             timestamptz not null default now(),
  duration_seconds int,
  created_at       timestamptz not null default now()
);

-- Session groups (copied from workout_groups)
create table session_groups (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references sessions(id) on delete cascade,
  name         text not null,
  group_type   group_type not null,
  position     numeric(10,4) not null,
  rest_seconds int not null check (rest_seconds > 0),
  created_at   timestamptz not null default now(),
  unique (session_id, name)
);

-- Session items (copied from workout_items)
create table session_items (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid not null references sessions(id) on delete cascade,
  group_id           uuid not null references session_groups(id) on delete cascade,
  exercise_id        uuid not null references exercises(id) on delete restrict,

  -- Nested order (inside the session group)
  group_position     numeric(10,4) not null check (group_position > 0),

  -- Flat order (auto-set by trigger; do not hand-edit)
  position           numeric(14,6) not null,        -- computed: group.position + group_position/1000

  planned_sets       int,
  planned_reps       int,
  planned_weight     numeric(8,2),
  item_rest_seconds  int,                           -- optional override
  rest_seconds       int not null check (rest_seconds > 0), -- effective rest used by UI
  created_at         timestamptz not null default now()
);

create index idx_sessions_date                 on sessions (date desc);
create index idx_session_groups_order          on session_groups (session_id, position);
create index idx_session_items_groupord        on session_items (group_id, group_position);
create index idx_session_items_flatpos         on session_items (session_id, position);

-- =========================================
-- Completed sets (history source of truth)
-- =========================================
create table sets (
  id              uuid primary key default gen_random_uuid(),
  session_item_id uuid not null references session_items(id) on delete cascade,
  set_index       int  not null default 1 check (set_index >= 1),
  reps            int  not null check (reps >= 0),
  weight          numeric(8,2) not null check (weight >= 0),
  created_at      timestamptz not null default now()
);

create index idx_sets_item_time on sets (session_item_id, created_at desc);

-- =========================================
-- Views (handy for dashboards/history)
-- =========================================
create or replace view v_cycle_progress as
select
  c.id as cycle_id,
  c.name,
  c.started_at,
  (c.started_at + (c.duration_weeks || ' weeks')::interval) as target_end,
  c.ended_at,
  count(distinct s.id) as sessions_done
from cycles c
left join sessions s on s.cycle_id = c.id
group by c.id;

create or replace view v_exercise_history as
select
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
group by si.exercise_id, e.name, s.date::date, s.id, s.title
order by day desc;

-- =========================================
-- Triggers: auto-flat position for workout_items
-- =========================================
create or replace function set_workout_item_position()
returns trigger
language plpgsql
as $$
declare
  gpos numeric(10,4);
begin
  select position into gpos from workout_groups where id = NEW.group_id;
  NEW.position := coalesce(gpos, 0) + (NEW.group_position / 1000.0);
  return NEW;
end;
$$;

create trigger trg_set_workout_item_position
before insert or update of group_id, group_position
on workout_items
for each row execute function set_workout_item_position();

create or replace function resync_items_after_workout_group_move()
returns trigger
language plpgsql
as $$
begin
  if NEW.position is distinct from OLD.position then
    update workout_items wi
       set position = NEW.position + (wi.group_position / 1000.0)
     where wi.group_id = NEW.id;
  end if;
  return NEW;
end;
$$;

create trigger trg_resync_items_after_workout_group_move
after update of position
on workout_groups
for each row execute function resync_items_after_workout_group_move();

-- =========================================
-- Triggers: auto-flat position for session_items
-- =========================================
create or replace function set_session_item_position()
returns trigger
language plpgsql
as $$
declare
  gpos numeric(10,4);
begin
  select position into gpos from session_groups where id = NEW.group_id;
  NEW.position := coalesce(gpos, 0) + (NEW.group_position / 1000.0);
  return NEW;
end;
$$;

create trigger trg_set_session_item_position
before insert or update of group_id, group_position
on session_items
for each row execute function set_session_item_position();

create or replace function resync_items_after_session_group_move()
returns trigger
language plpgsql
as $$
begin
  if NEW.position is distinct from OLD.position then
    update session_items si
       set position = NEW.position + (si.group_position / 1000.0)
     where si.group_id = NEW.id;
  end if;
  return NEW;
end;
$$;

create trigger trg_resync_items_after_session_group_move
after update of position
on session_groups
for each row execute function resync_items_after_session_group_move();

-- =========================================
-- Helper: start a session (copies groups/items; triggers set positions)
-- =========================================
create or replace function start_session(p_cycle uuid, p_workout uuid, p_title text)
returns uuid
language plpgsql
as $$
declare
  new_session uuid;
begin
  insert into sessions (cycle_id, workout_id, title)
  values (p_cycle, p_workout, p_title)
  returning id into new_session;

  insert into session_groups (session_id, name, group_type, position, rest_seconds)
  select new_session, wg.name, wg.group_type, wg.position, wg.rest_seconds
  from workout_groups wg
  where wg.workout_id = p_workout;

  insert into session_items (
    session_id, group_id, exercise_id,
    group_position, position,
    planned_sets, planned_reps, planned_weight,
    item_rest_seconds, rest_seconds
  )
  select
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
-- READ RPCs (JSON, UI-ready)
-- =========================================

-- Workout editor payload: groups + items, ordered, with effective rest
create or replace function workout_detail_json(p_workout uuid)
returns jsonb
language sql
stable
as $$
with
w as (
  select w.id, w.name, w.notes, count(wg.id) as groups_count
  from workouts w
  left join workout_groups wg on wg.workout_id = w.id
  where w.id = p_workout
  group by w.id
),
grp as (
  select wg.id, wg.name, wg.group_type, wg.rest_seconds, wg.position
  from workout_groups wg
  where wg.workout_id = p_workout
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
               'next_group_name',     chr(64 + coalesce((select count(*) from grp), 0) + 1), -- A=65
               'has_missing_exercises', false
             )
);
$$;

-- Session preview payload (no writes): how a session would look if started now
create or replace function workout_preview_session_json(p_workout uuid)
returns jsonb
language sql
stable
as $$
with
grp as (
  select wg.id, wg.name, wg.group_type, wg.position, wg.rest_seconds
  from workout_groups wg
  where wg.workout_id = p_workout
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
              from workouts w where w.id = p_workout),
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