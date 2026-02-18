interface Props {
  notes: string;
}

export function SpeakerNotesPanel({ notes }: Props) {
  return (
    <div style={{ marginTop: '12px', padding: '12px', background: 'var(--mcp-bg-secondary, #f9f9f9)', borderRadius: 'var(--zen-radius)', border: 'var(--zen-border)', maxHeight: '180px', overflow: 'auto' }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>Speaker Notes</h4>
      <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.5, color: 'var(--mcp-text-secondary, #666)' }}>
        {notes || '(no notes for this slide)'}
      </p>
    </div>
  );
}
