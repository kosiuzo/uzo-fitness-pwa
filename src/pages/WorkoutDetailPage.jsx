import { useParams } from 'react-router-dom';
import { WorkoutEditor } from '../components/workouts/WorkoutEditor';

export function WorkoutDetailPage() {
  const { workoutId } = useParams();

  if (!workoutId) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
          Missing workout identifier in route.
        </div>
      </div>
    );
  }

  return <WorkoutEditor workoutId={workoutId} />;
}

