import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BarHistogram, HeatmapGrid } from './DistributionCard';

describe('BarHistogram', () => {
  it('shows label', () => {
    render(<BarHistogram label="VP Distribution" buckets={[{ label: '6', count: 2 }, { label: '8', count: 4 }, { label: '10', count: 3 }]} medianIdx={1} />);
    expect(screen.getByText('VP Distribution')).toBeInTheDocument();
  });

  it('renders bucket labels', () => {
    render(<BarHistogram label="L" buckets={[{ label: '6', count: 2 }, { label: '10', count: 3 }]} />);
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders correct number of bucket bars', () => {
    const { container } = render(
      <BarHistogram label="L" buckets={[{ label: '6', count: 2 }, { label: '8', count: 4 }, { label: '10', count: 3 }]} />
    );
    // Each bucket has an outer flex div and an inner bar div — count the outer ones
    // The label row also has divs, so check for bucket label texts instead
    expect(screen.getAllByText(/^(6|8|10)$/).length).toBe(3);
    // suppress unused container warning
    expect(container).toBeDefined();
  });
});

describe('HeatmapGrid', () => {
  it('renders row and column labels', () => {
    render(<HeatmapGrid rowLabels={['Barony', 'Naaz']} colLabels={['R1', 'R2', 'R3']} values={[[0.1, 0.5, 0.9], [0.3, 0.7, 0.2]]} />);
    expect(screen.getByText('Barony')).toBeInTheDocument();
    expect(screen.getByText('R2')).toBeInTheDocument();
  });

  it('renders correct number of heatmap cells', () => {
    const { container } = render(
      <HeatmapGrid rowLabels={['A', 'B']} colLabels={['X', 'Y', 'Z']} values={[[0.1, 0.5, 0.9], [0.3, 0.7, 0.2]]} />
    );
    // 2 rows × 3 cols = 6 data cells + 8 legend gradient steps = 14 oklch elements
    const cells = container.querySelectorAll('[style*="oklch"]');
    expect(cells.length).toBe(14);
  });

  it('renders all row labels', () => {
    render(<HeatmapGrid rowLabels={['Barony', 'Naaz', 'Sol']} colLabels={['R1']} values={[[0.5], [0.3], [0.9]]} />);
    expect(screen.getByText('Barony')).toBeInTheDocument();
    expect(screen.getByText('Naaz')).toBeInTheDocument();
    expect(screen.getByText('Sol')).toBeInTheDocument();
  });
});
