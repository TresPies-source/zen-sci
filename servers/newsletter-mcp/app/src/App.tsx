import { useApp, useHostStyles } from '@modelcontextprotocol/ext-apps/react';
import { useState, useEffect } from 'react';
import type { CompileNewsletterResult } from './types';
import { MetadataStrip } from './components/MetadataStrip';
import { ClientViewTabs } from './components/ClientViewTabs';
import { CompliancePanel } from './components/CompliancePanel';
import { LinksPanel } from './components/LinksPanel';
import { MJMLSourceTab } from './components/MJMLSourceTab';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { EmptyState } from './components/EmptyState';

type TabName = 'preview' | 'source';

export default function App() {
  const app = useApp();
  const hostStyles = useHostStyles();
  const [data, setData] = useState<CompileNewsletterResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabName>('preview');

  useEffect(() => {
    app.ontoolresult = (result) => {
      try {
        const parsed = JSON.parse(result.content[0].text) as CompileNewsletterResult;
        setData(parsed);
        setError(null);
      } catch {
        setError('Failed to parse tool result');
      }
      setLoading(false);
    };
  }, [app]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState />;

  return (
    <div style={{ ...hostStyles, padding: '16px', fontFamily: 'var(--zen-font-sans)' }}>
      <MetadataStrip metadata={data.metadata} sizeWarning={data.size_warning} />

      <div className="zen-tabs" style={{ marginTop: '16px' }}>
        <button className={`zen-tab ${activeTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveTab('preview')}>Preview</button>
        <button className={`zen-tab ${activeTab === 'source' ? 'active' : ''}`} onClick={() => setActiveTab('source')}>MJML Source</button>
      </div>

      {activeTab === 'preview' && (
        <div style={{ marginTop: '12px' }}>
          <ClientViewTabs htmlContent={data.compiled_html} />
          <CompliancePanel compliance={data.compliance} />
          <LinksPanel links={data.link_list} />
        </div>
      )}

      {activeTab === 'source' && <MJMLSourceTab mjmlSource={data.mjml_source} />}
    </div>
  );
}
