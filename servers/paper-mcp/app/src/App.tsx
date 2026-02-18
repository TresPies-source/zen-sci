import { useApp, useHostStyles } from '@modelcontextprotocol/ext-apps/react';
import { useState, useEffect } from 'react';
import type { ConvertToPaperResult } from './types';
import { PDFPreview } from './components/PDFPreview';
import { FormatSelector } from './components/FormatSelector';
import { PaperInfoPanel } from './components/PaperInfoPanel';
import { WarningsStrip } from './components/WarningsStrip';
import { LaTeXSourceTab } from './components/LaTeXSourceTab';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { EmptyState } from './components/EmptyState';

type TabName = 'preview' | 'source';

export default function App() {
  const app = useApp();
  const hostStyles = useHostStyles();
  const [data, setData] = useState<ConvertToPaperResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabName>('preview');
  const [showAbstract, setShowAbstract] = useState(true);

  useEffect(() => {
    app.ontoolresult = (result) => {
      try {
        const parsed = JSON.parse(result.content[0].text) as ConvertToPaperResult;
        setData(parsed);
        setError(null);
      } catch {
        setError('Failed to parse tool result');
      }
      setLoading(false);
    };
  }, [app]);

  const handleFormatChange = async (format: string) => {
    try {
      await app.callServerTool({
        name: 'convert_to_paper',
        arguments: { source: data?.latex_source || '', title: '', authors: [], format },
      });
    } catch (e) {
      console.error('Format switch failed:', e);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState />;

  return (
    <div style={{ ...hostStyles, padding: '16px', fontFamily: 'var(--zen-font-sans)' }}>
      {data.warnings.length > 0 && <WarningsStrip warnings={data.warnings} />}

      <FormatSelector currentFormat={data.paper_format} onFormatChange={handleFormatChange} loading={loading} />

      <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
        <div style={{ flex: 1 }}>
          <div className="zen-tabs">
            <button className={`zen-tab ${activeTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveTab('preview')}>Preview</button>
            <button className={`zen-tab ${activeTab === 'source' ? 'active' : ''}`} onClick={() => setActiveTab('source')}>LaTeX Source</button>
          </div>
          {activeTab === 'preview' && <PDFPreview pdfBase64={data.pdf_base64} pageCount={data.page_count} />}
          {activeTab === 'source' && <LaTeXSourceTab laTeXSource={data.latex_source} />}
        </div>

        <aside style={{ width: '280px', borderLeft: 'var(--zen-border)', paddingLeft: '16px', maxHeight: '600px', overflowY: 'auto' }}>
          <PaperInfoPanel
            abstract={data.abstract_text}
            authors={data.author_affiliations}
            stats={{ sections: data.section_count, figures: data.figure_count, tables: data.table_count, citations: data.citation_count }}
            showAbstract={showAbstract}
            onToggleAbstract={() => setShowAbstract(!showAbstract)}
          />
        </aside>
      </div>
    </div>
  );
}
