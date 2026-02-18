// servers/blog-mcp/src/rendering/rss-generator.ts
// Generates Atom 1.0 XML feeds from post metadata.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PostMetadata {
  title: string;
  url: string;
  date: string;
  author?: string;
  summary?: string;
  content?: string;
  tags?: string[];
}

export interface FeedOptions {
  feedTitle: string;
  feedUrl: string;
  siteUrl: string;
  description?: string;
  author?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isValidDate(dateStr: string): boolean {
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

function toRfc3339(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export function generateFeed(
  posts: PostMetadata[],
  options: FeedOptions,
): string {
  // Validate required fields
  if (!options.feedTitle || options.feedTitle.trim().length === 0) {
    throw new Error('feedTitle is required and must be non-empty');
  }
  if (!options.feedUrl || options.feedUrl.trim().length === 0) {
    throw new Error('feedUrl is required and must be non-empty');
  }
  if (!options.siteUrl || options.siteUrl.trim().length === 0) {
    throw new Error('siteUrl is required and must be non-empty');
  }

  // Validate post dates
  for (const post of posts) {
    if (!isValidDate(post.date)) {
      throw new Error(`Invalid date "${post.date}" for post "${post.title}"`);
    }
  }

  const now = new Date().toISOString();

  // Determine updated time from latest post or now
  const latestDate = posts.length > 0
    ? posts.reduce((latest, post) => {
        const d = new Date(post.date);
        return d > latest ? d : latest;
      }, new Date(0)).toISOString()
    : now;

  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="utf-8"?>`);
  lines.push(`<feed xmlns="http://www.w3.org/2005/Atom">`);
  lines.push(`  <title>${escapeXml(options.feedTitle)}</title>`);
  lines.push(`  <link href="${escapeXml(options.feedUrl)}" rel="self" type="application/atom+xml" />`);
  lines.push(`  <link href="${escapeXml(options.siteUrl)}" rel="alternate" type="text/html" />`);
  lines.push(`  <id>${escapeXml(options.feedUrl)}</id>`);
  lines.push(`  <updated>${latestDate}</updated>`);

  if (options.description !== undefined) {
    lines.push(`  <subtitle>${escapeXml(options.description)}</subtitle>`);
  }

  if (options.author !== undefined) {
    lines.push(`  <author>`);
    lines.push(`    <name>${escapeXml(options.author)}</name>`);
    lines.push(`  </author>`);
  }

  lines.push(`  <generator>ZenSci Blog MCP v0.2.0</generator>`);

  for (const post of posts) {
    lines.push(`  <entry>`);
    lines.push(`    <title>${escapeXml(post.title)}</title>`);
    lines.push(`    <link href="${escapeXml(post.url)}" rel="alternate" type="text/html" />`);
    lines.push(`    <id>${escapeXml(post.url)}</id>`);
    lines.push(`    <updated>${toRfc3339(post.date)}</updated>`);
    lines.push(`    <published>${toRfc3339(post.date)}</published>`);

    if (post.author !== undefined) {
      lines.push(`    <author>`);
      lines.push(`      <name>${escapeXml(post.author)}</name>`);
      lines.push(`    </author>`);
    }

    if (post.summary !== undefined) {
      lines.push(`    <summary type="text">${escapeXml(post.summary)}</summary>`);
    }

    if (post.content !== undefined) {
      lines.push(`    <content type="html">${escapeXml(post.content)}</content>`);
    }

    if (post.tags !== undefined) {
      for (const tag of post.tags) {
        lines.push(`    <category term="${escapeXml(tag)}" />`);
      }
    }

    lines.push(`  </entry>`);
  }

  lines.push(`</feed>`);

  return lines.join('\n');
}
