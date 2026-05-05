import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatCard } from './StatCard';

describe('StatCard', () => {
  it('anchor variant shows label and value', () => {
    render(<StatCard variant="anchor" label="Total Games" value={7} />);
    expect(screen.getByText('Total Games')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('delta variant shows up arrow for positive delta', () => {
    render(<StatCard variant="delta" label="Avg VP" value={9.2} delta={0.4} />);
    expect(screen.getByText(/↑0\.4/)).toBeInTheDocument();
  });

  it('delta variant shows down arrow for negative delta', () => {
    render(<StatCard variant="delta" label="Avg VP" value={8.0} delta={-1.2} />);
    expect(screen.getByText(/↓1\.2/)).toBeInTheDocument();
  });

  it('rank variant shows rank number and percentile', () => {
    render(<StatCard variant="rank" label="Speaker wins" value="" rank={1} percentile={92} />);
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('92th percentile')).toBeInTheDocument();
  });

  it('hero variant shows label in accent color and footnote', () => {
    render(<StatCard variant="hero" label="Most wins" value={5} caption="Barony" footnote="Out of 7 games" />);
    expect(screen.getByText('Most wins')).toBeInTheDocument();
    expect(screen.getByText('Out of 7 games')).toBeInTheDocument();
  });

  it('rate variant shows percentage', () => {
    render(<StatCard variant="rate" label="Speaker wins" value="" numerator={3} denominator={7} />);
    expect(screen.getByText('43%')).toBeInTheDocument();
  });

  it('stack variant renders all stack items', () => {
    render(<StatCard variant="stack" label="Outcomes" value="" stack={[{ label: 'Wins', value: 4 }, { label: 'Losses', value: 3 }]} />);
    expect(screen.getByText('Wins')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Losses')).toBeInTheDocument();
  });

  it('quote variant shows italic value', () => {
    render(<StatCard variant="quote" label="Award" value="Most tactical" caption="5 games" />);
    expect(screen.getByText('Most tactical')).toBeInTheDocument();
    expect(screen.getByText('5 games')).toBeInTheDocument();
  });
});
