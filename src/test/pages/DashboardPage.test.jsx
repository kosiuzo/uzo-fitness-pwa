import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { DashboardPage } from '../../pages/DashboardPage';
import * as useCycles from '../../hooks/useCycles';

vi.mock('../../hooks/useCycles');

describe('DashboardPage', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = (component) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{component}</BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders dashboard header', () => {
    vi.spyOn(useCycles, 'useActiveCycle').mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    renderWithProviders(<DashboardPage />);

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Welcome back! Ready to train?')).toBeInTheDocument();
  });

  it('shows loading spinner while fetching active cycle', () => {
    vi.spyOn(useCycles, 'useActiveCycle').mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    renderWithProviders(<DashboardPage />);

    // Spinner should be visible (check by aria-label)
    expect(screen.getByLabelText('Loading...')).toBeInTheDocument();
  });

  it('displays active cycle when available', () => {
    const mockCycle = {
      id: 'cycle-1',
      name: 'Summer Strength',
      workoutId: 'workout-1',
      workoutName: 'Push Pull Legs',
      currentWeek: 3,
      durationWeeks: 12,
    };

    vi.spyOn(useCycles, 'useActiveCycle').mockReturnValue({
      data: mockCycle,
      isLoading: false,
      error: null,
    });

    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Summer Strength')).toBeInTheDocument();
    expect(screen.getByText('Push Pull Legs')).toBeInTheDocument();
    expect(screen.getByText('Week 3 of 12')).toBeInTheDocument();
  });

  it('shows no active cycle message when none exists', () => {
    vi.spyOn(useCycles, 'useActiveCycle').mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('No Active Cycle')).toBeInTheDocument();
    expect(
      screen.getByText('Start a new training cycle to track your weekly progress.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Cycle' })).toBeInTheDocument();
  });

  it('displays error message on fetch failure', () => {
    vi.spyOn(useCycles, 'useActiveCycle').mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch cycle'),
    });

    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch cycle')).toBeInTheDocument();
  });

  it('renders quick action buttons', () => {
    vi.spyOn(useCycles, 'useActiveCycle').mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Log Freestyle Workout')).toBeInTheDocument();
    expect(screen.getByText('View Workouts')).toBeInTheDocument();
  });

  it('shows recent sessions placeholder', () => {
    vi.spyOn(useCycles, 'useActiveCycle').mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Recent Sessions')).toBeInTheDocument();
    expect(screen.getByText('No recent sessions to display')).toBeInTheDocument();
  });

  it('renders all sections in correct order', () => {
    vi.spyOn(useCycles, 'useActiveCycle').mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    renderWithProviders(<DashboardPage />);

    const sections = screen.getAllByRole('heading', { level: 2 });
    // When no active cycle, only Quick Actions and Recent Sessions are shown
    expect(sections).toHaveLength(2);
    expect(sections[0]).toHaveTextContent('Quick Actions');
    expect(sections[1]).toHaveTextContent('Recent Sessions');
  });

  it('applies correct styling classes', () => {
    vi.spyOn(useCycles, 'useActiveCycle').mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    const { container } = renderWithProviders(<DashboardPage />);

    // Check for main container classes
    const mainContainer = container.querySelector('.min-h-screen');
    expect(mainContainer).toHaveClass('bg-gray-50');
  });
});
