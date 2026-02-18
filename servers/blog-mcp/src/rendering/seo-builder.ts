// servers/blog-mcp/src/rendering/seo-builder.ts
// Builds SEO metadata (Open Graph, Twitter Card, Schema.org) from frontmatter.

import type {
  WebMetadataSchema,
  OpenGraphMetadata,
  TwitterCardMetadata,
  SchemaOrgData,
  FrontmatterMetadata,
} from '@zen-sci/core';

// ---------------------------------------------------------------------------
// SEOOptions
// ---------------------------------------------------------------------------

export interface SEOOptions {
  siteUrl?: string;
  siteName?: string;
  twitterHandle?: string;
  defaultImage?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveAuthor(frontmatter: FrontmatterMetadata): string | undefined {
  if (typeof frontmatter.author === 'string') return frontmatter.author;
  if (Array.isArray(frontmatter.author) && frontmatter.author.length > 0) {
    return frontmatter.author[0];
  }
  return undefined;
}

function escapeHtml(value: string): string {
  const str = String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Coerce a frontmatter date value (may be a Date object from gray-matter) to a string.
 */
function coerceDate(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (value instanceof Date) return value.toISOString().split('T')[0];
  if (typeof value === 'string') return value;
  return String(value);
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

export function buildOpenGraph(
  frontmatter: FrontmatterMetadata,
  options: SEOOptions = {},
): OpenGraphMetadata {
  const og: OpenGraphMetadata = {
    title: frontmatter.title ?? 'Untitled',
    type: 'article',
  };

  if (frontmatter.description !== undefined) {
    og.description = frontmatter.description;
  }

  const image = (frontmatter['image'] as string | undefined) ?? options.defaultImage;
  if (image !== undefined) {
    og.image = image;
  }

  if (options.siteUrl !== undefined && frontmatter.title !== undefined) {
    og.url = options.siteUrl;
  }

  if (options.siteName !== undefined) {
    og.siteName = options.siteName;
  }

  const dateStr = coerceDate(frontmatter.date);
  if (dateStr !== undefined) {
    og.publishedTime = dateStr;
  }

  const author = resolveAuthor(frontmatter);
  if (author !== undefined) {
    og.author = author;
  }

  if (frontmatter.tags !== undefined) {
    og.tags = frontmatter.tags;
  }

  if (frontmatter.lang !== undefined) {
    og.locale = frontmatter.lang;
  }

  return og;
}

export function buildTwitterCard(
  frontmatter: FrontmatterMetadata,
  options: SEOOptions = {},
): TwitterCardMetadata {
  const image = (frontmatter['image'] as string | undefined) ?? options.defaultImage;
  const card: TwitterCardMetadata = {
    card: image !== undefined ? 'summary_large_image' : 'summary',
  };

  if (options.twitterHandle !== undefined) {
    card.site = options.twitterHandle;
  }

  if (frontmatter.title !== undefined) {
    card.title = frontmatter.title;
  }

  if (frontmatter.description !== undefined) {
    card.description = frontmatter.description;
  }

  if (image !== undefined) {
    card.image = image;
  }

  return card;
}

export function buildSchemaOrg(
  frontmatter: FrontmatterMetadata,
  options: SEOOptions = {},
): SchemaOrgData {
  const schema: SchemaOrgData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
  };

  if (frontmatter.title !== undefined) {
    schema.headline = frontmatter.title;
  }

  if (frontmatter.description !== undefined) {
    schema.description = frontmatter.description;
  }

  const author = resolveAuthor(frontmatter);
  if (author !== undefined) {
    schema.author = { '@type': 'Person', name: author };
  }

  const dateStr = coerceDate(frontmatter.date);
  if (dateStr !== undefined) {
    schema.datePublished = dateStr;
  }

  const image = (frontmatter['image'] as string | undefined) ?? options.defaultImage;
  if (image !== undefined) {
    schema.image = image;
  }

  if (options.siteUrl !== undefined) {
    schema.url = options.siteUrl;
  }

  if (frontmatter.keywords !== undefined) {
    schema.keywords = frontmatter.keywords.join(', ');
  } else if (frontmatter.tags !== undefined) {
    schema.keywords = frontmatter.tags.join(', ');
  }

  if (options.siteName !== undefined) {
    schema.publisher = { '@type': 'Organization', name: options.siteName };
  }

  return schema;
}

export function buildSEOMetadata(
  frontmatter: FrontmatterMetadata,
  options: SEOOptions = {},
): WebMetadataSchema {
  const meta: WebMetadataSchema = {};

  meta.og = buildOpenGraph(frontmatter, options);
  meta.twitter = buildTwitterCard(frontmatter, options);
  meta.structuredData = buildSchemaOrg(frontmatter, options);

  if (options.siteUrl !== undefined) {
    meta.canonical = options.siteUrl;
  }

  if (frontmatter.lang !== undefined) {
    meta.lang = frontmatter.lang;
  }

  if (frontmatter.description !== undefined) {
    meta.description = frontmatter.description;
  }

  return meta;
}

// ---------------------------------------------------------------------------
// renderToHtmlHead
// ---------------------------------------------------------------------------

export function renderToHtmlHead(meta: WebMetadataSchema): string {
  const lines: string[] = [];

  // Canonical URL
  if (meta.canonical !== undefined) {
    lines.push(`<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`);
  }

  // Lang
  if (meta.lang !== undefined) {
    lines.push(`<meta name="language" content="${escapeHtml(meta.lang)}" />`);
  }

  // Description
  if (meta.description !== undefined) {
    lines.push(`<meta name="description" content="${escapeHtml(meta.description)}" />`);
  }

  // Robots
  if (meta.robots !== undefined) {
    lines.push(`<meta name="robots" content="${escapeHtml(meta.robots)}" />`);
  }

  // Open Graph
  if (meta.og !== undefined) {
    const og = meta.og;
    lines.push(`<meta property="og:title" content="${escapeHtml(og.title)}" />`);
    lines.push(`<meta property="og:type" content="${escapeHtml(og.type)}" />`);
    if (og.description !== undefined) {
      lines.push(`<meta property="og:description" content="${escapeHtml(og.description)}" />`);
    }
    if (og.image !== undefined) {
      lines.push(`<meta property="og:image" content="${escapeHtml(og.image)}" />`);
    }
    if (og.url !== undefined) {
      lines.push(`<meta property="og:url" content="${escapeHtml(og.url)}" />`);
    }
    if (og.siteName !== undefined) {
      lines.push(`<meta property="og:site_name" content="${escapeHtml(og.siteName)}" />`);
    }
    if (og.publishedTime !== undefined) {
      lines.push(`<meta property="article:published_time" content="${escapeHtml(og.publishedTime)}" />`);
    }
    if (og.author !== undefined) {
      lines.push(`<meta property="article:author" content="${escapeHtml(og.author)}" />`);
    }
    if (og.tags !== undefined) {
      for (const tag of og.tags) {
        lines.push(`<meta property="article:tag" content="${escapeHtml(tag)}" />`);
      }
    }
  }

  // Twitter Card
  if (meta.twitter !== undefined) {
    const tc = meta.twitter;
    lines.push(`<meta name="twitter:card" content="${escapeHtml(tc.card)}" />`);
    if (tc.site !== undefined) {
      lines.push(`<meta name="twitter:site" content="${escapeHtml(tc.site)}" />`);
    }
    if (tc.title !== undefined) {
      lines.push(`<meta name="twitter:title" content="${escapeHtml(tc.title)}" />`);
    }
    if (tc.description !== undefined) {
      lines.push(`<meta name="twitter:description" content="${escapeHtml(tc.description)}" />`);
    }
    if (tc.image !== undefined) {
      lines.push(`<meta name="twitter:image" content="${escapeHtml(tc.image)}" />`);
    }
  }

  // Schema.org JSON-LD
  // Escape angle brackets within JSON-LD to prevent HTML injection
  if (meta.structuredData !== undefined) {
    const jsonLd = JSON.stringify(meta.structuredData)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e');
    lines.push(`<script type="application/ld+json">${jsonLd}</script>`);
  }

  return lines.join('\n');
}
