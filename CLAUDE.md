# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Uzo Fitness PWA** is a personal fitness tracker built as a mobile-first Progressive Web App using React 19 + Vite + Supabase. This is a **single-user V1 implementation** focused on workout management, session execution, and history tracking.

Key capabilities:
- Import/edit workouts with groups (single, superset, triset, circuit)
- Execute workout sessions with set/rep/weight logging
- Track exercise history and volume metrics
- Offline-capable PWA with service worker
- REST timers for supersets and exercise groups

## Development Commands

### Essential Commands
```bash
# Install dependencies
npm install

# Start development server (Vite typically runs on port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint
```

### Supabase Local Development
```bash
# Start local Supabase (required before running app in dev)
npx supabase start

# Stop local Supabase
npx supabase stop

# Reset database (reapply all migrations)
npx supabase db reset

# Create new migration
npx supabase migration new migration_name

# Access Supabase Studio (local dashboard)
# Open browser to http://127.0.0.1:54323

# View email testing interface (Inbucket)
# Open browser to http://127.0.0.1:54324
```

### Local Development Ports
- **Vite Dev Server**: 5173 (default)
- **Supabase API**: 54321
- **Supabase DB**: 54322
- **Supabase Studio**: 54323
- **Email Testing**: 54324

## Architecture

### Tech Stack
- **Frontend**: React 19.1.1, Vite 7.1.7, JavaScript (ES2020+)
- **Backend**: Supabase (Postgres 17)
- **State**: TanStack Query (planned for server state caching)
- **Styling**: Tailwind CSS (to be configured)
- **Testing**: Vitest 3.2.4 with React Testing Library
- **PWA**: vite-plugin-pwa with Workbox

### Data Architecture

**Server-First Approach**: Supabase handles data shaping via JSON RPCs. Frontend consumes structured JSON and uses TanStack Query for caching/invalidation.

**Key Database Objects**:
- `exercises` - Global exercise library
- `workouts` → `workout_groups` → `workout_items` - Workout definitions
- `cycles` - Multi-week workout programs
- `sessions` → `session_groups` → `session_items` → `sets` - Executed workouts (immutable snapshots)

**JSON RPC Pattern**:
- **Read RPCs** return UI-ready JSON (e.g., `workout_detail_json`, `session_detail_json`)
- **Write RPCs** are lean mutations (e.g., `reorder_workout_groups`, `add_workout_item`)
- After writes, frontend calls `invalidateQueries` on relevant query keys

**Query Key Strategy** (TanStack Query):
```javascript
['workout-detail', workoutId]
['session-detail', sessionId]
['exercise-history', exerciseId]
['workout-history', workoutId]
```

### Project Structure
```
src/
├── components/          # React components (planned organization)
│   ├── auth/           # Authentication UI
│   ├── dashboard/      # Dashboard/home screen
│   ├── workouts/       # Workout management
│   ├── sessions/       # Session execution
│   ├── history/        # History views
│   └── shared/         # Reusable components
├── hooks/              # Custom React hooks
│   ├── useWorkouts.js  # Workout data hooks
│   ├── useSessions.js  # Session hooks
│   └── useSupabase.js  # Supabase client hook
├── lib/                # Utility functions
│   ├── supabase.js     # Supabase client setup
│   ├── queries.js      # TanStack Query config
│   └── utils.js        # Helper functions
├── test/               # Test setup and utilities
├── assets/             # Images, icons, SVGs
├── App.jsx             # Main app component
├── main.jsx            # Application entry point
└── index.css           # Global styles
```

### Database Migrations

All database schema is managed through Supabase migrations in `supabase/migrations/`. **Never manually alter the database schema**—always create a migration:

```bash
npx supabase migration new descriptive_migration_name
```

