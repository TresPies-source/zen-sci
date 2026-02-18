export function LoadingState() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '24px' }}>
      <div className="zen-spinner" />
      <span style={{ color: 'var(--mcp-text-secondary, #666)' }}>Loading…</span>
    </div>
  );
}
