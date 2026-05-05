import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StackedRowBreakdown, Treemap } from './CategoryBreakdown';

const cats = [
  { label: 'Barony', color: '#d00', value: 4 },
  { label: 'Yssaril', color: '#0a0', value: 2 },
  { label: 'Naaz', color: '#00d', value: 1 },
];

describe('StackedRowBreakdown', () => {
  it('shows title', () => {
    render(<StackedRowBreakdown title="Wins by faction" categories={cats} />);
    expect(screen.getByText('Wins by faction')).toBeInTheDocument();
  });

  it('shows all category labels', () => {
    render(<StackedRowBreakdown title="T" categories={cats} />);
    expect(screen.getByText('Barony')).toBeInTheDocument();
    expect(screen.getByText('Yssaril')).toBeInTheDocument();
    expect(screen.getByText('Naaz')).toBeInTheDocument();
  });

  it('shows category values', () => {
    render(<StackedRowBreakdown title="T" categories={cats} />);
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('handles empty categories gracefully', () => {
    render(<StackedRowBreakdown title="Empty" categories={[]} />);
    expect(screen.getByText('Empty')).toBeInTheDocument();
  });
});

describe('Treemap', () => {
  it('renders all category labels', () => {
    render(<Treemap title="Pick rate" categories={cats} />);
    expect(screen.getByText('Barony')).toBeInTheDocument();
    expect(screen.getByText('Yssaril')).toBeInTheDocument();
  });

  it('shows title', () => {
    render(<Treemap title="Pick rate" categories={cats} />);
    expect(screen.getByText('Pick rate')).toBeInTheDocument();
  });
});
