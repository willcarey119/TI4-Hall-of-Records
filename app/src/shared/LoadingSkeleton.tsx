export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ padding: '12px 16px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <div style={{ height: 10, background: 'var(--ink-4)', marginBottom: 4, width: '60%' }} />
          <div style={{ height: 14, background: 'var(--ink-3)', marginBottom: 4 }} />
          <div style={{ height: 8, background: 'var(--ink-4)', width: '40%' }} />
        </div>
      ))}
    </div>
  );
}
