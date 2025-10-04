import { useState } from 'react';
import PropTypes from 'prop-types';
import { ExerciseCard } from './ExerciseCard';

/**
 * WorkoutGroupCard - Collapsible workout group with exercise list
 * Displays group type, rest time, and exercises with reorder handles
 */
export function WorkoutGroupCard({ group, onEdit, onExerciseReorder, className = '' }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { name, groupType, restSeconds, items = [] } = group;

  const groupTypeLabels = {
    single: 'Single',
    superset: 'Superset',
    triset: 'Triset',
    circuit: 'Circuit',
  };

  const groupTypeColors = {
    single: 'bg-gray-100 text-gray-700',
    superset: 'bg-blue-100 text-blue-700',
    triset: 'bg-purple-100 text-purple-700',
    circuit: 'bg-green-100 text-green-700',
  };

  return (
    <div className={`border border-gray-200 rounded-lg bg-white ${className}`}>
      {/* Group Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Group Name */}
            <h3 className="font-semibold text-gray-900">{name}</h3>

            {/* Group Type Badge */}
            <span className={`px-2 py-1 text-xs font-medium rounded ${groupTypeColors[groupType] || groupTypeColors.single}`}>
              {groupTypeLabels[groupType] || groupType}
            </span>

            {/* Rest Time */}
            <span className="text-sm text-gray-500">
              Rest: {Math.floor(restSeconds / 60)}:{String(restSeconds % 60).padStart(2, '0')}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(group)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Edit group"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={isExpanded ? 'Collapse group' : 'Expand group'}
            >
              <svg
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Exercise List (Collapsible) */}
      {isExpanded && (
        <div className="p-4 space-y-2">
          {items.length === 0 ? (
            <p className="text-center text-gray-400 py-4">No exercises added</p>
          ) : (
            items.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2">
                {/* Drag Handle */}
                {onExerciseReorder && (
                  <button
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                    aria-label="Reorder exercise"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm4-16h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z" />
                    </svg>
                  </button>
                )}

                {/* Exercise Card */}
                <ExerciseCard
                  exercise={{
                    id: item.id,
                    name: item.exerciseName,
                    groupPosition: item.groupPosition,
                    targetSets: item.targetSets,
                    targetReps: item.targetReps,
                    targetWeight: item.targetWeight,
                  }}
                  className="flex-1"
                />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

WorkoutGroupCard.propTypes = {
  group: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    groupType: PropTypes.oneOf(['single', 'superset', 'triset', 'circuit']).isRequired,
    restSeconds: PropTypes.number.isRequired,
    items: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      exerciseName: PropTypes.string.isRequired,
      groupPosition: PropTypes.string,
      targetSets: PropTypes.number,
      targetReps: PropTypes.number,
      targetWeight: PropTypes.number,
    })),
  }).isRequired,
  onEdit: PropTypes.func,
  onExerciseReorder: PropTypes.func,
  className: PropTypes.string,
};
