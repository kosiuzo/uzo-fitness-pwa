Got it 👍 Here’s your V1 Specification Document — a complete blueprint for your Fitness Tracker PWA.

⸻

Fitness Tracker Web App — V1 Specification Document

1. Overview

A personal fitness tracker delivered as a mobile-first PWA built with React + Supabase.
	•	Single user only (no multi-user complexity).
	•	Focus: import workouts, edit workouts, execute sessions, track sets/reps/weight, and review history.
	•	Support supersets/groups and rest timers.
	•	Server-driven JSON RPCs handle data shaping; the frontend renders and mutates.
	•	State & caching with TanStack Query.

⸻

2. Data Model (Supabase / Postgres)

Enums

exercise_category: strength | cardio | mobility | balance
group_type: single | superset | triset | circuit

Tables
	•	exercises → global exercise library
	•	workouts → workout definitions
	•	workout_groups → groups within a workout (A/B/C blocks)
	•	workout_items → exercises within a group; has group_position + auto position
	•	cycles → run a workout for N weeks
	•	sessions → actual training days (instance of workout/cycle)
	•	session_groups → copy of workout groups for a session
	•	session_items → copy of workout items for a session
	•	sets → logged sets (reps × weight)

Triggers
	•	Auto-generate flat position for workout_items & session_items.
	•	Resync positions when groups move.

Views
	•	v_cycle_progress → track cycle sessions completed
	•	v_exercise_history → per-exercise volume history

Helper Functions
	•	start_session(cycle_id, workout_id, title) → copies workout → session (with groups & items)

⸻

3. Server RPCs (JSON)

Reads (UI-ready)
	•	workout_detail_json(workout_id)
→ Editor payload: groups + items, effective rest, counts.
	•	workout_preview_session_json(workout_id)
→ Session preview payload (groups/items, read-only).
	•	workout_history_json(workout_id)
→ List of sessions with volume totals.
	•	session_detail_json(session_id)
→ Session detail: groups → items → sets, with totals.
	•	exercise_history_json(exercise_id)
→ History of one exercise across sessions.

Writes (lean)
	•	reorder_workout_groups(workout_id, moved_group_id, before_group_id)
	•	reorder_workout_items(group_id, moved_item_id, before_item_id)
	•	add_workout_group, add_workout_item, update_*, delete_*
	•	All return void (or affected ids).
	•	UI calls invalidateQueries on relevant query keys.

⸻

4. Wireframes (ASCII)

Login

[ Email ] [ Password ]
[ Log In ]

Dashboard

Active Cycle: Push A – Week 1/2
[ Start Today’s Session ]
[ Log Freestyle Workout ]

Workouts (Library)

Push A (2 groups)   [ View ] [ Start Cycle ]
Pull B (3 groups)   [ View ] [ Start Cycle ]
[ + Add Workout ] [ Import JSON ]
[ Manage Exercises ]

Workout Detail (Editor)

Workout: Push A
------------------------------
Group A • Superset • Rest 120s [ Edit ]
≡ A1 Flat DB Press  4x8 @ 30kg
≡ A2 Cable Row      4x10 @ 50kg
[ + Add Exercise to Group A ]

Group B • Single • Rest 90s    [ Edit ]
≡ B1 Overhead Press 3x8 @ 20kg
[ + Add Exercise to Group B ]

[ + Add Group ]   [ Start Session ]   [ Start Cycle ]

Session (Active)

Session: Push A – Oct 3
Elapsed: 00:18:42
------------------------------
Group A • Superset • Rest 120s  Round 2/4
A1 Flat DB Press  [ Reps: __ ][ Wt: __ ][ Log ]
A2 Cable Row      [ Reps: __ ][ Wt: __ ][ Log ]
[ Start Group Rest (120s) ]
------------------------------
Group B • Single • Rest 90s
B1 Overhead Press [ Reps: __ ][ Wt: __ ][ Log ]
[ Finish Session ]

History (Workout → Day Detail)

Workout History: Push A
Mon Sep 29  Volume: 4200  [ View ]
Wed Oct 1   Volume: 4350  [ View ]
...

Day Detail (Sep 29)
Group A Superset
 A1 Flat DB Press  8@30, 8@30, 8@30, 8@30
 A2 Cable Row      10@50, 10@50, 10@50, 10@50
Group B Single
 B1 Overhead Press 8@20, 8@20, 8@20
Totals: A=2960, B=480, Session=4200

Exercise History

Bench Press
Sep 29: 4x8 @ 30kg Vol=960
Oct 01: 4x8 @ 32.5 Vol=1040

Settings

Import Workouts JSON
Export Data JSON
Units: [kg/lb], Dark Mode
[ Log Out ]


⸻

5. Functional Requirements

Core
	•	Login: email/password via Supabase.
	•	Workouts: CRUD, groups, items, reorder, import/export JSON.
	•	Cycles: attach workout, duration weeks, track sessions done.
	•	Sessions: start from workout/cycle; log sets with reps/weight; rest timers (group default, item override); finish → compute totals.
	•	History:
	•	By workout → sessions list.
	•	By day → sets detail.
	•	By exercise → volume over time.
	•	Settings: JSON import/export, unit toggle, dark mode.

JSON Import/Export
	•	Workouts can be imported/exported with groups/items.
	•	Auto-add missing exercises to exercises.

Data Integrity
	•	Ordering: position managed server-side.
	•	Effective rest always included in JSON.
	•	Sessions are immutable snapshots.

⸻

6. Technical Requirements
	•	Frontend: React + TypeScript, Supabase JS client, TanStack Query, Tailwind CSS.
	•	Backend: Supabase Postgres + RPCs.
	•	Caching: Query keys →
	•	['workout-detail', workoutId]
	•	['workout-preview', workoutId]
	•	['workout-history', workoutId]
	•	['session-detail', sessionId]
	•	['exercise-history', exerciseId]
	•	Offline: PWA manifest, service worker optional stretch.
	•	Charts: Recharts for history graphs.

⸻

7. V2 Considerations (not in scope for V1)
	•	PR tracking (1RM, set volume).
	•	Freestyle session helper RPCs (currently just use sessions with null workout).
	•	Notes (per-session, per-exercise, per-set).
	•	PR dashboard or progress badges.

⸻

✅ This document = your V1 PRD/Spec.
It has: schema, RPCs, wireframes, functional + technical requirements, and V2 roadmap.