import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QuickActionButtons } from '../../components/dashboard/QuickActionButtons';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('QuickActionButtons', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const renderWithRouter = (component) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it('renders both action buttons', () => {
    renderWithRouter(<QuickActionButtons />);

    expect(screen.getByText('Log Freestyle Workout')).toBeInTheDocument();
    expect(screen.getByText('View Workouts')).toBeInTheDocument();
  });

  it('navigates to freestyle session when log freestyle is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<QuickActionButtons />);

    const freestyleButton = screen.getByRole('button', { name: /Log Freestyle Workout/i });
    await user.click(freestyleButton);

    expect(mockNavigate).toHaveBeenCalledWith('/sessions/new');
  });

  it('navigates to workouts page when view workouts is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<QuickActionButtons />);

    const workoutsButton = screen.getByRole('button', { name: /View Workouts/i });
    await user.click(workoutsButton);

    expect(mockNavigate).toHaveBeenCalledWith('/workouts');
  });

  it('renders buttons in a grid layout', () => {
    const { container } = renderWithRouter(<QuickActionButtons />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-2');
  });

  it('displays icons for both buttons', () => {
    const { container } = renderWithRouter(<QuickActionButtons />);

    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(2);
  });
});
