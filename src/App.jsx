import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from './components/layout'
import { NetworkStatusBanner } from './components/shared'

// Placeholder page components - will be implemented in Phase 3+
function DashboardPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="text-gray-600">Welcome to Uzo Fitness PWA</p>
    </div>
  )
}

function WorkoutsPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Workouts</h1>
      <p className="text-gray-600">Workout library coming soon</p>
    </div>
  )
}

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
    <>
      <NetworkStatusBanner />
      <RouterProvider router={router} />
    </>
  )
}

export default App
