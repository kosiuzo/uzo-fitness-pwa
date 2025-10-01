# Supabase Database Setup

This directory contains the database schema, migrations, and seed data for the Uzo Fitness PWA.

## 📁 Structure

```
supabase/
├── migrations/           # Database migration files (run in order)
│   ├── 20250930000001_initial_schema.sql
│   ├── 20250930000002_triggers_and_functions.sql
│   ├── 20250930000003_rpc_functions.sql
│   └── 20250930000004_row_level_security.sql
├── seed.sql             # Sample data for local testing
├── config.toml          # Supabase local configuration
└── README.md            # This file
```

## 🔒 Security Features

All migrations include production-ready security:

- ✅ **Row Level Security (RLS)** enabled on all tables
- ✅ **User isolation** - users can only access their own data
- ✅ **Auto user_id assignment** via triggers
- ✅ **Security definer functions** for controlled access
- ✅ **Input validation** via check constraints
- ✅ **Audit trails** with created_at/updated_at timestamps

## 🚀 Quick Start - Local Development

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Start Supabase Locally

```bash
npx supabase start
```

This will:
- Start local Postgres database
- Apply all migrations automatically
- Start Supabase Studio at http://localhost:54323

### 3. Create a Test User

Visit http://localhost:54323 and create a test user via the Auth section.

### 4. Seed Sample Data (Optional)

```bash
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/seed.sql
```

Default password: `postgres`

### 5. Test the Database

```typescript
import { supabase } from './config/supabase';

// Create a workout
const { data, error } = await supabase
  .from('workouts')
  .insert({ name: 'Push Day', notes: 'Chest, shoulders, triceps' });

// Query workouts
const { data: workouts } = await supabase
  .from('workouts')
  .select('*');
```

## 🏗️ Database Schema

### Core Tables

**exercises** - Exercise library (shared/user-specific)
- System exercises (user_id = null)
- User custom exercises

**workouts** - Reusable workout templates
- User-owned workout definitions
- Contains groups and items

**workout_groups** - Exercise groupings within workouts
- Single, superset, triset, circuit types
- Default rest time for group

**workout_items** - Individual exercises in workouts
- Links to exercises
- Set count, reps, weight, rest overrides

**cycles** - Training programs (N weeks of a workout)
- Duration tracking
- Links workouts to periods

**sessions** - Actual training days
- Copies workout structure at start
- Records performance

**session_groups** - Groups within sessions
**session_items** - Exercises within sessions
**sets** - Completed set records (history)

### Views

**v_cycle_progress** - Cycle completion tracking
**v_exercise_history** - Exercise volume and progression

### Functions

**start_session(cycle_id, workout_id, title)** - Creates session from workout
**workout_detail_json(workout_id)** - Complete workout data for editor
**workout_preview_session_json(workout_id)** - Preview session structure

## 📝 Generating TypeScript Types

After schema changes, regenerate types:

```bash
# Local development
npx supabase gen types typescript --local > src/types/database.ts

# Production
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

## 🔄 Creating New Migrations

```bash
npx supabase migration new your_migration_name
```

Edit the generated file in `supabase/migrations/`

## 🌐 Deploying to Production

### 1. Link to Your Project

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

### 2. Push Migrations

```bash
npx supabase db push
```

### 3. Verify

```bash
npx supabase db diff
```

## 🧪 Testing

The schema includes comprehensive security:

```typescript
// ✅ This works - user's own data
const { data } = await supabase
  .from('workouts')
  .select('*');

// ❌ This fails - another user's data (RLS blocks it)
const { data: otherData } = await supabase
  .from('workouts')
  .select('*')
  .eq('user_id', 'some-other-user-id');
```

## 🛡️ Security Best Practices

1. **Never disable RLS** unless absolutely necessary
2. **Always test policies** before deploying
3. **Use security definer** functions for complex operations
4. **Validate inputs** via check constraints
5. **Audit changes** via updated_at triggers
6. **Review foreign keys** ensure proper cascade behavior

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)
- [TypeScript Types](https://supabase.com/docs/guides/api/generating-types)
