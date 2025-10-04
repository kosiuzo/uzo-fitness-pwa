/**
 * WorkoutCard Component
 *
 * Displays workout information with name, group/exercise count, last session date
 * Includes View and Cycle action buttons
 */

import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

export function WorkoutCard({ workout }) {
  const navigate = useNavigate();

  const handleView = () => {
    navigate(`/workouts/${workout.id}`);
  };

  const handleCycle = () => {
    navigate(`/cycles/new?workoutId=${workout.id}`);
  };

  // Calculate total exercise count
  const exerciseCount = workout.groups.reduce((sum, group) => {
    return sum + (group.exercise_count || group.items?.length || 0);
  }, 0);

  // Format last session date
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

    // Format as "Oct 3" style
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const lastSessionText = workout.last_session_date
    ? formatDate(workout.last_session_date)
    : 'Never';

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
      style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        border: '1px solid #e5e7eb',
        padding: '1rem',
        marginBottom: '0.75rem',
      }}
    >
      {/* Workout name */}
      <h3
        className="text-lg font-semibold text-gray-900 mb-1"
        style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          color: '#111827',
          marginBottom: '0.25rem',
        }}
      >
        {workout.name}
      </h3>

      {/* Group and exercise count */}
      <p
        className="text-sm text-gray-600 mb-1"
        style={{
          fontSize: '0.875rem',
          color: '#4b5563',
          marginBottom: '0.25rem',
        }}
      >
        {workout.groups.length} {workout.groups.length === 1 ? 'group' : 'groups'}, {exerciseCount} ex
      </p>

      {/* Last session date */}
      <p
        className="text-xs text-gray-500 mb-3"
        style={{
          fontSize: '0.75rem',
          color: '#6b7280',
          marginBottom: '0.75rem',
        }}
      >
        Last: {lastSessionText}
      </p>

      {/* Action buttons */}
      <div
        className="flex gap-2"
        style={{
          display: 'flex',
          gap: '0.5rem',
        }}
      >
        <button
          onClick={handleView}
          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            backgroundColor: '#2563eb',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: 500,
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          View
        </button>
        <button
          onClick={handleCycle}
          className="flex-1 px-3 py-2 bg-gray-100 text-gray-900 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            backgroundColor: '#f3f4f6',
            color: '#111827',
            fontSize: '0.875rem',
            fontWeight: 500,
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Cycle
        </button>
      </div>
    </div>
  );
}

WorkoutCard.propTypes = {
  workout: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    groups: PropTypes.arrayOf(
      PropTypes.shape({
        exercise_count: PropTypes.number,
        items: PropTypes.array,
      })
    ).isRequired,
    last_session_date: PropTypes.string,
  }).isRequired,
};
