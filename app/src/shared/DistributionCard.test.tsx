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
    render(<HeatmapGrid rowLabels={['Barony', 'Naaz']} colLabels={['R1', 'R2', 'R3']} ranks={[[1, 2, 3], [2, 1, 3]]} />);
    expect(screen.getByText('Barony')).toBeInTheDocument();
    expect(screen.getByText('R2')).toBeInTheDocument();
  });

  it('renders inline rank numbers in cells', () => {
    render(
      <HeatmapGrid rowLabels={['A']} colLabels={['X', 'Y']} ranks={[[1, 2]]} />
    );
    // rank numbers 1 and 2 should appear as visible text in cells
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
  });

  it('renders correct number of colored cells', () => {
    const { container } = render(
      <HeatmapGrid rowLabels={['A', 'B']} colLabels={['X', 'Y', 'Z']} ranks={[[1, 2, 3], [2, 3, 1]]} />
    );
    // 2 rows × 3 cols = 6 data cells + 8 legend swatches = 14 oklch elements
    const cells = container.querySelectorAll('[style*="oklch"]');
    expect(cells.length).toBe(14);
  });

  it('renders all row labels', () => {
    render(<HeatmapGrid rowLabels={['Barony', 'Naaz', 'Sol']} colLabels={['R1']} ranks={[[1], [2], [3]]} />);
    expect(screen.getByText('Barony')).toBeInTheDocument();
    expect(screen.getByText('Naaz')).toBeInTheDocument();
    expect(screen.getByText('Sol')).toBeInTheDocument();
  });
});
