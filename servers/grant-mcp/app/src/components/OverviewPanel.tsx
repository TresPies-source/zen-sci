import type { GrantComplianceData } from '../types';

interface Props {
  data: GrantComplianceData;
}

export function OverviewPanel({ data }: Props) {
  const { funder, program_type, compliance_status, page_count, word_count, budget_total, budget_overhead } = data.metadata;
  const agencyColors: Record<string, { bg: string; color: string }> = {
    nih: { bg: '#ffebee', color: '#c62828' },
    nsf: { bg: '#e3f2fd', color: '#1565c0' },
    erc: { bg: '#f3e5f5', color: '#6a1b9a' },
  };
  const statusClass = compliance_status === 'compliant' ? 'pass' : compliance_status === 'warning' ? 'warn' : 'fail';
  const statusLabel = compliance_status === 'compliant' ? 'Compliant' : compliance_status === 'warning' ? 'Warning' : 'Non-Compliant';

  return (
    <div style={{ padding: '16px', borderRadius: 'var(--zen-radius)', border: 'var(--zen-border)' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
        <span className="zen-badge" style={agencyColors[funder] || agencyColors.nih}>
          {funder.toUpperCase()} {program_type}
        </span>
        <span className={`zen-badge ${statusClass}`}>{statusLabel}</span>
      </div>
      <table className="zen-meta-table">
        <tbody>
          <tr><td>Page Count</td><td>{page_count} pages</td></tr>
          <tr><td>Word Count</td><td>{word_count.toLocaleString()} words</td></tr>
          <tr><td>Budget Total</td><td>${budget_total.toLocaleString()}</td></tr>
          <tr><td>Indirect Costs</td><td>${budget_overhead.toLocaleString()}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
