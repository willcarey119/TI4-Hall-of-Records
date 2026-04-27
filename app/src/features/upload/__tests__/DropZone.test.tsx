// src/features/upload/__tests__/DropZone.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DropZone } from '../DropZone';

describe('DropZone', () => {
  it('renders a drop zone with instructional text', () => {
    render(<DropZone onFile={vi.fn()} />);
    expect(screen.getByText(/drop.*json/i)).toBeInTheDocument();
  });

  it('calls onFile when a file is selected via the input', async () => {
    const onFile = vi.fn();
    render(<DropZone onFile={onFile} />);
    const input = screen.getByTestId('file-input');
    const file = new File(['{}'], 'game.json', { type: 'application/json' });
    await userEvent.upload(input, file);
    expect(onFile).toHaveBeenCalledWith(file);
    expect(onFile).toHaveBeenCalledTimes(1);
  });

  it('calls onFile when a file is dropped onto the zone', () => {
    const onFile = vi.fn();
    render(<DropZone onFile={onFile} />);
    const zone = screen.getByRole('button');
    const file = new File(['{}'], 'game.json', { type: 'application/json' });
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    expect(onFile).toHaveBeenCalledWith(file);
  });

  it('does not call onFile when disabled', async () => {
    const onFile = vi.fn();
    render(<DropZone onFile={onFile} disabled />);
    const input = screen.getByTestId('file-input');
    const file = new File(['{}'], 'game.json', { type: 'application/json' });
    await userEvent.upload(input, file);
    expect(onFile).not.toHaveBeenCalled();
  });
});
