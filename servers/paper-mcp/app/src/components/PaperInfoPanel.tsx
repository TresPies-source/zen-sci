import { StatsGrid } from './StatsGrid';

interface Props {
  abstract: string;
  authors: Array<{ name: string; affiliation: string }>;
  stats: { sections: number; figures: number; tables: number; citations: number };
  showAbstract: boolean;
  onToggleAbstract: () => void;
}

export function PaperInfoPanel({ abstract, authors, stats, showAbstract, onToggleAbstract }: Props) {
  return (
    <div>
      <button onClick={onToggleAbstract} style={{ width: '100%', padding: '10px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: 600, textAlign: 'left', color: 'var(--mcp-text-primary, #000)' }}>
        {showAbstract ? '\u25BC' : '\u25B6'} Abstract
      </button>
      {showAbstract && (
        <div style={{ padding: '10px', backgroundColor: 'var(--mcp-bg-secondary, #f9f9f9)', borderRadius: 'var(--zen-radius)', fontSize: '12px', lineHeight: 1.5, marginBottom: '12px', color: 'var(--mcp-text-secondary, #666)' }}>
          {abstract}
        </div>
      )}
      <div style={{ marginBottom: '12px' }}>
        <h4 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Authors</h4>
        <div style={{ fontSize: '11px', color: 'var(--mcp-text-secondary, #666)' }}>
          {authors.map((author, idx) => (
            <div key={idx} style={{ marginBottom: '4px' }}>
              <strong>{author.name}</strong>
              <div style={{ fontSize: '10px', fontStyle: 'italic' }}>{author.affiliation}</div>
            </div>
          ))}
        </div>
      </div>
      <StatsGrid stats={stats} />
    </div>
  );
}
