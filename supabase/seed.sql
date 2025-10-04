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
-- Sample accounts & full feature dataset
-- =========================================
-- The block below seeds two demo accounts (athlete & coach) with workouts,
-- cycles, sessions, and set history so every major UI surface has data.
-- Re-running the seed is safe; the block deletes and recreates the sample data.

DO $$
DECLARE
  demo_user constant uuid := '11111111-1111-1111-1111-111111111111';
  demo_email constant text := 'demo@example.com';
  coach_user constant uuid := '22222222-2222-2222-2222-222222222222';
  coach_email constant text := 'coach@example.com';

  push_workout constant uuid := 'b4f1f4ce-6b15-4a89-902d-9a70d1f23a10';
  lower_workout constant uuid := '5e7b85fb-00e9-4b65-9fb3-1c258152a4c1';
  conditioning_workout constant uuid := 'd6cd042f-6b6d-40a4-8e4f-38908d756f90';
  coach_workout constant uuid := '0d5b94a4-25f8-41a7-8ad3-39d97c4ab9f4';

  push_group_a constant uuid := '9458f2b4-bf35-46e8-906a-1557c95fd5d1';
  push_group_b constant uuid := '9c9a1b6d-64b1-476b-a523-8a05d4953ea7';
  push_group_c constant uuid := 'd279332c-8f4c-4b88-ba90-7a4c2b7a1bf4';
  lower_group_a constant uuid := '0a43cbb4-2078-4cc4-84b0-31779042f2b8';
  lower_group_b constant uuid := 'd82b0d88-6f6f-4dd5-b284-7c83413cf5df';
  conditioning_group_main constant uuid := 'af0f4775-5306-431a-bb02-1735660a4d91';
  coach_group_main constant uuid := '4c836c87-9f82-4cbf-8e2b-9da4bbafab5d';

  push_cycle constant uuid := '1f3a6270-4e2a-4c21-aafb-c5c05f38f312';
  lower_cycle constant uuid := 'f7064202-2a0f-4252-93e3-7190eae3ac6f';
  coach_cycle constant uuid := '1e0f5a65-82ba-4ef4-9c47-f3ed8e33adf0';

  push_session_recent constant uuid := '8b0f47d4-8ef6-4f6d-b781-6f6b4aa9154c';
  push_session_week1 constant uuid := 'f2b4a4f0-5f6f-4ebc-9f84-4e4d1b223b3b';
  lower_session_recap constant uuid := '0cefdf02-14a6-4b6d-9b19-173c4cc1ca0f';
  conditioning_session constant uuid := '9f6ba3ba-9a64-4c02-9d1f-5194f1a2e71c';
  coach_session constant uuid := 'a5fdd73b-68a0-4689-a1a1-64d9565ee0ad';

  ps_recent_group_a constant uuid := '7f6ad86b-7e36-4b45-9ee9-f8a838a3c77a';
  ps_recent_group_b constant uuid := '9d9da19f-a3e8-4a26-9f30-d02318aeca20';
  ps_recent_group_c constant uuid := '5b8e9b4c-b613-4cbf-9c4a-1a9301a0d2eb';
  ps_week1_group_a constant uuid := '4e3cd4e8-39df-4ef0-9d2e-0b8bbfd0d5f1';
  ps_week1_group_b constant uuid := '50d3ac55-3f7f-4d28-9af7-f04d2c7b5f7b';
  ps_week1_group_c constant uuid := 'b3d99db0-d0fa-4474-a2e6-6a2067446c68';
  lower_session_group_a constant uuid := 'c1a4fcb1-6f52-4c4a-8482-963e5edc76fe';
  lower_session_group_b constant uuid := 'a3ab27c8-5e4f-4d62-b8c6-0fea77c26120';
  conditioning_session_group constant uuid := 'ee872f5c-5702-4bd3-8f46-3e1ae6e61f7a';
  coach_session_group constant uuid := 'c864c68f-40d0-4c31-94c8-e2f0c3c8adbb';

  ps_recent_bench_item constant uuid := '0bbf1a29-15de-4a7b-9ff1-14258f22c5d1';
  ps_recent_shoulder_item constant uuid := '5e6c7d89-897a-4fba-9bb5-e2d2c2cfc5aa';
  ps_recent_dip_item constant uuid := '9a5d1e6c-0688-4f91-98be-ff6695f4f78c';
  ps_recent_jump_item constant uuid := '6a1f663d-94f3-4c82-88b3-348fa5fd24cc';
  ps_recent_assault_item constant uuid := '933c23f9-4865-4d19-98a2-614089c5d5f2';
  ps_week1_bench_item constant uuid := 'e4a9f8b3-4be2-44fb-9a74-6dd6cba5c00d';
  ps_week1_shoulder_item constant uuid := '7784b1e4-3f6d-4ed2-92af-6c5a74b67a42';
  ps_week1_dip_item constant uuid := '61a7ab66-9e03-471c-a466-276f4e5a3814';
  ps_week1_jump_item constant uuid := 'f9de472d-e576-4a85-9acf-873bbfea0a79';
  ps_week1_assault_item constant uuid := 'a5fcb3c9-7830-4d3e-8982-ad5c9cf3c4c4';
  lower_squat_item constant uuid := 'e925bd1a-8752-4db3-a4c3-7e6fe12a08b2';
  lower_deadlift_item constant uuid := '56aecd9d-f645-48d4-bb41-bfe75f991414';
  lower_split_squat_item constant uuid := 'c984c2e7-2c41-4ad2-8d24-8db14ed132cd';
  conditioning_row_item constant uuid := 'abf67d65-602e-4ca0-b47b-7c6e3e29d5f0';
  conditioning_jump_item constant uuid := '71f7ed9b-a637-4be0-a2a1-23d5d6f3c712';
  conditioning_sled_item constant uuid := 'd2570f9d-fb4f-4fc3-8f44-57d5a7fa1c3c';
  coach_session_item_swings constant uuid := 'f1f26d8a-6c2d-47a9-8bd7-715ff3c4ad1d';
  coach_session_item_band constant uuid := 'c670be4b-be9d-4da0-b6b4-829af7cb28d1';
  coach_session_item_row constant uuid := 'd5a87c2a-6a65-4ad0-8b7c-5b4cc4f3219a';

  push_item_bench constant uuid := '9bf0a3c6-4bb9-4f7f-bf4b-931f6a0a4eb0';
  push_item_db_sh_press constant uuid := '998d17d6-0d01-41bc-b31e-269b4015da9e';
  push_item_oh_press constant uuid := 'd6e0be9c-5cd6-4c5d-a55e-4ad3c6db0b9b';
  push_item_dips constant uuid := '8186515e-91a0-4016-bf7d-cc8c9d0826db';
  push_item_jump constant uuid := 'e4f12520-5ddc-45f9-9bcf-b7f1c9fce6d9';
  push_item_assault constant uuid := 'f43c9dd3-5613-4d0a-a3a5-93d7c5ed0c77';
  lower_item_squat constant uuid := '4c8195f7-02da-4d4f-9a6b-f679408d4f08';
  lower_item_deadlift constant uuid := '1f8d4dcc-3f8e-4436-9079-884905fe4a65';
  lower_item_leg_press constant uuid := '8d7e2d6a-e97b-4b1c-8202-1657bf78490c';
  lower_item_split_squat constant uuid := 'da2f1ee2-d4ea-4f21-bdea-37f1a85e2b21';
  conditioning_item_row constant uuid := '343344c3-b506-4cca-9b11-9db6466b7403';
  conditioning_item_jump constant uuid := '4a7b4b13-7f1c-46fc-9f48-d16aa0bdf231';
  conditioning_item_sled constant uuid := '51bf0402-7344-4df7-9488-cfbf71df4d8e';
  coach_item_swings constant uuid := '726bdc2e-7ca4-4df3-bcf4-5f4515a331ad';
  coach_item_band constant uuid := '58f58a8b-e53d-4dfb-8029-2bb7d1cf8e69';
  coach_item_row constant uuid := 'c7286213-d03d-4e66-9466-3d8a38c3c205';

  bench constant uuid := '00000000-0000-0000-0000-000000000001';
  squat constant uuid := '00000000-0000-0000-0000-000000000002';
  deadlift constant uuid := '00000000-0000-0000-0000-000000000003';
  oh_press_ex constant uuid := '00000000-0000-0000-0000-000000000004';
  db_rows_ex constant uuid := '00000000-0000-0000-0000-000000000006';
  db_shoulder_ex constant uuid := '00000000-0000-0000-0000-000000000007';
  dips_ex constant uuid := '00000000-0000-0000-0000-000000000009';
  leg_press_ex constant uuid := '00000000-0000-0000-0000-000000000010';
  treadmill_ex constant uuid := '00000000-0000-0000-0000-000000000011';
  rowing_ex constant uuid := '00000000-0000-0000-0000-000000000012';
  assault_bike_ex constant uuid := '00000000-0000-0000-0000-000000000013';
  jump_rope_ex constant uuid := '00000000-0000-0000-0000-000000000014';
  single_leg_balance_ex constant uuid := '00000000-0000-0000-0000-000000000018';

  tempo_split_squat uuid;
  sled_push uuid;
  coach_kb_swings uuid;
  coach_band_pull uuid;
