// src/features/upload/__tests__/DropZone.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DropZone } from '../DropZone';

describe('DropZone', () => {
  it('renders a drop zone with instructional text', () => {
    render(<DropZone onFiles={vi.fn()} />);
    expect(screen.getByText(/drop.*json/i)).toBeInTheDocument();
  });

  it('calls onFiles with a single-element array when one file is selected via the input', async () => {
    const onFiles = vi.fn();
    render(<DropZone onFiles={onFiles} />);
    const input = screen.getByTestId('file-input');
    const file = new File(['{}'], 'game.json', { type: 'application/json' });
    await userEvent.upload(input, file);
    expect(onFiles).toHaveBeenCalledWith([file]);
    expect(onFiles).toHaveBeenCalledTimes(1);
  });

  it('calls onFiles with all files when multiple files are selected via the input', async () => {
    const onFiles = vi.fn();
    render(<DropZone onFiles={onFiles} />);
    const input = screen.getByTestId('file-input');
    const file1 = new File(['{}'], 'game1.json', { type: 'application/json' });
    const file2 = new File(['{}'], 'game2.json', { type: 'application/json' });
    await userEvent.upload(input, [file1, file2]);
    expect(onFiles).toHaveBeenCalledWith([file1, file2]);
    expect(onFiles).toHaveBeenCalledTimes(1);
  });

  it('calls onFiles with a single-element array when one file is dropped onto the zone', () => {
    const onFiles = vi.fn();
    render(<DropZone onFiles={onFiles} />);
    const zone = screen.getByRole('button');
    const file = new File(['{}'], 'game.json', { type: 'application/json' });
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    expect(onFiles).toHaveBeenCalledWith([file]);
  });

  it('calls onFiles with all files when multiple files are dropped onto the zone', () => {
    const onFiles = vi.fn();
    render(<DropZone onFiles={onFiles} />);
    const zone = screen.getByRole('button');
    const file1 = new File(['{}'], 'a.json', { type: 'application/json' });
    const file2 = new File(['{}'], 'b.json', { type: 'application/json' });
    fireEvent.drop(zone, { dataTransfer: { files: [file1, file2] } });
    expect(onFiles).toHaveBeenCalledWith([file1, file2]);
  });

  it('does not call onFiles when disabled', async () => {
    const onFiles = vi.fn();
    render(<DropZone onFiles={onFiles} disabled />);
    const input = screen.getByTestId('file-input');
    const file = new File(['{}'], 'game.json', { type: 'application/json' });
    await userEvent.upload(input, file);
    expect(onFiles).not.toHaveBeenCalled();
  });
});
