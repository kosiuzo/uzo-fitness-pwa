import { useActiveCycle } from '../hooks/useCycles';
import { ActiveCycleCard } from '../components/dashboard/ActiveCycleCard';
import { QuickActionButtons } from '../components/dashboard/QuickActionButtons';
import { Spinner } from '../components/shared/Spinner';

/**
 * DashboardPage - User's home screen
 *
 * Displays:
 * - Active cycle progress (if exists)
 * - Quick action buttons
 * - Recent sessions (future implementation)
 */
export function DashboardPage() {
  const { data: activeCycle, isLoading, error } = useActiveCycle();

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold mb-2">Error Loading Dashboard</h2>
            <p className="text-red-600 text-sm">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Ready to train?</p>
        </header>

        {/* Active Cycle Section */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : activeCycle ? (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Active Cycle</h2>
            <ActiveCycleCard cycle={activeCycle} />
          </section>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-blue-900 font-semibold mb-2">No Active Cycle</h3>
            <p className="text-blue-700 text-sm mb-4">
              Start a new training cycle to track your weekly progress.
            </p>
            <button
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              onClick={() => {
                // Navigate to cycles page (future implementation)
                console.log('Navigate to create cycle');
              }}
            >
              Create Cycle
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
          <QuickActionButtons />
        </section>

        {/* Recent Sessions - Placeholder for future implementation */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Sessions</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-500 text-sm">No recent sessions to display</p>
            <p className="text-gray-400 text-xs mt-1">
              Start a workout to see your training history
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
