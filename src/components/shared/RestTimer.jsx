import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * RestTimer - Countdown timer for rest periods
 * Displays countdown with start/pause/reset controls
 */
export function RestTimer({
  seconds = 90,
  onComplete,
  onSkip,
  autoStart = false,
  className = ''
}) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Initialize audio element for completion alert
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSl+zPLTgjMGHm7A7+OZURE=');
  }, []);

  // Countdown logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            // Play sound and trigger completion
            if (audioRef.current && audioRef.current.play) {
              const playPromise = audioRef.current.play();
              if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => {
                  // Fallback to vibration if audio fails
                  if (navigator.vibrate) {
                    navigator.vibrate([200, 100, 200]);
                  }
                });
              }
            }
            if (onComplete) {
              onComplete();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, onComplete]);

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(seconds);
  };

  const handleSkip = () => {
    setIsRunning(false);
    setTimeLeft(0);
    if (onSkip) {
      onSkip();
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const progress = ((seconds - timeLeft) / seconds) * 100;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="space-y-6">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 text-center">Rest Timer</h3>

        {/* Countdown Display */}
        <div className="relative">
          {/* Progress Ring */}
          <svg className="w-48 h-48 mx-auto transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
              className={`transition-all duration-1000 ${
                timeLeft === 0 ? 'text-green-500' : timeLeft <= 10 ? 'text-red-500' : 'text-blue-500'
              }`}
              strokeLinecap="round"
            />
          </svg>

          {/* Time Display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900 tabular-nums">
                {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {timeLeft === 0 ? "Time's up!" : isRunning ? 'Running' : 'Paused'}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          {/* Start/Pause Button */}
          <button
            onClick={handleStartPause}
            disabled={timeLeft === 0}
            className={`flex-1 py-3 px-4 font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
              isRunning
                ? 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
            } disabled:bg-gray-300 disabled:cursor-not-allowed`}
          >
            {isRunning ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
                Pause
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Start
              </span>
            )}
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            aria-label="Reset timer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Skip Button */}
        {onSkip && timeLeft > 0 && (
          <button
            onClick={handleSkip}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip Rest
          </button>
        )}
      </div>
    </div>
  );
}

RestTimer.propTypes = {
  seconds: PropTypes.number,
  onComplete: PropTypes.func,
  onSkip: PropTypes.func,
  autoStart: PropTypes.bool,
  className: PropTypes.string,
};
