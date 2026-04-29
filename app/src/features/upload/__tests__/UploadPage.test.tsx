// src/features/upload/__tests__/UploadPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('UploadPage', () => {
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
    // Valid JSON so JSON.parse succeeds; the mocked parseGame throws the error.
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
    // Simulate a file larger than 10 MB — File constructor doesn't check size limits,
    // so we override the size property via Object.defineProperty.
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
