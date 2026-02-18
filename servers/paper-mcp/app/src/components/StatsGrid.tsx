interface Props {
  stats: { sections: number; figures: number; tables: number; citations: number };
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: '10px', backgroundColor: 'var(--mcp-bg-secondary, #f9f9f9)', borderRadius: 'var(--zen-radius)', textAlign: 'center' }}>
      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--zen-tab-active-bg, #2563eb)' }}>{value}</div>
      <div style={{ fontSize: '10px', color: 'var(--mcp-text-secondary, #666)', marginTop: '2px' }}>{label}</div>
    </div>
  );
}

export function StatsGrid({ stats }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
      <StatItem label="Sections" value={stats.sections} />
      <StatItem label="Figures" value={stats.figures} />
      <StatItem label="Tables" value={stats.tables} />
      <StatItem label="Citations" value={stats.citations} />
    </div>
  );
}
