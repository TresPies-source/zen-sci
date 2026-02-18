import type { ConvertToHtmlResult } from '../types';

interface MetaTagTableProps {
  seo: ConvertToHtmlResult['seo'];
  frontmatter: ConvertToHtmlResult['frontmatter'];
}

interface TagRow {
  category: string;
  name: string;
  value: string;
  present: boolean;
}

function buildRows(seo: ConvertToHtmlResult['seo'], frontmatter: ConvertToHtmlResult['frontmatter']): TagRow[] {
  const rows: TagRow[] = [];

  // Frontmatter fields
  rows.push({ category: 'Frontmatter', name: 'title', value: frontmatter.title ?? '', present: !!frontmatter.title });
  rows.push({ category: 'Frontmatter', name: 'date', value: frontmatter.date ?? '', present: !!frontmatter.date });
  rows.push({ category: 'Frontmatter', name: 'slug', value: frontmatter.slug ?? '', present: !!frontmatter.slug });
  rows.push({ category: 'Frontmatter', name: 'tags', value: (frontmatter.tags ?? []).join(', '), present: !!frontmatter.tags && frontmatter.tags.length > 0 });

  // OG fields
  for (const [key, val] of Object.entries(seo.og)) {
    if (typeof val === 'string') {
      rows.push({ category: 'Open Graph', name: `og:${key}`, value: val, present: !!val });
    }
  }

  // Twitter fields
  for (const [key, val] of Object.entries(seo.twitter)) {
    if (typeof val === 'string') {
      rows.push({ category: 'Twitter', name: `twitter:${key}`, value: val, present: !!val });
    }
  }

  // Schema.org fields
  for (const [key, val] of Object.entries(seo.schema_org)) {
    if (typeof val === 'string') {
      rows.push({ category: 'Schema.org', name: key, value: val, present: !!val });
    }
  }

  return rows;
}

export function MetaTagTable({ seo, frontmatter }: MetaTagTableProps) {
  const rows = buildRows(seo, frontmatter);
  let lastCategory = '';

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="zen-meta-table" style={{ fontSize: '12px' }}>
        <thead>
          <tr style={{ borderBottom: 'var(--zen-border)' }}>
            <td style={{ fontWeight: 600, color: 'var(--mcp-text-primary, #333)' }}>Category</td>
            <td style={{ fontWeight: 600, color: 'var(--mcp-text-primary, #333)' }}>Property</td>
            <td style={{ fontWeight: 600, color: 'var(--mcp-text-primary, #333)' }}>Value</td>
            <td style={{ fontWeight: 600, color: 'var(--mcp-text-primary, #333)', textAlign: 'center', width: '40px' }}>OK</td>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const showCategory = row.category !== lastCategory;
            lastCategory = row.category;
            return (
              <tr key={i}>
                <td style={{
                  fontWeight: showCategory ? 600 : 400,
                  color: showCategory ? 'var(--mcp-text-primary, #333)' : 'transparent',
                }}>
                  {row.category}
                </td>
                <td style={{ fontFamily: 'var(--zen-font-mono)', fontSize: '11px' }}>{row.name}</td>
                <td style={{
                  maxWidth: '300px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: row.present ? 'var(--mcp-text-primary, #333)' : 'var(--mcp-text-secondary, #999)',
                }}>
                  {row.value || '(empty)'}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {row.present ? (
                    <span style={{ color: '#155724', fontWeight: 700, fontSize: '13px' }}>Y</span>
                  ) : (
                    <span style={{ color: '#721c24', fontWeight: 700, fontSize: '13px' }}>N</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
