export function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '12px' }}>
      <div className="zen-spinner" />
      <p style={{ fontSize: '14px', color: 'var(--mcp-text-secondary, #666)' }}>
        Waiting for slide deck data...
      </p>
    </div>
  );
}
