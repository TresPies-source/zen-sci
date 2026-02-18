import type { ConvertToHtmlResult } from '../types';
import { OgCardPreview } from './OgCardPreview';
import { TwitterCardPreview } from './TwitterCardPreview';
import { MetaTagTable } from './MetaTagTable';

interface SeoTabProps {
  data: ConvertToHtmlResult;
}

export function SeoTab({ data }: SeoTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600 }}>Open Graph Preview</h3>
        <OgCardPreview seo={data.seo} />
      </div>

      <div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600 }}>Twitter Card Preview</h3>
        <TwitterCardPreview seo={data.seo} />
      </div>

      <div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600 }}>Meta Tags</h3>
        <MetaTagTable seo={data.seo} frontmatter={data.frontmatter} />
      </div>
    </div>
  );
}
