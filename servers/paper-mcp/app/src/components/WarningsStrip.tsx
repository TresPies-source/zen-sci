interface Props {
  warnings: Array<{ type: 'warning' | 'error'; message: string }>;
}

export function WarningsStrip({ warnings }: Props) {
  if (warnings.length === 0) return null;
  const hasError = warnings.some((w) => w.type === 'error');

  return (
    <div style={{ padding: '12px', backgroundColor: hasError ? '#f8d7da' : '#fff3cd', borderLeft: `4px solid ${hasError ? '#721c24' : '#856404'}`, borderRadius: 'var(--zen-radius)', marginBottom: '12px' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: hasError ? '#721c24' : '#856404', marginBottom: '6px' }}>
        {hasError ? 'Errors' : 'Warnings'}
      </div>
      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: hasError ? '#721c24' : '#856404' }}>
        {warnings.map((w, idx) => <li key={idx} style={{ marginBottom: '4px' }}>{w.message}</li>)}
      </ul>
    </div>
  );
}
