import { render, screen } from '@testing-library/react';
import { Mast } from './Mast';

it('renders the title as an h1', () => {
  render(<Mast title="Hall of Records" subtitle="TI4 · Archive" />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hall of Records');
});

it('renders the subtitle', () => {
  render(<Mast title="Hall of Records" subtitle="TI4 · Archive" />);
  expect(screen.getByText('TI4 · Archive')).toBeInTheDocument();
});
