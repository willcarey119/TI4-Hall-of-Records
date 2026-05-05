import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EntityCard } from './EntityCard';

describe('EntityCard', () => {
  it('newsprint variant shows win rate', () => {
    render(<EntityCard variant="newsprint" factionId="Barony" color="#aaa" gamesPlayed={10} wins={4} avgVp={8.2} />);
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText('Barony')).toBeInTheDocument();
  });

  it('tabular variant renders grid row with stats', () => {
    render(<EntityCard variant="tabular" factionId="Yssaril" color="#bbb" gamesPlayed={5} wins={2} avgVp={7.0} />);
    expect(screen.getByText('Yssaril')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('chip variant is compact with avgVp', () => {
    render(<EntityCard variant="chip" factionId="Naaz" color="#ccc" gamesPlayed={3} wins={1} avgVp={6.5} />);
    expect(screen.getByText('Naaz')).toBeInTheDocument();
    expect(screen.getByText('6.5')).toBeInTheDocument();
  });

  it('player variant shows player name', () => {
    render(<EntityCard variant="player" factionId="Barony" color="#aaa" gamesPlayed={5} wins={2} avgVp={8.0} playerName="Tim" />);
    expect(screen.getByText('Tim')).toBeInTheDocument();
    expect(screen.getByText('Player')).toBeInTheDocument();
  });

  it('winner prop applies accent background to chip', () => {
    const { container } = render(<EntityCard variant="chip" factionId="X" color="#f00" gamesPlayed={1} wins={1} avgVp={10} winner />);
    const chip = container.firstChild as HTMLElement;
    expect(chip.style.background).toContain('accent');
  });

  it('handles zero games played without division error', () => {
    render(<EntityCard variant="newsprint" factionId="X" color="#000" gamesPlayed={0} wins={0} avgVp={0} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
