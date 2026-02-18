import { useApp, useHostStyles } from '@modelcontextprotocol/ext-apps/react';
import { useState, useEffect } from 'react';
import type { SlideDeckData } from './types';
import { MetadataStrip } from './components/MetadataStrip';
import { SlideNavigator } from './components/SlideNavigator';
import { BeamerViewer } from './components/BeamerViewer';
import { RevealViewer } from './components/RevealViewer';
import { SpeakerNotesPanel } from './components/SpeakerNotesPanel';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { EmptyState } from './components/EmptyState';

type FormatView = 'beamer' | 'reveal';

export default function App() {
  const app = useApp();
  const hostStyles = useHostStyles();
  const [data, setData] = useState<SlideDeckData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFormat, setActiveFormat] = useState<FormatView>('beamer');
  const [currentSlide, setCurrentSlide] = useState(1);
  const [showNotes, setShowNotes] = useState(true);

  useEffect(() => {
    app.ontoolresult = (result) => {
      try {
        const parsed = JSON.parse(result.content[0].text) as SlideDeckData;
        setData(parsed);
        setError(null);
        setCurrentSlide(1);
        if (parsed.format === 'slides-html') setActiveFormat('reveal');
        else setActiveFormat('beamer');
      } catch {
        setError('Failed to parse tool result');
      }
      setLoading(false);
    };
  }, [app]);

  const prevSlide = () => setCurrentSlide((s) => Math.max(1, s - 1));
  const nextSlide = () => setCurrentSlide((s) => Math.min(data?.metadata.slide_count || 1, s + 1));

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState />;

  const currentNotes = data.metadata.slides[currentSlide - 1]?.speaker_notes || '';

  return (
    <div style={{ ...hostStyles, padding: '16px', fontFamily: 'var(--zen-font-sans)', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', padding: '12px', background: 'var(--mcp-bg-secondary, #f9f9f9)', borderRadius: 'var(--zen-radius)' }}>
        <div className="zen-tabs" style={{ margin: 0, borderBottom: 'none' }}>
          <button className={`zen-tab ${activeFormat === 'beamer' ? 'active' : ''}`} onClick={() => setActiveFormat('beamer')} disabled={!data.content.beamer}>Beamer (PDF)</button>
          <button className={`zen-tab ${activeFormat === 'reveal' ? 'active' : ''}`} onClick={() => setActiveFormat('reveal')} disabled={!data.content.reveal}>Reveal.js</button>
        </div>
        <button onClick={() => setShowNotes(!showNotes)} style={{ marginLeft: 'auto', padding: '6px 12px', background: showNotes ? 'var(--mcp-accent, #2563eb)' : 'transparent', color: showNotes ? '#fff' : 'var(--mcp-text, #000)', border: 'var(--zen-border)', borderRadius: 'var(--zen-radius)', cursor: 'pointer', fontSize: '13px' }}>
          {showNotes ? 'Notes On' : 'Notes Off'}
        </button>
      </div>

      <MetadataStrip data={data} currentSlide={currentSlide} />

      <div style={{ display: 'flex', gap: '12px', flex: 1, overflow: 'hidden', marginTop: '12px' }}>
        <SlideNavigator slides={data.metadata.slides} currentSlide={currentSlide} onSelectSlide={setCurrentSlide} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeFormat === 'beamer' && data.content.beamer && (
            <BeamerViewer pdfBase64={data.content.beamer} currentSlide={currentSlide} onPrev={prevSlide} onNext={nextSlide} slideCount={data.metadata.slide_count} />
          )}
          {activeFormat === 'reveal' && data.content.reveal && (
            <RevealViewer htmlContent={data.content.reveal} />
          )}
          {showNotes && <SpeakerNotesPanel notes={currentNotes} />}
        </div>
      </div>
    </div>
  );
}
