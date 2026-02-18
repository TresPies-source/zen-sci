export function EmptyState() {
  return (
    <div style={{ padding: '48px', textAlign: 'center' }}>
      <p style={{ color: 'var(--mcp-text-secondary, #666)', fontSize: '14px' }}>
        Waiting for grant proposal data. Use the <code>generate_proposal</code> tool to generate a compliance report.
      </p>
    </div>
  );
}
