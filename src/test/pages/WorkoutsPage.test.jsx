/**
 * WorkoutsPage Component Tests
 *
 * Tests for workout library page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WorkoutsPage } from '../../pages/WorkoutsPage';
import * as useWorkoutsHook from '../../hooks/useWorkouts';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('WorkoutsPage', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    mockNavigate.mockClear();
    vi.clearAllMocks();
  });

  const mockWorkouts = [
    {
      id: 'workout-1',
      name: 'Push A',
      groups: [
        { id: 'g1', exercise_count: 3 },
        { id: 'g2', exercise_count: 2 },
      ],
      last_session_date: '2024-10-01T12:00:00Z',
    },
    {
      id: 'workout-2',
      name: 'Pull B',
      groups: [
        { id: 'g3', exercise_count: 4 },
      ],
      last_session_date: null,
    },
  ];

  const renderWorkoutsPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <WorkoutsPage />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders page title', async () => {
    vi.spyOn(useWorkoutsHook, 'useWorkouts').mockReturnValue({
      data: mockWorkouts,
      isLoading: false,
      error: null,
    });

    renderWorkoutsPage();

    expect(screen.getByText(/💪 Workouts/)).toBeInTheDocument();
  });

  it('shows loading spinner while fetching workouts', () => {
    vi.spyOn(useWorkoutsHook, 'useWorkouts').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    renderWorkoutsPage();

    expect(screen.getByLabelText('Loading workouts')).toBeInTheDocument();
  });

  it('displays error message on fetch failure', () => {
    vi.spyOn(useWorkoutsHook, 'useWorkouts').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
    });

    renderWorkoutsPage();

    expect(screen.getByText(/Error Loading Workouts/i)).toBeInTheDocument();
    expect(screen.getByText(/Network error/i)).toBeInTheDocument();
  });

  it('shows empty state when no workouts', () => {
    vi.spyOn(useWorkoutsHook, 'useWorkouts').mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderWorkoutsPage();

    expect(screen.getByText(/No workouts yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Create your first workout or import from JSON/i)).toBeInTheDocument();
  });

  it('renders workout cards when workouts exist', () => {
    vi.spyOn(useWorkoutsHook, 'useWorkouts').mockReturnValue({
      data: mockWorkouts,
      isLoading: false,
      error: null,
    });

    renderWorkoutsPage();

    expect(screen.getByText('Push A')).toBeInTheDocument();
    expect(screen.getByText('Pull B')).toBeInTheDocument();
  });

  it('renders Add Workout button', () => {
    vi.spyOn(useWorkoutsHook, 'useWorkouts').mockReturnValue({
      data: mockWorkouts,
      isLoading: false,
      error: null,
    });

    renderWorkoutsPage();

    expect(screen.getByLabelText('Add new workout')).toBeInTheDocument();
  });

  it('renders Import JSON button', () => {
    vi.spyOn(useWorkoutsHook, 'useWorkouts').mockReturnValue({
      data: mockWorkouts,
      isLoading: false,
      error: null,
    });

    renderWorkoutsPage();

    expect(screen.getByRole('button', { name: /Import JSON/i })).toBeInTheDocument();
  });

  it('renders Manage Exercises button', () => {
    vi.spyOn(useWorkoutsHook, 'useWorkouts').mockReturnValue({
      data: mockWorkouts,
      isLoading: false,
      error: null,
    });

    renderWorkoutsPage();

    expect(screen.getByRole('button', { name: /Manage Exercises/i })).toBeInTheDocument();
  });

  it('navigates to new workout form on Add click', () => {
    vi.spyOn(useWorkoutsHook, 'useWorkouts').mockReturnValue({
      data: mockWorkouts,
      isLoading: false,
      error: null,
    });

    renderWorkoutsPage();

    const addButton = screen.getByLabelText('Add new workout');
    fireEvent.click(addButton);

    expect(mockNavigate).toHaveBeenCalledWith('/workouts/new');
  });

  it('navigates to import page on Import JSON click', () => {
    vi.spyOn(useWorkoutsHook, 'useWorkouts').mockReturnValue({
      data: mockWorkouts,
      isLoading: false,
      error: null,
    });

    renderWorkoutsPage();

    const importButton = screen.getByRole('button', { name: /Import JSON/i });
    fireEvent.click(importButton);

    expect(mockNavigate).toHaveBeenCalledWith('/workouts/import');
  });

  it('navigates to exercises page on Manage Exercises click', () => {
    vi.spyOn(useWorkoutsHook, 'useWorkouts').mockReturnValue({
      data: mockWorkouts,
      isLoading: false,
      error: null,
    });

    renderWorkoutsPage();

    const manageButton = screen.getByRole('button', { name: /Manage Exercises/i });
    fireEvent.click(manageButton);

    expect(mockNavigate).toHaveBeenCalledWith('/exercises');
  });

  it('displays multiple workout cards in list', () => {
    vi.spyOn(useWorkoutsHook, 'useWorkouts').mockReturnValue({
      data: mockWorkouts,
      isLoading: false,
      error: null,
    });

    renderWorkoutsPage();

    const viewButtons = screen.getAllByRole('button', { name: /view/i });
    expect(viewButtons).toHaveLength(2); // One for each workout
  });

  it('shows default error message when error has no message', () => {
    vi.spyOn(useWorkoutsHook, 'useWorkouts').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: {},
    });

    renderWorkoutsPage();

    expect(screen.getByText(/Failed to load workouts. Please try again./i)).toBeInTheDocument();
  });
});
