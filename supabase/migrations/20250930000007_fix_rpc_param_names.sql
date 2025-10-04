-- =========================================
-- Fix RPC Parameter Names to Match Client Calls
-- Migration: 20250930000007
-- Aligns SQL function signatures with *_id parameters used by supabase-js
-- =========================================

-- Drop old signatures
DROP FUNCTION IF EXISTS start_session(uuid, uuid, text);
DROP FUNCTION IF EXISTS workout_detail_json(uuid);
DROP FUNCTION IF EXISTS workout_preview_session_json(uuid);
DROP FUNCTION IF EXISTS workout_list_json();

-- =========================================
-- start_session: ensure parameter names match client payload
-- =========================================
CREATE OR REPLACE FUNCTION start_session(
  p_cycle_id uuid,
  p_workout_id uuid,
  p_title text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_session uuid;
  calling_user uuid;
BEGIN
  calling_user := auth.uid();

  IF calling_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify user owns the workout referenced
  IF NOT EXISTS (
    SELECT 1 FROM workouts
    WHERE id = p_workout_id
      AND user_id = calling_user
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Workout not found or access denied';
  END IF;

  -- Optional cycle ownership check when supplied
  IF p_cycle_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM cycles
    WHERE id = p_cycle_id
      AND user_id = calling_user
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Cycle not found or access denied';
  END IF;

  -- Create session record
  INSERT INTO sessions (user_id, cycle_id, workout_id, title)
  VALUES (calling_user, p_cycle_id, p_workout_id, p_title)
  RETURNING id INTO new_session;

  -- Copy workout groups
  INSERT INTO session_groups (user_id, session_id, name, group_type, position, rest_seconds)
  SELECT calling_user, new_session, wg.name, wg.group_type, wg.position, wg.rest_seconds
  FROM workout_groups wg
  WHERE wg.workout_id = p_workout_id
    AND wg.user_id = calling_user
    AND wg.deleted_at IS NULL;

  -- Copy workout items
  INSERT INTO session_items (
    user_id,
    session_id,
    group_id,
    exercise_id,
    group_position,
    position,
    planned_sets,
    planned_reps,
    planned_weight,
    item_rest_seconds,
    rest_seconds
  )
  SELECT
    calling_user,
    new_session,
    sg.id,
    wi.exercise_id,
    wi.group_position,
    0, -- placeholder; BEFORE trigger computes flattened position
    wi.set_count,
    wi.reps,
    wi.weight,
    wi.item_rest_seconds,
    COALESCE(wi.item_rest_seconds, sg.rest_seconds)
  FROM workout_items wi
  JOIN workout_groups wg ON wg.id = wi.group_id
  JOIN session_groups sg ON sg.session_id = new_session
                         AND sg.name = wg.name
  WHERE wg.workout_id = p_workout_id
    AND wi.user_id = calling_user
    AND wi.deleted_at IS NULL
    AND wg.deleted_at IS NULL
  ORDER BY wg.position, wi.group_position;

  RETURN new_session;
END;
$$;

-- =========================================
-- workout_detail_json: rename parameter to p_workout_id
-- =========================================
CREATE OR REPLACE FUNCTION workout_detail_json(p_workout_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH
workout AS (
  SELECT w.id, w.name, w.notes, count(wg.id) AS groups_count
  FROM workouts w
  LEFT JOIN workout_groups wg ON wg.workout_id = w.id AND wg.deleted_at IS NULL
  WHERE w.id = p_workout_id
    AND w.deleted_at IS NULL
    AND (
      w.user_id = auth.uid()
      OR auth.role() = 'anon'
    )
  GROUP BY w.id
),
groups AS (
  SELECT wg.id, wg.name, wg.group_type, wg.rest_seconds, wg.position
  FROM workout_groups wg
  WHERE wg.workout_id = p_workout_id
    AND wg.deleted_at IS NULL
    AND (
      wg.user_id = auth.uid()
      OR auth.role() = 'anon'
    )
  ORDER BY wg.position
),
items AS (
  SELECT
    wi.id,
    wi.group_id,
    e.id    AS exercise_id,
    e.name  AS exercise_name,
    wi.set_count,
    wi.reps,
    wi.weight,
    wi.group_position,
    wi.position,
    wi.item_rest_seconds,
    COALESCE(wi.item_rest_seconds, wg.rest_seconds) AS rest_seconds_effective
  FROM workout_items wi
  JOIN workout_groups wg ON wg.id = wi.group_id
  JOIN exercises e       ON e.id  = wi.exercise_id
  WHERE wg.workout_id = p_workout_id
    AND wi.deleted_at IS NULL
    AND wg.deleted_at IS NULL
    AND (
      wi.user_id = auth.uid()
      OR auth.role() = 'anon'
    )
  ORDER BY wi.position
),
items_json AS (
  SELECT
    it.group_id,
    jsonb_build_object(
      'workout_item_id',        it.id,
      'exercise_id',            it.exercise_id,
      'exercise_name',          it.exercise_name,
      'set_count',              it.set_count,
      'reps',                   it.reps,
      'weight',                 it.weight,
      'group_position',         it.group_position,
      'position',               it.position,
      'item_rest_seconds',      it.item_rest_seconds,
      'rest_seconds_effective', it.rest_seconds_effective
    ) AS item_obj
  FROM items it
)
SELECT jsonb_build_object(
  'workout', (
    SELECT jsonb_build_object('id', w.id, 'name', w.name, 'notes', w.notes, 'groups_count', w.groups_count)
    FROM workout w
  ),
  'groups', COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'workout_group_id', g.id,
        'name',             g.name,
        'group_type',       g.group_type,
        'rest_seconds',     g.rest_seconds,
        'position',         g.position,
        'items',            COALESCE(
                               (
                                 SELECT jsonb_agg(item_obj ORDER BY (item_obj->>'group_position')::numeric)
                                 FROM items_json ij
                                 WHERE ij.group_id = g.id
                               ),
                               '[]'::jsonb
                             )
      )
      ORDER BY g.position
    ),
    '[]'::jsonb
  ),
  'meta', jsonb_build_object(
    'next_group_position', COALESCE((SELECT max(position)::numeric + 1 FROM groups), 1),
    'next_group_name',     chr(64 + COALESCE((SELECT count(*)::int FROM groups), 0) + 1),
    'has_missing_exercises', false
  )
)
FROM groups g;
$$;

