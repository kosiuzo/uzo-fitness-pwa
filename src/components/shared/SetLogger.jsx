import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * SetLogger - Input form for logging exercise sets
 * Provides reps and weight inputs with a log button
 */
export function SetLogger({
  targetReps,
  targetWeight,
  lastSet,
  onSubmit,
  isLoading = false,
  className = ''
}) {
  const [reps, setReps] = useState(targetReps || lastSet?.reps || 0);
  const [weight, setWeight] = useState(targetWeight || lastSet?.weight || 0);

  // Update inputs when target or last set changes
  useEffect(() => {
    setReps(targetReps || lastSet?.reps || 0);
    setWeight(targetWeight || lastSet?.weight || 0);
  }, [targetReps, targetWeight, lastSet]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reps > 0 && weight >= 0) {
      onSubmit(reps, weight);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="space-y-4">
        {/* Input Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Reps Input */}
          <div>
            <label htmlFor="reps" className="block text-sm font-medium text-gray-700 mb-1">
              Reps
            </label>
            <input
              id="reps"
              type="number"
              min="0"
              value={reps}
              onChange={(e) => setReps(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-center text-2xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {/* Weight Input */}
          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
              Weight (kg)
            </label>
            <input
              id="weight"
              type="number"
              min="0"
              step="0.5"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-center text-2xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Target Display */}
        {(targetReps || targetWeight) && (
          <div className="text-sm text-gray-500 text-center">
            Target: {targetReps || '–'} reps @ {targetWeight || '–'} kg
          </div>
        )}

        {/* Log Button */}
        <button
          type="submit"
          disabled={isLoading || reps === 0}
          className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Logging...
            </span>
          ) : (
            'Log Set'
          )}
        </button>
      </div>
    </form>
  );
}

SetLogger.propTypes = {
  targetReps: PropTypes.number,
  targetWeight: PropTypes.number,
  lastSet: PropTypes.shape({
    reps: PropTypes.number,
    weight: PropTypes.number,
  }),
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  className: PropTypes.string,
};
