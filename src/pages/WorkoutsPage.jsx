/**
 * WorkoutsPage Component
 *
 * Workout library view showing list of workouts with actions
 * Includes Add Workout, Import JSON, and Manage Exercises buttons
 */

import { useNavigate } from 'react-router-dom';
import { useWorkouts } from '../hooks/useWorkouts';
import { WorkoutCard } from '../components/workouts/WorkoutCard';

export function WorkoutsPage() {
  const navigate = useNavigate();
  const { data: workouts, isLoading, error } = useWorkouts();

  const handleAddWorkout = () => {
    navigate('/workouts/new');
  };

  const handleImportJson = () => {
    navigate('/workouts/import');
  };

  const handleManageExercises = () => {
    navigate('/exercises');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" aria-label="Loading workouts" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4" style={{ padding: '1rem' }}>
        <div
          className="bg-red-50 border border-red-200 rounded-lg p-4"
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            padding: '1rem',
          }}
        >
          <h3 className="text-red-800 font-medium mb-1" style={{ color: '#991b1b', fontWeight: 500, marginBottom: '0.25rem' }}>
            Error Loading Workouts
          </h3>
          <p className="text-red-600 text-sm" style={{ color: '#dc2626', fontSize: '0.875rem' }}>
            {error.message || 'Failed to load workouts. Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  const hasWorkouts = workouts && workouts.length > 0;

  return (
    <div className="flex flex-col h-full bg-gray-50" style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <div
        className="bg-white border-b border-gray-200 px-4 py-4"
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '1rem',
        }}
      >
        <div className="flex items-center justify-between" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
            💪 Workouts
          </h1>
          <button
            onClick={handleAddWorkout}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label="Add new workout"
          >
            +
          </button>
        </div>
      </div>

      {/* Workout list */}
      <div className="flex-1 overflow-y-auto p-4" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {!hasWorkouts ? (
          <div
            className="text-center py-12"
            style={{
              textAlign: 'center',
              paddingTop: '3rem',
              paddingBottom: '3rem',
            }}
          >
            <p className="text-gray-600 mb-2" style={{ color: '#4b5563', marginBottom: '0.5rem' }}>
              No workouts yet
            </p>
            <p className="text-gray-500 text-sm" style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Create your first workout or import from JSON
            </p>
          </div>
        ) : (
          <div>
            {workouts.map((workout) => (
              <WorkoutCard key={workout.id} workout={workout} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom action buttons */}
      <div
        className="bg-white border-t border-gray-200 p-4 space-y-2"
        style={{
          backgroundColor: 'white',
          borderTop: '1px solid #e5e7eb',
          padding: '1rem',
        }}
      >
        <button
          onClick={handleImportJson}
          className="w-full px-4 py-3 bg-gray-100 text-gray-900 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            backgroundColor: '#f3f4f6',
            color: '#111827',
            fontWeight: 500,
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '0.5rem',
          }}
        >
          Import JSON
        </button>
        <button
          onClick={handleManageExercises}
          className="w-full px-4 py-3 bg-gray-100 text-gray-900 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            backgroundColor: '#f3f4f6',
            color: '#111827',
            fontWeight: 500,
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Manage Exercises
        </button>
      </div>
    </div>
  );
}
