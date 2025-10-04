import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { WorkoutEditor } from '../../../components/workouts/WorkoutEditor';

const mockUseWorkoutDetail = vi.fn();
const mockAddGroupMutate = vi.fn();
const mockAddItemMutate = vi.fn();
const mockReorderGroups = vi.fn();
const mockReorderItems = vi.fn();
const mockStartSessionMutate = vi.fn();
const mockUseExercises = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../../hooks/useWorkouts', () => ({
  useWorkoutDetail: (...args) => mockUseWorkoutDetail(...args),
  useReorderWorkoutGroups: () => ({ mutate: mockReorderGroups }),
  useReorderWorkoutItems: () => ({ mutate: mockReorderItems }),
  useAddWorkoutGroup: () => ({ mutate: mockAddGroupMutate, isPending: false }),
  useAddWorkoutItem: () => ({ mutate: mockAddItemMutate, isPending: false }),
}));

vi.mock('../../../hooks/useExercises', () => ({
  useExercises: (...args) => mockUseExercises(...args),
}));

vi.mock('../../../hooks/useSessions', () => ({
  useStartSession: () => ({ mutate: mockStartSessionMutate, isPending: false }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const baseWorkout = {
  id: 'workout-1',
  name: 'Push A',
  description: 'Upper body focus',
  groups: [
    {
      id: 'group-1',
      name: 'Group A',
      position: 1,
      groupType: 'superset',
      restSeconds: 120,
      items: [
        {
          id: 'item-1',
          exerciseId: 'exercise-1',
          exerciseName: 'Flat DB Press',
          groupPosition: 'A1',
          position: 1,
          targetSets: 4,
          targetReps: 8,
          targetWeight: 30,
          restSeconds: 90,
          notes: null,
        },
      ],
    },
  ],
};

describe('WorkoutEditor', () => {
  beforeEach(() => {
    mockUseWorkoutDetail.mockReset();
    mockUseWorkoutDetail.mockReturnValue({
      data: baseWorkout,
      isLoading: false,
      error: null,
    });
    mockUseExercises.mockReset();
    mockUseExercises.mockReturnValue({
      data: [
        { id: 'exercise-1', name: 'Flat DB Press' },
        { id: 'exercise-2', name: 'Cable Row' },
      ],
      isLoading: false,
    });
    mockAddGroupMutate.mockReset();
    mockAddItemMutate.mockReset();
    mockReorderGroups.mockReset();
    mockReorderItems.mockReset();
    mockStartSessionMutate.mockReset();
    mockNavigate.mockReset();
  });

  const renderEditor = () =>
    render(
      <BrowserRouter>
        <WorkoutEditor workoutId="workout-1" />
      </BrowserRouter>
    );

  it('shows workout details with groups and exercises', () => {
    renderEditor();

    expect(screen.getByText('Push A')).toBeInTheDocument();
    expect(screen.getByText(/Group A/)).toBeInTheDocument();
    expect(screen.getByText(/Flat DB Press/)).toBeInTheDocument();
  });

  it('submits add group form', () => {
    renderEditor();

    fireEvent.click(screen.getByRole('button', { name: '+ Add Group' }));

    fireEvent.change(screen.getByLabelText(/Group name/i), {
      target: { value: 'Group B' },
    });
    fireEvent.change(screen.getByLabelText(/Group type/i), {
      target: { value: 'triset' },
    });
    fireEvent.change(screen.getByLabelText(/^Rest seconds$/i), {
      target: { value: '90' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add Group' }));

    expect(mockAddGroupMutate).toHaveBeenCalledWith(
      {
        p_workout_id: 'workout-1',
        p_name: 'Group B',
        p_group_type: 'triset',
        p_rest_seconds: 90,
      },
      expect.any(Object)
    );
  });

  it('submits add exercise form for first group', () => {
    renderEditor();

    fireEvent.click(screen.getByRole('button', { name: '+ Add Exercise' }));

    const exerciseSelect = screen
      .getAllByLabelText(/Exercise/i)
      .find((element) => element.tagName === 'SELECT');

    expect(exerciseSelect).toBeTruthy();

    fireEvent.change(exerciseSelect, {
      target: { value: 'exercise-2' },
    });
    fireEvent.change(screen.getByLabelText(/^Target sets$/i), {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByLabelText(/^Target reps$/i), {
      target: { value: '12' },
    });
    fireEvent.change(screen.getByLabelText(/Target weight \(optional\)/i), {
      target: { value: '25' },
    });
    fireEvent.change(screen.getByLabelText(/Rest seconds \(optional\)/i), {
      target: { value: '60' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add Exercise' }));

    expect(mockAddItemMutate).toHaveBeenCalledWith(
      {
        workoutId: 'workout-1',
        p_workout_group_id: 'group-1',
        p_exercise_id: 'exercise-2',
        p_target_sets: 3,
        p_target_reps: 12,
        p_target_weight: 25,
        p_rest_seconds: 60,
      },
      expect.any(Object)
    );
  });

  it('triggers start session mutation', () => {
    renderEditor();

    fireEvent.click(screen.getByRole('button', { name: 'Start Session' }));

    expect(mockStartSessionMutate).toHaveBeenCalledWith(
      { p_workout_id: 'workout-1' },
      expect.any(Object)
    );
  });

  it('navigates to cycle creation from start cycle button', () => {
    renderEditor();

    fireEvent.click(screen.getByRole('button', { name: 'Start Cycle' }));

    expect(mockNavigate).toHaveBeenCalledWith('/cycles/new?workoutId=workout-1');
  });
});
