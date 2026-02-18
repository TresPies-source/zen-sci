import { describe, it, expect } from 'vitest';
import type { FrontmatterMetadata } from '@zen-sci/core';
import {
  buildSEOMetadata,
  buildOpenGraph,
  buildTwitterCard,
  buildSchemaOrg,
  renderToHtmlHead,
} from '../../src/rendering/seo-builder.js';

const SAMPLE_FRONTMATTER: FrontmatterMetadata = {
  title: 'Test Blog Post',
  author: 'Jane Doe',
  date: '2026-01-15',
  description: 'A test blog post about testing.',
  tags: ['testing', 'blog'],
};

const SAMPLE_OPTIONS = {
  siteUrl: 'https://example.com/blog/test',
  siteName: 'Test Blog',
  twitterHandle: '@testblog',
  defaultImage: 'https://example.com/default.jpg',
};

// =============================================================================
// buildOpenGraph
// =============================================================================

describe('buildOpenGraph', () => {
  it('sets type to article', () => {
    const og = buildOpenGraph(SAMPLE_FRONTMATTER, SAMPLE_OPTIONS);
    expect(og.type).toBe('article');
  });

  it('uses frontmatter title', () => {
    const og = buildOpenGraph(SAMPLE_FRONTMATTER, SAMPLE_OPTIONS);
    expect(og.title).toBe('Test Blog Post');
  });

  it('includes description from frontmatter', () => {
    const og = buildOpenGraph(SAMPLE_FRONTMATTER, SAMPLE_OPTIONS);
    expect(og.description).toBe('A test blog post about testing.');
  });

  it('falls back to defaultImage when no frontmatter image', () => {
    const og = buildOpenGraph(SAMPLE_FRONTMATTER, SAMPLE_OPTIONS);
    expect(og.image).toBe('https://example.com/default.jpg');
  });

  it('uses frontmatter image over default', () => {
    const fm: FrontmatterMetadata = {
      ...SAMPLE_FRONTMATTER,
      image: 'https://example.com/post-image.jpg',
    };
    const og = buildOpenGraph(fm, SAMPLE_OPTIONS);
    expect(og.image).toBe('https://example.com/post-image.jpg');
  });

  it('includes site name from options', () => {
    const og = buildOpenGraph(SAMPLE_FRONTMATTER, SAMPLE_OPTIONS);
    expect(og.siteName).toBe('Test Blog');
  });

  it('includes published time from frontmatter date', () => {
    const og = buildOpenGraph(SAMPLE_FRONTMATTER, SAMPLE_OPTIONS);
    expect(og.publishedTime).toBe('2026-01-15');
  });

  it('includes tags', () => {
    const og = buildOpenGraph(SAMPLE_FRONTMATTER, SAMPLE_OPTIONS);
    expect(og.tags).toEqual(['testing', 'blog']);
  });

  it('defaults title to Untitled when missing', () => {
    const og = buildOpenGraph({}, {});
    expect(og.title).toBe('Untitled');
  });
});

// =============================================================================
// buildTwitterCard
// =============================================================================

describe('buildTwitterCard', () => {
  it('uses summary_large_image when image present', () => {
    const tc = buildTwitterCard(SAMPLE_FRONTMATTER, SAMPLE_OPTIONS);
    // defaultImage is set, so card should be summary_large_image
    expect(tc.card).toBe('summary_large_image');
  });

  it('uses summary when no image available', () => {
    const tc = buildTwitterCard(SAMPLE_FRONTMATTER, {});
    expect(tc.card).toBe('summary');
  });

  it('includes twitter handle from options', () => {
    const tc = buildTwitterCard(SAMPLE_FRONTMATTER, SAMPLE_OPTIONS);
    expect(tc.site).toBe('@testblog');
  });

  it('includes title and description', () => {
    const tc = buildTwitterCard(SAMPLE_FRONTMATTER, SAMPLE_OPTIONS);
    expect(tc.title).toBe('Test Blog Post');
    expect(tc.description).toBe('A test blog post about testing.');
  });
});

// =============================================================================
// buildSchemaOrg
// =============================================================================

