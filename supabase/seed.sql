-- =========================================
-- Seed Data for Local Development
-- =========================================
-- This file provides sample data for testing the fitness tracker locally
-- Run with: psql -f supabase/seed.sql

-- Note: In Supabase local development, you'll need to create a test user first
-- or use the Supabase Dashboard to create one

-- =========================================
-- System Exercises (shared across all users)
-- =========================================

insert into exercises (id, user_id, name, category, instructions) values
  -- Strength exercises
  ('00000000-0000-0000-0000-000000000001', null, 'Barbell Bench Press', 'strength', 'Lie on bench, lower bar to chest, press up'),
  ('00000000-0000-0000-0000-000000000002', null, 'Barbell Back Squat', 'strength', 'Bar on upper back, squat depth, drive up'),
  ('00000000-0000-0000-0000-000000000003', null, 'Conventional Deadlift', 'strength', 'Hip hinge, grip bar, stand up with neutral spine'),
  ('00000000-0000-0000-0000-000000000004', null, 'Barbell Overhead Press', 'strength', 'Press bar overhead from shoulders'),
  ('00000000-0000-0000-0000-000000000005', null, 'Pull-ups', 'strength', 'Hang from bar, pull chin over bar'),
  ('00000000-0000-0000-0000-000000000006', null, 'Dumbbell Rows', 'strength', 'Row dumbbell to hip while bracing on bench'),
  ('00000000-0000-0000-0000-000000000007', null, 'Dumbbell Shoulder Press', 'strength', 'Press dumbbells overhead from shoulders'),
  ('00000000-0000-0000-0000-000000000008', null, 'Barbell Bicep Curls', 'strength', 'Curl bar to shoulders with elbows fixed'),
  ('00000000-0000-0000-0000-000000000009', null, 'Tricep Dips', 'strength', 'Lower body between parallel bars, press up'),
  ('00000000-0000-0000-0000-000000000010', null, 'Leg Press', 'strength', 'Press platform with feet, control descent'),

  -- Cardio exercises
  ('00000000-0000-0000-0000-000000000011', null, 'Treadmill Run', 'cardio', 'Run on treadmill at target pace'),
  ('00000000-0000-0000-0000-000000000012', null, 'Rowing Machine', 'cardio', 'Row with proper form: legs, core, arms'),
  ('00000000-0000-0000-0000-000000000013', null, 'Assault Bike', 'cardio', 'Pedal with arms and legs'),
  ('00000000-0000-0000-0000-000000000014', null, 'Jump Rope', 'cardio', 'Jump rope continuously'),

  -- Mobility exercises
  ('00000000-0000-0000-0000-000000000015', null, 'Foam Roll IT Band', 'mobility', 'Roll IT band on foam roller'),
  ('00000000-0000-0000-0000-000000000016', null, 'Hip Flexor Stretch', 'mobility', 'Lunge position, push hips forward'),
  ('00000000-0000-0000-0000-000000000017', null, 'Thoracic Rotation', 'mobility', 'Rotate upper back while keeping hips stable'),

  -- Balance exercises
  ('00000000-0000-0000-0000-000000000018', null, 'Single Leg Balance', 'balance', 'Stand on one leg for time'),
  ('00000000-0000-0000-0000-000000000019', null, 'Bosu Ball Squats', 'balance', 'Squat on bosu ball')
on conflict (user_id, name) do nothing;

-- =========================================
-- Sample Workouts (require user_id at runtime)
-- =========================================
-- These are templates - in actual usage, you'll create workouts
-- for specific users through your application

-- Example: Push Day Workout
-- When creating for a real user, replace the user_id with actual auth.uid()
-- This is just for documentation/reference

/*
-- Example workout creation (run after user authentication)
DO $$
DECLARE
  workout_push uuid;
  group_a uuid;
  group_b uuid;
BEGIN
  -- Create workout
  INSERT INTO workouts (user_id, name, notes)
  VALUES (auth.uid(), 'Push Day A', 'Chest, shoulders, triceps focus')
  RETURNING id INTO workout_push;

  -- Create groups
  INSERT INTO workout_groups (user_id, workout_id, name, group_type, position, rest_seconds)
  VALUES
    (auth.uid(), workout_push, 'A', 'single', 1, 180)
  RETURNING id INTO group_a;

  INSERT INTO workout_groups (user_id, workout_id, name, group_type, position, rest_seconds)
  VALUES
    (auth.uid(), workout_push, 'B', 'superset', 2, 120)
  RETURNING id INTO group_b;

  -- Add exercises to groups
  INSERT INTO workout_items (
    user_id, workout_id, group_id, exercise_id,
    group_position, set_count, reps, weight
  ) VALUES
    (auth.uid(), workout_push, group_a, '00000000-0000-0000-0000-000000000001'::uuid, 1, 4, 8, 185),
    (auth.uid(), workout_push, group_b, '00000000-0000-0000-0000-000000000007'::uuid, 1, 3, 12, 50),
    (auth.uid(), workout_push, group_b, '00000000-0000-0000-0000-000000000009'::uuid, 2, 3, 12, null);
END $$;
*/

-- =========================================
-- Documentation: Testing Workflow
-- =========================================
--
-- 1. Start Supabase locally:
--    npx supabase start
--
-- 2. Create a test user via Supabase Studio:
--    http://localhost:54323
--
-- 3. Run migrations (automatic on start)
--
-- 4. Create sample workouts for your test user:
--    Use the example above with your test user's ID
--
-- 5. Test the RPC functions:
--    SELECT workout_detail_json('your-workout-id');
--    SELECT start_session(null, 'your-workout-id', 'Test Session');
--
-- =========================================
