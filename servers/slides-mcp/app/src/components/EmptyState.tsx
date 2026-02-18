export function EmptyState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '12px', padding: '24px' }}>
      <h2 style={{ margin: 0, fontSize: '18px' }}>Slides Preview</h2>
      <p style={{ fontSize: '14px', color: 'var(--mcp-text-secondary, #666)', textAlign: 'center', maxWidth: '400px' }}>
        No slide deck loaded. Use the <code style={{ fontFamily: 'var(--zen-font-mono)', background: 'var(--mcp-bg-secondary, #f5f5f5)', padding: '2px 6px', borderRadius: '4px' }}>convert_to_slides</code> tool to generate a presentation.
      </p>
    </div>
  );
}
