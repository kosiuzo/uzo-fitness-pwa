# Fitness Tracker - Component Architecture & Routing Design

**Status**: Design Specification
**Date**: 2025-10-02
**Framework**: React 19 + React Router v6 + TanStack Query

---

## Table of Contents

1. [Overview](#1-overview)
2. [Component Hierarchy](#2-component-hierarchy)
3. [Routing Architecture](#3-routing-architecture)
4. [Page Components](#4-page-components)
5. [Feature Components](#5-feature-components)
6. [Shared Components](#6-shared-components)
7. [State Management Patterns](#7-state-management-patterns)
8. [Data Flow](#8-data-flow)
9. [File Structure](#9-file-structure)
10. [Implementation Roadmap](#10-implementation-roadmap)

---

## 1. Overview

### Architecture Principles

- **Mobile-First**: All components designed for touch interactions and mobile viewports
- **Component Composition**: Small, reusable components over large monolithic ones
- **Server State**: TanStack Query manages all server data (no local state for API data)
- **Route-Based Code Splitting**: Lazy-loaded pages for optimal bundle size
- **Accessibility**: WCAG 2.1 AA compliance for all interactive elements

### Tech Stack

- **React 19.1.1**: Concurrent features, automatic batching
- **React Router 6**: Client-side routing with data loaders
- **TanStack Query 5**: Server state management (already implemented)
- **Tailwind CSS**: Utility-first styling (to be configured)
- **Headless UI**: Accessible component primitives (modals, dialogs, etc.)

---

## 2. Component Hierarchy

### Visual Tree

```
App
├── QueryClientProvider (TanStack Query)
├── Router (React Router)
│   ├── AuthLayout
│   │   └── LoginPage
│   └── AppLayout (Protected)
│       ├── NavigationBar
│       ├── NetworkStatusBanner
│       └── Routes
│           ├── DashboardPage
│           │   ├── ActiveCycleCard
│           │   ├── QuickActionButtons
│           │   └── RecentSessionsList
│           ├── WorkoutsPage
│           │   ├── WorkoutList
│           │   │   └── WorkoutCard[]
│           │   └── WorkoutFilters
│           ├── WorkoutDetailPage (/:workoutId)
│           │   ├── WorkoutHeader
│           │   ├── WorkoutGroupList
│           │   │   └── WorkoutGroup[]
│           │   │       ├── GroupHeader
│           │   │       └── WorkoutItemList
│           │   │           └── WorkoutItem[]
│           │   └── WorkoutActions
│           ├── SessionPage (/:sessionId)
│           │   ├── SessionHeader
│           │   ├── SessionTimer
│           │   ├── SessionGroupList
│           │   │   └── SessionGroup[]
│           │   │       ├── GroupProgressIndicator
│           │   │       ├── SessionItemList
│           │   │       │   └── SessionItem[]
│           │   │       │       ├── SetInputForm
│           │   │       │       └── SetHistoryList
│           │   │       └── RestTimer
│           │   └── SessionActions
│           ├── WorkoutHistoryPage (/:workoutId/history)
│           │   ├── HistoryHeader
│           │   └── SessionHistoryList
│           │       └── SessionCard[]
│           ├── SessionDetailPage (/:sessionId/detail)
│           │   ├── SessionSummaryHeader
│           │   └── SessionGroupsDetail
│           │       └── GroupDetail[]
│           │           └── ItemDetail[]
│           │               └── SetLog[]
│           ├── ExercisesPage
│           │   ├── ExerciseList
│           │   │   └── ExerciseCard[]
│           │   └── ExerciseFilters
│           ├── ExerciseHistoryPage (/:exerciseId/history)
│           │   ├── ExerciseHeader
│           │   ├── ProgressChart
│           │   └── SessionHistoryList
│           ├── CyclesPage
│           │   └── CycleList
│           │       └── CycleCard[]
│           └── SettingsPage
│               ├── UserSettings
│               ├── DataManagement
│               └── AppSettings
└── Modals (Portal)
    ├── CreateWorkoutModal
    ├── EditWorkoutModal
    ├── AddExerciseModal
    ├── ExercisePickerModal
    ├── GroupEditorModal
    ├── ConfirmationDialog
    └── ImportWorkoutModal
```

---

## 3. Routing Architecture

### Route Structure

```tsx
// src/App.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'workouts',
        children: [
          {
            index: true,
            element: <WorkoutsPage />,
          },
          {
            path: ':workoutId',
            element: <WorkoutDetailPage />,
          },
          {
            path: ':workoutId/history',
            element: <WorkoutHistoryPage />,
          },
        ],
      },
      {
        path: 'sessions',
        children: [
          {
            path: ':sessionId',
            element: <SessionPage />,
          },
          {
            path: ':sessionId/detail',
            element: <SessionDetailPage />,
          },
        ],
      },
      {
        path: 'exercises',
        children: [
          {
            index: true,
            element: <ExercisesPage />,
          },
          {
            path: ':exerciseId/history',
            element: <ExerciseHistoryPage />,
          },
        ],
      },
      {
        path: 'cycles',
        element: <CyclesPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {import.meta.env.DEV && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
```

### Route Patterns

| Route | Component | Purpose |
|-------|-----------|---------|
| `/login` | `LoginPage` | Authentication |
| `/` | `DashboardPage` | Home dashboard |
| `/workouts` | `WorkoutsPage` | Workout library list |
| `/workouts/:workoutId` | `WorkoutDetailPage` | Edit workout |
| `/workouts/:workoutId/history` | `WorkoutHistoryPage` | Workout sessions |
| `/sessions/:sessionId` | `SessionPage` | Active workout execution |
| `/sessions/:sessionId/detail` | `SessionDetailPage` | Finished session view |
| `/exercises` | `ExercisesPage` | Exercise library |
| `/exercises/:exerciseId/history` | `ExerciseHistoryPage` | Exercise progress |
| `/cycles` | `CyclesPage` | Cycle management |
| `/settings` | `SettingsPage` | User settings |

---

## 4. Page Components

### 4.1 DashboardPage

**Purpose**: User's home screen with quick access to active cycle and recent sessions

**Location**: `src/pages/DashboardPage.tsx`

**Data Dependencies**:
- Active cycle (if any): Custom query
- Recent sessions (last 5): Custom query

**Components**:
```tsx
function DashboardPage() {
  const { data: activeCycle } = useActiveCycle();
  const { data: recentSessions } = useRecentSessions({ limit: 5 });

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>

      {activeCycle && <ActiveCycleCard cycle={activeCycle} />}

      <QuickActionButtons />

      <section>
        <h2>Recent Sessions</h2>
        <RecentSessionsList sessions={recentSessions} />
      </section>
    </div>
  );
}
```

**Child Components**:
- `ActiveCycleCard` - Shows current cycle progress with "Start Today's Session" button
- `QuickActionButtons` - "Log Freestyle Workout", navigate to workouts
- `RecentSessionsList` - Last 5 sessions with volume totals

---

### 4.2 WorkoutsPage

**Purpose**: Browse and manage workout library

**Location**: `src/pages/WorkoutsPage.tsx`

**Data Dependencies**:
- Workout list: `useWorkouts()`

**Components**:
```tsx
function WorkoutsPage() {
  const { data: workouts, isLoading } = useWorkouts();
  const [filter, setFilter] = useState('all');

  return (
    <div className="workouts-page">
      <header>
        <h1>Workouts</h1>
        <button onClick={() => openCreateWorkoutModal()}>+ Add</button>
      </header>

      <WorkoutFilters value={filter} onChange={setFilter} />

      {isLoading ? (
        <Spinner />
      ) : (
        <WorkoutList workouts={workouts} filter={filter} />
      )}

      <FloatingActionButton
        icon={<PlusIcon />}
        onClick={() => openImportWorkoutModal()}
      />
    </div>
  );
}
```

**Child Components**:
- `WorkoutList` - Grid/list of workout cards
- `WorkoutCard` - Individual workout with preview, actions
- `WorkoutFilters` - Filter by category, recent, etc.

---

### 4.3 WorkoutDetailPage

**Purpose**: Edit workout structure (groups, items, ordering)

**Location**: `src/pages/WorkoutDetailPage.tsx`

**Data Dependencies**:
- Workout detail: `useWorkoutDetail(workoutId)`

**Components**:
```tsx
function WorkoutDetailPage() {
  const { workoutId } = useParams();
  const { data: workout } = useWorkoutDetail(workoutId);
  const updateWorkout = useUpdateWorkout();
  const reorderGroups = useReorderWorkoutGroups();

  return (
    <div className="workout-detail-page">
      <WorkoutHeader
        workout={workout}
        onEdit={(data) => updateWorkout.mutate(data)}
      />

      <WorkoutGroupList
        groups={workout.groups}
        onReorder={(movedId, beforeId) =>
          reorderGroups.mutate({
            p_workout_id: workoutId,
            p_moved_group_id: movedId,
            p_before_group_id: beforeId,
          })
        }
      />

      <WorkoutActions
        workoutId={workoutId}
        onStartSession={() => navigate(`/sessions/new?workoutId=${workoutId}`)}
      />
    </div>
  );
}
```

**Child Components**:
- `WorkoutHeader` - Name, description, edit button
- `WorkoutGroupList` - List of groups (draggable)
- `WorkoutGroup` - Single group with items
- `WorkoutItem` - Exercise in group with target sets/reps
- `WorkoutActions` - Start session, start cycle, delete

---

### 4.4 SessionPage (Active Workout)

**Purpose**: Execute workout session with set logging and timers

**Location**: `src/pages/SessionPage.tsx`

**Data Dependencies**:
- Session detail: `useSessionDetail(sessionId, { isActive: true })` (polls every 15s)

**Components**:
```tsx
function SessionPage() {
  const { sessionId } = useParams();
  const { data: session } = useSessionDetail(sessionId, { isActive: true });
  const logSet = useLogSet();
  const finishSession = useFinishSession();
  const [activeRestTimer, setActiveRestTimer] = useState(null);

  return (
    <div className="session-page">
      <SessionHeader
        title={session.title}
        elapsedTime={session.startedAt}
      />

      <SessionGroupList
        groups={session.groups}
        onLogSet={(itemId, reps, weight) =>
          logSet.mutate({ sessionId, sessionItemId: itemId, reps, weight })
        }
        onStartRest={(seconds) => setActiveRestTimer(seconds)}
      />

      {activeRestTimer && (
        <RestTimer
          seconds={activeRestTimer}
          onComplete={() => setActiveRestTimer(null)}
        />
      )}

      <SessionActions
        onFinish={() =>
          finishSession.mutate({
            p_session_id: sessionId,
            workoutId: session.workoutId,
          })
        }
      />
    </div>
  );
}
```

**Child Components**:
- `SessionHeader` - Title, elapsed time
- `SessionTimer` - Real-time elapsed counter
- `SessionGroupList` - List of groups with progress indicators
- `SessionGroup` - Group with round counter (for supersets)
- `SessionItem` - Exercise with set input form
- `SetInputForm` - Reps/weight inputs + Log button
- `SetHistoryList` - Previously logged sets for this item
- `RestTimer` - Countdown modal/overlay
- `SessionActions` - Finish session, pause

---

### 4.5 WorkoutHistoryPage

**Purpose**: View all sessions for a specific workout

**Location**: `src/pages/WorkoutHistoryPage.tsx`

**Data Dependencies**:
- Workout history: `useWorkoutHistory(workoutId)`

**Components**:
```tsx
function WorkoutHistoryPage() {
  const { workoutId } = useParams();
  const { data: history } = useWorkoutHistory(workoutId);

  return (
    <div className="workout-history-page">
      <HistoryHeader
        workoutName={history.workoutName}
        totalSessions={history.sessions.length}
      />

      <SessionHistoryList sessions={history.sessions} />
    </div>
  );
}
```

**Child Components**:
- `HistoryHeader` - Workout name, total sessions
- `SessionHistoryList` - List of sessions
- `SessionCard` - Date, volume, duration, link to detail

---

### 4.6 SessionDetailPage (Finished Session)

**Purpose**: View completed session with all logged sets

**Location**: `src/pages/SessionDetailPage.tsx`

**Data Dependencies**:
- Session detail: `useSessionDetail(sessionId, { isActive: false })` (cached 30min)

**Components**:
```tsx
function SessionDetailPage() {
  const { sessionId } = useParams();
  const { data: session } = useSessionDetail(sessionId, { isActive: false });

  return (
    <div className="session-detail-page">
      <SessionSummaryHeader
        title={session.title}
        date={session.startedAt}
        duration={session.finishedAt - session.startedAt}
        totalVolume={session.totalVolume}
      />

      <SessionGroupsDetail groups={session.groups} />
    </div>
  );
}
```

**Child Components**:
- `SessionSummaryHeader` - Date, duration, total volume
- `SessionGroupsDetail` - Read-only view of groups
- `GroupDetail` - Group with volume total
- `ItemDetail` - Exercise with all sets
- `SetLog` - Individual set (reps × weight)

---

### 4.7 ExercisesPage

**Purpose**: Manage exercise library

**Location**: `src/pages/ExercisesPage.tsx`

**Data Dependencies**:
- Exercise list: `useExercises()`

**Components**:
```tsx
function ExercisesPage() {
  const { data: exercises } = useExercises();
  const [categoryFilter, setCategoryFilter] = useState('all');

  return (
    <div className="exercises-page">
      <header>
        <h1>Exercises</h1>
        <button onClick={() => openAddExerciseModal()}>+ Add</button>
      </header>

      <ExerciseFilters
        category={categoryFilter}
        onCategoryChange={setCategoryFilter}
      />

      <ExerciseList exercises={exercises} filter={categoryFilter} />
    </div>
  );
}
```

**Child Components**:
- `ExerciseList` - Searchable/filterable list
- `ExerciseCard` - Name, category, usage stats
- `ExerciseFilters` - Category filter, search

---

### 4.8 ExerciseHistoryPage

**Purpose**: View progression for one exercise across all sessions

**Location**: `src/pages/ExerciseHistoryPage.tsx`

**Data Dependencies**:
- Exercise history: `useExerciseHistory(exerciseId)`

**Components**:
```tsx
function ExerciseHistoryPage() {
  const { exerciseId } = useParams();
  const { data: history } = useExerciseHistory(exerciseId);

  const chartData = history.sessions.map((s) => ({
    date: s.sessionDate,
    volume: s.totalVolume,
    maxWeight: s.maxWeight,
  }));

  return (
    <div className="exercise-history-page">
      <ExerciseHeader name={history.exerciseName} />

      <ProgressChart data={chartData} />

      <SessionHistoryList sessions={history.sessions} />
    </div>
  );
}
```

**Child Components**:
- `ExerciseHeader` - Exercise name
- `ProgressChart` - Line chart (volume/weight over time)
- `SessionHistoryList` - Sessions where exercise was performed

---

## 5. Feature Components

### 5.1 Workout Components

#### WorkoutCard

**Purpose**: Display workout summary in list view

**Props**:
```tsx
interface WorkoutCardProps {
  workout: {
    id: string;
    name: string;
    groupCount: number;
    itemCount: number;
    lastUsed: string | null;
  };
  onView: (id: string) => void;
  onStartCycle: (id: string) => void;
}
```

**UI Elements**:
- Workout name (bold, 18px)
- "{groupCount} groups, {itemCount} exercises"
- "Last used: {lastUsed}" (if exists)
- Buttons: "View", "Start Cycle"

---

#### WorkoutGroup

**Purpose**: Display and manage group within workout editor

**Props**:
```tsx
interface WorkoutGroupProps {
  group: WorkoutGroup;
  onEdit: (data: Partial<WorkoutGroup>) => void;
  onAddItem: (exerciseId: string) => void;
  onReorderItems: (movedId: string, beforeId: string) => void;
  isDragging?: boolean;
}
```

**UI Elements**:
- Group header: "Group A • Superset • Rest 120s"
- Edit button (pencil icon)
- Item list (draggable)
- "+ Add Exercise" button

---

#### WorkoutItem

**Purpose**: Display exercise within group

**Props**:
```tsx
interface WorkoutItemProps {
  item: WorkoutItem;
  onEdit: (data: Partial<WorkoutItem>) => void;
  onDelete: () => void;
  isDraggable?: boolean;
}
```

**UI Elements**:
- Group position: "A1"
- Exercise name: "Flat DB Press"
- Target: "4×8 @ 30kg"
- Drag handle (≡ icon)
- Edit/delete actions

---

### 5.2 Session Components

#### SessionItem

**Purpose**: Active workout item with set logging

**Props**:
```tsx
interface SessionItemProps {
  item: SessionItem;
  onLogSet: (reps: number, weight: number) => void;
  isLoading: boolean;
}
```

**UI Elements**:
- Exercise name: "A1 Flat DB Press"
- Target: "4×8 @ 30kg"
- Set input form:
  - Reps input (number)
  - Weight input (number)
  - "Log Set" button
- Previous sets: "Set 1: 8@30kg, Set 2: 8@30kg"
- Sets completed: "2/4"

---

#### SetInputForm

**Purpose**: Input reps and weight for a set

**Props**:
```tsx
interface SetInputFormProps {
  targetReps?: number;
  targetWeight?: number;
  lastSet?: { reps: number; weight: number };
  onSubmit: (reps: number, weight: number) => void;
  isLoading: boolean;
}
```

**UI Elements**:
- Reps input (prefilled with target or last set)
- Weight input (prefilled with target or last set)
- "Log Set" button (primary, large, thumb-friendly)

---

#### RestTimer

**Purpose**: Countdown timer for rest periods

**Props**:
```tsx
interface RestTimerProps {
  seconds: number;
  onComplete: () => void;
  onSkip: () => void;
}
```

**UI Elements**:
- Large countdown display: "2:00"
- Progress circle animation
- "Skip Rest" button
- Audio/vibration on completion

---

### 5.3 History Components

#### SessionCard

**Purpose**: Display session summary in history list

**Props**:
```tsx
interface SessionCardProps {
  session: {
    id: string;
    title: string;
    startedAt: string;
    totalVolume: number;
    duration: number; // seconds
  };
  onClick: (id: string) => void;
}
```

**UI Elements**:
- Date: "Mon Oct 3"
- Title: "Push A – Week 1"
- Volume: "4,200 kg"
- Duration: "45:23"
- Tap to view detail

---

#### ProgressChart

**Purpose**: Line chart for exercise progression

**Library**: Recharts

**Props**:
```tsx
interface ProgressChartProps {
  data: Array<{
    date: string;
    volume: number;
    maxWeight?: number;
  }>;
  metric: 'volume' | 'weight';
}
```

**UI Elements**:
- Line chart with X-axis (dates) and Y-axis (volume/weight)
- Toggle metric button
- Tooltips on data points

---

## 6. Shared Components

### 6.1 Layout Components

#### AppLayout

**Purpose**: Main app shell with navigation

**Location**: `src/components/layout/AppLayout.tsx`

**Components**:
```tsx
function AppLayout() {
  return (
    <div className="app-layout">
      <NetworkStatusBanner />
      <main>
        <Outlet /> {/* React Router outlet for child routes */}
      </main>
      <NavigationBar />
    </div>
  );
}
```

---

#### NavigationBar

**Purpose**: Bottom navigation (mobile-first)

**Location**: `src/components/layout/NavigationBar.tsx`

**UI Elements**:
- Home (dashboard)
- Workouts
- Exercises
- Cycles
- Settings

**Implementation**:
```tsx
function NavigationBar() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: HomeIcon, label: 'Home' },
    { path: '/workouts', icon: DumbbellIcon, label: 'Workouts' },
    { path: '/exercises', icon: ListIcon, label: 'Exercises' },
    { path: '/cycles', icon: CalendarIcon, label: 'Cycles' },
    { path: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={location.pathname === item.path ? 'active' : ''}
        >
          <item.icon />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
```

---

#### NetworkStatusBanner

**Purpose**: Show offline status banner

**Location**: `src/components/layout/NetworkStatusBanner.tsx`

**From Spec**: Section 6.3

```tsx
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

function NetworkStatusBanner() {
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

---

### 6.2 Form Components

#### Button

**Variants**: primary, secondary, danger, ghost

**Props**:
```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

---

#### Input

**Types**: text, number, email

**Props**:
```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}
```

---

#### Select

**Props**:
```tsx
interface SelectProps {
  label?: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}
```

---

### 6.3 Feedback Components

#### Spinner

**Sizes**: sm, md, lg

```tsx
function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return <div className={`spinner spinner-${size}`} />;
}
```

---

#### Toast

**Library**: react-hot-toast

**Usage**:
```tsx
import { toast } from 'react-hot-toast';

// In mutation onSuccess
toast.success('Workout created!');

// In mutation onError
toast.error(error.message);
```

---

#### ConfirmationDialog

**Library**: Headless UI

**Props**:
```tsx
interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}
```

---

### 6.4 Modal Components

#### Modal (Base)

**Library**: Headless UI Dialog

**Props**:
```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}
```

---

#### CreateWorkoutModal

**Purpose**: Create new workout

**Form Fields**:
- Name (text, required)
- Description (textarea, optional)

**Actions**: Cancel, Create

---

#### ExercisePickerModal

**Purpose**: Select exercise from library

**UI**:
- Search input
- Category filter
- Scrollable exercise list
- Selected exercise highlight

---

## 7. State Management Patterns

### 7.1 Server State (TanStack Query)

**All API data managed via hooks**:

```tsx
// Read data
const { data, isLoading, error } = useWorkoutDetail(workoutId);

// Mutate data
const updateWorkout = useUpdateWorkout();
updateWorkout.mutate({ p_workout_id: id, p_name: 'New Name' });
```

**No Redux/Zustand needed** - TanStack Query handles all server state.

---

### 7.2 URL State (React Router)

**Route params for entity IDs**:

```tsx
// /workouts/:workoutId
const { workoutId } = useParams();

// /sessions/:sessionId
const { sessionId } = useParams();
```

**Search params for filters**:

```tsx
// /workouts?category=strength
const [searchParams, setSearchParams] = useSearchParams();
const category = searchParams.get('category');
```

---

### 7.3 Local UI State (useState)

**Component-local ephemeral state**:

```tsx
// Modal open/close
const [isModalOpen, setIsModalOpen] = useState(false);

// Form inputs (before submission)
const [formData, setFormData] = useState({ name: '', description: '' });

// Active rest timer
const [activeTimer, setActiveTimer] = useState<number | null>(null);
```

---

### 7.4 Form State (React Hook Form)

**For complex forms with validation**:

```tsx
import { useForm } from 'react-hook-form';

function WorkoutForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    createWorkout.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name', { required: true })} />
      {errors.name && <span>Name is required</span>}
      <button type="submit">Create</button>
    </form>
  );
}
```

---

## 8. Data Flow

### 8.1 Read Flow (Query)

```
User Opens Page
    ↓
Component Mounts
    ↓
useWorkoutDetail(id) called
    ↓
TanStack Query checks cache
    ↓
If stale → Call RPC function
    ↓
rpc.workoutDetailJson(id)
    ↓
Supabase RPC
    ↓
JSON response
    ↓
TanStack Query caches result
    ↓
Component receives data
    ↓
UI renders
```

---

### 8.2 Write Flow (Mutation)

```
User Clicks "Update Workout"
    ↓
updateWorkout.mutate({ ... })
    ↓
TanStack Query mutation
    ↓
rpc.updateWorkout({ ... })
    ↓
Supabase RPC
    ↓
Success response
    ↓
onSuccess callback
    ↓
invalidateQueries(['workouts', 'detail', id])
    ↓
TanStack Query refetches
    ↓
UI updates with new data
```

---

### 8.3 Optimistic Update Flow

```
User Logs Set
    ↓
logSet.mutate({ ... })
    ↓
onMutate (optimistic update)
    ↓
Update cache immediately
    ↓
UI shows new set instantly
    ↓
RPC call to server
    ↓
If success: keep optimistic update
    ↓
If error: rollback cache
    ↓
onSettled: refetch for consistency
```

---

## 9. File Structure

### Complete Component Directory

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── NavigationBar.tsx
│   │   ├── NetworkStatusBanner.tsx
│   │   └── ProtectedRoute.tsx
│   ├── workouts/
│   │   ├── WorkoutCard.tsx
│   │   ├── WorkoutList.tsx
│   │   ├── WorkoutFilters.tsx
│   │   ├── WorkoutHeader.tsx
│   │   ├── WorkoutGroup.tsx
│   │   ├── WorkoutGroupList.tsx
│   │   ├── WorkoutItem.tsx
│   │   ├── WorkoutActions.tsx
│   │   └── modals/
│   │       ├── CreateWorkoutModal.tsx
│   │       ├── EditWorkoutModal.tsx
│   │       ├── GroupEditorModal.tsx
│   │       └── ImportWorkoutModal.tsx
│   ├── sessions/
│   │   ├── SessionHeader.tsx
│   │   ├── SessionTimer.tsx
│   │   ├── SessionGroup.tsx
│   │   ├── SessionGroupList.tsx
│   │   ├── SessionItem.tsx
│   │   ├── SessionActions.tsx
│   │   ├── SetInputForm.tsx
│   │   ├── SetHistoryList.tsx
│   │   ├── RestTimer.tsx
│   │   └── SessionSummaryHeader.tsx
│   ├── history/
│   │   ├── SessionCard.tsx
│   │   ├── SessionHistoryList.tsx
│   │   ├── HistoryHeader.tsx
│   │   ├── ProgressChart.tsx
│   │   ├── GroupDetail.tsx
│   │   └── ItemDetail.tsx
│   ├── exercises/
│   │   ├── ExerciseCard.tsx
│   │   ├── ExerciseList.tsx
│   │   ├── ExerciseFilters.tsx
│   │   ├── ExerciseHeader.tsx
│   │   └── modals/
│   │       ├── AddExerciseModal.tsx
│   │       └── ExercisePickerModal.tsx
│   ├── dashboard/
│   │   ├── ActiveCycleCard.tsx
│   │   ├── QuickActionButtons.tsx
│   │   └── RecentSessionsList.tsx
│   ├── cycles/
│   │   ├── CycleCard.tsx
│   │   └── CycleList.tsx
│   └── shared/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       ├── Spinner.tsx
│       ├── Modal.tsx
│       ├── ConfirmationDialog.tsx
│       ├── FloatingActionButton.tsx
│       └── EmptyState.tsx
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── WorkoutsPage.tsx
│   ├── WorkoutDetailPage.tsx
│   ├── WorkoutHistoryPage.tsx
│   ├── SessionPage.tsx
│   ├── SessionDetailPage.tsx
│   ├── ExercisesPage.tsx
│   ├── ExerciseHistoryPage.tsx
│   ├── CyclesPage.tsx
│   └── SettingsPage.tsx
├── hooks/ (already exists)
│   ├── useWorkouts.ts
│   ├── useSessions.ts
│   ├── useExercises.ts
│   ├── useAuth.ts (to be created)
│   ├── useNetworkStatus.ts (to be created)
│   └── useTimer.ts (to be created)
├── lib/ (already exists)
│   ├── queryKeys.ts
│   ├── queryConfig.ts
│   ├── queryClient.ts
│   └── rpc.ts
├── types/ (already exists)
│   └── rpc.ts
├── config/
│   ├── supabase.ts (already exists)
│   └── env.ts (already exists)
├── utils/
│   ├── formatters.ts (date, number formatting)
│   ├── validators.ts (form validation)
│   └── helpers.ts (utility functions)
├── App.tsx
└── main.tsx
```

---

## 10. Implementation Roadmap

### Phase 1: Foundation ✅
- [x] React + Vite scaffold
- [x] TanStack Query integration
- [x] Routing setup (next)

### Phase 2: Shared Components (Week 1)
- [ ] Layout components (AppLayout, NavigationBar)
- [ ] Shared UI (Button, Input, Select, Spinner)
- [ ] Modal primitives (Modal, ConfirmationDialog)
- [ ] Network status banner

### Phase 3: Authentication (Week 1)
- [ ] LoginPage
- [ ] ProtectedRoute wrapper
- [ ] useAuth hook
- [ ] Auth state management

### Phase 4: Dashboard (Week 2)
- [ ] DashboardPage
- [ ] ActiveCycleCard
- [ ] QuickActionButtons
- [ ] RecentSessionsList

### Phase 5: Workouts (Week 2-3)
- [ ] WorkoutsPage + WorkoutList
- [ ] WorkoutDetailPage + Editor
- [ ] Workout components (Group, Item)
- [ ] Create/Edit modals
- [ ] Drag-and-drop reordering

### Phase 6: Sessions (Week 3-4)
- [ ] SessionPage (active workout)
- [ ] SessionItem + SetInputForm
- [ ] RestTimer component
- [ ] Session actions
- [ ] SessionDetailPage (finished)

### Phase 7: History (Week 4)
- [ ] WorkoutHistoryPage
- [ ] SessionCard
- [ ] SessionDetailPage improvements
- [ ] ProgressChart (Recharts)

### Phase 8: Exercises (Week 5)
- [ ] ExercisesPage
- [ ] ExerciseCard + ExerciseList
- [ ] ExerciseHistoryPage
- [ ] Exercise modals

### Phase 9: Cycles (Week 5)
- [ ] CyclesPage
- [ ] CycleCard + CycleList
- [ ] Cycle creation flow

### Phase 10: Settings (Week 6)
- [ ] SettingsPage
- [ ] Import/Export functionality
- [ ] User preferences

### Phase 11: Polish (Week 6-7)
- [ ] Mobile gestures (swipe, pull-to-refresh)
- [ ] Animations (page transitions, loading states)
- [ ] Accessibility audit
- [ ] Performance optimization

---

## Appendices

### A. Component Checklist Template

For each component:
- [ ] TypeScript props interface defined
- [ ] Mobile-first responsive design
- [ ] Accessibility (ARIA labels, keyboard nav)
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Empty states handled
- [ ] Touch-friendly (44px minimum touch targets)
- [ ] Unit tests (if complex logic)

### B. Route Protection Pattern

```tsx
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Spinner />;

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
```

### C. Error Boundary Pattern

```tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

---

**Document Status**: ✅ Design Complete
**Next Step**: Phase 2 - Implement Shared Components
**Last Updated**: 2025-10-02
