// src/features/upload/DropZone.tsx
import { useRef, useState } from 'react';

interface DropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function DropZone({ onFile, disabled = false }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) return;
    const file = e.target.files?.[0];
    if (file !== undefined) onFile(file);
    e.target.value = ''; // reset so the same file can be re-uploaded
  }

  function handleDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file !== undefined) onFile(file);
  }

  function handleDragOver(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (!disabled) setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { if (!disabled) inputRef.current?.click(); }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDragEnd={handleDragLeave}
        disabled={disabled}
        className={[
          'w-full border-2 border-dashed px-8 py-12 text-center transition-colors',
          'font-mono text-xs uppercase tracking-widest',
          dragging
            ? 'border-accent bg-paper-2 text-accent'
            : 'border-ink-4 text-ink-3 hover:border-ink-3 hover:bg-paper-2',
          disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
        ].join(' ')}
      >
        <span className="block">Drop JSON export here</span>
        <span className="mt-1 block text-[10px] text-ink-4">
          or click to browse · .json files only
        </span>
      </button>
      <input
        ref={inputRef}
        data-testid="file-input"
        type="file"
        accept=".json"
        disabled={disabled}
        onChange={handleChange}
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 h-0 w-0 overflow-hidden opacity-0"
      />
    </div>
  );
}
