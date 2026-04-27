import { render, screen } from '@testing-library/react';
import { Kicker } from './Kicker';

it('renders the kicker text', () => {
  render(<Kicker text="VP Race" />);
  expect(screen.getByText('VP Race')).toBeInTheDocument();
});

it('renders headline children when provided', () => {
  render(<Kicker text="Nov 15, 2023">Sol Seizes the Throne</Kicker>);
  expect(screen.getByText('Sol Seizes the Throne')).toBeInTheDocument();
});

it('renders without children', () => {
  const { container } = render(<Kicker text="Label only" />);
  // Only the label span — no headline div
  expect(container.querySelectorAll('div').length).toBe(1); // outer wrapper only
});
