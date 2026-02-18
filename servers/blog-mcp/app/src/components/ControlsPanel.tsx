import { useState } from 'react';

interface ControlsPanelProps {
  onRegenerate: () => Promise<void>;
  onGenerateFeed: () => Promise<void>;
}

export function ControlsPanel({ onRegenerate, onGenerateFeed }: ControlsPanelProps) {
  const [loading, setLoading] = useState(false);

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      await onRegenerate();
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFeed = async () => {
    setLoading(true);
    try {
      await onGenerateFeed();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px 0', flexWrap: 'wrap' }}>
      <button
        onClick={handleRegenerate}
        disabled={loading}
        style={{
          padding: '6px 12px',
          background: 'var(--mcp-accent, #2563eb)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--zen-radius)',
          cursor: loading ? 'default' : 'pointer',
          opacity: loading ? 0.6 : 1,
          fontSize: '12px',
        }}
      >
        {loading ? 'Processing...' : 'Regenerate'}
      </button>

      <button
        onClick={handleGenerateFeed}
        disabled={loading}
        style={{
          padding: '6px 12px',
          background: 'var(--mcp-accent, #2563eb)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--zen-radius)',
          cursor: loading ? 'default' : 'pointer',
          opacity: loading ? 0.6 : 1,
          fontSize: '12px',
        }}
      >
        Generate Feed
      </button>
    </div>
  );
}