describe('buildSchemaOrg', () => {
  it('sets @type to BlogPosting', () => {
    const schema = buildSchemaOrg(SAMPLE_FRONTMATTER, SAMPLE_OPTIONS);
    expect(schema['@type']).toBe('BlogPosting');
  });

  it('sets @context to schema.org', () => {
    const schema = buildSchemaOrg(SAMPLE_FRONTMATTER, SAMPLE_OPTIONS);
    expect(schema['@context']).toBe('https://schema.org');
  });

  it('includes headline and description', () => {
    const schema = buildSchemaOrg(SAMPLE_FRONTMATTER, SAMPLE_OPTIONS);
    expect(schema.headline).toBe('Test Blog Post');
    expect(schema.description).toBe('A test blog post about testing.');
  });

  it('includes author', () => {
    const schema = buildSchemaOrg(SAMPLE_FRONTMATTER, SAMPLE_OPTIONS);
    expect(schema.author).toEqual({ '@type': 'Person', name: 'Jane Doe' });
  });

  it('includes date published', () => {
    const schema = buildSchemaOrg(SAMPLE_FRONTMATTER, SAMPLE_OPTIONS);
    expect(schema.datePublished).toBe('2026-01-15');
  });

  it('builds keywords from tags', () => {
    const schema = buildSchemaOrg(SAMPLE_FRONTMATTER, SAMPLE_OPTIONS);
    expect(schema.keywords).toBe('testing, blog');
  });

  it('includes publisher from siteName', () => {
    const schema = buildSchemaOrg(SAMPLE_FRONTMATTER, SAMPLE_OPTIONS);
    expect(schema.publisher).toEqual({
      '@type': 'Organization',
      name: 'Test Blog',
    });
  });
});

// =============================================================================
// buildSEOMetadata
// =============================================================================

describe('buildSEOMetadata', () => {
  it('returns og, twitter, and structuredData', () => {
    const meta = buildSEOMetadata(SAMPLE_FRONTMATTER, SAMPLE_OPTIONS);
    expect(meta.og).toBeDefined();
    expect(meta.twitter).toBeDefined();
    expect(meta.structuredData).toBeDefined();
  });

  it('sets canonical from siteUrl', () => {
    const meta = buildSEOMetadata(SAMPLE_FRONTMATTER, SAMPLE_OPTIONS);
    expect(meta.canonical).toBe('https://example.com/blog/test');
  });

  it('includes description at top level', () => {
    const meta = buildSEOMetadata(SAMPLE_FRONTMATTER, SAMPLE_OPTIONS);
    expect(meta.description).toBe('A test blog post about testing.');
  });
});

// =============================================================================
// renderToHtmlHead
// =============================================================================

describe('renderToHtmlHead', () => {
  it('produces valid HTML meta tags', () => {
    const meta = buildSEOMetadata(SAMPLE_FRONTMATTER, SAMPLE_OPTIONS);
    const head = renderToHtmlHead(meta);

    expect(head).toContain('og:title');
    expect(head).toContain('og:type');
    expect(head).toContain('twitter:card');
    expect(head).toContain('application/ld+json');
  });

  it('includes canonical link', () => {
    const meta = buildSEOMetadata(SAMPLE_FRONTMATTER, SAMPLE_OPTIONS);
    const head = renderToHtmlHead(meta);
    expect(head).toContain('<link rel="canonical"');
    expect(head).toContain('https://example.com/blog/test');
  });

  it('includes meta description', () => {
    const meta = buildSEOMetadata(SAMPLE_FRONTMATTER, SAMPLE_OPTIONS);
    const head = renderToHtmlHead(meta);
    expect(head).toContain('<meta name="description"');
  });

  it('includes JSON-LD structured data', () => {
    const meta = buildSEOMetadata(SAMPLE_FRONTMATTER, SAMPLE_OPTIONS);
    const head = renderToHtmlHead(meta);
    expect(head).toContain('application/ld+json');
    expect(head).toContain('BlogPosting');
  });

  it('escapes HTML in metadata values', () => {
    const fm: FrontmatterMetadata = {
      title: 'Test <script>alert(1)</script>',
      description: 'Description with "quotes" & <special> chars',
    };
    const meta = buildSEOMetadata(fm, {});
    const head = renderToHtmlHead(meta);
    expect(head).not.toContain('<script>alert(1)</script>');
    expect(head).toContain('&lt;script&gt;');
  });
});
