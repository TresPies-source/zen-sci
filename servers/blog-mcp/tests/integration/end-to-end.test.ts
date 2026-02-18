import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createZenSciServer } from '@zen-sci/sdk';
import type { ZenSciContext } from '@zen-sci/sdk';
import { blogManifest } from '../../src/manifest.js';
import { convertToHtml } from '../../src/tools/convert-to-html.js';
import { validatePost } from '../../src/tools/validate-post.js';
import { generateFeedTool } from '../../src/tools/generate-feed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_DIR = join(__dirname, '../../fixtures');

function makeCtx(): ZenSciContext {
  return createZenSciServer({
    name: 'blog-mcp-integration',
    version: '0.2.0',
    manifest: blogManifest,
  });
}

// =============================================================================
// convertToHtml end-to-end
// =============================================================================

describe('convertToHtml end-to-end', () => {
  it('converts sample-post.md to HTML', async () => {
    const source = readFileSync(join(FIXTURES_DIR, 'sample-post.md'), 'utf-8');
    const bib = readFileSync(join(FIXTURES_DIR, 'sample-post.bib'), 'utf-8');

    const ctx = makeCtx();
    const result = await convertToHtml(
      {
        source,
        bibliography: bib,
        options: {
          seoSiteUrl: 'https://blog.zensci.dev/posts/quantum',
          seoSiteName: 'ZenSci Blog',
          twitterHandle: '@zensci',
        },
      },
      ctx,
    );

    expect(result.html).toContain('<!DOCTYPE html>');
    expect(result.html).toContain('Understanding Quantum Entanglement');
    expect(result.html).toContain('Dr. Alice Chen');
    expect(result.html).toContain('article');
    expect(result.metadata.word_count).toBeGreaterThan(0);
    expect(result.metadata.reading_time_minutes).toBeGreaterThanOrEqual(1);
    expect(result.seo.og).toBeDefined();
    expect(result.seo.twitter).toBeDefined();
    expect(result.seo.structuredData).toBeDefined();
  });

  it('uses title and author overrides', async () => {
    const ctx = makeCtx();
    const result = await convertToHtml(
      {
        source: '# Hello\n\nWorld',
        title: 'Override Title',
        author: 'Override Author',
      },
      ctx,
    );

    expect(result.metadata.title).toBe('Override Title');
    expect(result.metadata.author).toBe('Override Author');
    expect(result.html).toContain('Override Title');
  });

  it('includes citation stats', async () => {
    const source = readFileSync(join(FIXTURES_DIR, 'sample-post.md'), 'utf-8');
    const bib = readFileSync(join(FIXTURES_DIR, 'sample-post.bib'), 'utf-8');

    const ctx = makeCtx();
    const result = await convertToHtml(
      { source, bibliography: bib },
      ctx,
    );

    expect(result.citations).toBeDefined();
    expect(typeof result.citations.total).toBe('number');
    expect(typeof result.citations.resolved).toBe('number');
    expect(Array.isArray(result.citations.unresolved)).toBe(true);
  });

  it('generates TOC when requested', async () => {
    const ctx = makeCtx();
    const result = await convertToHtml(
      {
        source: '# Heading 1\n\n## Heading 2\n\nContent here.',
        options: { toc: true },
      },
      ctx,
    );

    expect(result.html).toContain('Table of Contents');
  });

  it('handles dark theme', async () => {
    const ctx = makeCtx();
    const result = await convertToHtml(
      {
        source: '# Hello\n\nWorld',
        options: { theme: 'dark' },
      },
      ctx,
    );

    expect(result.html).toContain('data-theme="dark"');
  });
});

// =============================================================================
// validatePost end-to-end
// =============================================================================

describe('validatePost end-to-end', () => {
  it('validates sample-post.md', async () => {
    const source = readFileSync(join(FIXTURES_DIR, 'sample-post.md'), 'utf-8');
    const bib = readFileSync(join(FIXTURES_DIR, 'sample-post.bib'), 'utf-8');

    const ctx = makeCtx();
    const result = await validatePost(
      { source, bibliography: bib },
      ctx,
    );

    expect(typeof result.valid).toBe('boolean');
    expect(result.citation_stats).toBeDefined();
    expect(result.math_stats).toBeDefined();
    expect(result.accessibility_issues).toBeDefined();
  });

  it('reports missing frontmatter fields', async () => {
    const ctx = makeCtx();
    const result = await validatePost(
      { source: '# Just a heading\n\nNo frontmatter here.' },
      ctx,
    );

    // Should have warnings about missing title, date, description
    const warningCodes = result.warnings.map((w) => w.code);
    expect(warningCodes).toContain('missing-title');
    expect(warningCodes).toContain('missing-date');
    expect(warningCodes).toContain('missing-description');
  });

  it('reports heading hierarchy issues', async () => {
    const ctx = makeCtx();
    const result = await validatePost(
      { source: '# Title\n\n### Skipped H2\n\nContent' },
      ctx,
    );

    // Should report accessibility issue about skipped heading
    expect(result.accessibility_issues.length).toBeGreaterThan(0);
    const issue = result.accessibility_issues[0];
    expect(issue).toBeDefined();
    if (issue) {
      expect(issue.message).toContain('skipped');
    }
  });

  it('handles empty source', async () => {
    const ctx = makeCtx();
    const result = await validatePost(
      { source: '' },
      ctx,
    );

    expect(result).toBeDefined();
    expect(typeof result.valid).toBe('boolean');
  });
});

// =============================================================================
// generateFeed end-to-end
// =============================================================================

describe('generateFeed end-to-end', () => {
  it('generates Atom feed from post metadata', async () => {
    const ctx = makeCtx();
    const result = await generateFeedTool(
      {
        posts: [
          {
            title: 'First Post',
            url: 'https://example.com/blog/first',
            date: '2026-01-10',
            author: 'Alice',
            summary: 'First post summary',
          },
          {
            title: 'Second Post',
            url: 'https://example.com/blog/second',
            date: '2026-01-20',
          },
        ],
        feedTitle: 'Test Feed',
        feedUrl: 'https://example.com/feed.xml',
        siteUrl: 'https://example.com',
        description: 'A test feed',
      },
      ctx,
    );

    expect(result.feed_xml).toContain('<?xml');
    expect(result.feed_xml).toContain('<feed');
    expect(result.feed_xml).toContain('Test Feed');
    expect(result.feed_xml).toContain('First Post');
    expect(result.feed_xml).toContain('Second Post');
    expect(result.post_count).toBe(2);
    expect(result.generated_at).toBeDefined();
  });

  it('handles empty posts array', async () => {
    const ctx = makeCtx();
    const result = await generateFeedTool(
      {
        posts: [],
        feedTitle: 'Empty Feed',
        feedUrl: 'https://example.com/feed.xml',
        siteUrl: 'https://example.com',
      },
      ctx,
    );

    expect(result.post_count).toBe(0);
    expect(result.feed_xml).toContain('Empty Feed');
    expect(result.feed_xml).not.toContain('<entry>');
  });
});
