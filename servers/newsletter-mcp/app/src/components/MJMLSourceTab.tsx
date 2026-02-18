export function MJMLSourceTab({ mjmlSource }: { mjmlSource: string }) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(mjmlSource);
  };

  return (
    <div style={{ marginTop: '12px' }}>
      <button onClick={handleCopy} style={{ padding: '8px 12px', backgroundColor: 'var(--zen-tab-active-bg, #2563eb)', color: '#fff', border: 'none', borderRadius: 'var(--zen-radius)', cursor: 'pointer', fontSize: '12px', marginBottom: '8px' }}>
        Copy to Clipboard
      </button>
      <pre style={{ backgroundColor: 'var(--mcp-bg-secondary, #f5f5f5)', padding: '12px', borderRadius: 'var(--zen-radius)', overflow: 'auto', fontSize: '11px', lineHeight: '1.4', color: 'var(--mcp-text-primary, #000)' }}>
        {mjmlSource}
      </pre>
    </div>
  );
}
