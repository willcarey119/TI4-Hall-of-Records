import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DivergingComparison, MultiEntityComparison } from './ComparisonBlock';

describe('DivergingComparison', () => {
  it('shows both entity labels', () => {
    render(<DivergingComparison entityA={{ label: 'Barony' }} entityB={{ label: 'Yssaril' }} rows={[{ metric: 'Wins', a: 4, b: 2 }]} />);
    expect(screen.getByText('Barony')).toBeInTheDocument();
    expect(screen.getByText('Yssaril')).toBeInTheDocument();
  });

  it('shows metric label', () => {
    render(<DivergingComparison entityA={{ label: 'A' }} entityB={{ label: 'B' }} rows={[{ metric: 'VP Avg', a: 8, b: 7 }]} />);
    expect(screen.getByText('VP Avg')).toBeInTheDocument();
  });

  it('shows both values for a row', () => {
    render(<DivergingComparison entityA={{ label: 'A' }} entityB={{ label: 'B' }} rows={[{ metric: 'Wins', a: 4, b: 2 }]} />);
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders multiple rows', () => {
    render(
      <DivergingComparison
        entityA={{ label: 'A' }}
        entityB={{ label: 'B' }}
        rows={[{ metric: 'Wins', a: 4, b: 2 }, { metric: 'VP Avg', a: 8, b: 7 }]}
      />
    );
    expect(screen.getByText('Wins')).toBeInTheDocument();
    expect(screen.getByText('VP Avg')).toBeInTheDocument();
  });
});

describe('MultiEntityComparison', () => {
  it('renders best value for each metric', () => {
    render(<MultiEntityComparison metrics={['Wins']} entities={[{ label: 'A', values: [4] }, { label: 'B', values: [2] }]} />);
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders all entity column headers', () => {
    render(<MultiEntityComparison metrics={['Wins']} entities={[{ label: 'Barony', values: [4] }, { label: 'Naaz', values: [2] }]} />);
    expect(screen.getByText('Barony')).toBeInTheDocument();
    expect(screen.getByText('Naaz')).toBeInTheDocument();
  });

  it('renders metric label', () => {
    render(<MultiEntityComparison metrics={['Win Rate']} entities={[{ label: 'X', values: [3] }]} />);
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
  });
});
