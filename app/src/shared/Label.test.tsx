import { render, screen } from '@testing-library/react';
import { Label } from './Label';

it('renders children', () => {
  render(<Label>Round</Label>);
  expect(screen.getByText('Round')).toBeInTheDocument();
});

it('uses a span element', () => {
  const { container } = render(<Label>VP</Label>);
  expect(container.querySelector('span')).toBeInTheDocument();
});
