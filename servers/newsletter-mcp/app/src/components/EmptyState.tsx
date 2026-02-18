export function EmptyState() {
  return (
    <div style={{ padding: '48px 16px', textAlign: 'center' }}>
      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--mcp-text-primary, #333)', marginBottom: '8px' }}>
        No newsletter preview available
      </p>
      <p style={{ fontSize: '12px', color: 'var(--mcp-text-secondary, #666)' }}>
        Run the <code style={{ fontFamily: 'var(--zen-font-mono)', backgroundColor: 'var(--mcp-bg-secondary, #f5f5f5)', padding: '2px 6px', borderRadius: '3px' }}>convert_to_email</code> tool to generate a preview.
      </p>
    </div>
  );
}
