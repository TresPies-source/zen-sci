import type { ConvertToHtmlResult } from '../types';

interface TwitterCardPreviewProps {
  seo: ConvertToHtmlResult['seo'];
}

export function TwitterCardPreview({ seo }: TwitterCardPreviewProps) {
  const { twitter } = seo;
  const card = twitter.card ?? 'summary';
  const title = twitter.title ?? '(no title)';
  const description = twitter.description ?? '';

  const isLargeImage = card === 'summary_large_image';

  return (
    <div style={{
      border: 'var(--zen-border)',
      borderRadius: 'var(--zen-radius)',
      overflow: 'hidden',
      maxWidth: isLargeImage ? '500px' : '440px',
      boxShadow: 'var(--zen-shadow)',
      background: '#fff',
    }}>
      {isLargeImage && (
        <div style={{
          width: '100%',
          height: '200px',
          background: 'linear-gradient(135deg, #1da1f2 0%, #0d8ecf 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '11px',
          fontWeight: 600,
        }}>
          Large Image Card
        </div>
      )}
      <div style={{
        display: isLargeImage ? 'block' : 'flex',
        gap: isLargeImage ? undefined : '12px',
      }}>
        {!isLargeImage && (
          <div style={{
            width: '120px',
            minHeight: '120px',
            background: 'linear-gradient(135deg, #1da1f2 0%, #0d8ecf 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 600,
            flexShrink: 0,
          }}>
            {card}
          </div>
        )}
        <div style={{ padding: '12px', flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', color: 'var(--mcp-text-primary, #333)' }}>
            {title}
          </div>
          {description && (
            <div style={{ fontSize: '12px', color: 'var(--mcp-text-secondary, #666)', lineHeight: 1.4, marginBottom: '4px' }}>
              {description.length > 200 ? description.slice(0, 200) + '...' : description}
            </div>
          )}
          <div style={{ fontSize: '11px', color: 'var(--mcp-text-secondary, #999)' }}>
            twitter:card = {card}
          </div>
        </div>
      </div>
    </div>
  );
}
