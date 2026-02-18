import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createZenSciServer } from '@zen-sci/sdk';
import type { ZenSciContext } from '@zen-sci/sdk';
import { newsletterManifest } from '../../src/manifest.js';
import { convertToEmail } from '../../src/tools/convert-to-email.js';
import { validateEmail } from '../../src/tools/validate-email.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_DIR = join(__dirname, '../../fixtures');

function makeCtx(): ZenSciContext {
  return createZenSciServer({
    name: 'newsletter-mcp-integration',
    version: '0.3.0',
    manifest: newsletterManifest,
  });
}

// =============================================================================
// convertToEmail end-to-end
// =============================================================================

describe('convertToEmail end-to-end', () => {
  it('converts sample-newsletter.md to complete HTML', async () => {
    const source = readFileSync(join(FIXTURES_DIR, 'sample-newsletter.md'), 'utf-8');
    const ctx = makeCtx();

    const result = await convertToEmail(
      {
        source,
        subject: 'ZenSci Monthly: February 2026',
        previewText: 'New features, research highlights, and community events',
        unsubscribeUrl: 'https://example.com/unsubscribe',
      },
      ctx,
    );

    expect(result.html).toContain('<!DOCTYPE html>');
    expect(result.html).toContain('<html');
    expect(result.html).toContain('<head');
    expect(result.html).toContain('<body');
    expect(result.html).toContain('</html>');
  });

  it('includes all structural tags', async () => {
    const source = '# Hello\n\nWorld';
    const ctx = makeCtx();

    const result = await convertToEmail(
      { source, subject: 'Test' },
      ctx,
    );

    expect(result.html).toContain('<!DOCTYPE html>');
    expect(result.html).toContain('<html');
    expect(result.html).toContain('<head');
    expect(result.html).toContain('<body');
    expect(result.html).toContain('</body>');
    expect(result.html).toContain('</html>');
  });

  it('produces output under 100KB for simple newsletter', async () => {
    const source = readFileSync(join(FIXTURES_DIR, 'sample-newsletter.md'), 'utf-8');
    const ctx = makeCtx();

    const result = await convertToEmail(
      { source, subject: 'Test Newsletter' },
      ctx,
    );

    expect(result.estimated_size_bytes).toBeLessThan(102400);
  });

  it('includes footer with unsubscribe link', async () => {
    const source = '# Hello\n\nWorld';
    const ctx = makeCtx();

    const result = await convertToEmail(
      {
        source,
        subject: 'Test',
        unsubscribeUrl: 'https://example.com/unsub',
      },
      ctx,
    );

    expect(result.html).toContain('https://example.com/unsub');
    expect(result.html).toContain('Unsubscribe');
  });

  it('always includes footer even without unsubscribe URL', async () => {
    const source = '# Hello\n\nWorld';
    const ctx = makeCtx();

    const result = await convertToEmail(
      { source, subject: 'Test' },
      ctx,
    );

    expect(result.html).toContain('receiving this email');
  });

  it('preserves subject in result', async () => {
    const ctx = makeCtx();

    const result = await convertToEmail(
      { source: '# Hello', subject: 'My Subject Line' },
      ctx,
    );

    expect(result.subject).toBe('My Subject Line');
  });

  it('includes preview text in result when provided', async () => {
    const ctx = makeCtx();

    const result = await convertToEmail(
      {
        source: '# Hello',
        subject: 'Test',
        previewText: 'Preview here',
      },
      ctx,
    );

    expect(result.preview_text).toBe('Preview here');
  });

  it('does not include preview_text key when not provided', async () => {
    const ctx = makeCtx();

    const result = await convertToEmail(
      { source: '# Hello', subject: 'Test' },
      ctx,
    );

    expect('preview_text' in result).toBe(false);
  });

  it('reports char_count and estimated_size_bytes', async () => {
    const ctx = makeCtx();

    const result = await convertToEmail(
      { source: '# Hello\n\nWorld', subject: 'Test' },
      ctx,
    );

    expect(result.char_count).toBeGreaterThan(0);
    expect(result.estimated_size_bytes).toBeGreaterThan(0);
  });

  it('returns empty mjml_errors for valid output', async () => {
    const ctx = makeCtx();

    const result = await convertToEmail(
      { source: '# Hello\n\nWorld', subject: 'Test' },
      ctx,
    );

    expect(result.mjml_errors).toEqual([]);
  });

  it('warns when email exceeds Gmail size threshold', async () => {
    // Create a very large source
    const lines: string[] = ['---\ntitle: Large\n---\n'];
    for (let i = 0; i < 3000; i++) {
      lines.push(`This is line number ${i} with some padding text to inflate the size of the email significantly.\n`);
    }
    const source = lines.join('\n');
    const ctx = makeCtx();

    const result = await convertToEmail(
      { source, subject: 'Large Email' },
      ctx,
    );

    expect(result.warnings.some((w) => w.includes('Gmail'))).toBe(true);
  });
});

// =============================================================================
// validateEmail end-to-end
// =============================================================================

describe('validateEmail end-to-end', () => {
  it('validates sample-newsletter.md as valid', async () => {
    const source = readFileSync(join(FIXTURES_DIR, 'sample-newsletter.md'), 'utf-8');
    const ctx = makeCtx();

    const result = await validateEmail({ source }, ctx);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns estimated size for valid input', async () => {
    const source = '---\ntitle: Test\n---\n\n# Hello\n\nWorld';
    const ctx = makeCtx();

    const result = await validateEmail({ source }, ctx);

    expect(result.estimated_size_bytes).toBeGreaterThan(0);
  });

  it('reports accessibility issues for skipped headings', async () => {
    const source = '---\ntitle: Test\n---\n\n# Title\n\n### Skipped H2\n\nContent';
    const ctx = makeCtx();

    const result = await validateEmail({ source }, ctx);

    expect(result.accessibility_issues.length).toBeGreaterThan(0);
    const issue = result.accessibility_issues[0];
    expect(issue).toBeDefined();
    if (issue) {
      expect(issue.code).toBe('heading-skip');
    }
  });

  it('warns when title is missing from frontmatter', async () => {
    const source = '# Just content\n\nNo frontmatter here.';
    const ctx = makeCtx();

    const result = await validateEmail({ source }, ctx);

    expect(result.warnings.some((w) => w.code === 'missing-title')).toBe(true);
  });

  it('handles empty source', async () => {
    const ctx = makeCtx();

    const result = await validateEmail({ source: '' }, ctx);

    expect(result).toBeDefined();
    expect(typeof result.valid).toBe('boolean');
  });

  it('uses subject fallback when no title in frontmatter', async () => {
    const ctx = makeCtx();

    const result = await validateEmail(
      { source: '# Hello', subject: 'Fallback Subject' },
      ctx,
    );

    expect(result).toBeDefined();
    expect(result.estimated_size_bytes).toBeGreaterThan(0);
  });
});
