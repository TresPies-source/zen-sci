interface Props {
  message: string;
}

export function ErrorState({ message }: Props) {
  return (
    <div style={{ padding: '24px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>!</div>
      <p style={{ fontSize: '14px', fontWeight: 600, color: '#721c24', marginBottom: '4px' }}>
        Newsletter conversion failed
      </p>
      <p style={{ fontSize: '12px', color: 'var(--mcp-text-secondary, #666)' }}>
        {message}
      </p>
      <p style={{ fontSize: '11px', color: 'var(--mcp-text-secondary, #999)', marginTop: '12px' }}>
        Try running <code style={{ fontFamily: 'var(--zen-font-mono)', backgroundColor: 'var(--mcp-bg-secondary, #f5f5f5)', padding: '2px 6px', borderRadius: '3px' }}>convert_to_email</code> again
      </p>
    </div>
  );
}
