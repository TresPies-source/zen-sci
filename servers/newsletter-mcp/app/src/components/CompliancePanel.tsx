import { useState } from 'react';

interface Props {
  compliance: { footer_present: boolean; unsubscribe_link_present: boolean };
}

export function CompliancePanel({ compliance }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const allChecked = compliance.footer_present && compliance.unsubscribe_link_present;
  const passCount = [compliance.footer_present, compliance.unsubscribe_link_present].filter(Boolean).length;

  return (
    <div style={{ marginTop: '12px' }}>
      <button onClick={() => setIsOpen(!isOpen)} style={{ width: '100%', padding: '10px 12px', border: 'var(--zen-border)', borderRadius: 'var(--zen-radius)', backgroundColor: 'var(--mcp-bg-secondary, #f9f9f9)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontWeight: 500 }}>
        <span>CAN-SPAM Compliance</span>
        <span className={`zen-badge ${allChecked ? 'pass' : 'warn'}`}>{passCount}/2</span>
      </button>
      {isOpen && (
        <div style={{ marginTop: '8px', paddingLeft: '16px', borderLeft: '2px solid var(--zen-tab-active-bg)', fontSize: '13px' }}>
          <div>{compliance.footer_present ? '\u2713' : '\u2717'} Footer present</div>
          <div>{compliance.unsubscribe_link_present ? '\u2713' : '\u2717'} Unsubscribe link present</div>
          <span className={`zen-badge ${allChecked ? 'pass' : 'fail'}`} style={{ marginTop: '8px' }}>{allChecked ? 'PASS' : 'FAIL'}</span>
        </div>
      )}
    </div>
  );
}
