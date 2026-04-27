import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { UploadPage } from './UploadPage';

vi.mock('../../adapters/firestore', () => ({
  signInAnon: vi.fn().mockResolvedValue('uid-123'),
  saveGame: vi.fn().mockResolvedValue('game-id'),
}));

vi.mock('../../lib/parser/parseGame', () => ({
  parseGame: vi.fn().mockReturnValue({
    gameId: 'game-id',
    playedAt: 1700006400000,
    durationSeconds: 14400,
    factions: [],
    winner: null,
    finalScores: {},
    warnings: [],
  }),
}));

it('renders the drop zone', () => {
  render(<UploadPage />);
  expect(screen.getByText(/Drop JSON export here/i)).toBeInTheDocument();
});

it('does NOT render a Hall of Records heading', () => {
  render(<UploadPage />);
  expect(screen.queryByText(/Hall of Records/i)).not.toBeInTheDocument();
});

it('calls onSaved after a successful upload and save', async () => {
  const user = userEvent.setup();
  const onSaved = vi.fn();
  render(<UploadPage onSaved={onSaved} />);

  const file = new File(['{}'], 'game.json', { type: 'application/json' });
  const input = screen.getByTestId('file-input');
  await user.upload(input, file);

  // Click save
  const saveBtn = await screen.findByRole('button', { name: /Save to Records/i });
  await user.click(saveBtn);

  await screen.findByText(/Saved to the Archive/i);
  expect(onSaved).toHaveBeenCalledTimes(1);
});
