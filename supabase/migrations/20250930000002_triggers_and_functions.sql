-- =========================================
-- Triggers and Functions
-- Migration: 20250930000002
-- =========================================

-- =========================================
-- Updated_at trigger function
-- =========================================
create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

-- Apply updated_at triggers to all relevant tables
create trigger trg_exercises_updated_at
  before update on exercises
  for each row execute function update_updated_at_column();

create trigger trg_workouts_updated_at
  before update on workouts
  for each row execute function update_updated_at_column();

create trigger trg_workout_groups_updated_at
  before update on workout_groups
  for each row execute function update_updated_at_column();

create trigger trg_workout_items_updated_at
  before update on workout_items
  for each row execute function update_updated_at_column();

create trigger trg_cycles_updated_at
  before update on cycles
  for each row execute function update_updated_at_column();

create trigger trg_sessions_updated_at
  before update on sessions
  for each row execute function update_updated_at_column();

create trigger trg_session_groups_updated_at
  before update on session_groups
  for each row execute function update_updated_at_column();

create trigger trg_session_items_updated_at
  before update on session_items
  for each row execute function update_updated_at_column();

create trigger trg_sets_updated_at
  before update on sets
  for each row execute function update_updated_at_column();

-- =========================================
-- Auto-set user_id triggers
-- =========================================
create or replace function set_user_id()
returns trigger
language plpgsql
security definer
as $$
begin
  if NEW.user_id is null then
    NEW.user_id = auth.uid();
  end if;
  return NEW;
end;
$$;

-- Apply user_id triggers (except exercises which can be null for system exercises)
create trigger trg_workouts_user_id
  before insert on workouts
  for each row execute function set_user_id();

create trigger trg_workout_groups_user_id
  before insert on workout_groups
  for each row execute function set_user_id();

create trigger trg_workout_items_user_id
  before insert on workout_items
  for each row execute function set_user_id();

create trigger trg_cycles_user_id
  before insert on cycles
  for each row execute function set_user_id();

create trigger trg_sessions_user_id
  before insert on sessions
  for each row execute function set_user_id();

create trigger trg_session_groups_user_id
  before insert on session_groups
  for each row execute function set_user_id();

create trigger trg_session_items_user_id
  before insert on session_items
  for each row execute function set_user_id();

create trigger trg_sets_user_id
  before insert on sets
  for each row execute function set_user_id();

-- =========================================
-- Workout item position management
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
-- Session item position management
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
