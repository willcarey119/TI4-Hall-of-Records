// src/features/upload/UploadPage.tsx
import { useState } from 'react';
import type { ParsedGame } from '../../lib/parser/types';
import { parseGame } from '../../lib/parser/parseGame';
import { DropZone } from './DropZone';
import { GamePreview } from './GamePreview';

// ── Types ─────────────────────────────────────────────────────────────────────

type FileStatus =
  | { state: 'pending' }
  | { state: 'parsing' }
  | { state: 'saving' }
  | { state: 'saved' }
  | { state: 'error'; message: string };

interface FileEntry {
  file: File;
  status: FileStatus;
}

type SingleStatus = 'parsing' | 'preview' | 'saving' | 'saved' | 'error';
type Mode = 'idle' | 'single' | 'bulk';

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

// ── Helpers ───────────────────────────────────────────────────────────────────

function fileSizeError(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) {
    return `File too large (${(file.size / 1_048_576).toFixed(1)} MB). Maximum is 10 MB.`;
  }
  return null;
}

async function parseSingle(file: File): Promise<ParsedGame> {
  const text = await file.text();
  const raw = JSON.parse(text) as unknown;
  return parseGame(raw);
}

// ── Component ─────────────────────────────────────────────────────────────────

interface UploadPageProps {
  onSaved?: () => void;
}

