import type { AttachmentStatus } from '../types';

interface Props {
  attachments: AttachmentStatus[];
}

export function AttachmentsPanel({ attachments }: Props) {
  return (
    <div style={{ marginTop: '16px' }}>
      <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>Required Attachments</h3>
      <table className="zen-meta-table" style={{ width: '100%' }}>
        <thead style={{ background: 'var(--mcp-border, #f0f0f0)' }}>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px' }}>File Role</th>
            <th style={{ textAlign: 'center', padding: '8px', fontSize: '12px' }}>Required</th>
            <th style={{ textAlign: 'center', padding: '8px', fontSize: '12px' }}>Present</th>
          </tr>
        </thead>
        <tbody>
          {attachments.map((att, idx) => (
            <tr key={idx}>
              <td style={{ padding: '8px' }}>{att.role}</td>
              <td style={{ textAlign: 'center', padding: '8px' }}>{att.required ? 'Yes' : 'No'}</td>
              <td style={{ textAlign: 'center', padding: '8px' }}>
                <span style={{ color: att.present ? '#4caf50' : '#f44336', fontWeight: 500 }}>
                  {att.present ? '\u2713 Yes' : '\u2717 No'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
