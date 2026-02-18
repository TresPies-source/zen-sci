export function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ padding: '16px', color: 'var(--mcp-error, #c0392b)', border: '1px solid currentColor', borderRadius: '6px' }}>
      <strong>Error:</strong> {message}
    </div>
  );
}
