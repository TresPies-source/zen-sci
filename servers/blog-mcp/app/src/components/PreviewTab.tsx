import { useState } from 'react';
import type { ConvertToHtmlResult } from '../types';

type Viewport = 'desktop' | 'mobile';

interface PreviewTabProps {
  data: ConvertToHtmlResult;
}

export function PreviewTab({ data }: PreviewTabProps) {
  const [viewport, setViewport] = useState<Viewport>('desktop');

  const iframeWidth = viewport === 'mobile' ? '375px' : '100%';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: 'var(--mcp-text-secondary, #666)' }}>Viewport:</span>
        <button
          onClick={() => setViewport('desktop')}
          style={{
            padding: '4px 10px',
            border: 'var(--zen-border)',
            borderRadius: 'var(--zen-radius)',
            background: viewport === 'desktop' ? 'var(--mcp-accent, #2563eb)' : 'transparent',
            color: viewport === 'desktop' ? '#fff' : 'var(--mcp-text-primary, #333)',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Desktop
        </button>
        <button
          onClick={() => setViewport('mobile')}
          style={{
            padding: '4px 10px',
            border: 'var(--zen-border)',
            borderRadius: 'var(--zen-radius)',
            background: viewport === 'mobile' ? 'var(--mcp-accent, #2563eb)' : 'transparent',
            color: viewport === 'mobile' ? '#fff' : 'var(--mcp-text-primary, #333)',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Mobile
        </button>
        <div style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--mcp-text-secondary, #666)' }}>
          {data.word_count} words / {data.reading_time_minutes} min read
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: viewport === 'mobile' ? 'center' : 'stretch',
        background: 'var(--mcp-bg-secondary, #f5f5f5)',
        borderRadius: 'var(--zen-radius)',
        border: 'var(--zen-border)',
        padding: viewport === 'mobile' ? '12px' : '0',
      }}>
        <iframe
          srcDoc={data.html}
          title="Blog Preview"
          sandbox="allow-same-origin"
          style={{
            width: iframeWidth,
            height: '600px',
            border: viewport === 'mobile' ? 'var(--zen-border)' : 'none',
            borderRadius: 'var(--zen-radius)',
            background: '#fff',
          }}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '12px',
        padding: '8px 0',
      }}>
        <div style={{ fontSize: '12px' }}>
          <span style={{ color: 'var(--mcp-text-secondary, #666)' }}>Title: </span>
          <strong>{data.frontmatter.title ?? '(none)'}</strong>
        </div>
        <div style={{ fontSize: '12px' }}>
          <span style={{ color: 'var(--mcp-text-secondary, #666)' }}>Date: </span>
          {data.frontmatter.date ?? '(none)'}
        </div>
        <div style={{ fontSize: '12px' }}>
          <span style={{ color: 'var(--mcp-text-secondary, #666)' }}>Citations: </span>
          <span className={`zen-badge ${data.citations.resolved === data.citations.total ? 'pass' : 'warn'}`}>
            {data.citations.resolved}/{data.citations.total}
          </span>
        </div>
      </div>

      {data.frontmatter.tags && data.frontmatter.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {data.frontmatter.tags.map((tag) => (
            <span key={tag} className="zen-badge info">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}
