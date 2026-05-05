import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MultiLineChart, SmallMultiples } from './TrendCard';

describe('MultiLineChart', () => {
  it('renders title', () => {
    render(<MultiLineChart title="VP Race" series={[{ label: 'A', color: '#f00', values: [0, 3, 5, 8] }]} />);
    expect(screen.getByText('VP Race')).toBeInTheDocument();
  });

  it('renders an SVG polyline per series', () => {
    const { container } = render(
      <MultiLineChart title="VP Race" series={[
        { label: 'A', color: '#f00', values: [0, 3, 5, 8] },
        { label: 'B', color: '#00f', values: [1, 2, 4, 6] },
      ]} />
    );
    expect(container.querySelectorAll('polyline').length).toBe(2);
  });

  it('renders legend labels', () => {
    render(<MultiLineChart title="T" series={[{ label: 'Barony', color: '#f00', values: [1, 2] }]} />);
    expect(screen.getByText('Barony')).toBeInTheDocument();
  });

  it('omits polyline for series with fewer than 2 values', () => {
    const { container } = render(
      <MultiLineChart title="T" series={[{ label: 'A', color: '#f00', values: [5] }]} />
    );
    expect(container.querySelectorAll('polyline').length).toBe(0);
  });
});

describe('SmallMultiples', () => {
  it('renders one SVG per series', () => {
    const { container } = render(
      <SmallMultiples title="Pace" series={[
        { label: 'Barony', color: '#d00', values: [1, 2, 3] },
        { label: 'Naaz', color: '#00d', values: [2, 2, 4] },
      ]} />
    );
    expect(container.querySelectorAll('svg').length).toBe(2);
  });

  it('shows final value for each series', () => {
    render(<SmallMultiples title="Pace" series={[{ label: 'X', color: '#000', values: [1, 2, 7] }]} />);
    expect(screen.getByText('7.0')).toBeInTheDocument();
  });

  it('shows series label', () => {
    render(<SmallMultiples title="T" series={[{ label: 'Barony', color: '#d00', values: [1, 2, 3] }]} />);
    expect(screen.getByText('Barony')).toBeInTheDocument();
  });
});
