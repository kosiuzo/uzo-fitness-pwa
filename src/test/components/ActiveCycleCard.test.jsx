import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ActiveCycleCard } from '../../components/dashboard/ActiveCycleCard';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ActiveCycleCard', () => {
  const mockCycle = {
    id: 'cycle-1',
    name: 'Summer Strength',
    workoutId: 'workout-1',
    workoutName: 'Push Pull Legs',
    currentWeek: 3,
    durationWeeks: 12,
  };

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const renderWithRouter = (component) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it('renders cycle information correctly', () => {
    renderWithRouter(<ActiveCycleCard cycle={mockCycle} />);

    expect(screen.getByText('Summer Strength')).toBeInTheDocument();
    expect(screen.getByText('Push Pull Legs')).toBeInTheDocument();
    expect(screen.getByText('Week 3 of 12')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('displays correct progress percentage', () => {
    renderWithRouter(<ActiveCycleCard cycle={mockCycle} />);

    // 3/12 = 25%
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('shows progress bar with correct width', () => {
    const { container } = renderWithRouter(<ActiveCycleCard cycle={mockCycle} />);

    const progressBar = container.querySelector('.bg-blue-600');
    expect(progressBar).toHaveStyle({ width: '25%' });
  });

  it('navigates to session creation when button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ActiveCycleCard cycle={mockCycle} />);

    const button = screen.getByRole('button', { name: /Start Today's Session/i });
    await user.click(button);

    expect(mockNavigate).toHaveBeenCalledWith(
      '/sessions/new?workoutId=workout-1&cycleId=cycle-1'
    );
  });

  it('renders start session button', () => {
    renderWithRouter(<ActiveCycleCard cycle={mockCycle} />);

    const button = screen.getByRole('button', { name: /Start Today's Session/i });
    expect(button).toBeInTheDocument();
  });

  it('displays 100% progress when on final week', () => {
    const finalWeekCycle = {
      ...mockCycle,
      currentWeek: 12,
    };

    renderWithRouter(<ActiveCycleCard cycle={finalWeekCycle} />);

    expect(screen.getByText('Week 12 of 12')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('displays correct progress for first week', () => {
    const firstWeekCycle = {
      ...mockCycle,
      currentWeek: 1,
      durationWeeks: 8,
    };

    renderWithRouter(<ActiveCycleCard cycle={firstWeekCycle} />);

    expect(screen.getByText('Week 1 of 8')).toBeInTheDocument();
    // 1/8 = 12.5% -> Math.round = 13%
    expect(screen.getByText('13%')).toBeInTheDocument();
  });

  it('handles mid-cycle progress correctly', () => {
    const midCycleCycle = {
      ...mockCycle,
      currentWeek: 6,
      durationWeeks: 10,
    };

    renderWithRouter(<ActiveCycleCard cycle={midCycleCycle} />);

    expect(screen.getByText('Week 6 of 10')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });
});
