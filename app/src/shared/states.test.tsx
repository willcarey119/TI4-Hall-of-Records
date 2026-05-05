import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EmptyState } from './EmptyState';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorState } from './ErrorState';

describe('EmptyState', () => {
  it('shows editorial headline', () => {
    render(<EmptyState />);
    expect(screen.getByText(/presses await ink/)).toBeInTheDocument();
  });

  it('shows Vol. 0 kicker', () => {
    render(<EmptyState />);
    expect(screen.getByText('Vol. 0 · No. 0')).toBeInTheDocument();
  });
});

describe('LoadingSkeleton', () => {
  it('renders default 3 rows', () => {
    const { container } = render(<LoadingSkeleton />);
    // 3 row groups — React serialises camelCase to kebab-case in the DOM
    expect(container.querySelectorAll('[style*="margin-bottom: 12px"]').length).toBe(3);
  });

  it('renders custom number of rows', () => {
    const { container } = render(<LoadingSkeleton rows={5} />);
    expect(container.querySelectorAll('[style*="margin-bottom: 12px"]').length).toBe(5);
  });
});

describe('ErrorState', () => {
  it('shows error message', () => {
    render(<ErrorState message="Parse failed" />);
    expect(screen.getByText('Parse failed')).toBeInTheDocument();
  });

  it('shows Stop the press kicker', () => {
    render(<ErrorState message="X" />);
    expect(screen.getByText('Stop the press')).toBeInTheDocument();
  });

  it('shows detail when provided', () => {
    render(<ErrorState message="X" detail="Unexpected token at line 42" />);
    expect(screen.getByText('Unexpected token at line 42')).toBeInTheDocument();
  });

  it('calls onRetry when Retry clicked', () => {
    const fn = vi.fn();
    render(<ErrorState message="X" onRetry={fn} />);
    fireEvent.click(screen.getByText('Retry'));
    expect(fn).toHaveBeenCalled();
  });

  it('does not render Retry button when no onRetry prop', () => {
    render(<ErrorState message="X" />);
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
  });
});
