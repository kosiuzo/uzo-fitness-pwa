import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from './components/layout'
import { NetworkStatusBanner } from './components/shared'
import { DashboardPage } from './pages/DashboardPage'
import { WorkoutsPage } from './pages/WorkoutsPage'
import { WorkoutDetailPage } from './pages/WorkoutDetailPage'
import { WorkoutNewPage } from './pages/WorkoutNewPage'

// Create query client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: 1,
    },
  },
})

// Placeholder page components - will be implemented in future phases
function ExercisesPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Exercises</h1>
      <p className="text-gray-600">Exercise library coming soon</p>
    </div>
  )
}

function CyclesPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Cycles</h1>
      <p className="text-gray-600">Workout cycles coming soon</p>
    </div>
  )
}

function SettingsPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <p className="text-gray-600">Settings coming soon</p>
    </div>
  )
}

// Router configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'workouts',
        element: <WorkoutsPage />,
      },
      {
        path: 'workouts/new',
        element: <WorkoutNewPage />,
      },
      {
        path: 'workouts/:workoutId',
        element: <WorkoutDetailPage />,
      },
      {
        path: 'exercises',
        element: <ExercisesPage />,
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
])

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NetworkStatusBanner />
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

export default App
