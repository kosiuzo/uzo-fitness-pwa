import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SetLogger } from '../../components/shared/SetLogger';

describe('SetLogger', () => {
  const mockSubmit = vi.fn();

  beforeEach(() => {
    mockSubmit.mockClear();
  });

  it('renders reps and weight inputs', () => {
    render(<SetLogger onSubmit={mockSubmit} />);

    expect(screen.getByLabelText('Reps')).toBeInTheDocument();
    expect(screen.getByLabelText(/Weight/)).toBeInTheDocument();
  });

  it('initializes with target values when provided', () => {
    render(<SetLogger targetReps={10} targetWeight={60} onSubmit={mockSubmit} />);

    expect(screen.getByLabelText('Reps')).toHaveValue(10);
    expect(screen.getByLabelText(/Weight/)).toHaveValue(60);
  });

  it('initializes with last set values when provided', () => {
    const lastSet = { reps: 8, weight: 55 };
    render(<SetLogger lastSet={lastSet} onSubmit={mockSubmit} />);

    expect(screen.getByLabelText('Reps')).toHaveValue(8);
    expect(screen.getByLabelText(/Weight/)).toHaveValue(55);
  });

  it('prioritizes target values over last set', () => {
    const lastSet = { reps: 8, weight: 55 };
    render(<SetLogger targetReps={10} targetWeight={60} lastSet={lastSet} onSubmit={mockSubmit} />);

    expect(screen.getByLabelText('Reps')).toHaveValue(10);
    expect(screen.getByLabelText(/Weight/)).toHaveValue(60);
  });

  it('displays target information when provided', () => {
    render(<SetLogger targetReps={10} targetWeight={60} onSubmit={mockSubmit} />);

    expect(screen.getByText('Target: 10 reps @ 60 kg')).toBeInTheDocument();
  });

  it('updates reps value when input changes', async () => {
    const user = userEvent.setup();
    render(<SetLogger onSubmit={mockSubmit} />);

    const repsInput = screen.getByLabelText('Reps');
    await user.clear(repsInput);
    await user.type(repsInput, '12');

    expect(repsInput).toHaveValue(12);
  });

  it('updates weight value when input changes', async () => {
    const user = userEvent.setup();
    render(<SetLogger onSubmit={mockSubmit} />);

    const weightInput = screen.getByLabelText(/Weight/);
    await user.clear(weightInput);
    await user.type(weightInput, '65.5');

    expect(weightInput).toHaveValue(65.5);
  });

  it('calls onSubmit with correct values when form is submitted', async () => {
    const user = userEvent.setup();
    render(<SetLogger targetReps={10} targetWeight={60} onSubmit={mockSubmit} />);

    const repsInput = screen.getByLabelText('Reps');
    const weightInput = screen.getByLabelText(/Weight/);

    await user.clear(repsInput);
    await user.type(repsInput, '8');
    await user.clear(weightInput);
    await user.type(weightInput, '62.5');

    const logButton = screen.getByRole('button', { name: /Log Set/i });
    await user.click(logButton);

    expect(mockSubmit).toHaveBeenCalledWith(8, 62.5);
  });

  it('does not submit when reps is 0', async () => {
    const user = userEvent.setup();
    render(<SetLogger onSubmit={mockSubmit} />);

    const repsInput = screen.getByLabelText('Reps');
    await user.clear(repsInput);
    await user.type(repsInput, '0');

    const logButton = screen.getByRole('button', { name: /Log Set/i });
    await user.click(logButton);

    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('disables button when reps is 0', () => {
    render(<SetLogger onSubmit={mockSubmit} />);

    const repsInput = screen.getByLabelText('Reps');
    expect(repsInput).toHaveValue(0);

    const logButton = screen.getByRole('button', { name: /Log Set/i });
    expect(logButton).toBeDisabled();
  });

  it('shows loading state when isLoading is true', () => {
    render(<SetLogger onSubmit={mockSubmit} isLoading={true} />);

    expect(screen.getByText('Logging...')).toBeInTheDocument();
    expect(screen.getByLabelText('Reps')).toBeDisabled();
    expect(screen.getByLabelText(/Weight/)).toBeDisabled();
  });

  it('disables inputs and button when isLoading is true', () => {
    render(<SetLogger targetReps={10} targetWeight={60} onSubmit={mockSubmit} isLoading={true} />);

    expect(screen.getByLabelText('Reps')).toBeDisabled();
    expect(screen.getByLabelText(/Weight/)).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('allows zero weight for bodyweight exercises', async () => {
    const user = userEvent.setup();
    render(<SetLogger onSubmit={mockSubmit} />);

    const repsInput = screen.getByLabelText('Reps');
    const weightInput = screen.getByLabelText(/Weight/);

    await user.clear(repsInput);
    await user.type(repsInput, '15');
    await user.clear(weightInput);
    await user.type(weightInput, '0');

    const logButton = screen.getByRole('button', { name: /Log Set/i });
    await user.click(logButton);

    expect(mockSubmit).toHaveBeenCalledWith(15, 0);
  });

  it('updates inputs when target props change', () => {
    const { rerender } = render(<SetLogger targetReps={10} targetWeight={60} onSubmit={mockSubmit} />);

    expect(screen.getByLabelText('Reps')).toHaveValue(10);
    expect(screen.getByLabelText(/Weight/)).toHaveValue(60);

    rerender(<SetLogger targetReps={12} targetWeight={65} onSubmit={mockSubmit} />);

    expect(screen.getByLabelText('Reps')).toHaveValue(12);
    expect(screen.getByLabelText(/Weight/)).toHaveValue(65);
  });
});
