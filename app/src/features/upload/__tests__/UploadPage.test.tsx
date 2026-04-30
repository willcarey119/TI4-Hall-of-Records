// src/features/upload/__tests__/UploadPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ParsedGame } from '../../../lib/parser/types';
import { parseGame } from '../../../lib/parser/parseGame';
import { saveGame } from '../../../adapters/firestore';
import { UploadPage } from '../UploadPage';

// ── Mocks (hoisted by Vitest) ─────────────────────────────────────────────────

vi.mock('../../../lib/parser/parseGame', () => ({
  parseGame: vi.fn(),
}));

vi.mock('../../../adapters/firestore', () => ({
  saveGame: vi.fn(() => Promise.resolve('abc123')),
}));

// ── Fixture ───────────────────────────────────────────────────────────────────

const mockGame: ParsedGame = {
  gameId: 'abc123',
  playedAt: 1700000000000,
  durationSeconds: 14400,
  factions: [
    { factionId: 'Sol', playerName: 'Tim', color: 'Blue', mapPosition: 0, startingTechs: [], startingPlanets: [] },
  ],
  options: {},
  initialSpeaker: 'Sol',
  phaseSnapshots: [],
  vpEvents: [],
  planetEvents: [],
  techEvents: [],
  agendaResolutions: [],
  strategyCardEvents: [],
  actionCardEvents: [],
  componentEvents: [],
  relicEvents: [],
  leaderEvents: [],
  objectiveReveals: [],
  speakerEvents: [],
  attachmentEvents: [],
  allianceEvents: [],
  promissoryNoteEvents: [],
  expeditionEvents: [],
  secondaryEvents: [],
  actionEvents: [],
  finalScores: { Sol: 10 },
  winner: 'Sol',
  timers: { game: 14400, factions: { Sol: 7200 }, secondaries: {}, agendas: { first: 0, second: 0 } },
  warnings: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(parseGame).mockReturnValue(mockGame);
});

// ── Single-file flow ──────────────────────────────────────────────────────────

