import { useState } from 'react';

interface FeedModalProps {
  feedXml: string;
  onClose: () => void;
}

export function FeedModal({ feedXml, onClose }: FeedModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(feedXml).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={{
        background: 'var(--mcp-bg-primary, #fff)',
        borderRadius: 'var(--zen-radius)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        width: '90%',
        maxWidth: '700px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: 'var(--zen-border)',
        }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>RSS/Atom Feed</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCopy}
              style={{
                padding: '4px 10px',
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
            <button
              onClick={onClose}
              style={{
                padding: '4px 10px',
                background: 'transparent',
                border: 'var(--zen-border)',
                borderRadius: 'var(--zen-radius)',
                cursor: 'pointer',
                fontSize: '12px',
                color: 'var(--mcp-text-primary, #333)',
              }}
            >
              Close
            </button>
          </div>
        </div>
        <pre style={{
          flex: 1,
          overflow: 'auto',
          padding: '12px 16px',
          margin: 0,
          fontFamily: 'var(--zen-font-mono)',
          fontSize: '11px',
          lineHeight: '1.5',
          color: 'var(--mcp-text-primary, #000)',
        }}>
          {feedXml}
        </pre>
      </div>
    </div>
  );
}