export function UploadPage({ onSaved }: UploadPageProps) {
  const [mode, setMode] = useState<Mode>('idle');

  // Single-file state
  const [singleGame, setSingleGame] = useState<ParsedGame | null>(null);
  const [singleStatus, setSingleStatus] = useState<SingleStatus>('parsing');
  const [singleError, setSingleError] = useState<string | null>(null);

  // Bulk state
  const [bulkFiles, setBulkFiles] = useState<FileEntry[]>([]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleSingleFile(file: File): Promise<void> {
    setSingleStatus('parsing');
    setSingleError(null);
    setMode('single');

    const sizeErr = fileSizeError(file);
    if (sizeErr !== null) {
      setSingleError(sizeErr);
      setSingleStatus('error');
      return;
    }

    try {
      const parsed = await parseSingle(file);
      setSingleGame(parsed);
      setSingleStatus('preview');
    } catch (e) {
      setSingleError(e instanceof Error ? e.message : 'Failed to parse file');
      setSingleStatus('error');
    }
  }

  async function handleSingleSave(): Promise<void> {
    if (singleGame === null) return;
    setSingleStatus('saving');
    setSingleError(null);
    try {
      const { saveGame } = await import('../../adapters/firestore');
      await saveGame(singleGame);
      setSingleStatus('saved');
      onSaved?.();
    } catch (e) {
      setSingleError(e instanceof Error ? e.message : 'Failed to save');
      setSingleStatus('error');
    }
  }

  async function processBulk(files: File[]): Promise<void> {
    const entries: FileEntry[] = files.map(f => ({ file: f, status: { state: 'pending' } }));
    setBulkFiles(entries);
    setMode('bulk');

    const { saveGame } = await import('../../adapters/firestore');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file === undefined) continue;

      // Mark parsing
      setBulkFiles(prev =>
        prev.map((entry, idx) =>
          idx === i ? { ...entry, status: { state: 'parsing' } } : entry,
        ),
      );

      const sizeErr = fileSizeError(file);
      if (sizeErr !== null) {
        setBulkFiles(prev =>
          prev.map((entry, idx) =>
            idx === i ? { ...entry, status: { state: 'error', message: sizeErr } } : entry,
          ),
        );
        continue;
      }

      let parsed: ParsedGame;
      try {
        parsed = await parseSingle(file);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to parse file';
        setBulkFiles(prev =>
          prev.map((entry, idx) =>
            idx === i ? { ...entry, status: { state: 'error', message } } : entry,
          ),
        );
        continue;
      }

      // Mark saving
      setBulkFiles(prev =>
        prev.map((entry, idx) =>
          idx === i ? { ...entry, status: { state: 'saving' } } : entry,
        ),
      );

      try {
        await saveGame(parsed);
        setBulkFiles(prev =>
          prev.map((entry, idx) =>
            idx === i ? { ...entry, status: { state: 'saved' } } : entry,
          ),
        );
        onSaved?.();
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to save';
        setBulkFiles(prev =>
          prev.map((entry, idx) =>
            idx === i ? { ...entry, status: { state: 'error', message } } : entry,
          ),
        );
      }
    }
  }

  function handleFiles(files: File[]): void {
    if (files.length === 1 && files[0] !== undefined) {
      void handleSingleFile(files[0]);
    } else if (files.length >= 2) {
      void processBulk(files);
    }
  }

  function resetToIdle(): void {
    setMode('idle');
    setSingleGame(null);
    setSingleStatus('parsing');
    setSingleError(null);
    setBulkFiles([]);
  }

  // ── Render helpers ──────────────────────────────────────────────────────────

  function renderBulkRow(entry: FileEntry, idx: number): React.ReactElement {
    const { file, status } = entry;
    const name = file.name;

    if (status.state === 'pending') {
      return (
        <li key={idx} className="font-mono text-xs text-ink-3">
          ◌ {name}
        </li>
      );
    }
    if (status.state === 'parsing' || status.state === 'saving') {
      return (
        <li key={idx} className="font-mono text-xs text-ink-3">
          ⟳ {name}
        </li>
      );
    }
    if (status.state === 'saved') {
      return (
        <li key={idx} className="font-mono text-xs text-accent">
          ✓ {name}
        </li>
      );
    }
    // error
    return (
      <li key={idx} className="font-mono text-xs text-accent">
        ✗ {name} — {status.message}
      </li>
    );
  }

  // ── Layout ──────────────────────────────────────────────────────────────────

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      {/* Note: the parent (HomePage) renders the "File Dispatch" section label. */}

      {/* Idle — show drop zone */}
      {mode === 'idle' && (
        <section className="space-y-4">
          <DropZone onFiles={handleFiles} />
        </section>
      )}

      {/* Single mode — parsing / error: show drop zone + status */}
      {mode === 'single' && (singleStatus === 'parsing' || singleStatus === 'error') && (
        <section className="space-y-4">
          <DropZone onFiles={handleFiles} disabled={singleStatus === 'parsing'} />
          {singleStatus === 'parsing' && (
            <p className="font-mono text-xs text-ink-3">Parsing…</p>
          )}
          {singleStatus === 'error' && singleError !== null && (
            <p className="border border-accent/40 bg-accent/5 p-3 font-mono text-xs text-accent">
              {singleError}
            </p>
          )}
        </section>
      )}

      {/* Single mode — preview / saving: show GamePreview */}
      {mode === 'single' &&
        (singleStatus === 'preview' || singleStatus === 'saving') &&
        singleGame !== null && (
          <section className="space-y-4">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
              Press Check
            </h2>
            <GamePreview
              game={singleGame}
              onSave={() => { void handleSingleSave(); }}
              saving={singleStatus === 'saving'}
            />
          </section>
        )}

      {/* Single mode — saved */}
      {mode === 'single' && singleStatus === 'saved' && (
        <section className="space-y-4">
          <div className="border-2 border-ink p-6">
            <p className="font-display text-2xl font-bold text-ink">
              Saved to the Archive.
            </p>
          </div>
          <button
            type="button"
            onClick={resetToIdle}
            className="font-mono text-xs uppercase tracking-widest text-ink-3 underline"
          >
            Upload another game
          </button>
        </section>
      )}

      {/* Bulk mode — drop zone stays visible + file list */}
      {mode === 'bulk' && (
        <section className="space-y-6">
          <DropZone onFiles={handleFiles} />
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-4">
            Drop more files to upload additional games.
          </p>
          <ul className="space-y-1" aria-label="Upload status">
            {bulkFiles.map((entry, idx) => renderBulkRow(entry, idx))}
          </ul>
        </section>
      )}
    </main>
  );
}
