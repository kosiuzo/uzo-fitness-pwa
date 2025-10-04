/**
 * WorkoutCard Component Tests
 *
 * Tests for workout card display and interactions
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { WorkoutCard } from '../../../components/workouts/WorkoutCard';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('WorkoutCard', () => {
  const mockWorkout = {
    id: 'workout-1',
    name: 'Push A',
    groups: [
      {
        id: 'group-1',
        exercise_count: 3,
        items: [{ id: 'item-1' }, { id: 'item-2' }, { id: 'item-3' }],
      },
      {
        id: 'group-2',
        exercise_count: 2,
        items: [{ id: 'item-4' }, { id: 'item-5' }],
      },
    ],
    last_session_date: '2024-10-01T12:00:00Z',
  };

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders workout name', () => {
    render(
      <BrowserRouter>
        <WorkoutCard workout={mockWorkout} />
      </BrowserRouter>
    );

    expect(screen.getByText('Push A')).toBeInTheDocument();
  });

  it('displays correct group count (singular)', () => {
    const singleGroupWorkout = {
      ...mockWorkout,
      groups: [mockWorkout.groups[0]],
    };

    render(
      <BrowserRouter>
        <WorkoutCard workout={singleGroupWorkout} />
      </BrowserRouter>
    );

    expect(screen.getByText(/1 group/)).toBeInTheDocument();
  });

  it('displays correct group count (plural)', () => {
    render(
      <BrowserRouter>
        <WorkoutCard workout={mockWorkout} />
      </BrowserRouter>
    );

    expect(screen.getByText(/2 groups/)).toBeInTheDocument();
  });

  it('calculates and displays total exercise count', () => {
    render(
      <BrowserRouter>
        <WorkoutCard workout={mockWorkout} />
      </BrowserRouter>
    );

    // 3 + 2 = 5 exercises total
    expect(screen.getByText(/5 ex/)).toBeInTheDocument();
  });

  it('formats recent date as relative (days ago)', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const workout = {
      ...mockWorkout,
      last_session_date: yesterday.toISOString(),
    };

    render(
      <BrowserRouter>
        <WorkoutCard workout={workout} />
      </BrowserRouter>
    );

    expect(screen.getByText(/Last: Yesterday/)).toBeInTheDocument();
  });

  it('formats today as "Today"', () => {
    const today = new Date().toISOString();

    const workout = {
      ...mockWorkout,
      last_session_date: today,
    };

    render(
      <BrowserRouter>
        <WorkoutCard workout={workout} />
      </BrowserRouter>
    );

    expect(screen.getByText(/Last: Today/)).toBeInTheDocument();
  });

  it('shows "Never" when no last session date', () => {
    const workout = {
      ...mockWorkout,
      last_session_date: null,
    };

    render(
      <BrowserRouter>
        <WorkoutCard workout={workout} />
      </BrowserRouter>
    );

    expect(screen.getByText(/Last: Never/)).toBeInTheDocument();
  });

  it('renders View button', () => {
    render(
      <BrowserRouter>
        <WorkoutCard workout={mockWorkout} />
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument();
  });

  it('renders Cycle button', () => {
    render(
      <BrowserRouter>
        <WorkoutCard workout={mockWorkout} />
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: /cycle/i })).toBeInTheDocument();
  });

  it('navigates to workout detail on View click', () => {
    render(
      <BrowserRouter>
        <WorkoutCard workout={mockWorkout} />
      </BrowserRouter>
    );

    const viewButton = screen.getByRole('button', { name: /view/i });
    fireEvent.click(viewButton);

    expect(mockNavigate).toHaveBeenCalledWith('/workouts/workout-1');
  });

  it('navigates to cycle creation on Cycle click', () => {
    render(
      <BrowserRouter>
        <WorkoutCard workout={mockWorkout} />
      </BrowserRouter>
    );

    const cycleButton = screen.getByRole('button', { name: /cycle/i });
    fireEvent.click(cycleButton);

    expect(mockNavigate).toHaveBeenCalledWith('/cycles/new?workoutId=workout-1');
  });

  it('handles workout with exercise_count property', () => {
    const workout = {
      ...mockWorkout,
      groups: [
        {
          id: 'group-1',
          exercise_count: 4,
        },
      ],
    };

    render(
      <BrowserRouter>
        <WorkoutCard workout={workout} />
      </BrowserRouter>
    );

    expect(screen.getByText(/4 ex/)).toBeInTheDocument();
  });

  it('handles workout with items array', () => {
    const workout = {
      ...mockWorkout,
      groups: [
        {
          id: 'group-1',
          items: [{ id: '1' }, { id: '2' }, { id: '3' }],
        },
      ],
    };

    render(
      <BrowserRouter>
        <WorkoutCard workout={workout} />
      </BrowserRouter>
    );

    expect(screen.getByText(/3 ex/)).toBeInTheDocument();
  });

  it('formats old dates with month abbreviation', () => {
    // Create a date from 60 days ago
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 60);

    const workout = {
      ...mockWorkout,
      last_session_date: oldDate.toISOString(),
    };

    render(
      <BrowserRouter>
        <WorkoutCard workout={workout} />
      </BrowserRouter>
    );

    // Should show format like "Oct 3" or similar
    const lastText = screen.getByText(/Last:/);
    expect(lastText).toBeInTheDocument();
    // Check that it's not showing relative format
    expect(lastText.textContent).not.toMatch(/ago/);
  });
});
