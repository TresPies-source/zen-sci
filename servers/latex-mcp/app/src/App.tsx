import { useApp, useHostStyles } from '@modelcontextprotocol/ext-apps/react';
import { useState, useEffect } from 'react';
import type { ConvertToPdfResult, TexEngine } from './types';
import { PdfViewer } from './components/PdfViewer';
import { LaTeXSource } from './components/LaTeXSource';
import { MetadataPanel } from './components/MetadataPanel';
import { ControlsPanel } from './components/ControlsPanel';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { EmptyState } from './components/EmptyState';

type TabName = 'preview' | 'source';

export default function App() {
  const app = useApp();
  const hostStyles = useHostStyles();
  const [data, setData] = useState<ConvertToPdfResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabName>('preview');

  useEffect(() => {
    app.ontoolresult = (result) => {
      try {
        const parsed = JSON.parse(result.content[0].text) as ConvertToPdfResult;
        setData(parsed);
        setError(null);
      } catch {
        setError('Failed to parse tool result');
      }
      setLoading(false);
    };
  }, [app]);

  const handleReRender = async (engine: TexEngine) => {
    if (!data) return;
    try {
      await app.callServerTool({
        name: 'convert_to_pdf',
        arguments: {
          source: data.latex_source,
          options: { engine },
        },
      });
    } catch (e) {
      console.error('Re-render failed:', e);
    }
  };

  const handleCheckCitations = async () => {
    if (!data) return;
    try {
      await app.callServerTool({
        name: 'check_citations',
        arguments: {
          source: data.latex_source,
          bibliography: '',
        },
      });
    } catch (e) {
      console.error('Citation check failed:', e);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState />;

  return (
    <div style={{ ...hostStyles, padding: '16px', fontFamily: 'var(--zen-font-sans)' }}>
      {data.warnings && data.warnings.length > 0 && (
        <div style={{
          background: '#fffacd',
          border: '1px solid #ffeb3b',
          color: '#333',
          padding: '8px 12px',
          borderRadius: 'var(--zen-radius)',
          marginBottom: '12px',
          fontSize: '12px',
        }}>
          <strong>{data.warnings.length} warning(s):</strong>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
            {data.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      <ControlsPanel data={data} onReRender={handleReRender} onCheckCitations={handleCheckCitations} />

      <div className="zen-tabs" style={{ marginTop: '12px' }}>
        <button
          className={`zen-tab ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </button>
        <button
          className={`zen-tab ${activeTab === 'source' ? 'active' : ''}`}
          onClick={() => setActiveTab('source')}
        >
          LaTeX
        </button>
      </div>

      {activeTab === 'preview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <PdfViewer pdfBase64={data.pdf_base64} pageCount={data.page_count} />
          <MetadataPanel data={data} />
        </div>
      )}
      {activeTab === 'source' && (
        <LaTeXSource source={data.latex_source} />
      )}
    </div>
  );
}
