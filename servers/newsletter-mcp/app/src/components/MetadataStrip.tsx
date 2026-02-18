interface Props {
  metadata: { subject_line: string; preview_text: string; sender_name: string; total_size_kb: number };
  sizeWarning: boolean;
}

export function MetadataStrip({ metadata, sizeWarning }: Props) {
  const getSizeBadge = () => {
    if (metadata.total_size_kb < 60) return { bg: '#d4edda', color: '#155724' };
    if (metadata.total_size_kb < 100) return { bg: '#fff3cd', color: '#856404' };
    return { bg: '#f8d7da', color: '#721c24' };
  };
  const badge = getSizeBadge();

  return (
    <div style={{ padding: '12px', backgroundColor: 'var(--mcp-bg-secondary, #f9f9f9)', borderRadius: 'var(--zen-radius)', borderBottom: 'var(--zen-border)' }}>
      <table className="zen-meta-table">
        <tbody>
          <tr><td><strong>Subject:</strong></td><td>{metadata.subject_line}</td></tr>
          <tr><td><strong>Preview Text:</strong></td><td style={{ fontSize: '12px', color: 'var(--mcp-text-secondary, #666)' }}>{metadata.preview_text}</td></tr>
          <tr><td><strong>From:</strong></td><td>{metadata.sender_name}</td></tr>
          <tr><td><strong>File Size:</strong></td><td><span className="zen-badge" style={{ backgroundColor: badge.bg, color: badge.color }}>{metadata.total_size_kb.toFixed(1)} KB{sizeWarning ? ' \u26A0' : ''}</span></td></tr>
        </tbody>
      </table>
    </div>
  );
}
