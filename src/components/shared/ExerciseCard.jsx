import PropTypes from 'prop-types';

/**
 * ExerciseCard - Displays exercise information with edit capability
 * Used in workout editor and session views
 */
export function ExerciseCard({ exercise, onEdit, className = '' }) {
  const { name, targetSets, targetReps, targetWeight, groupPosition } = exercise;

  return (
    <div className={`flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg ${className}`}>
      <div className="flex items-center gap-3 flex-1">
        {/* Group Position Badge */}
        {groupPosition && (
          <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 font-semibold text-sm rounded">
            {groupPosition}
          </span>
        )}

        {/* Exercise Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{name}</h3>
          <p className="text-sm text-gray-500">
            {targetSets && targetReps ? (
              <>
                {targetSets} × {targetReps}
                {targetWeight ? ` @ ${targetWeight} kg` : ''}
              </>
            ) : (
              <span className="text-gray-400">No target set</span>
            )}
          </p>
        </div>
      </div>

      {/* Edit Button */}
      {onEdit && (
        <button
          onClick={() => onEdit(exercise)}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={`Edit ${name}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
    </div>
  );
}

ExerciseCard.propTypes = {
  exercise: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    groupPosition: PropTypes.string,
    targetSets: PropTypes.number,
    targetReps: PropTypes.number,
    targetWeight: PropTypes.number,
  }).isRequired,
  onEdit: PropTypes.func,
  className: PropTypes.string,
};
