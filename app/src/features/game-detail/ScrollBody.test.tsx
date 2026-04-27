import { render, act } from '@testing-library/react';
import { vi, beforeEach, afterEach } from 'vitest';
import { ScrollBody } from './ScrollBody';

// IntersectionObserver is not implemented in jsdom — stub it.
let observerCallbacks: IntersectionObserverCallback[] = [];

beforeEach(() => {
  observerCallbacks = [];
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn().mockImplementation(function (cb: IntersectionObserverCallback) {
      observerCallbacks.push(cb);
      return { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

it('renders all four section stubs', () => {
  render(<ScrollBody onSectionChange={vi.fn()} />);
  expect(document.getElementById('vp-race')).toBeInTheDocument();
  expect(document.getElementById('timeline')).toBeInTheDocument();
  expect(document.getElementById('dashboard')).toBeInTheDocument();
  expect(document.getElementById('planets')).toBeInTheDocument();
});

it('creates IntersectionObservers on mount', () => {
  render(<ScrollBody onSectionChange={vi.fn()} />);
  expect(IntersectionObserver).toHaveBeenCalledTimes(4);
});

it('calls onSectionChange when a section enters the viewport', () => {
  const onSectionChange = vi.fn();
  render(<ScrollBody onSectionChange={onSectionChange} />);

  // Fire the timeline observer (index 1) with an intersecting entry
  act(() => {
    const fakeEntry = {
      isIntersecting: true,
      target: { dataset: { section: 'timeline' } },
    } as unknown as IntersectionObserverEntry;
    observerCallbacks[1]?.([fakeEntry], {} as IntersectionObserver);
  });

  expect(onSectionChange).toHaveBeenCalledWith('timeline');
});
