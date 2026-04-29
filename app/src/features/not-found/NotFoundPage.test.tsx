import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { NotFoundPage } from './NotFoundPage';

it('renders the 404 heading and message', () => {
  render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>
  );
  expect(screen.getByRole('heading', { level: 2, name: /page not found/i })).toBeInTheDocument();
  expect(screen.getByText(/error 404/i)).toBeInTheDocument();
  expect(screen.getByText(/dispatch you sought is not in our archives/i)).toBeInTheDocument();
});

it('renders a react-router Link back to /', () => {
  render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>
  );
  const link = screen.getByRole('link', { name: /return to the hall/i });
  expect(link).toBeInTheDocument();
  expect(link).toHaveAttribute('href', '/');
});

it('shows the 404 page when navigating to an unknown route', () => {
  render(
    <MemoryRouter initialEntries={['/this-does-not-exist']}>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/games/:gameId" element={<div>Game Detail</div>} />
        <Route path="/meta" element={<div>Meta</div>} />
        <Route path="/agenda" element={<div>Agenda</div>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MemoryRouter>
  );
  expect(screen.getByRole('heading', { level: 2, name: /page not found/i })).toBeInTheDocument();
  expect(screen.queryByText('Home')).not.toBeInTheDocument();
});
