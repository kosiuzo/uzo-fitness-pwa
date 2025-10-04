import { useNavigate } from 'react-router-dom';

/**
 * QuickActionButtons - Quick access buttons for common actions
 * Provides shortcuts to log freestyle workout and view workouts
 */
export function QuickActionButtons() {
  const navigate = useNavigate();

  const handleLogFreestyle = () => {
    // Navigate to freestyle workout creation
    // In a freestyle workout, user can log exercises without a predefined workout
    navigate('/sessions/new');
  };

  const handleViewWorkouts = () => {
    navigate('/workouts');
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Log Freestyle Workout */}
      <button
        onClick={handleLogFreestyle}
        className="flex flex-col items-center justify-center p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
      >
        <svg
          className="w-8 h-8 text-gray-600 mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        <span className="text-sm font-medium text-gray-900">Log Freestyle Workout</span>
      </button>

      {/* View Workouts */}
      <button
        onClick={handleViewWorkouts}
        className="flex flex-col items-center justify-center p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
      >
        <svg
          className="w-8 h-8 text-gray-600 mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <span className="text-sm font-medium text-gray-900">View Workouts</span>
      </button>
    </div>
  );
}
