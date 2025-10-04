import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkoutGroupCard } from '../../components/shared/WorkoutGroupCard';

describe('WorkoutGroupCard', () => {
  const mockGroup = {
    id: 'group-1',
    name: 'Group A',
    groupType: 'superset',
    restSeconds: 120,
    items: [
      {
        id: 'item-1',
        exerciseName: 'Flat Bench Press',
        groupPosition: 'A1',
        targetSets: 4,
        targetReps: 8,
        targetWeight: 30,
      },
      {
        id: 'item-2',
        exerciseName: 'Cable Row',
        groupPosition: 'A2',
        targetSets: 4,
        targetReps: 10,
        targetWeight: 50,
      },
    ],
  };

  it('renders group name and type badge', () => {
    render(<WorkoutGroupCard group={mockGroup} />);

    expect(screen.getByText('Group A')).toBeInTheDocument();
    expect(screen.getByText('Superset')).toBeInTheDocument();
  });

  it('displays rest time in MM:SS format', () => {
    render(<WorkoutGroupCard group={mockGroup} />);

    expect(screen.getByText(/Rest: 2:00/)).toBeInTheDocument();
  });

  it('renders all exercises in the group', () => {
    render(<WorkoutGroupCard group={mockGroup} />);

    expect(screen.getByText('Flat Bench Press')).toBeInTheDocument();
    expect(screen.getByText('Cable Row')).toBeInTheDocument();
  });

  it('toggles expanded/collapsed state when clicked', async () => {
    const user = userEvent.setup();
    render(<WorkoutGroupCard group={mockGroup} />);

    // Initially expanded
    expect(screen.getByText('Flat Bench Press')).toBeInTheDocument();

    // Click to collapse
    const collapseButton = screen.getByLabelText('Collapse group');
    await user.click(collapseButton);

    // Exercises should not be visible
    expect(screen.queryByText('Flat Bench Press')).not.toBeInTheDocument();

    // Click to expand again
    const expandButton = screen.getByLabelText('Expand group');
    await user.click(expandButton);

    // Exercises should be visible again
    expect(screen.getByText('Flat Bench Press')).toBeInTheDocument();
  });

  it('shows empty state when no exercises', () => {
    const emptyGroup = {
      ...mockGroup,
      items: [],
    };

    render(<WorkoutGroupCard group={emptyGroup} />);

    expect(screen.getByText('No exercises added')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    const handleEdit = vi.fn();

    render(<WorkoutGroupCard group={mockGroup} onEdit={handleEdit} />);

    const editButton = screen.getByLabelText('Edit group');
    await user.click(editButton);

    expect(handleEdit).toHaveBeenCalledWith(mockGroup);
  });

  it('renders reorder handles when onExerciseReorder is provided', () => {
    const handleReorder = vi.fn();

    render(<WorkoutGroupCard group={mockGroup} onExerciseReorder={handleReorder} />);

    const reorderButtons = screen.getAllByLabelText('Reorder exercise');
    expect(reorderButtons).toHaveLength(2);
  });

  it('does not render reorder handles when onExerciseReorder is not provided', () => {
    render(<WorkoutGroupCard group={mockGroup} />);

    expect(screen.queryByLabelText('Reorder exercise')).not.toBeInTheDocument();
  });

  it('displays correct badge color for group type', () => {
    const { rerender } = render(<WorkoutGroupCard group={mockGroup} />);

    const supersetBadge = screen.getByText('Superset');
    expect(supersetBadge).toHaveClass('bg-blue-100', 'text-blue-700');

    // Test triset
    rerender(<WorkoutGroupCard group={{ ...mockGroup, groupType: 'triset' }} />);
    const trisetBadge = screen.getByText('Triset');
    expect(trisetBadge).toHaveClass('bg-purple-100', 'text-purple-700');

    // Test circuit
    rerender(<WorkoutGroupCard group={{ ...mockGroup, groupType: 'circuit' }} />);
    const circuitBadge = screen.getByText('Circuit');
    expect(circuitBadge).toHaveClass('bg-green-100', 'text-green-700');
  });
});