-- =========================================
-- workout_preview_session_json: align parameter name
-- =========================================
CREATE OR REPLACE FUNCTION workout_preview_session_json(p_workout_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH
groups AS (
  SELECT wg.id, wg.name, wg.group_type, wg.position, wg.rest_seconds
  FROM workout_groups wg
  WHERE wg.workout_id = p_workout_id
    AND wg.deleted_at IS NULL
    AND (
      wg.user_id = auth.uid()
      OR auth.role() = 'anon'
    )
  ORDER BY wg.position
),
items AS (
  SELECT
    wi.id,
    wi.group_id,
    e.name AS exercise_name,
    wi.group_position,
    wi.set_count AS planned_sets,
    wi.reps      AS planned_reps,
    wi.weight    AS planned_weight,
    COALESCE(wi.item_rest_seconds, wg.rest_seconds) AS rest_seconds,
    wi.position
  FROM workout_items wi
  JOIN workout_groups wg ON wg.id = wi.group_id
  JOIN exercises e       ON e.id  = wi.exercise_id
  WHERE wg.workout_id = p_workout_id
    AND wi.deleted_at IS NULL
    AND wg.deleted_at IS NULL
    AND (
      wi.user_id = auth.uid()
      OR auth.role() = 'anon'
    )
  ORDER BY wi.position
),
items_json AS (
  SELECT
    it.group_id,
    jsonb_build_object(
      'exercise_name',  it.exercise_name,
      'planned_sets',   it.planned_sets,
      'planned_reps',   it.planned_reps,
      'planned_weight', it.planned_weight,
      'rest_seconds',   it.rest_seconds
    ) AS item_obj,
    it.group_position
  FROM items it
)
SELECT jsonb_build_object(
  'groups', COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'name', g.name,
        'group_type', g.group_type,
        'rest_seconds', g.rest_seconds,
        'items', COALESCE(
          (
            SELECT jsonb_agg(item_obj ORDER BY group_position)
            FROM items_json ij
            WHERE ij.group_id = g.id
          ),
          '[]'::jsonb
        )
      )
      ORDER BY g.position
    ),
    '[]'::jsonb
  )
)
FROM groups g;
$$;

-- =========================================
-- workout_list_json: allow anon role to inspect demo data
-- =========================================
CREATE OR REPLACE FUNCTION workout_list_json()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', w.id,
        'name', w.name,
        'description', w.notes,
        'groups', (
          SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
              'id', wg.id,
              'exercise_count', (
                SELECT count(*)
                FROM workout_items wi
                WHERE wi.group_id = wg.id
                  AND wi.deleted_at IS NULL
              )
            )
            ORDER BY wg.position
          ), '[]'::jsonb)
          FROM workout_groups wg
          WHERE wg.workout_id = w.id
            AND wg.deleted_at IS NULL
        ),
        'last_session_date', (
          SELECT max(s.date)
          FROM sessions s
          WHERE s.workout_id = w.id
            AND s.duration_seconds IS NOT NULL
            AND s.deleted_at IS NULL
        ),
        'created_at', w.created_at
      )
      ORDER BY w.created_at DESC
    ),
    '[]'::jsonb
  )
  FROM workouts w
  WHERE w.deleted_at IS NULL
    AND (
      auth.role() = 'anon'
      OR w.user_id = auth.uid()
    );
$$;
