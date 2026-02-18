import { useState } from 'react';
import type { ConvertToPdfResult, TexEngine } from '../types';

interface ControlsPanelProps {
  data: ConvertToPdfResult;
  onReRender: (engine: TexEngine) => Promise<void>;
  onCheckCitations: () => Promise<void>;
}

export function ControlsPanel({ data: _data, onReRender, onCheckCitations }: ControlsPanelProps) {
  const [engine, setEngine] = useState<TexEngine>('pdflatex');
  const [loading, setLoading] = useState(false);

  const handleReRender = async () => {
    setLoading(true);
    try {
      await onReRender(engine);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckCitations = async () => {
    setLoading(true);
    try {
      await onCheckCitations();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px 0', flexWrap: 'wrap' }}>
      <label style={{ fontSize: '12px' }}>
        TeX Engine:
        <select
          value={engine}
          onChange={(e) => setEngine(e.target.value as TexEngine)}
          disabled={loading}
          style={{ marginLeft: '6px', padding: '4px' }}
        >
          <option value="pdflatex">pdflatex</option>
          <option value="xelatex">xelatex</option>
          <option value="lualatex">lualatex</option>
        </select>
      </label>

      <button
        onClick={handleReRender}
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
        {loading ? 'Processing...' : 'Re-render'}
      </button>

      <button
        onClick={handleCheckCitations}
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
        Check Citations
      </button>
    </div>
  );
}
