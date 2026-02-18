import { useState } from 'react';
import type { GrantComplianceData } from '../types';

interface Props {
  data: GrantComplianceData;
  onAgencyChange: (agency: string) => void;
  onRecheck: () => void;
}

export function ComplianceToolbar({ data, onAgencyChange, onRecheck }: Props) {
  const [checking, setChecking] = useState(false);

  const handleRecheck = async () => {
    setChecking(true);
    onRecheck();
    setTimeout(() => setChecking(false), 1000);
  };

  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
      <label style={{ fontSize: '13px' }}>
        Funding Agency:
        <select
          value={data.metadata.funder}
          onChange={(e) => onAgencyChange(e.target.value)}
          disabled={checking}
          style={{ marginLeft: '8px', padding: '6px', borderRadius: 'var(--zen-radius)', border: 'var(--zen-border)' }}
        >
          <option value="nih">NIH</option>
          <option value="nsf">NSF</option>
          <option value="erc">ERC</option>
        </select>
      </label>
      <button
        onClick={handleRecheck}
        disabled={checking}
        style={{ padding: '6px 12px', background: 'var(--mcp-accent, #2563eb)', color: '#fff', border: 'none', borderRadius: '4px', cursor: checking ? 'not-allowed' : 'pointer', opacity: checking ? 0.6 : 1, fontSize: '13px' }}
      >
        {checking ? 'Checking...' : 'Re-check Compliance'}
      </button>
    </div>
  );
}
