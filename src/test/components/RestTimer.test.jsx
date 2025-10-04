import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { RestTimer } from '../../components/shared/RestTimer';

describe('RestTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders with initial time', () => {
    render(<RestTimer seconds={90} />);

    expect(screen.getByText('01:30')).toBeInTheDocument();
    expect(screen.getByText('Rest Timer')).toBeInTheDocument();
  });

  it('displays time in MM:SS format', () => {
    render(<RestTimer seconds={125} />);

    expect(screen.getByText('02:05')).toBeInTheDocument();
  });

  it('shows paused state initially when autoStart is false', () => {
    render(<RestTimer seconds={90} autoStart={false} />);

    expect(screen.getByText('Paused')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start/i })).toBeInTheDocument();
  });

  it('starts automatically when autoStart is true', () => {
    render(<RestTimer seconds={90} autoStart={true} />);

    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument();
  });

  it('starts countdown when start button is clicked', () => {
    render(<RestTimer seconds={10} />);

    const startButton = screen.getByRole('button', { name: /Start/i });
    fireEvent.click(startButton);

    expect(screen.getByText('Running')).toBeInTheDocument();

    // Advance timer by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('00:09')).toBeInTheDocument();
  });

  it('pauses countdown when pause button is clicked', () => {
    render(<RestTimer seconds={10} autoStart={true} />);

    // Advance by 3 seconds
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText('00:07')).toBeInTheDocument();

    const pauseButton = screen.getByRole('button', { name: /Pause/i });
    fireEvent.click(pauseButton);

    expect(screen.getByText('Paused')).toBeInTheDocument();

    // Advance timer - should not change because paused
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText('00:07')).toBeInTheDocument();
  });

  it('resets timer to initial value when reset button is clicked', () => {
    render(<RestTimer seconds={90} autoStart={true} />);

    // Advance timer by 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(screen.getByText('01:00')).toBeInTheDocument();

    const resetButton = screen.getByLabelText('Reset timer');
    fireEvent.click(resetButton);

    expect(screen.getByText('01:30')).toBeInTheDocument();
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('calls onComplete when timer reaches zero', () => {
    const handleComplete = vi.fn();
    render(<RestTimer seconds={3} autoStart={true} onComplete={handleComplete} />);

    // Advance timer to completion
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText('00:00')).toBeInTheDocument();
    expect(screen.getByText("Time's up!")).toBeInTheDocument();
    expect(handleComplete).toHaveBeenCalledTimes(1);
  });

  it('stops timer automatically when reaching zero', () => {
    render(<RestTimer seconds={2} autoStart={true} />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('00:00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start/i })).toBeInTheDocument();

    // Advancing further should not change time
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText('00:00')).toBeInTheDocument();
  });

  it('calls onSkip and sets time to zero when skip button is clicked', () => {
    const handleSkip = vi.fn();
    render(<RestTimer seconds={90} onSkip={handleSkip} />);

    const skipButton = screen.getByRole('button', { name: /Skip Rest/i });
    fireEvent.click(skipButton);

    expect(screen.getByText('00:00')).toBeInTheDocument();
    expect(handleSkip).toHaveBeenCalledTimes(1);
  });

  it('does not render skip button when onSkip is not provided', () => {
    render(<RestTimer seconds={90} />);

    expect(screen.queryByRole('button', { name: /Skip Rest/i })).not.toBeInTheDocument();
  });

  it('hides skip button when timer is at zero', () => {
    render(<RestTimer seconds={2} autoStart={true} onSkip={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Skip Rest/i })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByRole('button', { name: /Skip Rest/i })).not.toBeInTheDocument();
  });

  it('disables start/pause button when timer is at zero', () => {
    render(<RestTimer seconds={0} />);

    const startButton = screen.getByRole('button', { name: /Start/i });
    expect(startButton).toBeDisabled();
  });

  it('resumes from paused time when start is clicked again', () => {
    render(<RestTimer seconds={10} autoStart={true} />);

    // Run for 3 seconds
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText('00:07')).toBeInTheDocument();

    // Pause
    const pauseButton = screen.getByRole('button', { name: /Pause/i });
    fireEvent.click(pauseButton);

    // Resume
    const startButton = screen.getByRole('button', { name: /Start/i });
    fireEvent.click(startButton);

    // Run for 2 more seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('00:05')).toBeInTheDocument();
  });

  it('formats single digit minutes and seconds with leading zeros', () => {
    render(<RestTimer seconds={65} />);

    expect(screen.getByText('01:05')).toBeInTheDocument();
  });

  it('handles large time values correctly', () => {
    render(<RestTimer seconds={3599} />); // 59:59

    expect(screen.getByText('59:59')).toBeInTheDocument();
  });
});
