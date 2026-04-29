import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RoundDistributionChart } from './RoundDistributionChart';

describe('RoundDistributionChart', () => {
  it('renders an SVG with one bar per round', () => {
    const { container } = render(
      <RoundDistributionChart distribution={{ 2: 3, 4: 1 }} />
    );
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelectorAll('rect')).toHaveLength(2);
  });

  it('renders round labels', () => {
    const { container } = render(
      <RoundDistributionChart distribution={{ 2: 3, 4: 1 }} />
    );
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).toContain('R2');
    expect(texts).toContain('R4');
  });

  it('returns null for empty distribution', () => {
    const { container } = render(<RoundDistributionChart distribution={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders count labels above each bar', () => {
    const { container } = render(
      <RoundDistributionChart distribution={{ 1: 2, 3: 5 }} />
    );
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).toContain('2');
    expect(texts).toContain('5');
  });

  it('scales bar heights proportionally', () => {
    const { container } = render(
      <RoundDistributionChart distribution={{ 1: 4, 2: 2 }} />
    );
    const rects = Array.from(container.querySelectorAll('rect'));
    expect(rects).toHaveLength(2);
    const heights = rects.map(r => parseFloat(r.getAttribute('height') || '0'));
    expect(heights[0]).toBeGreaterThan(heights[1]);
  });

  it('uses custom label when provided', () => {
    const { container } = render(
      <RoundDistributionChart distribution={{ 1: 1 }} label="Vote count per round" />
    );
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });
});
