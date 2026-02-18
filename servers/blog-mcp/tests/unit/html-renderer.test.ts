import { describe, it, expect } from 'vitest';
import type { FrontmatterMetadata, WebMetadataSchema } from '@zen-sci/core';
import { HTMLRenderer } from '../../src/rendering/html-renderer.js';

const SIMPLE_MD = `---
title: Test Post
author: Alice
date: 2026-01-15
---

# Introduction

Hello world! This is a test paragraph.

## Code Example

\`\`\`javascript
console.log("hello");
\`\`\`

## External Links

Visit [Example](https://example.com) for more info.
Also see [local page](/about) for details.
`;

const FRONTMATTER: FrontmatterMetadata = {
  title: 'Test Post',
  author: 'Alice',
  date: '2026-01-15',
};

const META: WebMetadataSchema = {
  og: {
    title: 'Test Post',
    type: 'article',
  },
};

// =============================================================================
// HTMLRenderer
// =============================================================================

describe('HTMLRenderer', () => {
  const renderer = new HTMLRenderer();

  it('renders a complete HTML document', () => {
    const html = renderer.render(SIMPLE_MD, FRONTMATTER, META);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });

  it('wraps content in article role=main', () => {
    const html = renderer.render(SIMPLE_MD, FRONTMATTER, META);
    expect(html).toContain('<article role="main">');
    expect(html).toContain('</article>');
  });

  it('adds id attributes to headings', () => {
    const html = renderer.render(SIMPLE_MD, FRONTMATTER, META);
    expect(html).toContain('id="introduction"');
    expect(html).toContain('id="code-example"');
    expect(html).toContain('id="external-links"');
  });

  it('adds target=_blank to external links', () => {
    const html = renderer.render(SIMPLE_MD, FRONTMATTER, META);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('does not add target=_blank to local links', () => {
    const html = renderer.render(SIMPLE_MD, FRONTMATTER, META);
    // The local link /about should not have target=_blank
    const aboutLinkMatch = html.match(/<a href="\/about"[^>]*>/);
    expect(aboutLinkMatch).toBeTruthy();
    if (aboutLinkMatch) {
      expect(aboutLinkMatch[0]).not.toContain('target="_blank"');
    }
  });

  it('includes article header with title', () => {
    const html = renderer.render(SIMPLE_MD, FRONTMATTER, META);
    expect(html).toContain('<h1>Test Post</h1>');
  });

  it('includes article header with author', () => {
    const html = renderer.render(SIMPLE_MD, FRONTMATTER, META);
    expect(html).toContain('By Alice');
  });

  it('includes article header with date', () => {
    const html = renderer.render(SIMPLE_MD, FRONTMATTER, META);
    expect(html).toContain('2026-01-15');
    expect(html).toContain('<time');
  });

  it('wraps code blocks in pre/code with language class', () => {
    const html = renderer.render(SIMPLE_MD, FRONTMATTER, META);
    expect(html).toContain('language-javascript');
    expect(html).toContain('console.log');
  });

  it('includes embedded CSS by default', () => {
    const html = renderer.render(SIMPLE_MD, FRONTMATTER, META);
    expect(html).toContain('<style>');
  });

  it('respects embedCSS=false', () => {
    const html = renderer.render(SIMPLE_MD, FRONTMATTER, META, {
      embedCSS: false,
    });
    expect(html).not.toContain('<style>');
  });

  it('renders table of contents when toc=true', () => {
    const html = renderer.render(SIMPLE_MD, FRONTMATTER, META, {
      toc: true,
    });
    expect(html).toContain('Table of Contents');
    expect(html).toContain('nav');
    expect(html).toContain('#introduction');
  });

  it('does not render TOC when toc is not set', () => {
    const html = renderer.render(SIMPLE_MD, FRONTMATTER, META);
    expect(html).not.toContain('Table of Contents');
  });

  it('sets data-theme attribute', () => {
    const html = renderer.render(SIMPLE_MD, FRONTMATTER, META, {
      cssTheme: 'dark',
    });
    expect(html).toContain('data-theme="dark"');
  });

  it('defaults to system theme', () => {
    const html = renderer.render(SIMPLE_MD, FRONTMATTER, META);
    expect(html).toContain('data-theme="system"');
  });

  it('handles empty source gracefully', () => {
    const html = renderer.render('', {}, META);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Untitled');
  });

  it('includes SEO meta tags', () => {
    const html = renderer.render(SIMPLE_MD, FRONTMATTER, META);
    expect(html).toContain('og:title');
  });

  it('renders tags when present in frontmatter', () => {
    const fm: FrontmatterMetadata = {
      ...FRONTMATTER,
      tags: ['test', 'blog'],
    };
    const html = renderer.render(SIMPLE_MD, fm, META);
    expect(html).toContain('class="tag"');
    expect(html).toContain('test');
    expect(html).toContain('blog');
  });
});
