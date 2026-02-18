import type { SlideData } from '../types';

interface Props {
  slides: SlideData[];
  currentSlide: number;
  onSelectSlide: (slide: number) => void;
}

export function SlideNavigator({ slides, currentSlide, onSelectSlide }: Props) {
  return (
    <div style={{ width: '120px', borderRight: 'var(--zen-border)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {slides.map((slide) => (
        <button key={slide.slide_number} onClick={() => onSelectSlide(slide.slide_number)} style={{ padding: '8px', border: 'none', background: currentSlide === slide.slide_number ? 'var(--mcp-accent, #2563eb)' : 'transparent', color: currentSlide === slide.slide_number ? '#fff' : 'var(--mcp-text, #000)', textAlign: 'left', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {slide.slide_number}. {slide.title || 'Untitled'}
        </button>
      ))}
    </div>
  );
}