describe('UploadPage — single file flow', () => {
  it('renders the drop zone on initial load', () => {
    render(<UploadPage />);
    expect(screen.getByText(/drop.*json/i)).toBeInTheDocument();
  });

  it('does NOT render a Hall of Records heading', () => {
    render(<UploadPage />);
    expect(screen.queryByText(/Hall of Records/i)).not.toBeInTheDocument();
  });

  it('calls onSaved after a successful upload and save', async () => {
    const onSaved = vi.fn();
    render(<UploadPage onSaved={onSaved} />);

    const file = new File(['{}'], 'game.json', { type: 'application/json' });
    await userEvent.upload(screen.getByTestId('file-input'), file);

    const saveBtn = await screen.findByRole('button', { name: /Save to Records/i });
    await userEvent.click(saveBtn);

    await screen.findByText(/Saved to the Archive/i);
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it('shows the game preview after a valid JSON file is uploaded', async () => {
    render(<UploadPage />);
    const file = new File(['{}'], 'game.json', { type: 'application/json' });
    await userEvent.upload(screen.getByTestId('file-input'), file);
    expect(await screen.findByRole('button', { name: /save to records/i })).toBeInTheDocument();
  });

  it('shows an error message for a file that fails to parse', async () => {
    vi.mocked(parseGame).mockImplementationOnce(() => {
      throw new Error('Unexpected token at position 3');
    });
    render(<UploadPage />);
    const file = new File(['{}'], 'bad.json', { type: 'application/json' });
    await userEvent.upload(screen.getByTestId('file-input'), file);
    expect(await screen.findByText(/unexpected token at position 3/i)).toBeInTheDocument();
  });

  it('calls saveGame when the save button is clicked', async () => {
    render(<UploadPage />);
    await userEvent.upload(
      screen.getByTestId('file-input'),
      new File(['{}'], 'game.json', { type: 'application/json' }),
    );
    await userEvent.click(await screen.findByRole('button', { name: /save to records/i }));
    expect(saveGame).toHaveBeenCalledWith(mockGame);
  });

  it('shows an error and stays on the drop zone when file exceeds 10 MB', async () => {
    render(<UploadPage />);
    const bigFile = new File(['{}'], 'huge.json', { type: 'application/json' });
    Object.defineProperty(bigFile, 'size', { value: 11 * 1024 * 1024 });
    await userEvent.upload(screen.getByTestId('file-input'), bigFile);
    expect(await screen.findByText(/file too large/i)).toBeInTheDocument();
    expect(saveGame).not.toHaveBeenCalled();
  });

  it('shows a success confirmation after saving', async () => {
    render(<UploadPage />);
    await userEvent.upload(
      screen.getByTestId('file-input'),
      new File(['{}'], 'game.json', { type: 'application/json' }),
    );
    await userEvent.click(await screen.findByRole('button', { name: /save to records/i }));
    expect(await screen.findByText(/saved to the archive/i)).toBeInTheDocument();
  });

  it('shows a save error message if saveGame rejects', async () => {
    vi.mocked(saveGame).mockRejectedValueOnce(new Error('Firestore write failed'));
    render(<UploadPage />);
    await userEvent.upload(
      screen.getByTestId('file-input'),
      new File(['{}'], 'game.json', { type: 'application/json' }),
    );
    await userEvent.click(await screen.findByRole('button', { name: /save to records/i }));
    expect(await screen.findByText(/firestore write failed/i)).toBeInTheDocument();
  });
});

// ── Bulk flow ─────────────────────────────────────────────────────────────────

describe('UploadPage — bulk flow (2+ files)', () => {
  it('enters bulk mode and shows status list when 2 files are uploaded', async () => {
    render(<UploadPage />);
    const file1 = new File(['{}'], 'game1.json', { type: 'application/json' });
    const file2 = new File(['{}'], 'game2.json', { type: 'application/json' });
    await userEvent.upload(screen.getByTestId('file-input'), [file1, file2]);

    // Status list should appear
    expect(await screen.findByRole('list', { name: /upload status/i })).toBeInTheDocument();
  });

  it('shows saved checkmarks for each file after successful bulk upload', async () => {
    render(<UploadPage />);
    const file1 = new File(['{}'], 'alpha.json', { type: 'application/json' });
    const file2 = new File(['{}'], 'beta.json', { type: 'application/json' });
    await userEvent.upload(screen.getByTestId('file-input'), [file1, file2]);

    await waitFor(() => {
      const items = screen.getAllByRole('listitem');
      expect(items.some(el => el.textContent?.includes('✓') && el.textContent.includes('alpha.json'))).toBe(true);
      expect(items.some(el => el.textContent?.includes('✓') && el.textContent.includes('beta.json'))).toBe(true);
    });
  });

  it('calls saveGame once per file in bulk mode', async () => {
    render(<UploadPage />);
    const file1 = new File(['{}'], 'game1.json', { type: 'application/json' });
    const file2 = new File(['{}'], 'game2.json', { type: 'application/json' });
    await userEvent.upload(screen.getByTestId('file-input'), [file1, file2]);

    await waitFor(() => {
      expect(saveGame).toHaveBeenCalledTimes(2);
    });
  });

  it('calls onSaved once per successfully saved file in bulk mode', async () => {
    const onSaved = vi.fn();
    render(<UploadPage onSaved={onSaved} />);
    const file1 = new File(['{}'], 'game1.json', { type: 'application/json' });
    const file2 = new File(['{}'], 'game2.json', { type: 'application/json' });
    await userEvent.upload(screen.getByTestId('file-input'), [file1, file2]);

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledTimes(2);
    });
  });

  it('marks a file as error in bulk mode when parse fails', async () => {
    vi.mocked(parseGame)
      .mockReturnValueOnce(mockGame)          // file1 succeeds
      .mockImplementationOnce(() => {         // file2 throws
        throw new Error('Bad JSON structure');
      });

    render(<UploadPage />);
    const file1 = new File(['{}'], 'ok.json', { type: 'application/json' });
    const file2 = new File(['{}'], 'bad.json', { type: 'application/json' });
    await userEvent.upload(screen.getByTestId('file-input'), [file1, file2]);

    await waitFor(() => {
      const items = screen.getAllByRole('listitem');
      expect(items.some(el => el.textContent?.includes('✗') && el.textContent.includes('bad.json'))).toBe(true);
      expect(items.some(el => el.textContent?.includes('Bad JSON structure'))).toBe(true);
    });
  });

  it('marks a file as error in bulk mode when save fails', async () => {
    vi.mocked(saveGame)
      .mockResolvedValueOnce('id1')
      .mockRejectedValueOnce(new Error('Write quota exceeded'));

    render(<UploadPage />);
    const file1 = new File(['{}'], 'ok.json', { type: 'application/json' });
    const file2 = new File(['{}'], 'fail.json', { type: 'application/json' });
    await userEvent.upload(screen.getByTestId('file-input'), [file1, file2]);

    await waitFor(() => {
      const items = screen.getAllByRole('listitem');
      expect(items.some(el => el.textContent?.includes('✗') && el.textContent.includes('fail.json'))).toBe(true);
      expect(items.some(el => el.textContent?.includes('Write quota exceeded'))).toBe(true);
    });
  });

  it('keeps the DropZone visible during and after bulk upload', async () => {
    render(<UploadPage />);
    const file1 = new File(['{}'], 'game1.json', { type: 'application/json' });
    const file2 = new File(['{}'], 'game2.json', { type: 'application/json' });
    await userEvent.upload(screen.getByTestId('file-input'), [file1, file2]);

    // After completion the file input (hidden within DropZone) is still in the DOM
    await waitFor(() => {
      expect(saveGame).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByTestId('file-input')).toBeInTheDocument();
  });

  it('shows the "drop more files" subtitle in bulk mode', async () => {
    render(<UploadPage />);
    const file1 = new File(['{}'], 'game1.json', { type: 'application/json' });
    const file2 = new File(['{}'], 'game2.json', { type: 'application/json' });
    await userEvent.upload(screen.getByTestId('file-input'), [file1, file2]);

    expect(await screen.findByText(/drop more files/i)).toBeInTheDocument();
  });
});
