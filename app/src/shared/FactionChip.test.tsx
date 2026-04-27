import { render } from '@testing-library/react';
import { FactionChip } from './FactionChip';

it('renders faction name', () => {
  const { container } = render(
    <FactionChip factionId="Sol" color="#4477bb" />
  );
  expect(container.textContent).toContain('Sol');
});

it('renders score when provided', () => {
  const { container } = render(
    <FactionChip factionId="Hacan" color="#ddaa22" score={8} />
  );
  expect(container.textContent).toContain('8');
});

it('shows ✦ indicator for winner', () => {
  const { container } = render(
    <FactionChip factionId="Sol" color="#4477bb" score={10} winner />
  );
  expect(container.textContent).toContain('✦');
});

it('does not show ✦ for non-winner', () => {
  const { container } = render(
    <FactionChip factionId="Sol" color="#4477bb" score={10} />
  );
  expect(container.textContent).not.toContain('✦');
});
