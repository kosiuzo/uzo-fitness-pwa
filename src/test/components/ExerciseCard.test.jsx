import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExerciseCard } from '../../components/shared/ExerciseCard';

describe('ExerciseCard', () => {
  const mockExercise = {
    id: 'ex-1',
    name: 'Barbell Bench Press',
    groupPosition: 'A1',
    targetSets: 4,
    targetReps: 10,
    targetWeight: 60,
  };

  it('renders exercise name and details', () => {
    render(<ExerciseCard exercise={mockExercise} />);

    expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument();
    expect(screen.getByText('4 × 10 @ 60 kg')).toBeInTheDocument();
  });

  it('displays group position badge', () => {
    render(<ExerciseCard exercise={mockExercise} />);

    expect(screen.getByText('A1')).toBeInTheDocument();
  });

  it('shows placeholder when no targets are set', () => {
    const exerciseWithoutTargets = {
      id: 'ex-2',
      name: 'Push-ups',
    };

    render(<ExerciseCard exercise={exerciseWithoutTargets} />);

    expect(screen.getByText('No target set')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    const handleEdit = vi.fn();

    render(<ExerciseCard exercise={mockExercise} onEdit={handleEdit} />);

    const editButton = screen.getByLabelText('Edit Barbell Bench Press');
    await user.click(editButton);

    expect(handleEdit).toHaveBeenCalledWith(mockExercise);
  });

  it('does not render edit button when onEdit is not provided', () => {
    render(<ExerciseCard exercise={mockExercise} />);

    expect(screen.queryByLabelText(/Edit/)).not.toBeInTheDocument();
  });

  it('handles exercise without weight', () => {
    const exerciseNoWeight = {
      ...mockExercise,
      targetWeight: null,
    };

    render(<ExerciseCard exercise={exerciseNoWeight} />);

    expect(screen.getByText('4 × 10')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ExerciseCard exercise={mockExercise} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
