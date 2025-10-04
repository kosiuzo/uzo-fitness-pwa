import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

/**
 * ActiveCycleCard - Displays active cycle information
 * Shows cycle name, workout, week progress, and start session button
 */
export function ActiveCycleCard({ cycle }) {
  const navigate = useNavigate();
  const { name, workoutName, currentWeek, durationWeeks, workoutId } = cycle;

  const handleStartSession = () => {
    // Navigate to session creation with workout ID
    navigate(`/sessions/new?workoutId=${workoutId}&cycleId=${cycle.id}`);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">{name}</h2>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
            Active
          </span>
        </div>
        <p className="text-sm text-gray-600">{workoutName}</p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Week {currentWeek} of {durationWeeks}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round((currentWeek / durationWeeks) * 100)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentWeek / durationWeeks) * 100}%` }}
          />
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleStartSession}
        className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        Start Today's Session
      </button>
    </div>
  );
}

ActiveCycleCard.propTypes = {
  cycle: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    workoutId: PropTypes.string.isRequired,
    workoutName: PropTypes.string.isRequired,
    currentWeek: PropTypes.number.isRequired,
    durationWeeks: PropTypes.number.isRequired,
  }).isRequired,
};
