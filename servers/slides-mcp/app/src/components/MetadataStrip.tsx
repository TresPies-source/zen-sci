import type { SlideDeckData } from '../types';

interface Props {
  data: SlideDeckData;
  currentSlide: number;
}

export function MetadataStrip({ data, currentSlide }: Props) {
  const { title, author, theme, slide_count, math_expressions, bibliography_count } = data.metadata;

  return (
    <div style={{ padding: '8px 12px', fontSize: '12px', background: 'var(--mcp-bg-secondary, #f9f9f9)', borderRadius: 'var(--zen-radius)', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '16px', alignItems: 'center' }}>
      <div>
        <strong>{title}</strong>
        {author && <div style={{ color: 'var(--mcp-text-secondary, #666)' }}>{author}</div>}
      </div>
      <div style={{ textAlign: 'center', color: 'var(--mcp-text-secondary, #666)' }}>
        Slide {currentSlide} of {slide_count} · {math_expressions} equations · {bibliography_count} refs
      </div>
      <div style={{ textAlign: 'right' }}>
        <span className="zen-badge info" style={{ background: '#e8f5e9', color: '#2e7d32' }}>{theme}</span>
      </div>
    </div>
  );
}
