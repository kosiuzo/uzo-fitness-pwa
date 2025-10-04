import { useParams } from 'react-router-dom';
import { WorkoutEditor } from '../components/workouts/WorkoutEditor';

export function WorkoutDetailPage() {
  const { workoutId } = useParams();

  const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  if (!workoutId) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
          Missing workout identifier in route.
        </div>
      </div>
    );
  }

  if (!uuidPattern.test(workoutId)) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
          Invalid workout identifier.
        </div>
      </div>
    );
  }

  return <WorkoutEditor workoutId={workoutId} />;
}
