import type { ConvertToHtmlResult } from '../types';

interface OgCardPreviewProps {
  seo: ConvertToHtmlResult['seo'];
}

export function OgCardPreview({ seo }: OgCardPreviewProps) {
  const { og } = seo;
  const title = og.title ?? '(no title)';
  const description = og.description ?? '';
  const type = og.type ?? 'article';
  const image = og.image;

  return (
    <div style={{
      border: 'var(--zen-border)',
      borderRadius: 'var(--zen-radius)',
      overflow: 'hidden',
      maxWidth: '500px',
      boxShadow: 'var(--zen-shadow)',
      background: '#fff',
    }}>
      {image && (
        <div style={{
          width: '100%',
          height: '200px',
          background: `url(${image}) center/cover no-repeat`,
          backgroundColor: 'var(--mcp-bg-secondary, #f0f0f0)',
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--mcp-text-secondary, #999)',
            fontSize: '12px',
          }}>
            og:image preview
          </div>
        </div>
      )}
      {!image && (
        <div style={{
          width: '100%',
          height: '120px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '11px',
          fontWeight: 600,
        }}>
          No og:image set
        </div>
      )}
      <div style={{ padding: '12px 16px' }}>
        <div style={{ fontSize: '11px', color: 'var(--mcp-text-secondary, #999)', marginBottom: '4px', textTransform: 'uppercase' }}>
          {type}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', color: 'var(--mcp-text-primary, #333)' }}>
          {title}
        </div>
        {description && (
          <div style={{ fontSize: '12px', color: 'var(--mcp-text-secondary, #666)', lineHeight: 1.4 }}>
            {description.length > 160 ? description.slice(0, 160) + '...' : description}
          </div>
        )}
      </div>
    </div>
  );
}
