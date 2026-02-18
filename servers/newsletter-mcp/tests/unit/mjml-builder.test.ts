import { describe, it, expect } from 'vitest';
import type { FrontmatterMetadata } from '@zen-sci/core';
import { MJMLBuilder } from '../../src/rendering/mjml-builder.js';
import type { EmailOptions } from '../../src/rendering/mjml-builder.js';

// =============================================================================
// Test data
// =============================================================================

const SIMPLE_MD = `---
title: Test Newsletter
author: Alice
date: 2026-02-15
---

# Welcome

Hello world! This is a test paragraph.

## Section Two

More content here with **bold** and *italic* text.
`;

const FRONTMATTER: FrontmatterMetadata = {
  title: 'Test Newsletter',
  author: 'Alice',
  date: '2026-02-15',
};

const BASE_OPTIONS: EmailOptions = {
  subject: 'Test Subject',
};

// =============================================================================
// MJMLBuilder
// =============================================================================

describe('MJMLBuilder', () => {
  const builder = new MJMLBuilder();

  it('generates complete HTML document with DOCTYPE', () => {
    const html = builder.build(SIMPLE_MD, FRONTMATTER, BASE_OPTIONS);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });

  it('includes head with charset and viewport meta', () => {
    const html = builder.build(SIMPLE_MD, FRONTMATTER, BASE_OPTIONS);
    expect(html).toContain('<head>');
    expect(html).toContain('charset="utf-8"');
    expect(html).toContain('viewport');
  });

  it('includes body tag', () => {
    const html = builder.build(SIMPLE_MD, FRONTMATTER, BASE_OPTIONS);
    expect(html).toContain('<body');
    expect(html).toContain('</body>');
  });

  it('renders markdown content as table-based HTML', () => {
    const html = builder.build(SIMPLE_MD, FRONTMATTER, BASE_OPTIONS);
    expect(html).toContain('role="presentation"');
    expect(html).toContain('Welcome');
    expect(html).toContain('Section Two');
  });

  it('always includes footer', () => {
    const html = builder.build(SIMPLE_MD, FRONTMATTER, BASE_OPTIONS);
    expect(html).toContain('receiving this email');
  });

  it('includes logo URL when provided', () => {
    const options: EmailOptions = {
      ...BASE_OPTIONS,
      logoUrl: 'https://example.com/logo.png',
    };
    const html = builder.build(SIMPLE_MD, FRONTMATTER, options);
    expect(html).toContain('https://example.com/logo.png');
    expect(html).toContain('<img');
  });

  it('does not include logo img when logoUrl not provided', () => {
    const html = builder.build(SIMPLE_MD, FRONTMATTER, BASE_OPTIONS);
    // The header should not contain a logo img
    // (but content images might exist in the body)
    expect(html).not.toContain('alt="Logo"');
  });

  it('includes unsubscribe link in footer', () => {
    const options: EmailOptions = {
      ...BASE_OPTIONS,
      unsubscribeUrl: 'https://example.com/unsubscribe',
    };
    const html = builder.build(SIMPLE_MD, FRONTMATTER, options);
    expect(html).toContain('https://example.com/unsubscribe');
    expect(html).toContain('Unsubscribe');
  });

  it('includes preview text when provided', () => {
    const options: EmailOptions = {
      ...BASE_OPTIONS,
      previewText: 'This is preview text for email clients',
    };
    const html = builder.build(SIMPLE_MD, FRONTMATTER, options);
    expect(html).toContain('This is preview text for email clients');
  });

  it('does not include preview div when previewText not provided', () => {
    const html = builder.build(SIMPLE_MD, FRONTMATTER, BASE_OPTIONS);
    expect(html).not.toContain('max-height: 0; overflow: hidden');
  });

  it('uses custom brand color', () => {
    const options: EmailOptions = {
      ...BASE_OPTIONS,
      brandColor: '#ff5722',
    };
    const html = builder.build(SIMPLE_MD, FRONTMATTER, options);
    expect(html).toContain('#ff5722');
  });

  it('uses custom footer text', () => {
    const options: EmailOptions = {
      ...BASE_OPTIONS,
      footerText: 'Custom footer message here.',
    };
    const html = builder.build(SIMPLE_MD, FRONTMATTER, options);
    expect(html).toContain('Custom footer message here.');
  });

  it('includes title from frontmatter in header', () => {
    const html = builder.build(SIMPLE_MD, FRONTMATTER, BASE_OPTIONS);
    expect(html).toContain('Test Newsletter');
  });

  it('falls back to subject when frontmatter has no title', () => {
    const html = builder.build('# Hello\n\nWorld', {}, BASE_OPTIONS);
    expect(html).toContain('Test Subject');
  });

  it('includes date from frontmatter', () => {
    const html = builder.build(SIMPLE_MD, FRONTMATTER, BASE_OPTIONS);
    expect(html).toContain('2026-02-15');
  });

  it('renders bold text as <strong>', () => {
    const html = builder.build(SIMPLE_MD, FRONTMATTER, BASE_OPTIONS);
    expect(html).toContain('<strong>bold</strong>');
  });

  it('renders italic text as <em>', () => {
    const html = builder.build(SIMPLE_MD, FRONTMATTER, BASE_OPTIONS);
    expect(html).toContain('<em>italic</em>');
  });

  it('renders CTA buttons', () => {
    const md = `---
title: Test
---

[CTA: Click Here](https://example.com)
`;
    const html = builder.build(md, { title: 'Test' }, BASE_OPTIONS);
    expect(html).toContain('https://example.com');
    expect(html).toContain('Click Here');
    expect(html).toContain('background-color:');
  });

  it('renders code blocks', () => {
    const md = `---
title: Test
---

\`\`\`javascript
console.log("hello");
\`\`\`
`;
    const html = builder.build(md, { title: 'Test' }, BASE_OPTIONS);
    expect(html).toContain('console.log');
    expect(html).toContain('monospace');
  });

  it('renders horizontal rules as dividers', () => {
    const md = `---
title: Test
---

Above

---

Below
`;
    const html = builder.build(md, { title: 'Test' }, BASE_OPTIONS);
    expect(html).toContain('<hr');
  });

  it('renders images', () => {
    const md = `---
title: Test
---

![Alt text](https://example.com/image.png)
`;
    const html = builder.build(md, { title: 'Test' }, BASE_OPTIONS);
    expect(html).toContain('src="https://example.com/image.png"');
    expect(html).toContain('alt="Alt text"');
  });

  it('includes inline styles (no external CSS)', () => {
    const html = builder.build(SIMPLE_MD, FRONTMATTER, BASE_OPTIONS);
    expect(html).toContain('<style');
    // Main content should use inline styles too
    expect(html).toContain('style="');
  });
});
