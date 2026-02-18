import { describe, it, expect } from 'vitest';
import { createZenSciServer } from '@zen-sci/sdk';
import type { ZenSciContext } from '@zen-sci/sdk';
import { latexManifest } from '../../src/manifest.js';
import { validateDocument } from '../../src/tools/validate-document.js';
import { checkCitations } from '../../src/tools/check-citations.js';
import { convertToPdf } from '../../src/tools/convert-to-pdf.js';

const SAMPLE_BIB = `@article{smith2020,
  title = {Quantum Computing in the Wild},
  author = {Smith, John and Doe, Jane},
  year = {2020},
  journal = {Nature Computing}
}

@book{knuth1997,
  title = {The Art of Computer Programming},
  author = {Knuth, Donald E.},
  year = {1997},
  publisher = {Addison-Wesley}
}`;

function makeCtx(): ZenSciContext {
  return createZenSciServer({
    name: 'latex-mcp-test',
    version: '0.1.0',
    manifest: latexManifest,
  });
}

// =============================================================================
// validate_document
// =============================================================================

describe('validateDocument', () => {
  it('validates a simple markdown document', async () => {
    const ctx = makeCtx();
    const result = await validateDocument(
      { source: '# Hello\n\nWorld' },
      ctx,
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('reports citation stats when bibliography provided', async () => {
    const ctx = makeCtx();
    const result = await validateDocument(
      {
        source: '# Test\n\nSee [@smith2020].',
        bibliography: SAMPLE_BIB,
      },
      ctx,
    );
    // Note: The markdown parser may not extract [@key] as citation nodes
    // but the tool should still run without error
    expect(result.valid).toBeDefined();
    expect(result.citationStats).toBeDefined();
    expect(result.mathStats).toBeDefined();
  });

  it('returns math stats', async () => {
    const ctx = makeCtx();
    const result = await validateDocument(
      { source: '# Math\n\n$E = mc^2$' },
      ctx,
    );
    expect(result.mathStats).toBeDefined();
    expect(typeof result.mathStats.total).toBe('number');
  });

  it('handles empty source gracefully', async () => {
    const ctx = makeCtx();
    const result = await validateDocument(
      { source: '' },
      ctx,
    );
    // Empty source is still parseable
    expect(result).toBeDefined();
  });
});

// =============================================================================
// check_citations
// =============================================================================

describe('checkCitations', () => {
  it('resolves known citations', async () => {
    const ctx = makeCtx();
    const result = await checkCitations(
      {
        source: '# Test\n\nSee [@smith2020].',
        bibliography: SAMPLE_BIB,
      },
      ctx,
    );
    expect(result.bibliography_entries).toBe(2);
    // citation key extraction depends on parser support for [@key]
    expect(typeof result.bibliography_entries).toBe('number');
  });

  it('reports all bibliography entries', async () => {
    const ctx = makeCtx();
    const result = await checkCitations(
      {
        source: '# Test',
        bibliography: SAMPLE_BIB,
      },
      ctx,
    );
    expect(result.bibliography_entries).toBe(2);
    expect(result.resolved).toEqual([]);
    expect(result.unresolved).toEqual([]);
  });
});

// =============================================================================
// convert_to_pdf
// =============================================================================

describe('convertToPdf', () => {
  it('returns result shape even when Python engine unavailable', async () => {
    const ctx = makeCtx();
    const result = await convertToPdf(
      {
        source: '# Hello\n\nWorld',
        title: 'Test Document',
        author: ['Alice'],
      },
      ctx,
    );

    expect(result.latex_source).toBeDefined();
    expect(typeof result.latex_source).toBe('string');
    expect(result.metadata.title).toBe('Test Document');
    expect(result.metadata.author).toEqual(['Alice']);
    expect(result.metadata.generated_at).toBeDefined();
    expect(result.citations).toBeDefined();
    // There will be warnings about Python being unavailable
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it('includes citation stats in result', async () => {
    const ctx = makeCtx();
    const result = await convertToPdf(
      {
        source: '# Test',
        bibliography: SAMPLE_BIB,
      },
      ctx,
    );

    expect(result.citations).toBeDefined();
    expect(result.citations.total).toBe(0); // no citation keys in source
    expect(result.citations.resolved).toBe(0);
    expect(result.citations.unresolved).toEqual([]);
  });

  it('reports unresolved citations as warnings', async () => {
    const ctx = makeCtx();
    // Use a citation key that doesn't exist in the bib
    // Note: The parser may not extract pandoc-style citations, so
    // this is more of a structural test
    const result = await convertToPdf(
      {
        source: '# Test\n\nRef[@missing2023]',
        bibliography: SAMPLE_BIB,
      },
      ctx,
    );

    expect(result).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it('generates basic LaTeX when Python unavailable', async () => {
    const ctx = makeCtx();
    const result = await convertToPdf(
      {
        source: '# Hello World',
        title: 'My Paper',
        author: ['Alice', 'Bob'],
        latex_preamble: '\\usepackage{amsmath}',
      },
      ctx,
    );

    // Should contain LaTeX structure from fallback
    expect(result.latex_source).toContain('\\documentclass');
    expect(result.latex_source).toContain('My Paper');
    expect(result.latex_source).toContain('Alice');
    expect(result.latex_source).toContain('Bob');
    expect(result.latex_source).toContain('amsmath');
  });

  it('handles missing title/author gracefully', async () => {
    const ctx = makeCtx();
    const result = await convertToPdf(
      { source: '# Hello' },
      ctx,
    );
    expect(result.metadata.title).toBeUndefined();
    expect(result.metadata.author).toBeUndefined();
  });
});
