export function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '12px' }}>
      <div className="zen-spinner" />
      <p style={{ fontSize: '13px', color: 'var(--mcp-text-secondary, #666)' }}>Loading grant compliance data...</p>
    </div>
  );
}
