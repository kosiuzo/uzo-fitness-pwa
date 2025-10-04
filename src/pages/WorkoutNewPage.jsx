import { Button } from '../components/shared/Button';

export function WorkoutNewPage() {
  return (
    <div className="flex h-full flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Create Workout</h1>
        <p className="mt-1 text-sm text-gray-500">
          The workout builder is coming soon. In the meantime you can duplicate a demo workout or import JSON.
        </p>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="max-w-md space-y-4 text-center">
          <p className="text-gray-600">
            Need to test the editor? Open any existing workout from the library to explore the full drag-and-drop experience.
          </p>
          <Button
            variant="secondary"
            onClick={() => window.history.back()}
          >
            Back to Workouts
          </Button>
        </div>
      </div>
    </div>
  );
}
