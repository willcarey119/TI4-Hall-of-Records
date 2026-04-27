// src/features/upload/WarningList.tsx
interface WarningListProps {
  warnings: string[];
}

export function WarningList({ warnings }: WarningListProps) {
  if (warnings.length === 0) return null;
  return (
    <div className="border border-accent/40 bg-accent/5 p-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
        {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
      </p>
      <ul className="mt-2 space-y-1">
        {warnings.map((w) => (
          <li key={w} className="font-mono text-xs text-ink-3">
            {w}
          </li>
        ))}
      </ul>
    </div>
  );
}
