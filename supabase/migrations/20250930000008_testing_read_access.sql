-- =========================================
-- Testing Read Access for Public/Anon Role
-- Migration: 20250930000008
-- Allows anon key to read seed data for QA purposes
-- =========================================

-- Exercises: allow anon role to read all rows (including user-specific)
DROP POLICY IF EXISTS "Anon can read exercises" ON exercises;
CREATE POLICY "Anon can read exercises"
  ON exercises FOR SELECT
  USING (auth.role() = 'anon');

-- Workouts: allow anon role to read any workout
DROP POLICY IF EXISTS "Anon can read workouts" ON workouts;
CREATE POLICY "Anon can read workouts"
  ON workouts FOR SELECT
  USING (auth.role() = 'anon');

-- Workout groups: allow anon read
DROP POLICY IF EXISTS "Anon can read workout groups" ON workout_groups;
CREATE POLICY "Anon can read workout groups"
  ON workout_groups FOR SELECT
  USING (auth.role() = 'anon');

-- Workout items: allow anon read
DROP POLICY IF EXISTS "Anon can read workout items" ON workout_items;
CREATE POLICY "Anon can read workout items"
  ON workout_items FOR SELECT
  USING (auth.role() = 'anon');
