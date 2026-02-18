import { useState } from 'react';

interface Props {
  links: Array<{ text: string; url: string }>;
}

export function LinksPanel({ links }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ marginTop: '12px' }}>
      <button onClick={() => setIsOpen(!isOpen)} style={{ width: '100%', padding: '10px 12px', border: 'var(--zen-border)', borderRadius: 'var(--zen-radius)', backgroundColor: 'var(--mcp-bg-secondary, #f9f9f9)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontWeight: 500 }}>
        <span>Links in Email</span>
        <span style={{ fontSize: '12px', color: 'var(--mcp-text-secondary, #666)' }}>{links.length} link{links.length !== 1 ? 's' : ''}</span>
      </button>
      {isOpen && (
        <div style={{ marginTop: '8px' }}>
          <table className="zen-meta-table" style={{ width: '100%' }}>
            <thead><tr style={{ borderBottom: '2px solid var(--zen-tab-active-bg)', fontWeight: 600, fontSize: '12px' }}><td>Link Text</td><td>URL</td></tr></thead>
            <tbody>
              {links.map((link, idx) => (
                <tr key={idx}><td style={{ maxWidth: '40%', wordBreak: 'break-word' }}>{link.text || '(no text)'}</td><td style={{ color: 'var(--mcp-accent, #2563eb)', fontSize: '12px' }}>{link.url}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
