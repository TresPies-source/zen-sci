import { useApp, useHostStyles } from '@modelcontextprotocol/ext-apps/react';
import { useState, useEffect, useRef } from 'react';
import type { ConvertToHtmlResult } from './types';
import { PreviewTab } from './components/PreviewTab';
import { SeoTab } from './components/SeoTab';
import { SourceTab } from './components/SourceTab';
import { ControlsPanel } from './components/ControlsPanel';
import { FeedModal } from './components/FeedModal';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { EmptyState } from './components/EmptyState';

type TabName = 'preview' | 'seo' | 'source';

export default function App() {
  const app = useApp();
  const hostStyles = useHostStyles();
  const [data, setData] = useState<ConvertToHtmlResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabName>('preview');
  const [feedXml, setFeedXml] = useState<string | null>(null);

  // Keep a ref to the latest source args so we can regenerate
  const lastSourceRef = useRef<string>('');

  useEffect(() => {
    app.ontoolresult = (result) => {
      try {
        const text = result.content[0].text;
        const parsed = JSON.parse(text);

        // Detect if this is a feed result (has xml field) or a convert result (has html field)
        if (parsed.xml !== undefined) {
          setFeedXml(parsed.xml as string);
        } else {
          const blogResult = parsed as ConvertToHtmlResult;
          setData(blogResult);
          setError(null);
        }
      } catch {
        setError('Failed to parse tool result');
      }
      setLoading(false);
    };
  }, [app]);

  // Track the source from the latest data for regeneration
  useEffect(() => {
    if (data) {
      // We reconstruct a minimal source from the HTML to re-call the tool.
      // In practice the original markdown source is not in the result,
      // so we store the last known source from the frontmatter title.
      lastSourceRef.current = data.html;
    }
  }, [data]);

  const handleRegenerate = async () => {
    if (!data) return;
    try {
      await app.callServerTool({
        name: 'convert_to_html',
        arguments: {
          source: lastSourceRef.current,
          title: data.frontmatter.title,
        },
      });
    } catch (e) {
      console.error('Regenerate failed:', e);
    }
  };

  const handleGenerateFeed = async () => {
    if (!data) return;
    try {
      await app.callServerTool({
        name: 'generate_feed',
        arguments: {
          posts: [
            {
              title: data.frontmatter.title ?? 'Untitled Post',
              url: data.frontmatter.slug
                ? `https://example.com/blog/${data.frontmatter.slug}`
                : 'https://example.com/blog/post',
              date: data.frontmatter.date ?? new Date().toISOString(),
              summary: data.seo.og.description ?? '',
              tags: data.frontmatter.tags ?? [],
            },
          ],
          feedTitle: 'ZenSci Blog Feed',
          feedUrl: 'https://example.com/feed.xml',
          siteUrl: 'https://example.com',
        },
      });
    } catch (e) {
      console.error('Generate feed failed:', e);
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

      <ControlsPanel onRegenerate={handleRegenerate} onGenerateFeed={handleGenerateFeed} />

      <div className="zen-tabs" style={{ marginTop: '12px' }}>
        <button
          className={`zen-tab ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </button>
        <button
          className={`zen-tab ${activeTab === 'seo' ? 'active' : ''}`}
          onClick={() => setActiveTab('seo')}
        >
          SEO
        </button>
        <button
          className={`zen-tab ${activeTab === 'source' ? 'active' : ''}`}
          onClick={() => setActiveTab('source')}
        >
          Source
        </button>
      </div>

      {activeTab === 'preview' && <PreviewTab data={data} />}
      {activeTab === 'seo' && <SeoTab data={data} />}
      {activeTab === 'source' && <SourceTab html={data.html} />}

      {feedXml && (
        <FeedModal feedXml={feedXml} onClose={() => setFeedXml(null)} />
      )}
    </div>
  );
}
