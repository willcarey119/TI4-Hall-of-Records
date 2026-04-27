// src/features/upload/UploadPage.tsx
import { useState } from 'react';
import type { ParsedGame } from '../../lib/parser/types';
import { parseGame } from '../../lib/parser/parseGame';
import { DropZone } from './DropZone';
import { GamePreview } from './GamePreview';

type Status = 'idle' | 'parsing' | 'preview' | 'saving' | 'saved' | 'error';

interface UploadPageProps {
  onSaved?: () => void;
}

export function UploadPage({ onSaved }: UploadPageProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [game, setGame] = useState<ParsedGame | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File): Promise<void> {
    setStatus('parsing');
    setError(null);
    try {
      const text = await file.text();
      const raw = JSON.parse(text) as unknown;
      const parsed = parseGame(raw);
      setGame(parsed);
      setStatus('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse file');
      setStatus('error');
    }
  }

  async function handleSave(): Promise<void> {
    if (game === null) return;
    setStatus('saving');
    setError(null);
    try {
      const { signInAnon, saveGame } = await import('../../adapters/firestore');
      await signInAnon();
      await saveGame(game);
      setStatus('saved');
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
      setStatus('error');
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      {/* Upload / error states */}
      {(status === 'idle' || status === 'parsing' || status === 'error') && (
        <section className="space-y-4">
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
            File Dispatch
          </h2>
          <DropZone
            onFile={(f) => { void handleFile(f); }}
            disabled={status === 'parsing'}
          />
          {status === 'parsing' && (
            <p className="font-mono text-xs text-ink-3">Parsing…</p>
          )}
          {status === 'error' && error !== null && (
            <p className="border border-accent/40 bg-accent/5 p-3 font-mono text-xs text-accent">
              {error}
            </p>
          )}
        </section>
      )}

      {/* Preview / saving states */}
      {(status === 'preview' || status === 'saving') && game !== null && (
        <section className="space-y-4">
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
            Press Check
          </h2>
          <GamePreview
            game={game}
            onSave={() => { void handleSave(); }}
            saving={status === 'saving'}
          />
        </section>
      )}

      {/* Success state */}
      {status === 'saved' && (
        <section className="space-y-4">
          <div className="border-2 border-ink p-6">
            <p className="font-display text-2xl font-bold text-ink">
              Saved to the Archive.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setStatus('idle'); setGame(null); }}
            className="font-mono text-xs uppercase tracking-widest text-ink-3 underline"
          >
            Upload another game
          </button>
        </section>
      )}
    </main>
  );
}
