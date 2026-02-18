interface PdfToolbarProps {
  currentPage: number;
  pageCount: number;
  zoom: number;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
}

export function PdfToolbar({ currentPage, pageCount, zoom, onPageChange, onZoomChange }: PdfToolbarProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 12px',
      background: 'var(--mcp-bg-secondary, #f9f9f9)',
      borderRadius: 'var(--zen-radius)',
      border: 'var(--zen-border)',
      fontSize: '13px',
      flexWrap: 'wrap',
    }}>
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        style={{ padding: '4px 8px', cursor: currentPage === 1 ? 'default' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
      >
        Prev
      </button>
      <span style={{ minWidth: '60px', textAlign: 'center', color: 'var(--mcp-text-secondary)' }}>
        {currentPage} / {pageCount}
      </span>
      <button
        onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
        disabled={currentPage === pageCount}
        style={{ padding: '4px 8px', cursor: currentPage === pageCount ? 'default' : 'pointer', opacity: currentPage === pageCount ? 0.5 : 1 }}
      >
        Next
      </button>

      <div style={{ borderLeft: 'var(--zen-border)', height: '20px' }} />

      <button onClick={() => onZoomChange(Math.max(50, zoom - 10))} style={{ padding: '4px 8px' }}>-</button>
      <span style={{ minWidth: '40px', textAlign: 'center' }}>{zoom}%</span>
      <button onClick={() => onZoomChange(Math.min(300, zoom + 10))} style={{ padding: '4px 8px' }}>+</button>
      <button onClick={() => onZoomChange(100)} style={{ padding: '4px 8px', fontSize: '11px' }}>100%</button>
    </div>
  );
}
