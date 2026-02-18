import type { SectionStatus } from '../types';

interface Props {
  sections: SectionStatus[];
}

export function SectionChecklist({ sections }: Props) {
  const statusIcon = (status: string) => status === 'pass' ? '\u2713' : status === 'warn' ? '\u26A0' : '\u2717';
  const statusColor = (status: string) => status === 'pass' ? '#4caf50' : status === 'warn' ? '#ff9800' : '#f44336';

  return (
    <div style={{ marginTop: '16px' }}>
      <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>Section Checklist</h3>
      <div style={{ maxHeight: '400px', overflowY: 'auto', border: 'var(--zen-border)', borderRadius: 'var(--zen-radius)' }}>
        {sections.map((section, idx) => (
          <div key={idx} style={{ padding: '12px', borderBottom: 'var(--zen-border)', display: 'grid', gridTemplateColumns: '1fr 60px 80px', gap: '12px', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: '13px' }}>{section.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--mcp-text-secondary, #666)' }}>
                {section.page_count} / {section.required_pages} pages · {section.word_count} words
              </div>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: statusColor(section.status), color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
              {statusIcon(section.status)}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--mcp-text-secondary, #666)', textAlign: 'right' }}>
              {section.required ? 'Required' : 'Optional'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
