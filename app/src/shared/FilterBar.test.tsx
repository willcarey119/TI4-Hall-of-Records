import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterBar } from './FilterBar';

describe('FilterBar', () => {
  it('renders segment buttons', () => {
    render(<FilterBar segments={[{ label: 'Table', value: 'table' }, { label: 'Cards', value: 'cards' }]} activeSegment="table" />);
    expect(screen.getByText('Table')).toBeInTheDocument();
    expect(screen.getByText('Cards')).toBeInTheDocument();
  });

  it('calls onSegmentChange when a segment is clicked', () => {
    const handler = vi.fn();
    render(<FilterBar segments={[{ label: 'Table', value: 'table' }, { label: 'Cards', value: 'cards' }]} activeSegment="table" onSegmentChange={handler} />);
    fireEvent.click(screen.getByText('Cards'));
    expect(handler).toHaveBeenCalledWith('cards');
  });

  it('active segment has different background', () => {
    const { container } = render(<FilterBar segments={[{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }]} activeSegment="a" />);
    const buttons = container.querySelectorAll('button');
    expect(buttons[0].style.background).toContain('ink');
    expect(buttons[1].style.background).toBe('transparent');
  });

  it('renders dropdown label and options', () => {
    render(<FilterBar dropdownLabel="Season" dropdownOptions={[{ label: 'All', value: 'all' }]} dropdownValue="all" />);
    expect(screen.getByText('Season')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('calls onDropdownChange when dropdown changes', () => {
    const handler = vi.fn();
    render(<FilterBar dropdownLabel="S" dropdownOptions={[{ label: 'All', value: 'all' }, { label: '2025', value: '2025' }]} dropdownValue="all" onDropdownChange={handler} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '2025' } });
    expect(handler).toHaveBeenCalledWith('2025');
  });

  it('renders nothing when no segments or dropdown', () => {
    const { container } = render(<FilterBar />);
    const filterBar = container.firstChild as HTMLElement;
    expect(filterBar.children.length).toBe(0);
  });
});
