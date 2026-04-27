import { render } from '@testing-library/react';
import { Rule } from './Rule';

it('renders an hr element', () => {
  const { container } = render(<Rule />);
  expect(container.querySelector('hr')).toBeInTheDocument();
});

it('applies thin border by default', () => {
  const { container } = render(<Rule />);
  const hr = container.querySelector('hr') as HTMLElement;
  expect(hr.style.borderTop).toBe('1px solid var(--rule)');
});

it('applies thick border', () => {
  const { container } = render(<Rule weight="thick" />);
  const hr = container.querySelector('hr') as HTMLElement;
  expect(hr.style.borderTop).toBe('2px solid var(--rule)');
});

it('applies double border', () => {
  const { container } = render(<Rule weight="double" />);
  const hr = container.querySelector('hr') as HTMLElement;
  expect(hr.style.borderTop).toBe('3px double var(--rule)');
});
