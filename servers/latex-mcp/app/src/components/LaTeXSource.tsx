import { useState } from 'react';

interface LaTeXSourceProps {
  source: string;
}

export function LaTeXSource({ source }: LaTeXSourceProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(source).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <button
        onClick={handleCopy}
        style={{
          alignSelf: 'flex-end',
          padding: '6px 12px',
          background: 'var(--mcp-accent, #2563eb)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--zen-radius)',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre style={{
        background: 'var(--mcp-bg-secondary, #f5f5f5)',
        padding: '12px',
        borderRadius: 'var(--zen-radius)',
        border: 'var(--zen-border)',
        overflow: 'auto',
        maxHeight: '600px',
        fontFamily: 'var(--zen-font-mono)',
        fontSize: '11px',
        lineHeight: '1.5',
        color: 'var(--mcp-text-primary, #000)',
        margin: 0,
      }}>
        {source}
      </pre>
    </div>
  );
}
