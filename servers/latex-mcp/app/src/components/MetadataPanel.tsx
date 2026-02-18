import type { ConvertToPdfResult } from '../types';

interface MetadataPanelProps {
  data: ConvertToPdfResult;
}

export function MetadataPanel({ data }: MetadataPanelProps) {
  const warningCount = data.warnings?.length ?? 0;
  const citationResolvedPercent =
    data.citations.total > 0
      ? Math.round((data.citations.resolved / data.citations.total) * 100)
      : 100;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      padding: '12px',
      background: 'var(--mcp-bg-secondary, #f9f9f9)',
      borderRadius: 'var(--zen-radius)',
      border: 'var(--zen-border)',
    }}>
      <div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600 }}>Document</h3>
        <table className="zen-meta-table">
          <tbody>
            {data.metadata.title && (
              <tr><td>Title</td><td style={{ fontWeight: 500 }}>{data.metadata.title}</td></tr>
            )}
            {data.metadata.author && data.metadata.author.length > 0 && (
              <tr><td>Author(s)</td><td>{data.metadata.author.join(', ')}</td></tr>
            )}
            {data.metadata.date && (
              <tr><td>Date</td><td>{data.metadata.date}</td></tr>
            )}
            <tr><td>Pages</td><td>{data.page_count}</td></tr>
          </tbody>
        </table>
      </div>

      <div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600 }}>Status</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Warnings</span>
            <span className={`zen-badge ${warningCount > 0 ? 'warn' : 'pass'}`} style={{ marginLeft: 'auto' }}>
              {warningCount}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Citations</span>
            <span className={`zen-badge ${citationResolvedPercent === 100 ? 'pass' : 'warn'}`} style={{ marginLeft: 'auto' }}>
              {data.citations.resolved}/{data.citations.total}
            </span>
          </div>
          {data.citations.unresolved && data.citations.unresolved.length > 0 && (
            <div style={{ fontSize: '11px', color: 'var(--mcp-text-secondary)', marginTop: '4px' }}>
              <strong>Unresolved:</strong> {data.citations.unresolved.join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
