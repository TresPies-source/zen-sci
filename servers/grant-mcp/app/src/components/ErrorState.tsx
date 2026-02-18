export function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <p style={{ color: '#721c24', fontSize: '14px', fontWeight: 500 }}>Error</p>
      <p style={{ color: 'var(--mcp-text-secondary, #666)', fontSize: '13px' }}>{message}</p>
    </div>
  );
}