BEGIN
  delete from auth.identities where user_id in (demo_user, coach_user);
  delete from auth.users where id in (demo_user, coach_user);

  insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, last_sign_in_at, aud, role)
  values (demo_user, demo_email, crypt('Password123!', gen_salt('bf')), now(), jsonb_build_object('full_name', 'Demo Trainee'), now(), now(), now(), 'authenticated', 'authenticated')
  on conflict (id) do update set
    email = excluded.email,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now(),
    last_sign_in_at = excluded.last_sign_in_at;

  insert into auth.identities (id, user_id, provider, provider_id, identity_data, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), demo_user, 'email', demo_email, jsonb_build_object('sub', demo_user::text, 'email', demo_email), now(), now(), now())
  on conflict (provider, provider_id) do update set
    user_id = excluded.user_id,
    identity_data = excluded.identity_data,
    last_sign_in_at = excluded.last_sign_in_at,
    updated_at = excluded.updated_at;

  insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, last_sign_in_at, aud, role)
  values (coach_user, coach_email, crypt('Password123!', gen_salt('bf')), now(), jsonb_build_object('full_name', 'Coach Casey'), now(), now(), now(), 'authenticated', 'authenticated')
  on conflict (id) do update set
    email = excluded.email,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now(),
    last_sign_in_at = excluded.last_sign_in_at;

  insert into auth.identities (id, user_id, provider, provider_id, identity_data, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), coach_user, 'email', coach_email, jsonb_build_object('sub', coach_user::text, 'email', coach_email), now(), now(), now())
  on conflict (provider, provider_id) do update set
    user_id = excluded.user_id,
    identity_data = excluded.identity_data,
    last_sign_in_at = excluded.last_sign_in_at,
    updated_at = excluded.updated_at;

  insert into exercises (id, user_id, name, category, instructions, deleted_at)
  values (gen_random_uuid(), demo_user, 'Tempo Split Squat', 'strength', '3 second eccentric, stay tall, dumbbells at sides', null)
  on conflict (user_id, name) do update set
    category = excluded.category,
    instructions = excluded.instructions,
    deleted_at = null
  returning id into tempo_split_squat;

  insert into exercises (id, user_id, name, category, instructions, deleted_at)
  values (gen_random_uuid(), demo_user, 'Sled Push', 'cardio', 'Load heavy, push 20m, walk back recovery', null)
  on conflict (user_id, name) do update set
    category = excluded.category,
    instructions = excluded.instructions,
    deleted_at = null
  returning id into sled_push;

  insert into exercises (id, user_id, name, category, instructions, deleted_at)
  values (gen_random_uuid(), coach_user, 'Kettlebell Swings', 'cardio', 'Hinge hard, drive bell to shoulder height', null)
  on conflict (user_id, name) do update set
    category = excluded.category,
    instructions = excluded.instructions,
    deleted_at = null
  returning id into coach_kb_swings;

  insert into exercises (id, user_id, name, category, instructions, deleted_at)
  values (gen_random_uuid(), coach_user, 'Band Pull Apart', 'mobility', 'Keep ribs down, smooth control for upper back', null)
  on conflict (user_id, name) do update set
    category = excluded.category,
    instructions = excluded.instructions,
    deleted_at = null
  returning id into coach_band_pull;

  insert into workouts (id, user_id, name, notes, deleted_at)
  values (push_workout, demo_user, 'Push Power', 'Heavy pressing paired with arm finisher', null)
  on conflict (id) do update set
    name = excluded.name,
    notes = excluded.notes,
    deleted_at = null;

  insert into workouts (id, user_id, name, notes, deleted_at)
  values (lower_workout, demo_user, 'Lower Body Strength', 'Squat/deadlift focus plus unilateral work', null)
  on conflict (id) do update set
    name = excluded.name,
    notes = excluded.notes,
    deleted_at = null;

  insert into workouts (id, user_id, name, notes, deleted_at)
  values (conditioning_workout, demo_user, 'Conditioning & Mobility', 'Quick mixed modal finisher and mobility', null)
  on conflict (id) do update set
    name = excluded.name,
    notes = excluded.notes,
    deleted_at = null;

  insert into workouts (id, user_id, name, notes, deleted_at)
  values (coach_workout, coach_user, 'Team Conditioning Template', 'Shared circuit for small group sessions', null)
  on conflict (id) do update set
    name = excluded.name,
    notes = excluded.notes,
    deleted_at = null;

  insert into workout_groups (id, user_id, workout_id, name, group_type, position, rest_seconds, deleted_at)
  values
    (push_group_a, demo_user, push_workout, 'A – Heavy Press', 'single', 1, 180, null),
    (push_group_b, demo_user, push_workout, 'B – Overhead / Triceps', 'superset', 2, 120, null),
    (push_group_c, demo_user, push_workout, 'C – Conditioning', 'circuit', 3, 90, null)
  on conflict (id) do update set
    name = excluded.name,
    group_type = excluded.group_type,
    position = excluded.position,
    rest_seconds = excluded.rest_seconds,
    deleted_at = null;

  insert into workout_groups (id, user_id, workout_id, name, group_type, position, rest_seconds, deleted_at)
  values
    (lower_group_a, demo_user, lower_workout, 'A – Primary Lifts', 'single', 1, 210, null),
    (lower_group_b, demo_user, lower_workout, 'B – Accessories', 'superset', 2, 120, null)
  on conflict (id) do update set
    name = excluded.name,
    group_type = excluded.group_type,
    position = excluded.position,
    rest_seconds = excluded.rest_seconds,
    deleted_at = null;

  insert into workout_groups (id, user_id, workout_id, name, group_type, position, rest_seconds, deleted_at)
  values (conditioning_group_main, demo_user, conditioning_workout, 'MetCon Circuit', 'circuit', 1, 60, null)
  on conflict (id) do update set
    name = excluded.name,
    group_type = excluded.group_type,
    position = excluded.position,
    rest_seconds = excluded.rest_seconds,
    deleted_at = null;

  insert into workout_groups (id, user_id, workout_id, name, group_type, position, rest_seconds, deleted_at)
  values (coach_group_main, coach_user, coach_workout, 'Group Circuit', 'circuit', 1, 75, null)
  on conflict (id) do update set
    name = excluded.name,
    group_type = excluded.group_type,
    position = excluded.position,
    rest_seconds = excluded.rest_seconds,
    deleted_at = null;

  insert into workout_items (id, user_id, workout_id, group_id, exercise_id, group_position, set_count, reps, weight, item_rest_seconds, superset_note, deleted_at)
  values
    (push_item_bench, demo_user, push_workout, push_group_a, bench, 1, 5, 5, 185, null, 'Pause on first rep', null),
    (push_item_db_sh_press, demo_user, push_workout, push_group_a, db_shoulder_ex, 2, 3, 10, 45, 90, 'Seated, slow eccentric', null),
    (push_item_oh_press, demo_user, push_workout, push_group_b, oh_press_ex, 1, 3, 8, 115, null, null, null),
    (push_item_dips, demo_user, push_workout, push_group_b, dips_ex, 2, 3, 12, null, 45, 'Add weight if 12 easy', null),
    (push_item_jump, demo_user, push_workout, push_group_c, jump_rope_ex, 1, 3, 70, null, 30, '60 skips target', null),
    (push_item_assault, demo_user, push_workout, push_group_c, assault_bike_ex, 2, 3, 45, null, 60, 'Calories sprint, steady return', null)
  on conflict (id) do update set
    workout_id = excluded.workout_id,
    group_id = excluded.group_id,
    exercise_id = excluded.exercise_id,
    group_position = excluded.group_position,
    set_count = excluded.set_count,
    reps = excluded.reps,
    weight = excluded.weight,
    item_rest_seconds = excluded.item_rest_seconds,
    superset_note = excluded.superset_note,
    deleted_at = null;

  insert into workout_items (id, user_id, workout_id, group_id, exercise_id, group_position, set_count, reps, weight, item_rest_seconds, superset_note, deleted_at)
  values
    (lower_item_squat, demo_user, lower_workout, lower_group_a, squat, 1, 5, 5, 275, null, 'Belts on top sets', null),
    (lower_item_deadlift, demo_user, lower_workout, lower_group_a, deadlift, 2, 3, 5, 315, 150, 'Hook grip practice', null),
    (lower_item_leg_press, demo_user, lower_workout, lower_group_b, leg_press_ex, 1, 4, 12, 320, null, null, null),
    (lower_item_split_squat, demo_user, lower_workout, lower_group_b, tempo_split_squat, 2, 3, 10, 50, 75, 'Tempo 3-1-1, hold last rep', null)
  on conflict (id) do update set
    workout_id = excluded.workout_id,
    group_id = excluded.group_id,
    exercise_id = excluded.exercise_id,
    group_position = excluded.group_position,
    set_count = excluded.set_count,
    reps = excluded.reps,
    weight = excluded.weight,
    item_rest_seconds = excluded.item_rest_seconds,
    superset_note = excluded.superset_note,
    deleted_at = null;

  insert into workout_items (id, user_id, workout_id, group_id, exercise_id, group_position, set_count, reps, weight, item_rest_seconds, superset_note, deleted_at)
  values
    (conditioning_item_row, demo_user, conditioning_workout, conditioning_group_main, rowing_ex, 1, 4, 250, null, null, 'Meters per round', null),
    (conditioning_item_jump, demo_user, conditioning_workout, conditioning_group_main, jump_rope_ex, 2, 4, 80, null, 30, 'Quick spins', null),
    (conditioning_item_sled, demo_user, conditioning_workout, conditioning_group_main, sled_push, 3, 4, 1, null, 60, '20m heavy push', null)
  on conflict (id) do update set
    workout_id = excluded.workout_id,
    group_id = excluded.group_id,
    exercise_id = excluded.exercise_id,
    group_position = excluded.group_position,
    set_count = excluded.set_count,
    reps = excluded.reps,
    weight = excluded.weight,
    item_rest_seconds = excluded.item_rest_seconds,
    superset_note = excluded.superset_note,
    deleted_at = null;

  insert into workout_items (id, user_id, workout_id, group_id, exercise_id, group_position, set_count, reps, weight, item_rest_seconds, superset_note, deleted_at)
  values
    (coach_item_swings, coach_user, coach_workout, coach_group_main, coach_kb_swings, 1, 5, 15, 24, null, 'Russian swings', null),
    (coach_item_band, coach_user, coach_workout, coach_group_main, coach_band_pull, 2, 5, 20, null, 30, 'Control the return', null),
    (coach_item_row, coach_user, coach_workout, coach_group_main, treadmill_ex, 3, 5, 45, null, 60, 'Assault runner intervals', null)
  on conflict (id) do update set
    workout_id = excluded.workout_id,
    group_id = excluded.group_id,
    exercise_id = excluded.exercise_id,
    group_position = excluded.group_position,
    set_count = excluded.set_count,
    reps = excluded.reps,
    weight = excluded.weight,
    item_rest_seconds = excluded.item_rest_seconds,
    superset_note = excluded.superset_note,
    deleted_at = null;

  insert into cycles (id, user_id, workout_id, name, duration_weeks, started_at, ended_at, deleted_at)
  values (push_cycle, demo_user, push_workout, 'Push Power (8 Weeks)', 8, now() - interval '14 days', null, null)
  on conflict (id) do update set
    workout_id = excluded.workout_id,
    name = excluded.name,
    duration_weeks = excluded.duration_weeks,
    started_at = excluded.started_at,
    ended_at = excluded.ended_at,
    deleted_at = null;

  insert into cycles (id, user_id, workout_id, name, duration_weeks, started_at, ended_at, deleted_at)
  values (lower_cycle, demo_user, lower_workout, 'Lower Strength (6 Weeks)', 6, now() - interval '70 days', now() - interval '21 days', null)
  on conflict (id) do update set
    workout_id = excluded.workout_id,
    name = excluded.name,
    duration_weeks = excluded.duration_weeks,
    started_at = excluded.started_at,
    ended_at = excluded.ended_at,
    deleted_at = null;

  insert into cycles (id, user_id, workout_id, name, duration_weeks, started_at, ended_at, deleted_at)
  values (coach_cycle, coach_user, coach_workout, 'Team Conditioning', 4, now() - interval '7 days', null, null)
  on conflict (id) do update set
    workout_id = excluded.workout_id,
    name = excluded.name,
    duration_weeks = excluded.duration_weeks,
    started_at = excluded.started_at,
    ended_at = excluded.ended_at,
    deleted_at = null;

  insert into sessions (id, user_id, cycle_id, workout_id, title, date, duration_seconds, deleted_at)
  values (push_session_recent, demo_user, push_cycle, push_workout, 'Push Power – Week 3 Day 1', now() - interval '2 days', 3600, null)
  on conflict (id) do update set
    cycle_id = excluded.cycle_id,
    workout_id = excluded.workout_id,
    title = excluded.title,
    date = excluded.date,
    duration_seconds = excluded.duration_seconds,
    deleted_at = null;

  insert into sessions (id, user_id, cycle_id, workout_id, title, date, duration_seconds, deleted_at)
  values (push_session_week1, demo_user, push_cycle, push_workout, 'Push Power – Week 2 Day 1', now() - interval '9 days', 3470, null)
  on conflict (id) do update set
    cycle_id = excluded.cycle_id,
    workout_id = excluded.workout_id,
    title = excluded.title,
    date = excluded.date,
    duration_seconds = excluded.duration_seconds,
    deleted_at = null;

  insert into sessions (id, user_id, cycle_id, workout_id, title, date, duration_seconds, deleted_at)
  values (lower_session_recap, demo_user, lower_cycle, lower_workout, 'Lower Strength – Week 5 Day 2', now() - interval '42 days', 3720, null)
  on conflict (id) do update set
    cycle_id = excluded.cycle_id,
    workout_id = excluded.workout_id,
    title = excluded.title,
    date = excluded.date,
    duration_seconds = excluded.duration_seconds,
    deleted_at = null;

  insert into sessions (id, user_id, cycle_id, workout_id, title, date, duration_seconds, deleted_at)
  values (conditioning_session, demo_user, null, conditioning_workout, 'Conditioning & Mobility – Friday Quickie', now() - interval '4 days', 1800, null)
  on conflict (id) do update set
    workout_id = excluded.workout_id,
    title = excluded.title,
    date = excluded.date,
    duration_seconds = excluded.duration_seconds,
    deleted_at = null;

  insert into sessions (id, user_id, cycle_id, workout_id, title, date, duration_seconds, deleted_at)
  values (coach_session, coach_user, coach_cycle, coach_workout, 'Team Conditioning – Week 2', now() - interval '1 day', 3200, null)
  on conflict (id) do update set
    cycle_id = excluded.cycle_id,
    workout_id = excluded.workout_id,
    title = excluded.title,
    date = excluded.date,
    duration_seconds = excluded.duration_seconds,
    deleted_at = null;

  insert into session_groups (id, user_id, session_id, name, group_type, position, rest_seconds, deleted_at)
  values
    (ps_recent_group_a, demo_user, push_session_recent, 'A – Heavy Press', 'single', 1, 180, null),
    (ps_recent_group_b, demo_user, push_session_recent, 'B – Overhead / Triceps', 'superset', 2, 120, null),
    (ps_recent_group_c, demo_user, push_session_recent, 'C – Conditioning', 'circuit', 3, 90, null),
    (ps_week1_group_a, demo_user, push_session_week1, 'A – Heavy Press', 'single', 1, 180, null),
    (ps_week1_group_b, demo_user, push_session_week1, 'B – Overhead / Triceps', 'superset', 2, 120, null),
    (ps_week1_group_c, demo_user, push_session_week1, 'C – Conditioning', 'circuit', 3, 90, null),
    (lower_session_group_a, demo_user, lower_session_recap, 'A – Primary Lifts', 'single', 1, 210, null),
    (lower_session_group_b, demo_user, lower_session_recap, 'B – Accessories', 'superset', 2, 120, null),
    (conditioning_session_group, demo_user, conditioning_session, 'MetCon Circuit', 'circuit', 1, 60, null)
  on conflict (id) do update set
    session_id = excluded.session_id,
    name = excluded.name,
    group_type = excluded.group_type,
    position = excluded.position,
    rest_seconds = excluded.rest_seconds,
    deleted_at = null;

  insert into session_groups (id, user_id, session_id, name, group_type, position, rest_seconds, deleted_at)
  values (coach_session_group, coach_user, coach_session, 'Group Circuit', 'circuit', 1, 75, null)
  on conflict (id) do update set
    session_id = excluded.session_id,
    name = excluded.name,
    group_type = excluded.group_type,
    position = excluded.position,
    rest_seconds = excluded.rest_seconds,
    deleted_at = null;

  insert into session_items (id, user_id, session_id, group_id, exercise_id, group_position, planned_sets, planned_reps, planned_weight, item_rest_seconds, rest_seconds, deleted_at)
  values
    (ps_recent_bench_item, demo_user, push_session_recent, ps_recent_group_a, bench, 1, 5, 5, 190, null, 180, null),
    (ps_recent_shoulder_item, demo_user, push_session_recent, ps_recent_group_a, db_shoulder_ex, 2, 3, 10, 47.5, 90, 90, null),
    (ps_recent_dip_item, demo_user, push_session_recent, ps_recent_group_b, dips_ex, 2, 3, 12, null, 45, 120, null),
    (ps_recent_jump_item, demo_user, push_session_recent, ps_recent_group_c, jump_rope_ex, 1, 3, 70, null, 30, 60, null),
    (ps_recent_assault_item, demo_user, push_session_recent, ps_recent_group_c, assault_bike_ex, 2, 3, 50, null, 60, 90, null)
  on conflict (id) do update set
    session_id = excluded.session_id,
    group_id = excluded.group_id,
    exercise_id = excluded.exercise_id,
    group_position = excluded.group_position,
    planned_sets = excluded.planned_sets,
    planned_reps = excluded.planned_reps,
    planned_weight = excluded.planned_weight,
    item_rest_seconds = excluded.item_rest_seconds,
    rest_seconds = excluded.rest_seconds,
    deleted_at = null;

  insert into session_items (id, user_id, session_id, group_id, exercise_id, group_position, planned_sets, planned_reps, planned_weight, item_rest_seconds, rest_seconds, deleted_at)
  values
    (ps_week1_bench_item, demo_user, push_session_week1, ps_week1_group_a, bench, 1, 5, 5, 185, null, 180, null),
    (ps_week1_shoulder_item, demo_user, push_session_week1, ps_week1_group_a, db_shoulder_ex, 2, 3, 10, 45, 90, 90, null),
    (ps_week1_dip_item, demo_user, push_session_week1, ps_week1_group_b, dips_ex, 2, 3, 12, null, 45, 120, null),
    (ps_week1_jump_item, demo_user, push_session_week1, ps_week1_group_c, jump_rope_ex, 1, 3, 60, null, 30, 60, null),
    (ps_week1_assault_item, demo_user, push_session_week1, ps_week1_group_c, assault_bike_ex, 2, 3, 40, null, 60, 90, null)
  on conflict (id) do update set
    session_id = excluded.session_id,
    group_id = excluded.group_id,
    exercise_id = excluded.exercise_id,
    group_position = excluded.group_position,
    planned_sets = excluded.planned_sets,
    planned_reps = excluded.planned_reps,
    planned_weight = excluded.planned_weight,
    item_rest_seconds = excluded.item_rest_seconds,
    rest_seconds = excluded.rest_seconds,
    deleted_at = null;

  insert into session_items (id, user_id, session_id, group_id, exercise_id, group_position, planned_sets, planned_reps, planned_weight, item_rest_seconds, rest_seconds, deleted_at)
  values
    (lower_squat_item, demo_user, lower_session_recap, lower_session_group_a, squat, 1, 5, 5, 295, null, 210, null),
    (lower_deadlift_item, demo_user, lower_session_recap, lower_session_group_a, deadlift, 2, 3, 5, 335, 150, 150, null),
    (lower_split_squat_item, demo_user, lower_session_recap, lower_session_group_b, tempo_split_squat, 2, 3, 10, 50, 75, 120, null)
  on conflict (id) do update set
    session_id = excluded.session_id,
    group_id = excluded.group_id,
    exercise_id = excluded.exercise_id,
    group_position = excluded.group_position,
    planned_sets = excluded.planned_sets,
    planned_reps = excluded.planned_reps,
    planned_weight = excluded.planned_weight,
    item_rest_seconds = excluded.item_rest_seconds,
    rest_seconds = excluded.rest_seconds,
    deleted_at = null;

  insert into session_items (id, user_id, session_id, group_id, exercise_id, group_position, planned_sets, planned_reps, planned_weight, item_rest_seconds, rest_seconds, deleted_at)
  values
    (conditioning_row_item, demo_user, conditioning_session, conditioning_session_group, rowing_ex, 1, 4, 250, null, null, 60, null),
    (conditioning_jump_item, demo_user, conditioning_session, conditioning_session_group, jump_rope_ex, 2, 4, 80, null, 30, 60, null),
    (conditioning_sled_item, demo_user, conditioning_session, conditioning_session_group, sled_push, 3, 4, 1, null, 60, 60, null)
  on conflict (id) do update set
    session_id = excluded.session_id,
    group_id = excluded.group_id,
    exercise_id = excluded.exercise_id,
    group_position = excluded.group_position,
    planned_sets = excluded.planned_sets,
    planned_reps = excluded.planned_reps,
    planned_weight = excluded.planned_weight,
    item_rest_seconds = excluded.item_rest_seconds,
    rest_seconds = excluded.rest_seconds,
    deleted_at = null;

  insert into session_items (id, user_id, session_id, group_id, exercise_id, group_position, planned_sets, planned_reps, planned_weight, item_rest_seconds, rest_seconds, deleted_at)
  values
    (coach_session_item_swings, coach_user, coach_session, coach_session_group, coach_kb_swings, 1, 5, 15, 28, null, 75, null),
    (coach_session_item_band, coach_user, coach_session, coach_session_group, coach_band_pull, 2, 5, 20, null, 30, 75, null),
    (coach_session_item_row, coach_user, coach_session, coach_session_group, rowing_ex, 3, 5, 300, null, 60, 75, null)
  on conflict (id) do update set
    session_id = excluded.session_id,
    group_id = excluded.group_id,
    exercise_id = excluded.exercise_id,
    group_position = excluded.group_position,
    planned_sets = excluded.planned_sets,
    planned_reps = excluded.planned_reps,
    planned_weight = excluded.planned_weight,
    item_rest_seconds = excluded.item_rest_seconds,
    rest_seconds = excluded.rest_seconds,
    deleted_at = null;

  insert into sets (id, user_id, session_item_id, set_index, reps, weight, deleted_at)
  values
    ('6d6bf3b8-b7bf-4876-8d25-dfcd2d8b0041', demo_user, ps_recent_bench_item, 1, 5, 190, null),
    ('547a677e-84f6-4201-885b-a2b209d29259', demo_user, ps_recent_bench_item, 2, 5, 195, null),
    ('6d91b5df-d73d-431a-a996-78bbfa4c9ce8', demo_user, ps_recent_bench_item, 3, 5, 200, null),
    ('f736e2f3-3c25-4d4f-8d4e-cc5f4a8e3ab9', demo_user, ps_recent_shoulder_item, 1, 10, 47.5, null),
    ('b8f8ed8b-979a-4123-8073-ec5a0d50af96', demo_user, ps_recent_shoulder_item, 2, 10, 47.5, null),
    ('a4d7a8df-5d22-4c51-a5a5-accc7f3d7631', demo_user, ps_recent_dip_item, 1, 12, 0, null),
    ('9eaef3de-0760-4d25-8bb5-f2941c31bd01', demo_user, ps_recent_dip_item, 2, 12, 15, null),
    ('4bcb3c42-8f8b-4c90-99c8-4ab01b03a8a4', demo_user, ps_recent_dip_item, 3, 10, 25, null),
    ('876c57a7-d15f-4f5f-86a8-40cd82f1e253', demo_user, ps_recent_jump_item, 1, 70, 0, null),
    ('1ef25b15-5e0d-4c26-9f32-4d0b5fe621a3', demo_user, ps_recent_jump_item, 2, 70, 0, null),
    ('a7c5fbdc-3d6b-4c3a-bc37-6f7fe7f78aa9', demo_user, ps_recent_assault_item, 1, 45, 0, null),
    ('2dc5b2a6-17e4-43f4-92fd-4a907c17a573', demo_user, ps_recent_assault_item, 2, 45, 0, null),
    ('5a11ad5a-16a1-4e15-9dbe-446323f795d4', demo_user, ps_week1_bench_item, 1, 5, 185, null),
    ('33f5f533-1d14-4ac4-86cb-2cb2d1b785b5', demo_user, ps_week1_bench_item, 2, 5, 185, null),
    ('6d6faae3-8de1-4e83-8dc2-4c41f1f05732', demo_user, ps_week1_bench_item, 3, 5, 187.5, null),
    ('86d1a3c5-264a-4d3b-8c2c-9f50689c8b77', demo_user, ps_week1_dip_item, 1, 12, 0, null),
    ('2a1d88cd-b28f-4d26-b49e-8d576322de11', demo_user, ps_week1_dip_item, 2, 12, 0, null),
    ('ab31a692-1d7c-4ed3-982a-9a86527d5c46', demo_user, ps_week1_jump_item, 1, 60, 0, null),
    ('99e72593-2346-496b-8e66-df63c19e7810', demo_user, ps_week1_jump_item, 2, 60, 0, null),
    ('d82ef280-3f4b-44db-9754-4e9c86e6503b', demo_user, ps_week1_assault_item, 1, 40, 0, null),
    ('f918ad42-6e9a-4bf6-9d7d-5dc602dd0f87', demo_user, lower_squat_item, 1, 5, 295, null),
    ('afcb6a76-0bc7-47ed-9d05-59931bbf95fa', demo_user, lower_squat_item, 2, 5, 295, null),
    ('b9f11953-7576-4d26-b670-8bcee66216c7', demo_user, lower_deadlift_item, 1, 5, 335, null),
    ('f06b2a0c-4db4-4b6b-93ab-3b17ab0eac32', demo_user, lower_deadlift_item, 2, 5, 335, null),
    ('ca0901d0-3b1b-4af7-9fc1-3cda2ab400fe', demo_user, lower_split_squat_item, 1, 10, 50, null),
    ('da6f8de1-eebd-4df7-a4f1-6fdd0f4cbf1a', demo_user, lower_split_squat_item, 2, 10, 50, null),
    ('79c84e9f-9eff-4370-834d-bb629898b765', demo_user, lower_split_squat_item, 3, 10, 50, null),
    ('2b1e9f5a-61af-479b-9049-34f85ba2ee1a', demo_user, conditioning_row_item, 1, 250, 0, null),
    ('35121fd2-e237-49b7-87a3-52fb1dc1b3ea', demo_user, conditioning_row_item, 2, 250, 0, null),
    ('4f0fe1ef-1db4-45de-8f97-594c90c0bf0b', demo_user, conditioning_jump_item, 1, 80, 0, null),
    ('f506b5fc-7fea-41de-8517-36b6b5480bec', demo_user, conditioning_jump_item, 2, 80, 0, null),
    ('1a7b2ac4-8d2d-49d8-8b36-54b45a4d8d49', demo_user, conditioning_sled_item, 1, 1, 0, null),
    ('50f4a4e7-b21e-4f09-bd49-7b7ad847d75a', demo_user, conditioning_sled_item, 2, 1, 0, null),
    ('9d49b70c-7d58-49a8-bef6-6f43fd6f1a45', coach_user, coach_session_item_swings, 1, 15, 28, null),
    ('e7e3a6e8-c9aa-4504-9c0a-64792e7b24d2', coach_user, coach_session_item_swings, 2, 15, 28, null),
    ('85c9b741-6f92-4fb8-8aa5-4be3e7b64665', coach_user, coach_session_item_band, 1, 20, 0, null),
    ('a6d23c95-32f7-45b4-9b77-7d0ae7d9a6d4', coach_user, coach_session_item_band, 2, 20, 0, null),
    ('f8285f4b-50c3-48a6-b0bd-29c2756c0ba7', coach_user, coach_session_item_row, 1, 300, 0, null),
    ('b0d50763-7f6f-4eef-84f2-4ebf7a3e341a', coach_user, coach_session_item_row, 2, 280, 0, null)
  on conflict (id) do update set
    session_item_id = excluded.session_item_id,
    set_index = excluded.set_index,
    reps = excluded.reps,
    weight = excluded.weight,
    deleted_at = null;

  RAISE NOTICE 'Demo data seeded: demo user %, coach %', demo_email, coach_email;
END $$;

-- =========================================
-- Helper: resetting with Supabase CLI
-- =========================================
-- 1. npx supabase db reset --use-mig-dir
-- 2. supabase db reset will apply migrations and run this seed automatically
