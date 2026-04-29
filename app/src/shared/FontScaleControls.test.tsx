import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FontScaleControls } from './FontScaleControls';

vi.mock('./useFontScale', () => ({
  useFontScale: vi.fn(),
}));

import { useFontScale } from './useFontScale';
const mockUseFontScale = vi.mocked(useFontScale);

function makeHook(overrides: Partial<ReturnType<typeof useFontScale>> = {}): ReturnType<typeof useFontScale> {
  return {
    scale: 1.0,
    atMin: false,
    atMax: false,
    up: vi.fn(),
    down: vi.fn(),
    ...overrides,
  };
}

describe('FontScaleControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFontScale.mockReturnValue(makeHook());
  });

  it('renders both A– and A+ buttons', () => {
    render(<FontScaleControls />);
    expect(screen.getByRole('button', { name: 'A–' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'A+' })).toBeInTheDocument();
  });

  it('disables the down button when atMin is true', () => {
    mockUseFontScale.mockReturnValue(makeHook({ atMin: true }));
    render(<FontScaleControls />);
    expect(screen.getByRole('button', { name: 'A–' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'A+' })).not.toBeDisabled();
  });

  it('disables the up button when atMax is true', () => {
    mockUseFontScale.mockReturnValue(makeHook({ atMax: true }));
    render(<FontScaleControls />);
    expect(screen.getByRole('button', { name: 'A+' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'A–' })).not.toBeDisabled();
  });

  it('calls up() when A+ is clicked', async () => {
    const up = vi.fn();
    mockUseFontScale.mockReturnValue(makeHook({ up }));
    render(<FontScaleControls />);
    await userEvent.click(screen.getByRole('button', { name: 'A+' }));
    expect(up).toHaveBeenCalledTimes(1);
  });

  it('calls down() when A– is clicked', async () => {
    const down = vi.fn();
    mockUseFontScale.mockReturnValue(makeHook({ down }));
    render(<FontScaleControls />);
    await userEvent.click(screen.getByRole('button', { name: 'A–' }));
    expect(down).toHaveBeenCalledTimes(1);
  });
});
