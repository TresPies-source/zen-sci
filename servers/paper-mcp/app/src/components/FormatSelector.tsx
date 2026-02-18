interface Props {
  currentFormat: string;
  onFormatChange: (format: string) => void;
  loading: boolean;
}

const FORMAT_LABELS: Record<string, string> = {
  'paper-ieee': 'IEEE Two-Column',
  'paper-acm': 'ACM Article',
  'paper-arxiv': 'arXiv Preprint',
};

export function FormatSelector({ currentFormat, onFormatChange, loading }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <label style={{ fontSize: '13px', fontWeight: 500 }}>Format:</label>
      <select value={currentFormat} onChange={(e) => onFormatChange(e.target.value)} disabled={loading} style={{ padding: '6px 10px', border: 'var(--zen-border)', borderRadius: 'var(--zen-radius)', backgroundColor: 'var(--mcp-bg-primary, #fff)', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
        <option value="paper-ieee">IEEE Two-Column</option>
        <option value="paper-acm">ACM Article</option>
        <option value="paper-arxiv">arXiv Preprint</option>
      </select>
      <span className="zen-badge info">{FORMAT_LABELS[currentFormat] || currentFormat}</span>
    </div>
  );
}
