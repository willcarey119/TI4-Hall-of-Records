import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LeaderboardPodium } from './LeaderboardPodium';

const top3 = [
  { factionId: 'Barony', color: '#d00', wins: 4, gamesPlayed: 7, avgVp: 9.1 },
  { factionId: 'Yssaril', color: '#0a0', wins: 3, gamesPlayed: 7, avgVp: 8.5 },
  { factionId: 'Naaz', color: '#00d', wins: 2, gamesPlayed: 7, avgVp: 7.8 },
];

describe('LeaderboardPodium', () => {
  it('renders 1st 2nd 3rd labels left to right', () => {
    render(<LeaderboardPodium top3={top3} />);
    const labels = ['1st', '2nd', '3rd'];
    labels.forEach(l => expect(screen.getByText(l)).toBeInTheDocument());
  });

  it('first place shows accent win rate (4/7 = 57%)', () => {
    render(<LeaderboardPodium top3={top3} />);
    // 4/7 = 57%, 3/7 = 43%, 2/7 = 29%
    expect(screen.getByText('57%')).toBeInTheDocument();
  });

  it('renders all three faction names', () => {
    render(<LeaderboardPodium top3={top3} />);
    expect(screen.getByText('Barony')).toBeInTheDocument();
    expect(screen.getByText('Yssaril')).toBeInTheDocument();
    expect(screen.getByText('Naaz')).toBeInTheDocument();
  });

  it('handles tie (0 wins, 0 games) gracefully', () => {
    const zero = [
      { factionId: 'A', color: '#000', wins: 0, gamesPlayed: 0, avgVp: 0 },
      { factionId: 'B', color: '#111', wins: 0, gamesPlayed: 0, avgVp: 0 },
      { factionId: 'C', color: '#222', wins: 0, gamesPlayed: 0, avgVp: 0 },
    ];
    render(<LeaderboardPodium top3={zero} />);
    expect(screen.getAllByText('0%').length).toBe(3);
  });
});
