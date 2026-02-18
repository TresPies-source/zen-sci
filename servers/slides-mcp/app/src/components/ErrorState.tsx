interface Props {
  message: string;
}

export function ErrorState({ message }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '12px' }}>
      <span className="zen-badge fail">Error</span>
      <p style={{ fontSize: '14px', color: 'var(--mcp-text, #333)', maxWidth: '400px', textAlign: 'center' }}>
        {message}
      </p>
    </div>
  );
}