Existing migrations (in order):
1. `20250930000001_initial_schema.sql` - Core tables and enums
2. `20250930000002_triggers_and_functions.sql` - Auto-positioning triggers
3. `20250930000003_rpc_functions.sql` - JSON RPCs for reads/writes
4. `20250930000004_row_level_security.sql` - RLS policies
5. `20250930000005_security_improvements.sql` - Enhanced security
6. `20250930000006_soft_deletes.sql` - Soft delete support

## Code Conventions

### JavaScript/React
- **Module System**: ES Modules (`type: "module"`)
- **Components**: Functional components with hooks, default exports
- **File Naming**: PascalCase for components (`.jsx`), camelCase/kebab-case for utilities
- **React Version**: 19.1.1 - use modern patterns and features
- **No Class Components**: Functional components only

### Import Order
```javascript
// 1. React imports
import { useState, useEffect } from 'react'

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query'

// 3. Local components/hooks
import { WorkoutCard } from './components/WorkoutCard'
import { useSupabase } from './hooks/useSupabase'

// 4. Styles
import './App.css'
```

### Testing
- **Test Location**: `src/test/` directory (not colocated)
- **Setup**: Global test setup in `src/test/setup.js`
- **Pattern**: Use React Testing Library, focus on user behavior

### Supabase Client Pattern
```javascript
// lib/supabase.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

Always use environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) from `.env.local` for configuration.

### TanStack Query Integration Pattern
```javascript
// Example: Fetching workout detail
const { data, isLoading } = useQuery({
  queryKey: ['workout-detail', workoutId],
  queryFn: async () => {
    const { data, error } = await supabase
      .rpc('workout_detail_json', { p_workout_id: workoutId })
    if (error) throw error
    return data
  }
})

// After mutations, invalidate relevant queries
const mutation = useMutation({
  mutationFn: async (params) => {
    const { error } = await supabase.rpc('add_workout_item', params)
    if (error) throw error
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['workout-detail', workoutId])
  }
})
```

## Important Context

### Single-User System
This app is designed for **one user only**. No multi-user features, no permissions beyond basic RLS. User authentication is simple email/password via Supabase Auth.

### Mobile-First Design
All UI must be designed mobile-first. Desktop is secondary. Focus on touch interactions, thumb-friendly UI zones, and PWA installability.

### Immutable Sessions
Once a workout session is started, it creates an **immutable snapshot** of the workout definition. Sessions preserve the workout structure at execution time, allowing workout definitions to evolve independently.

### REST Timer Requirements
- Support configurable rest periods per group (e.g., 90s, 120s, 180s)
- Handle supersets/trisets with group-level rest
- UI should show countdown timers and allow manual skip

## Specification Document

The complete V1 specification is in `docs/v1-prd-sped.md` with detailed wireframes, data model, and user flows. Reference this document for:
- Complete data model with relationships
- All JSON RPC signatures
- Detailed wireframes (ASCII mockups)
- User interaction flows
- Business logic requirements

## Security Notes

- **Never commit** `.env`, `.env.local`, or `.env.production`
- **Always use** the anon key in client code, never service_role key
- **Row Level Security (RLS)** is enabled on all tables—enforce single-user access
- Email confirmations are disabled for local dev (see `supabase/config.toml`)

## PWA Configuration

PWA manifest and service worker are configured in `vite.config.js`:
- Auto-update strategy enabled
- Offline caching for API requests (24-hour cache)
- Icons required: `pwa-192x192.png`, `pwa-512x512.png` (to be added to `public/`)

## Current Status

**Project is in initial setup phase**. Core infrastructure is in place:
- ✅ React + Vite scaffold
- ✅ Supabase local configuration
- ✅ Database schema migrations
- ✅ PWA manifest configured
- ✅ Testing infrastructure (Vitest)
- ⏳ TanStack Query (needs installation/setup)
- ⏳ Tailwind CSS (needs configuration)
- ⏳ Component library (needs implementation)
- ⏳ Authentication flow (needs implementation)

Next implementation priorities are documented in Serena project memories.
