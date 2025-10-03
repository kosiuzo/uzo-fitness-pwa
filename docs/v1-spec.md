# Uzo Fitness Tracker - V1 Enhanced Specification

**Version**: 1.1 (Enhanced with Architectural Recommendations)
**Date**: 2025-10-02
**Status**: Ready for Implementation

---

## Table of Contents

1. [Overview](#1-overview)
2. [Data Model](#2-data-model)
3. [Server RPCs](#3-server-rpcs)
4. [Query Key Strategy](#4-query-key-strategy)
5. [Cache Invalidation Map](#5-cache-invalidation-map)
6. [Offline Strategy](#6-offline-strategy)
7. [Database Indexes](#7-database-indexes)
8. [Wireframes](#8-wireframes)
9. [Functional Requirements](#9-functional-requirements)
10. [Technical Requirements](#10-technical-requirements)
11. [Implementation Checklist](#11-implementation-checklist)

---

## 1. Overview

A personal fitness tracker delivered as a mobile-first PWA built with React + Supabase.

**Core Principles**:
- **Single user only** - no multi-user complexity
- **Server-first architecture** - JSON RPCs handle data shaping
- **Immutable sessions** - workout snapshots preserve historical integrity
- **Intent-based mutations** - client expresses what, server handles how
- **Network-required for active sessions** - honest offline UX

**Key Features**:
- Import/edit workouts with groups (single, superset, triset, circuit)
- Execute workout sessions with set/rep/weight logging
- Rest timers for supersets and exercise groups
- Track exercise history and volume metrics
- Review workout history and progress

**Tech Stack**:
- Frontend: React 19 + TypeScript + Vite
- Backend: Supabase (Postgres 17)
- State: TanStack Query v5
- Styling: Tailwind CSS
- PWA: vite-plugin-pwa with Workbox
- Testing: Vitest + React Testing Library

---

## 2. Data Model

### 2.1 Enums

```sql
CREATE TYPE exercise_category AS ENUM (
  'strength',
  'cardio',
  'mobility',
  'balance'
);

CREATE TYPE group_type AS ENUM (
  'single',    -- One exercise at a time
  'superset',  -- Two exercises back-to-back
  'triset',    -- Three exercises back-to-back
  'circuit'    -- Multiple exercises in sequence
);
```

### 2.2 Tables

#### exercises - Global Exercise Library

```sql
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category exercise_category NOT NULL DEFAULT 'strength',
  description TEXT,
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete support
);

COMMENT ON TABLE exercises IS 'Global exercise library for the user';
COMMENT ON COLUMN exercises.name IS 'Unique exercise name, e.g., "Flat Bench Press"';
COMMENT ON COLUMN exercises.deleted_at IS 'Soft delete timestamp - NULL means active';
```

#### workouts - Workout Definitions

```sql
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE workouts IS 'Workout templates that can be executed as sessions';
```

#### workout_groups - Groups Within a Workout

```sql
CREATE TABLE workout_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES workouts ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- 'Group A', 'Group B', etc.
  group_type group_type NOT NULL DEFAULT 'single',
  rest_seconds INT NOT NULL DEFAULT 90, -- Default rest between rounds
  position INT NOT NULL, -- Display order (1, 2, 3, ...)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE workout_groups IS 'Logical groups within a workout (e.g., Superset A, Circuit B)';
COMMENT ON COLUMN workout_groups.rest_seconds IS 'Default rest after completing this group';
COMMENT ON COLUMN workout_groups.position IS 'Auto-managed display order within workout';
```

#### workout_items - Exercises Within a Group

```sql
CREATE TABLE workout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_group_id UUID REFERENCES workout_groups ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises NOT NULL,
  group_position TEXT NOT NULL, -- 'A1', 'A2', 'B1', etc.
  position INT NOT NULL, -- Flat position across entire workout
  target_sets INT, -- Suggested sets (e.g., 4)
  target_reps INT, -- Suggested reps (e.g., 8)
  target_weight DECIMAL(5,2), -- Suggested weight in kg
  rest_seconds INT, -- Override group rest (NULL = inherit from workout_groups.rest_seconds)
  notes TEXT, -- Exercise-specific notes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE workout_items IS 'Individual exercises within workout groups';
COMMENT ON COLUMN workout_items.group_position IS 'Human-readable position like "A1", "B2"';
COMMENT ON COLUMN workout_items.position IS 'Auto-managed flat position for entire workout ordering';
COMMENT ON COLUMN workout_items.rest_seconds IS 'NULL = inherit from group, INT = override';
COMMENT ON COLUMN workout_items.target_sets IS 'Suggested sets - actual sets logged in sessions';
```

#### cycles - Multi-Week Workout Programs

```sql
CREATE TABLE cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  workout_id UUID REFERENCES workouts NOT NULL,
  duration_weeks INT NOT NULL DEFAULT 4,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cycles IS 'Running a specific workout over N weeks';
```

#### sessions - Executed Workout Instances

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  workout_id UUID REFERENCES workouts, -- Source workout (nullable after workout deletion)
  cycle_id UUID REFERENCES cycles, -- Part of cycle (nullable for freestyle)
  user_id UUID REFERENCES auth.users NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ, -- NULL = in progress
  total_volume INT, -- Calculated: SUM(reps × weight) across all sets
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sessions IS 'Immutable snapshots of workout execution';
COMMENT ON COLUMN sessions.workout_id IS 'Source workout - nullable to preserve history if workout deleted';
COMMENT ON COLUMN sessions.finished_at IS 'NULL = session in progress';
COMMENT ON COLUMN sessions.total_volume IS 'Calculated on session finish';
```

#### session_groups - Session Group Snapshots

```sql
CREATE TABLE session_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  group_type group_type NOT NULL,
  rest_seconds INT NOT NULL,
  position INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE session_groups IS 'Snapshot of workout_groups at session start time';
```

#### session_items - Session Item Snapshots

```sql
CREATE TABLE session_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_group_id UUID REFERENCES session_groups ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises NOT NULL,
  exercise_name TEXT NOT NULL, -- Denormalized for history preservation
  group_position TEXT NOT NULL,
  position INT NOT NULL,
  target_sets INT,
  target_reps INT,
  target_weight DECIMAL(5,2),
  rest_seconds INT, -- Effective rest (resolved from override or group default)
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE session_items IS 'Snapshot of workout_items at session start time';
COMMENT ON COLUMN session_items.exercise_name IS 'Denormalized - preserves name even if exercise renamed/deleted';
COMMENT ON COLUMN session_items.rest_seconds IS 'Resolved effective rest (not nullable in session)';
```

#### sets - Logged Exercise Sets

```sql
CREATE TABLE sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_item_id UUID REFERENCES session_items ON DELETE CASCADE NOT NULL,
  reps INT NOT NULL,
  weight DECIMAL(5,2) NOT NULL, -- kg or lb based on user settings
  set_number INT NOT NULL, -- 1, 2, 3, 4...
  volume INT GENERATED ALWAYS AS (reps * weight) STORED, -- Calculated column
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sets IS 'Individual logged sets during session execution';
COMMENT ON COLUMN sets.volume IS 'Auto-calculated: reps × weight';
```

### 2.3 Triggers

```sql
-- Auto-generate positions for workout_items
CREATE OR REPLACE FUNCTION auto_position_workout_items()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.position IS NULL THEN
    SELECT COALESCE(MAX(position), 0) + 1
    INTO NEW.position
    FROM workout_items wi
    JOIN workout_groups wg ON wi.workout_group_id = wg.id
    WHERE wg.workout_id = (
      SELECT workout_id FROM workout_groups WHERE id = NEW.workout_group_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_position_workout_items
  BEFORE INSERT ON workout_items
  FOR EACH ROW
  EXECUTE FUNCTION auto_position_workout_items();
```

### 2.4 Views

```sql
-- Cycle progress tracking
CREATE VIEW v_cycle_progress AS
SELECT
  c.id AS cycle_id,
  c.name AS cycle_name,
  c.duration_weeks,
  c.start_date,
  COUNT(s.id) AS sessions_completed,
  MAX(s.started_at) AS last_session_date
FROM cycles c
LEFT JOIN sessions s ON s.cycle_id = c.id AND s.finished_at IS NOT NULL
GROUP BY c.id, c.name, c.duration_weeks, c.start_date;

COMMENT ON VIEW v_cycle_progress IS 'Track cycle completion progress';
```

```sql
-- Exercise history aggregation
CREATE VIEW v_exercise_history AS
SELECT
  e.id AS exercise_id,
  e.name AS exercise_name,
  s.id AS session_id,
  s.started_at AS session_date,
  si.id AS session_item_id,
  COUNT(st.id) AS sets_performed,
  SUM(st.volume) AS total_volume,
  MAX(st.weight) AS max_weight
FROM exercises e
JOIN session_items si ON si.exercise_id = e.id
JOIN session_groups sg ON si.session_group_id = sg.id
JOIN sessions s ON sg.session_id = s.id
LEFT JOIN sets st ON st.session_item_id = si.id
WHERE s.finished_at IS NOT NULL
GROUP BY e.id, e.name, s.id, s.started_at, si.id
ORDER BY s.started_at DESC;

COMMENT ON VIEW v_exercise_history IS 'Per-exercise volume history across all sessions';
```

---

## 3. Server RPCs

### 3.1 Read RPCs (UI-Ready JSON)

All read RPCs return structured JSON for direct UI consumption. No client-side JOINs required.

#### workout_list_json()

**Purpose**: List all workouts for workout library view
**Returns**: Array of workout summaries

```sql
CREATE OR REPLACE FUNCTION workout_list_json()
RETURNS JSON AS $$
  SELECT json_agg(json_build_object(
    'id', w.id,
    'name', w.name,
    'description', w.description,
    'groupCount', (SELECT COUNT(*) FROM workout_groups WHERE workout_id = w.id),
    'itemCount', (
      SELECT COUNT(*)
      FROM workout_items wi
      JOIN workout_groups wg ON wi.workout_group_id = wg.id
      WHERE wg.workout_id = w.id
    ),
    'lastUsed', (
      SELECT MAX(s.started_at)
      FROM sessions s
      WHERE s.workout_id = w.id AND s.finished_at IS NOT NULL
    ),
    'createdAt', w.created_at
  ) ORDER BY w.created_at DESC)
  FROM workouts w
  WHERE w.user_id = auth.uid() AND w.deleted_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER;
```

**Response Example**:
```json
[
  {
    "id": "uuid-1",
    "name": "Push A",
    "description": "Chest and triceps focus",
    "groupCount": 2,
    "itemCount": 5,
    "lastUsed": "2025-10-01T14:30:00Z",
    "createdAt": "2025-09-15T10:00:00Z"
  }
]
```

#### workout_detail_json(p_workout_id UUID)

**Purpose**: Full workout editor payload with groups and items
**Returns**: Complete workout structure with effective rest

```sql
CREATE OR REPLACE FUNCTION workout_detail_json(p_workout_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'id', w.id,
    'name', w.name,
    'description', w.description,
    'groups', (
      SELECT json_agg(json_build_object(
        'id', wg.id,
        'name', wg.name,
        'groupType', wg.group_type,
        'restSeconds', wg.rest_seconds,
        'position', wg.position,
        'items', (
          SELECT json_agg(json_build_object(
            'id', wi.id,
            'exerciseId', wi.exercise_id,
            'exerciseName', e.name,
            'groupPosition', wi.group_position,
            'position', wi.position,
            'targetSets', wi.target_sets,
            'targetReps', wi.target_reps,
            'targetWeight', wi.target_weight,
            'restSeconds', COALESCE(wi.rest_seconds, wg.rest_seconds), -- Effective rest
            'notes', wi.notes
          ) ORDER BY wi.position)
          FROM workout_items wi
          JOIN exercises e ON wi.exercise_id = e.id
          WHERE wi.workout_group_id = wg.id
        )
      ) ORDER BY wg.position)
      FROM workout_groups wg
      WHERE wg.workout_id = w.id
    ),
    'createdAt', w.created_at,
    'updatedAt', w.updated_at
  )
  FROM workouts w
  WHERE w.id = p_workout_id AND w.user_id = auth.uid() AND w.deleted_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER;
```

#### session_detail_json(p_session_id UUID)

**Purpose**: Complete session data with groups, items, and logged sets
**Returns**: Session execution state with totals

```sql
CREATE OR REPLACE FUNCTION session_detail_json(p_session_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'id', s.id,
    'title', s.title,
    'workoutId', s.workout_id,
    'startedAt', s.started_at,
    'finishedAt', s.finished_at,
    'totalVolume', COALESCE(s.total_volume, (
      SELECT SUM(st.volume)
      FROM sets st
      JOIN session_items si ON st.session_item_id = si.id
      JOIN session_groups sg ON si.session_group_id = sg.id
      WHERE sg.session_id = s.id
    )),
    'groups', (
      SELECT json_agg(json_build_object(
        'id', sg.id,
        'name', sg.name,
        'groupType', sg.group_type,
        'restSeconds', sg.rest_seconds,
        'position', sg.position,
        'items', (
          SELECT json_agg(json_build_object(
            'id', si.id,
            'exerciseId', si.exercise_id,
            'exerciseName', si.exercise_name,
            'groupPosition', si.group_position,
            'targetSets', si.target_sets,
            'targetReps', si.target_reps,
            'targetWeight', si.target_weight,
            'restSeconds', si.rest_seconds,
            'sets', (
              SELECT json_agg(json_build_object(
                'id', st.id,
                'reps', st.reps,
                'weight', st.weight,
                'volume', st.volume,
                'setNumber', st.set_number,
                'completedAt', st.completed_at
              ) ORDER BY st.set_number)
              FROM sets st
              WHERE st.session_item_id = si.id
            ),
            'setsCompleted', (SELECT COUNT(*) FROM sets WHERE session_item_id = si.id),
            'itemVolume', (SELECT SUM(volume) FROM sets WHERE session_item_id = si.id)
          ) ORDER BY si.position)
          FROM session_items si
          WHERE si.session_group_id = sg.id
        ),
        'groupVolume', (
          SELECT SUM(st.volume)
          FROM sets st
          JOIN session_items si ON st.session_item_id = si.id
          WHERE si.session_group_id = sg.id
        )
      ) ORDER BY sg.position)
      FROM session_groups sg
      WHERE sg.session_id = s.id
    )
  )
  FROM sessions s
  WHERE s.id = p_session_id AND s.user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;
```

#### exercise_history_json(p_exercise_id UUID)

**Purpose**: Historical performance data for one exercise
**Returns**: Volume and weight progression over time

```sql
CREATE OR REPLACE FUNCTION exercise_history_json(p_exercise_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'exerciseId', e.id,
    'exerciseName', e.name,
    'sessions', (
      SELECT json_agg(json_build_object(
        'sessionId', s.id,
        'sessionDate', s.started_at,
        'sessionTitle', s.title,
        'setsPerformed', COUNT(st.id),
        'totalVolume', SUM(st.volume),
        'maxWeight', MAX(st.weight),
        'avgReps', AVG(st.reps),
        'sets', json_agg(json_build_object(
          'reps', st.reps,
          'weight', st.weight,
          'volume', st.volume
        ) ORDER BY st.set_number)
      ) ORDER BY s.started_at DESC)
      FROM sessions s
      JOIN session_groups sg ON sg.session_id = s.id
      JOIN session_items si ON si.session_group_id = sg.id
      JOIN sets st ON st.session_item_id = si.id
      WHERE si.exercise_id = p_exercise_id
        AND s.finished_at IS NOT NULL
        AND s.user_id = auth.uid()
      GROUP BY s.id, s.started_at, s.title
    )
  )
  FROM exercises e
  WHERE e.id = p_exercise_id AND e.user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;
```

#### workout_history_json(p_workout_id UUID)

**Purpose**: All sessions for a specific workout
**Returns**: Session list with volume totals

```sql
CREATE OR REPLACE FUNCTION workout_history_json(p_workout_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'workoutId', w.id,
    'workoutName', w.name,
    'sessions', (
      SELECT json_agg(json_build_object(
        'id', s.id,
        'title', s.title,
        'startedAt', s.started_at,
        'finishedAt', s.finished_at,
        'totalVolume', s.total_volume,
        'duration', EXTRACT(EPOCH FROM (s.finished_at - s.started_at))::INT
      ) ORDER BY s.started_at DESC)
      FROM sessions s
      WHERE s.workout_id = p_workout_id
        AND s.finished_at IS NOT NULL
        AND s.user_id = auth.uid()
    )
  )
  FROM workouts w
  WHERE w.id = p_workout_id AND w.user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;
```

#### exercise_list_json()

**Purpose**: All exercises in user's library
**Returns**: Exercise library with usage stats

```sql
CREATE OR REPLACE FUNCTION exercise_list_json()
RETURNS JSON AS $$
  SELECT json_agg(json_build_object(
    'id', e.id,
    'name', e.name,
    'category', e.category,
    'description', e.description,
    'timesUsed', (
      SELECT COUNT(DISTINCT s.id)
      FROM sessions s
      JOIN session_groups sg ON sg.session_id = s.id
      JOIN session_items si ON si.session_group_id = sg.id
      WHERE si.exercise_id = e.id AND s.finished_at IS NOT NULL
    ),
    'lastUsed', (
      SELECT MAX(s.started_at)
      FROM sessions s
      JOIN session_groups sg ON sg.session_id = s.id
      JOIN session_items si ON si.session_group_id = sg.id
      WHERE si.exercise_id = e.id AND s.finished_at IS NOT NULL
    )
  ) ORDER BY e.name)
  FROM exercises e
  WHERE e.user_id = auth.uid() AND e.deleted_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER;
```

### 3.2 Write RPCs (Lean Mutations)

All write RPCs are intent-based and return void (or minimal IDs). Client calls `invalidateQueries` after mutation.

#### add_workout(p_name TEXT, p_description TEXT)

```sql
CREATE OR REPLACE FUNCTION add_workout(
  p_name TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_workout_id UUID;
BEGIN
  INSERT INTO workouts (name, description, user_id)
  VALUES (p_name, p_description, auth.uid())
  RETURNING id INTO v_workout_id;

  RETURN v_workout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### update_workout(p_workout_id UUID, p_name TEXT, p_description TEXT)

```sql
CREATE OR REPLACE FUNCTION update_workout(
  p_workout_id UUID,
  p_name TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE workouts
  SET name = p_name,
      description = p_description,
      updated_at = NOW()
  WHERE id = p_workout_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### delete_workout(p_workout_id UUID)

```sql
CREATE OR REPLACE FUNCTION delete_workout(p_workout_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Soft delete
  UPDATE workouts
  SET deleted_at = NOW()
  WHERE id = p_workout_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### add_workout_group(p_workout_id UUID, p_name TEXT, p_group_type group_type, p_rest_seconds INT)

```sql
CREATE OR REPLACE FUNCTION add_workout_group(
  p_workout_id UUID,
  p_name TEXT,
  p_group_type group_type DEFAULT 'single',
  p_rest_seconds INT DEFAULT 90
)
RETURNS UUID AS $$
DECLARE
  v_group_id UUID;
  v_next_position INT;
BEGIN
  -- Get next position
  SELECT COALESCE(MAX(position), 0) + 1 INTO v_next_position
  FROM workout_groups
  WHERE workout_id = p_workout_id;

  INSERT INTO workout_groups (workout_id, name, group_type, rest_seconds, position)
  VALUES (p_workout_id, p_name, p_group_type, p_rest_seconds, v_next_position)
  RETURNING id INTO v_group_id;

  RETURN v_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### reorder_workout_groups(p_workout_id UUID, p_moved_group_id UUID, p_before_group_id UUID)

**Purpose**: Move a group before another group (or to end if before_group_id is NULL)

```sql
CREATE OR REPLACE FUNCTION reorder_workout_groups(
  p_workout_id UUID,
  p_moved_group_id UUID,
  p_before_group_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_new_position INT;
BEGIN
  -- Determine new position
  IF p_before_group_id IS NULL THEN
    -- Move to end
    SELECT COALESCE(MAX(position), 0) + 1 INTO v_new_position
    FROM workout_groups
    WHERE workout_id = p_workout_id AND id != p_moved_group_id;
  ELSE
    -- Move before specified group
    SELECT position INTO v_new_position
    FROM workout_groups
    WHERE id = p_before_group_id;
  END IF;

  -- Update moved group position
  UPDATE workout_groups
  SET position = v_new_position
  WHERE id = p_moved_group_id;

  -- Renumber all groups to remove gaps
  WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY position) AS new_pos
    FROM workout_groups
    WHERE workout_id = p_workout_id
  )
  UPDATE workout_groups wg
  SET position = numbered.new_pos
  FROM numbered
  WHERE wg.id = numbered.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### add_workout_item(p_workout_group_id UUID, p_exercise_id UUID, p_target_sets INT, p_target_reps INT, p_target_weight DECIMAL, p_rest_seconds INT)

```sql
CREATE OR REPLACE FUNCTION add_workout_item(
  p_workout_group_id UUID,
  p_exercise_id UUID,
  p_target_sets INT DEFAULT NULL,
  p_target_reps INT DEFAULT NULL,
  p_target_weight DECIMAL(5,2) DEFAULT NULL,
  p_rest_seconds INT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_item_id UUID;
  v_group_position TEXT;
  v_group_name TEXT;
  v_item_count INT;
BEGIN
  -- Get group name and item count
  SELECT name INTO v_group_name
  FROM workout_groups
  WHERE id = p_workout_group_id;

  SELECT COUNT(*) INTO v_item_count
  FROM workout_items
  WHERE workout_group_id = p_workout_group_id;

  -- Generate group_position (e.g., 'A1', 'A2')
  v_group_position := SUBSTRING(v_group_name FROM 'Group ([A-Z])') || (v_item_count + 1)::TEXT;

  INSERT INTO workout_items (
    workout_group_id,
    exercise_id,
    group_position,
    target_sets,
    target_reps,
    target_weight,
    rest_seconds
  )
  VALUES (
    p_workout_group_id,
    p_exercise_id,
    v_group_position,
    p_target_sets,
    p_target_reps,
    p_target_weight,
    p_rest_seconds
  )
  RETURNING id INTO v_item_id;

  RETURN v_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### start_session(p_cycle_id UUID, p_workout_id UUID, p_title TEXT)

**Purpose**: Create immutable session snapshot from workout definition

```sql
CREATE OR REPLACE FUNCTION start_session(
  p_cycle_id UUID DEFAULT NULL,
  p_workout_id UUID DEFAULT NULL,
  p_title TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_title TEXT;
  v_group_id_map HSTORE; -- Map old group IDs to new session group IDs
BEGIN
  -- Transaction is implicit in plpgsql functions

  -- Generate title if not provided
  IF p_title IS NULL THEN
    SELECT name INTO v_title FROM workouts WHERE id = p_workout_id;
    v_title := v_title || ' – ' || TO_CHAR(NOW(), 'Mon DD');
  ELSE
    v_title := p_title;
  END IF;

  -- Create session
  INSERT INTO sessions (title, workout_id, cycle_id, user_id)
  VALUES (v_title, p_workout_id, p_cycle_id, auth.uid())
  RETURNING id INTO v_session_id;

  -- Copy workout groups → session groups (with ID mapping)
  WITH new_groups AS (
    INSERT INTO session_groups (session_id, name, group_type, rest_seconds, position)
    SELECT v_session_id, name, group_type, rest_seconds, position
    FROM workout_groups
    WHERE workout_id = p_workout_id
    ORDER BY position
    RETURNING id, (SELECT id FROM workout_groups wg WHERE wg.workout_id = p_workout_id ORDER BY position OFFSET (ROW_NUMBER() OVER () - 1) LIMIT 1) AS old_group_id
  )
  SELECT hstore(array_agg(old_group_id::TEXT), array_agg(id::TEXT)) INTO v_group_id_map
  FROM new_groups;

  -- Copy workout items → session items (using ID map)
  INSERT INTO session_items (
    session_group_id,
    exercise_id,
    exercise_name,
    group_position,
    position,
    target_sets,
    target_reps,
    target_weight,
    rest_seconds,
    notes
  )
  SELECT
    (v_group_id_map -> wi.workout_group_id::TEXT)::UUID,
    wi.exercise_id,
    e.name,
    wi.group_position,
    wi.position,
    wi.target_sets,
    wi.target_reps,
    wi.target_weight,
    COALESCE(wi.rest_seconds, wg.rest_seconds), -- Resolve effective rest
    wi.notes
  FROM workout_items wi
  JOIN workout_groups wg ON wi.workout_group_id = wg.id
  JOIN exercises e ON wi.exercise_id = e.id
  WHERE wg.workout_id = p_workout_id
  ORDER BY wi.position;

  RETURN v_session_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create session: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### log_set(p_session_item_id UUID, p_reps INT, p_weight DECIMAL)

```sql
CREATE OR REPLACE FUNCTION log_set(
  p_session_item_id UUID,
  p_reps INT,
  p_weight DECIMAL(5,2)
)
RETURNS UUID AS $$
DECLARE
  v_set_id UUID;
  v_set_number INT;
BEGIN
  -- Get next set number
  SELECT COALESCE(MAX(set_number), 0) + 1 INTO v_set_number
  FROM sets
  WHERE session_item_id = p_session_item_id;

  INSERT INTO sets (session_item_id, reps, weight, set_number)
  VALUES (p_session_item_id, p_reps, p_weight, v_set_number)
  RETURNING id INTO v_set_id;

  RETURN v_set_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### finish_session(p_session_id UUID)

```sql
CREATE OR REPLACE FUNCTION finish_session(p_session_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_volume INT;
BEGIN
  -- Calculate total volume
  SELECT SUM(st.volume) INTO v_total_volume
  FROM sets st
  JOIN session_items si ON st.session_item_id = si.id
  JOIN session_groups sg ON si.session_group_id = sg.id
  WHERE sg.session_id = p_session_id;

  -- Mark session finished
  UPDATE sessions
  SET finished_at = NOW(),
      total_volume = v_total_volume
  WHERE id = p_session_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. Query Key Strategy

Complete TanStack Query key hierarchy for all entities and operations.

### 4.1 Query Key Constants

```typescript
// src/lib/queryKeys.ts

export const queryKeys = {
  // Workouts
  workouts: {
    all: ['workouts'] as const,
    lists: () => [...queryKeys.workouts.all, 'list'] as const,
    list: () => [...queryKeys.workouts.lists()] as const,
    details: () => [...queryKeys.workouts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.workouts.details(), id] as const,
    previews: () => [...queryKeys.workouts.all, 'preview'] as const,
    preview: (id: string) => [...queryKeys.workouts.previews(), id] as const,
    histories: () => [...queryKeys.workouts.all, 'history'] as const,
    history: (id: string) => [...queryKeys.workouts.histories(), id] as const,
  },

  // Sessions
  sessions: {
    all: ['sessions'] as const,
    lists: () => [...queryKeys.sessions.all, 'list'] as const,
    list: () => [...queryKeys.sessions.lists()] as const,
    details: () => [...queryKeys.sessions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.sessions.details(), id] as const,
    active: () => [...queryKeys.sessions.all, 'active'] as const,
  },

  // Exercises
  exercises: {
    all: ['exercises'] as const,
    lists: () => [...queryKeys.exercises.all, 'list'] as const,
    list: () => [...queryKeys.exercises.lists()] as const,
    details: () => [...queryKeys.exercises.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.exercises.details(), id] as const,
    histories: () => [...queryKeys.exercises.all, 'history'] as const,
    history: (id: string) => [...queryKeys.exercises.histories(), id] as const,
  },

  // Cycles
  cycles: {
    all: ['cycles'] as const,
    lists: () => [...queryKeys.cycles.all, 'list'] as const,
    list: () => [...queryKeys.cycles.lists()] as const,
    details: () => [...queryKeys.cycles.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.cycles.details(), id] as const,
    active: () => [...queryKeys.cycles.all, 'active'] as const,
  },
} as const;
```

### 4.2 Usage Examples

```typescript
// Fetch workout detail
const { data: workout } = useQuery({
  queryKey: queryKeys.workouts.detail(workoutId),
  queryFn: async () => {
    const { data, error } = await supabase
      .rpc('workout_detail_json', { p_workout_id: workoutId });
    if (error) throw error;
    return data;
  },
});

// Fetch exercise history
const { data: history } = useQuery({
  queryKey: queryKeys.exercises.history(exerciseId),
  queryFn: async () => {
    const { data, error } = await supabase
      .rpc('exercise_history_json', { p_exercise_id: exerciseId });
    if (error) throw error;
    return data;
  },
});
```

### 4.3 Cache Configuration

```typescript
// src/lib/queryClient.ts

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global defaults
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Entity-specific cache times
export const cacheConfig = {
  // Workouts change infrequently - cache longer
  workouts: {
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  },

  // Active sessions change frequently - cache briefly
  activeSessions: {
    staleTime: 1000 * 10, // 10 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 15, // Poll every 15s during active session
  },

  // Historical data rarely changes - cache aggressively
  history: {
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
  },

  // Exercise library changes infrequently
  exercises: {
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  },
};
```

---

## 5. Cache Invalidation Map

Complete mapping of mutations to affected query keys.

### 5.1 Workout Mutations

```typescript
// src/hooks/useWorkoutMutations.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';

// Add workout
export function useAddWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { name: string; description?: string }) => {
      const { data, error } = await supabase.rpc('add_workout', {
        p_name: params.name,
        p_description: params.description,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate workout list
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.lists() });
    },
  });
}

// Update workout
export function useUpdateWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      workoutId: string;
      name: string;
      description?: string;
    }) => {
      const { error } = await supabase.rpc('update_workout', {
        p_workout_id: params.workoutId,
        p_name: params.name,
        p_description: params.description,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalidate specific workout detail
      queryClient.invalidateQueries({
        queryKey: queryKeys.workouts.detail(variables.workoutId),
      });
      // Invalidate workout list (name might have changed)
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.lists() });
    },
  });
}

// Delete workout
export function useDeleteWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workoutId: string) => {
      const { error } = await supabase.rpc('delete_workout', {
        p_workout_id: workoutId,
      });
      if (error) throw error;
    },
    onSuccess: (_, workoutId) => {
      // Invalidate workout list
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.lists() });
      // Invalidate specific workout (will now return null/404)
      queryClient.invalidateQueries({
        queryKey: queryKeys.workouts.detail(workoutId),
      });
      // Invalidate cycles that might reference this workout
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.all });
    },
  });
}

// Add workout group
export function useAddWorkoutGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      workoutId: string;
      name: string;
      groupType?: 'single' | 'superset' | 'triset' | 'circuit';
      restSeconds?: number;
    }) => {
      const { data, error } = await supabase.rpc('add_workout_group', {
        p_workout_id: params.workoutId,
        p_name: params.name,
        p_group_type: params.groupType,
        p_rest_seconds: params.restSeconds,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate workout detail (structure changed)
      queryClient.invalidateQueries({
        queryKey: queryKeys.workouts.detail(variables.workoutId),
      });
    },
  });
}

// Reorder workout groups
export function useReorderWorkoutGroups() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      workoutId: string;
      movedGroupId: string;
      beforeGroupId?: string;
    }) => {
      const { error } = await supabase.rpc('reorder_workout_groups', {
        p_workout_id: params.workoutId,
        p_moved_group_id: params.movedGroupId,
        p_before_group_id: params.beforeGroupId,
      });
      if (error) throw error;
    },
    // Optimistic update for smooth UX
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.workouts.detail(variables.workoutId),
      });

      const previousWorkout = queryClient.getQueryData(
        queryKeys.workouts.detail(variables.workoutId)
      );

      // Optimistically update cache (reorder groups in UI immediately)
      queryClient.setQueryData(
        queryKeys.workouts.detail(variables.workoutId),
        (old: any) => {
          if (!old) return old;
          // Implement optimistic reordering logic here
          return old;
        }
      );

      return { previousWorkout };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousWorkout) {
        queryClient.setQueryData(
          queryKeys.workouts.detail(variables.workoutId),
          context.previousWorkout
        );
      }
    },
    onSettled: (_, __, variables) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.workouts.detail(variables.workoutId),
      });
    },
  });
}
```

### 5.2 Session Mutations

```typescript
// Start session
export function useStartSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      workoutId?: string;
      cycleId?: string;
      title?: string;
    }) => {
      const { data, error } = await supabase.rpc('start_session', {
        p_workout_id: params.workoutId,
        p_cycle_id: params.cycleId,
        p_title: params.title,
      });
      if (error) throw error;
      return data; // Returns session_id
    },
    onSuccess: (sessionId, variables) => {
      // Invalidate active sessions
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.active(),
      });
      // If part of cycle, invalidate cycle progress
      if (variables.cycleId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.cycles.detail(variables.cycleId),
        });
      }
      // Prefetch session detail for smooth navigation
      queryClient.prefetchQuery({
        queryKey: queryKeys.sessions.detail(sessionId),
        queryFn: async () => {
          const { data } = await supabase.rpc('session_detail_json', {
            p_session_id: sessionId,
          });
          return data;
        },
      });
    },
  });
}

// Log set
export function useLogSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      sessionId: string;
      sessionItemId: string;
      reps: number;
      weight: number;
    }) => {
      const { data, error } = await supabase.rpc('log_set', {
        p_session_item_id: params.sessionItemId,
        p_reps: params.reps,
        p_weight: params.weight,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate session detail (totals changed)
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(variables.sessionId),
      });
    },
  });
}

// Finish session
export function useFinishSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      sessionId: string;
      workoutId?: string;
      cycleId?: string;
    }) => {
      const { error } = await supabase.rpc('finish_session', {
        p_session_id: params.sessionId,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalidate session detail
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(variables.sessionId),
      });
      // Invalidate active sessions
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.active(),
      });
      // If workout-based, invalidate workout history
      if (variables.workoutId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.workouts.history(variables.workoutId),
        });
      }
      // If cycle-based, invalidate cycle progress
      if (variables.cycleId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.cycles.detail(variables.cycleId),
        });
      }
      // Invalidate exercise histories for all exercises in session
      queryClient.invalidateQueries({
        queryKey: queryKeys.exercises.histories(),
      });
    },
  });
}
```

### 5.3 Complete Invalidation Reference

| Mutation | Invalidated Query Keys |
|----------|----------------------|
| `add_workout` | `workouts.lists()` |
| `update_workout` | `workouts.detail(id)`, `workouts.lists()` |
| `delete_workout` | `workouts.lists()`, `workouts.detail(id)`, `cycles.all` |
| `add_workout_group` | `workouts.detail(workoutId)` |
| `update_workout_group` | `workouts.detail(workoutId)` |
| `delete_workout_group` | `workouts.detail(workoutId)` |
| `reorder_workout_groups` | `workouts.detail(workoutId)` |
| `add_workout_item` | `workouts.detail(workoutId)` |
| `update_workout_item` | `workouts.detail(workoutId)` |
| `delete_workout_item` | `workouts.detail(workoutId)` |
| `reorder_workout_items` | `workouts.detail(workoutId)` |
| `start_session` | `sessions.active()`, `cycles.detail(cycleId)?` |
| `log_set` | `sessions.detail(sessionId)` |
| `finish_session` | `sessions.detail(sessionId)`, `sessions.active()`, `workouts.history(workoutId)?`, `cycles.detail(cycleId)?`, `exercises.histories()` |
| `add_exercise` | `exercises.lists()` |
| `update_exercise` | `exercises.detail(id)`, `exercises.lists()` |
| `delete_exercise` | `exercises.lists()`, `exercises.detail(id)` |
| `add_cycle` | `cycles.lists()` |
| `update_cycle` | `cycles.detail(id)`, `cycles.lists()` |
| `delete_cycle` | `cycles.lists()`, `cycles.detail(id)` |

---

## 6. Offline Strategy

### 6.1 Network-Required Architecture (V1 Approach)

**Decision**: Active workout sessions **require network connectivity**. Historical data can be cached for offline viewing.

**Rationale**:
- Server-first architecture with JSON RPCs requires network for writes
- Single-user app doesn't need complex distributed state management
- Honest UX is better than partially-offline experience with sync conflicts
- V1 scope prioritizes working online experience over offline capability

### 6.2 PWA Capabilities

```typescript
// vite.config.ts PWA configuration

import { VitePWA } from 'vite-plugin-pwa';

export default {
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Uzo Fitness Tracker',
        short_name: 'UzoFit',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [/* icons */],
      },
      workbox: {
        // Cache static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],

        // Cache Supabase API responses (read-only data)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200], // Only cache successful responses
              },
            },
          },
          {
            // Cache workout/session history (stable data)
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/rpc\/(workout_history_json|exercise_history_json|session_detail_json).*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'history-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
        ],
      },
    }),
  ],
};
```

### 6.3 Network Status Handling

```typescript
// src/hooks/useNetworkStatus.ts

import { useEffect, useState } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

```typescript
// src/components/NetworkStatusBanner.tsx

import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function NetworkStatusBanner() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="bg-yellow-100 border-b border-yellow-400 p-3 text-center">
      <p className="text-sm text-yellow-800 font-medium">
        ⚠️ You're offline. Active workouts require internet connection.
      </p>
      <p className="text-xs text-yellow-700 mt-1">
        Historical data is available offline.
      </p>
    </div>
  );
}
```

### 6.4 Offline UX Patterns

```typescript
// Disable session actions when offline
export function useStartSessionMutation() {
  const isOnline = useNetworkStatus();
  const mutation = useStartSession();

  return {
    ...mutation,
    mutate: (...args: any[]) => {
      if (!isOnline) {
        toast.error('Active workouts require internet connection');
        return;
      }
      return mutation.mutate(...args);
    },
  };
}
```

### 6.5 Future Offline Enhancement (V2 Scope)

If offline-first becomes critical:

**Option 1: Optimistic Offline Queue**
- Store set logs in IndexedDB when offline
- Sync to Supabase when connection restored
- Show "pending sync" indicator in UI
- Handle conflict resolution if session modified elsewhere

**Option 2: Local-First Architecture**
- Use local SQLite (via WA-SQLite) as source of truth
- Bidirectional sync with Supabase
- Requires significant architectural refactor
- Complex conflict resolution logic

**Recommendation for V1**: Stick with network-required. Validate user needs before adding complexity.

---

## 7. Database Indexes

### 7.1 Performance-Critical Indexes

```sql
-- ============================================
-- FOREIGN KEY INDEXES (Essential for JOINs)
-- ============================================

-- Workout hierarchy
CREATE INDEX idx_workout_groups_workout_id
  ON workout_groups(workout_id);

CREATE INDEX idx_workout_items_workout_group_id
  ON workout_items(workout_group_id);

CREATE INDEX idx_workout_items_exercise_id
  ON workout_items(exercise_id);

-- Session hierarchy
CREATE INDEX idx_session_groups_session_id
  ON session_groups(session_id);

CREATE INDEX idx_session_items_session_group_id
  ON session_items(session_group_id);

CREATE INDEX idx_session_items_exercise_id
  ON session_items(exercise_id);

CREATE INDEX idx_sets_session_item_id
  ON sets(session_item_id);

-- Cycles
CREATE INDEX idx_cycles_workout_id
  ON cycles(workout_id);

CREATE INDEX idx_sessions_cycle_id
  ON sessions(cycle_id);

-- ============================================
-- QUERY OPTIMIZATION INDEXES
-- ============================================

-- Workout history queries
CREATE INDEX idx_sessions_workout_id
  ON sessions(workout_id)
  WHERE finished_at IS NOT NULL;

CREATE INDEX idx_sessions_user_id_started_at
  ON sessions(user_id, started_at DESC)
  WHERE finished_at IS NOT NULL;

-- Exercise history queries
CREATE INDEX idx_sets_exercise_id_completed_at
  ON sets(
    (SELECT exercise_id FROM session_items WHERE id = session_item_id),
    completed_at DESC
  );

-- Active sessions
CREATE INDEX idx_sessions_active
  ON sessions(user_id, started_at DESC)
  WHERE finished_at IS NULL;

-- Soft delete filtering
CREATE INDEX idx_workouts_active
  ON workouts(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_exercises_active
  ON exercises(user_id, name)
  WHERE deleted_at IS NULL;

-- ============================================
-- RLS PERFORMANCE INDEXES
-- ============================================

-- User-scoped queries (for RLS policies)
CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_exercises_user_id ON exercises(user_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_cycles_user_id ON cycles(user_id);

-- ============================================
-- POSITION ORDERING INDEXES
-- ============================================

CREATE INDEX idx_workout_groups_position
  ON workout_groups(workout_id, position);

CREATE INDEX idx_workout_items_position
  ON workout_items(workout_group_id, position);

CREATE INDEX idx_session_groups_position
  ON session_groups(session_id, position);

CREATE INDEX idx_session_items_position
  ON session_items(session_group_id, position);
```

### 7.2 Index Usage Analysis

**Query**: `workout_detail_json(workout_id)`

**Indexes Used**:
1. `idx_workout_groups_workout_id` - Filter groups by workout
2. `idx_workout_items_workout_group_id` - Filter items by group
3. `idx_workout_items_exercise_id` - JOIN with exercises table

**Expected Performance**: <10ms for workout with 5 groups, 20 items

---

**Query**: `session_detail_json(session_id)`

**Indexes Used**:
1. `idx_session_groups_session_id` - Filter groups by session
2. `idx_session_items_session_group_id` - Filter items by group
3. `idx_sets_session_item_id` - Filter sets by item

**Expected Performance**: <20ms for session with 50 sets

---

**Query**: `exercise_history_json(exercise_id)`

**Indexes Used**:
1. `idx_session_items_exercise_id` - Filter session items by exercise
2. `idx_session_groups_session_id` - JOIN to sessions
3. `idx_sets_session_item_id` - Aggregate sets

**Expected Performance**: <30ms for exercise in 50 sessions with 200 total sets

---

## 8. Wireframes

*(Preserved from original spec)*

### Login

```
┌─────────────────────────┐
│   Uzo Fitness Tracker   │
├─────────────────────────┤
│                         │
│  Email                  │
│  ┌──────────────────┐   │
│  │                  │   │
│  └──────────────────┘   │
│                         │
│  Password               │
│  ┌──────────────────┐   │
│  │ ••••••••••       │   │
│  └──────────────────┘   │
│                         │
│  ┌──────────────────┐   │
│  │    Log In        │   │
│  └──────────────────┘   │
│                         │
└─────────────────────────┘
```

### Dashboard

```
┌─────────────────────────┐
│ 🏠 Dashboard            │
├─────────────────────────┤
│                         │
│ Active Cycle            │
│ ┌─────────────────────┐ │
│ │ Push A – Week 1/4   │ │
│ │ Next: Mon Oct 7     │ │
│ │                     │ │
│ │ [Start Session]     │ │
│ └─────────────────────┘ │
│                         │
│ Quick Actions           │
│ ┌─────────────────────┐ │
│ │ 💪 Freestyle        │ │
│ │    Workout          │ │
│ └─────────────────────┘ │
│                         │
│ Recent Sessions         │
│ ├─ Push A  Oct 3  4.2k │
│ ├─ Pull B  Oct 1  3.8k │
│ └─ Legs    Sep 29 5.1k │
│                         │
│ ⚙️ Settings  📊 History│
└─────────────────────────┘
```

### Workout Library

```
┌─────────────────────────┐
│ 💪 Workouts      [+]    │
├─────────────────────────┤
│                         │
│ ┌─────────────────────┐ │
│ │ Push A              │ │
│ │ 2 groups, 5 ex      │ │
│ │ Last: Oct 3         │ │
│ │ [View] [Cycle]      │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Pull B              │ │
│ │ 3 groups, 6 ex      │ │
│ │ Last: Oct 1         │ │
│ │ [View] [Cycle]      │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Legs                │ │
│ │ 3 groups, 7 ex      │ │
│ │ Last: Sep 29        │ │
│ │ [View] [Cycle]      │ │
│ └─────────────────────┘ │
│                         │
│ [Import JSON]           │
│ [Manage Exercises]      │
└─────────────────────────┘
```

### Workout Detail (Editor)

```
┌─────────────────────────┐
│ ← Push A           [⋮]  │
├─────────────────────────┤
│                         │
│ Group A • Superset      │
│ Rest: 120s    [Edit]    │
│ ├─ A1 Flat DB Press    │
│ │   4×8 @ 30kg          │
│ ├─ A2 Cable Row        │
│ │   4×10 @ 50kg         │
│ [+ Add Exercise]        │
│                         │
│ Group B • Single        │
│ Rest: 90s     [Edit]    │
│ ├─ B1 Overhead Press   │
│ │   3×8 @ 20kg          │
│ [+ Add Exercise]        │
│                         │
│ [+ Add Group]           │
│                         │
│ ┌─────────────────────┐ │
│ │ [Start Session]     │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### Active Session

```
┌─────────────────────────┐
│ ← Push A – Oct 3        │
│    ⏱️ 18:42              │
├─────────────────────────┤
│                         │
│ Group A • Superset      │
│ Round 2/4  Rest: 120s   │
│                         │
│ A1 Flat DB Press        │
│ Set 2: [8] [30] [Log]   │
│ History: 8@30, 8@30     │
│                         │
│ A2 Cable Row            │
│ Set 2: [10] [50] [Log]  │
│ History: 10@50, 10@50   │
│                         │
│ ┌─────────────────────┐ │
│ │ Start Rest (2:00)   │ │
│ └─────────────────────┘ │
│                         │
│ Group B • Single        │
│ ├─ B1 Overhead Press   │
│ │   Not started        │
│                         │
│ ┌─────────────────────┐ │
│ │ [Finish Session]    │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

---

## 9. Functional Requirements

### 9.1 Core Features

#### Authentication
- ✅ Email/password login via Supabase Auth
- ✅ Session persistence in localStorage
- ✅ Auto-refresh tokens
- ✅ Logout functionality

#### Workout Management
- ✅ Create/edit/delete workouts
- ✅ Organize exercises into groups (single, superset, triset, circuit)
- ✅ Reorder groups within workout (drag-and-drop or up/down buttons)
- ✅ Reorder items within groups
- ✅ Set target sets/reps/weight per exercise
- ✅ Configure rest periods (group default + item override)
- ✅ Add notes per exercise

#### Exercise Library
- ✅ Create/edit/delete exercises
- ✅ Categorize (strength, cardio, mobility, balance)
- ✅ View usage stats (times used, last used)
- ✅ Search/filter exercises

#### Cycles
- ✅ Create cycle from workout
- ✅ Set duration in weeks
- ✅ Track progress (sessions completed, weeks remaining)
- ✅ Mark as active cycle (displayed on dashboard)

#### Session Execution
- ✅ Start session from workout or cycle
- ✅ Log sets with reps and weight
- ✅ Rest timer (countdown with skip option)
- ✅ View previous set data (e.g., "Last: 8@30kg")
- ✅ Round tracking for supersets/circuits (Round 2/4)
- ✅ Pause/resume timer (elapsed time)
- ✅ Finish session → calculate total volume

#### History & Analytics
- ✅ Workout history (all sessions for a workout)
- ✅ Session detail (all sets for a specific day)
- ✅ Exercise history (performance over time for one exercise)
- ✅ Volume tracking (total kg lifted per session/group/item)
- ✅ Charts (line graph of weight/volume progression)

#### Data Portability
- ✅ Import workouts from JSON
- ⚠️ **Changed**: Preview new exercises before auto-adding to library
- ✅ Export workouts to JSON
- ✅ Export all data (backup)

#### Settings
- ✅ Toggle units (kg/lb)
- ✅ Dark mode
- ✅ Account management (change password, delete account)

### 9.2 Import Workflow (Enhanced)

**Previous (risky)**: Auto-add missing exercises during import
**New (safe)**:

```typescript
// Import flow with user confirmation
async function importWorkout(jsonData: WorkoutImportData) {
  // 1. Parse JSON
  const workout = JSON.parse(jsonData);

  // 2. Check for new exercises
  const existingExercises = await fetchExerciseList();
  const newExercises = workout.items
    .map(item => item.exerciseName)
    .filter(name => !existingExercises.some(ex => ex.name === name));

  // 3. If new exercises, show confirmation dialog
  if (newExercises.length > 0) {
    const confirmed = await showDialog({
      title: 'New Exercises Detected',
      message: `This workout contains ${newExercises.length} exercises not in your library:`,
      list: newExercises,
      actions: ['Cancel', 'Add to Library & Import'],
    });

    if (!confirmed) return;

    // 4. Create new exercises
    for (const name of newExercises) {
      await supabase.rpc('add_exercise', {
        p_name: name,
        p_category: 'strength', // Default, user can edit later
      });
    }
  }

  // 5. Create workout with groups and items
  const workoutId = await supabase.rpc('add_workout', {
    p_name: workout.name,
    p_description: workout.description,
  });

  // ... create groups and items
}
```

---

## 10. Technical Requirements

### 10.1 Frontend Stack

```json
{
  "dependencies": {
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "@supabase/supabase-js": "^2.58.0",
    "@tanstack/react-query": "^5.0.0",
    "react-router-dom": "^6.20.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/react": "^19.1.13",
    "@types/react-dom": "^19.1.9",
    "vite": "^7.1.7",
    "@vitejs/plugin-react": "^5.0.3",
    "vite-plugin-pwa": "^1.0.3",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "vitest": "^3.2.4",
    "@testing-library/react": "^16.3.0",
    "@testing-library/jest-dom": "^6.9.0",
    "eslint": "^9.36.0"
  }
}
```

### 10.2 Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Login, logout
│   ├── dashboard/      # Dashboard home
│   ├── workouts/       # Workout CRUD, editor
│   ├── sessions/       # Session execution
│   ├── history/        # History views, charts
│   ├── exercises/      # Exercise library
│   ├── cycles/         # Cycle management
│   └── shared/         # Buttons, inputs, modals
├── hooks/              # Custom React hooks
│   ├── useWorkouts.ts  # Workout queries/mutations
│   ├── useSessions.ts  # Session queries/mutations
│   ├── useExercises.ts # Exercise queries/mutations
│   └── useAuth.ts      # Authentication hook
├── lib/                # Utilities
│   ├── supabase.ts     # Supabase client
│   ├── queryKeys.ts    # TanStack Query keys
│   ├── queryClient.ts  # Query client config
│   └── utils.ts        # Helper functions
├── types/              # TypeScript types
│   ├── database.ts     # Supabase generated types
│   └── index.ts        # App-specific types
├── styles/             # Global styles
│   └── globals.css     # Tailwind directives
├── App.tsx             # Root component
└── main.tsx            # Entry point
```

### 10.3 Type Safety

```typescript
// Generate Supabase types
npx supabase gen types typescript --local > src/types/database.ts

// Usage
import { Database } from './types/database';

export type Workout = Database['public']['Tables']['workouts']['Row'];
export type WorkoutInsert = Database['public']['Tables']['workouts']['Insert'];
export type WorkoutUpdate = Database['public']['Tables']['workouts']['Update'];
```

### 10.4 Testing Strategy

```typescript
// Example: Workout detail hook test
import { renderHook, waitFor } from '@testing-library/react';
import { useWorkoutDetail } from './useWorkouts';
import { createWrapper } from '../test/utils';

test('fetches workout detail', async () => {
  const { result } = renderHook(() => useWorkoutDetail('workout-id'), {
    wrapper: createWrapper(),
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(result.current.data).toMatchObject({
    id: 'workout-id',
    name: 'Push A',
    groups: expect.arrayContaining([
      expect.objectContaining({
        name: 'Group A',
        groupType: 'superset',
      }),
    ]),
  });
});
```

---

## 11. Implementation Checklist

### Phase 1: Foundation ✅ (Completed)
- [x] React + Vite scaffold
- [x] Supabase configuration
- [x] Database migrations (6 migrations applied)
- [x] TypeScript types generated
- [x] Testing infrastructure (Vitest)

### Phase 2: Dependencies & Setup
- [ ] Install TanStack Query
  ```bash
  npm install @tanstack/react-query
  ```
- [ ] Install Tailwind CSS
  ```bash
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  ```
- [ ] Install React Router
  ```bash
  npm install react-router-dom
  ```
- [ ] Configure Query Client (`src/lib/queryClient.ts`)
- [ ] Configure Query Keys (`src/lib/queryKeys.ts`)

### Phase 3: Core Infrastructure
- [ ] Create Supabase client wrapper (`src/lib/supabase.ts`)
- [ ] Set up authentication context (`src/hooks/useAuth.ts`)
- [ ] Create base component library (`src/components/shared/`)
- [ ] Set up routing (`src/App.tsx`)
- [ ] Implement network status detection (`src/hooks/useNetworkStatus.ts`)

### Phase 4: Authentication
- [ ] Login page (`src/components/auth/LoginPage.tsx`)
- [ ] Auth state management
- [ ] Protected route wrapper
- [ ] Logout functionality

### Phase 5: Exercise Library
- [ ] Exercise list view
- [ ] Add/edit exercise modal
- [ ] Exercise search/filter
- [ ] Exercise queries (`src/hooks/useExercises.ts`)

### Phase 6: Workout Management
- [ ] Workout list view
- [ ] Workout detail/editor
- [ ] Add/edit group functionality
- [ ] Add/edit item functionality
- [ ] Drag-and-drop reordering (or up/down buttons)
- [ ] Workout queries/mutations (`src/hooks/useWorkouts.ts`)

### Phase 7: Session Execution
- [ ] Start session flow
- [ ] Active session UI
- [ ] Set logging
- [ ] Rest timer component
- [ ] Finish session flow
- [ ] Session queries/mutations (`src/hooks/useSessions.ts`)

### Phase 8: History & Analytics
- [ ] Workout history list
- [ ] Session detail view
- [ ] Exercise history view
- [ ] Volume charts (using Recharts)

### Phase 9: Cycles
- [ ] Cycle creation flow
- [ ] Cycle progress display
- [ ] Active cycle dashboard widget

### Phase 10: Data Portability
- [ ] JSON import with exercise confirmation dialog
- [ ] JSON export
- [ ] Full data backup export

### Phase 11: Settings & Polish
- [ ] Settings page (units, dark mode)
- [ ] PWA manifest finalization
- [ ] Service worker testing
- [ ] Performance optimization
- [ ] Accessibility audit

### Phase 12: Testing & Launch
- [ ] Write unit tests for hooks
- [ ] Write integration tests for flows
- [ ] E2E testing (Playwright)
- [ ] Performance testing
- [ ] Security audit
- [ ] Deploy to production

---

## Appendices

### A. Database Migration Order

1. `20250930000001_initial_schema.sql` - Tables and enums
2. `20250930000002_triggers_and_functions.sql` - Position triggers
3. `20250930000003_rpc_functions.sql` - JSON RPCs
4. `20250930000004_row_level_security.sql` - RLS policies
5. `20250930000005_security_improvements.sql` - Enhanced security
6. `20250930000006_soft_deletes.sql` - Soft delete support
7. **NEW**: `20251002000007_performance_indexes.sql` - All indexes from Section 7

### B. V2 Roadmap (Out of Scope for V1)

- PR tracking (1RM calculation, volume PRs, rep PRs)
- Freestyle session helper RPCs
- Notes (per-session, per-exercise, per-set)
- Progress badges and achievements
- Body weight tracking integration
- Social features (share workouts)
- Advanced analytics (volume progression graphs, periodization charts)
- Offline-first architecture with sync queue

### C. References

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)

---

**Document Status**: ✅ Ready for Implementation
**Last Updated**: 2025-10-02
**Version**: 1.1 Enhanced
