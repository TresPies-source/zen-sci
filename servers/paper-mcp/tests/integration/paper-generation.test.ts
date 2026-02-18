import { describe, it, expect } from 'vitest';
import { createZenSciServer } from '@zen-sci/sdk';
import type { ZenSciContext } from '@zen-sci/sdk';
import { paperManifest } from '../../src/manifest.js';
import { convertToPaper } from '../../src/tools/convert-to-paper.js';
import type { ConvertToPaperArgs } from '../../src/tools/convert-to-paper.js';
import { validateSubmission } from '../../src/tools/validate-submission.js';
import type { ValidateSubmissionArgs } from '../../src/tools/validate-submission.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCtx(): ZenSciContext {
  return createZenSciServer({
    name: 'paper-mcp-test',
    version: '0.1.0',
    manifest: paperManifest,
  });
}

const SAMPLE_SOURCE = `# Introduction

Quantum computing enables exponential speedups for many problems.

## Background

The surface code is a leading candidate for fault-tolerant quantum computing.

# Methods

We implement a novel decoder based on union-find algorithms.

# Results

Our decoder achieves a threshold of $p_{th} = 1.1 \\times 10^{-2}$.

# Conclusion

We demonstrated improved quantum error correction.
`;

const SAMPLE_AUTHORS: ConvertToPaperArgs['authors'] = [
  { name: 'Alice Researcher', affiliation: 'MIT', email: 'alice@mit.edu' },
  { name: 'Bob Scientist', affiliation: 'Stanford' },
];

const SAMPLE_ABSTRACT =
  'We present a novel approach to quantum error correction using topological surface codes.';

// ---------------------------------------------------------------------------
// convertToPaper tests
// ---------------------------------------------------------------------------

describe('convertToPaper', () => {
  it('generates IEEE LaTeX with \\documentclass[conference]{IEEEtran}', async () => {
    const ctx = makeCtx();
    const result = await convertToPaper(
      {
        source: SAMPLE_SOURCE,
        title: 'Test Paper',
        authors: SAMPLE_AUTHORS,
        format: 'paper-ieee',
        abstract: SAMPLE_ABSTRACT,
      },
      ctx,
    );

    expect(result.latex_source).toContain(
      '\\documentclass[conference]{IEEEtran}',
    );
    expect(result.format).toBe('paper-ieee');
    expect(result.column_count).toBe(2);
  });

  it('generates ACM LaTeX with \\documentclass[sigconf]{acmart}', async () => {
    const ctx = makeCtx();
    const result = await convertToPaper(
      {
        source: SAMPLE_SOURCE,
        title: 'ACM Paper',
        authors: SAMPLE_AUTHORS,
        format: 'paper-acm',
        abstract: SAMPLE_ABSTRACT,
      },
      ctx,
    );

    expect(result.latex_source).toContain(
      '\\documentclass[sigconf]{acmart}',
    );
    expect(result.format).toBe('paper-acm');
    expect(result.column_count).toBe(2);
  });

  it('generates arXiv LaTeX with \\documentclass[a4paper]{article}', async () => {
    const ctx = makeCtx();
    const result = await convertToPaper(
      {
        source: SAMPLE_SOURCE,
        title: 'arXiv Paper',
        authors: SAMPLE_AUTHORS,
        format: 'paper-arxiv',
        abstract: SAMPLE_ABSTRACT,
      },
      ctx,
    );

    expect(result.latex_source).toContain(
      '\\documentclass[a4paper]{article}',
    );
    expect(result.format).toBe('paper-arxiv');
    expect(result.column_count).toBe(1);
  });

  it('includes \\begin{abstract} when abstract is provided', async () => {
    const ctx = makeCtx();
    const result = await convertToPaper(
      {
        source: SAMPLE_SOURCE,
        title: 'Test Paper',
        authors: SAMPLE_AUTHORS,
        format: 'paper-ieee',
        abstract: SAMPLE_ABSTRACT,
      },
      ctx,
    );

    expect(result.latex_source).toContain('\\begin{abstract}');
    expect(result.latex_source).toContain('\\end{abstract}');
    expect(result.latex_source).toContain(SAMPLE_ABSTRACT);
  });

  it('includes abstract_word_count when abstract is provided', async () => {
    const ctx = makeCtx();
    const result = await convertToPaper(
      {
        source: SAMPLE_SOURCE,
        title: 'Test Paper',
        authors: SAMPLE_AUTHORS,
        format: 'paper-ieee',
        abstract: SAMPLE_ABSTRACT,
      },
      ctx,
    );

    expect(result.abstract_word_count).toBeDefined();
    expect(result.abstract_word_count).toBeGreaterThan(0);
  });

  it('omits abstract_word_count when no abstract', async () => {
    const ctx = makeCtx();
    const result = await convertToPaper(
      {
        source: SAMPLE_SOURCE,
        title: 'Test Paper',
        authors: SAMPLE_AUTHORS,
        format: 'paper-arxiv',
      },
      ctx,
    );

    expect(result.abstract_word_count).toBeUndefined();
  });

  it('includes \\IEEEauthorblockN for IEEE authors', async () => {
    const ctx = makeCtx();
    const result = await convertToPaper(
      {
        source: SAMPLE_SOURCE,
        title: 'IEEE Paper',
        authors: SAMPLE_AUTHORS,
        format: 'paper-ieee',
        abstract: SAMPLE_ABSTRACT,
      },
      ctx,
    );

    expect(result.latex_source).toContain('\\IEEEauthorblockN{Alice Researcher}');
    expect(result.latex_source).toContain('\\IEEEauthorblockN{Bob Scientist}');
  });

  it('includes \\IEEEkeywords for IEEE with keywords', async () => {
    const ctx = makeCtx();
    const result = await convertToPaper(
      {
        source: SAMPLE_SOURCE,
        title: 'IEEE Paper',
        authors: SAMPLE_AUTHORS,
        format: 'paper-ieee',
        abstract: SAMPLE_ABSTRACT,
        keywords: ['quantum', 'error correction'],
      },
      ctx,
    );

    expect(result.latex_source).toContain('\\begin{IEEEkeywords}');
    expect(result.latex_source).toContain('quantum, error correction');
    expect(result.latex_source).toContain('\\end{IEEEkeywords}');
  });

  it('converts markdown headings to LaTeX sections', async () => {
    const ctx = makeCtx();
    const result = await convertToPaper(
      {
        source: SAMPLE_SOURCE,
        title: 'Test Paper',
        authors: [{ name: 'Author' }],
        format: 'paper-arxiv',
      },
      ctx,
    );

    expect(result.latex_source).toContain('\\section{Introduction}');
    expect(result.latex_source).toContain('\\subsection{Background}');
    expect(result.latex_source).toContain('\\section{Methods}');
    expect(result.latex_source).toContain('\\section{Results}');
    expect(result.latex_source).toContain('\\section{Conclusion}');
  });

  it('includes bibliography commands when bibliography provided', async () => {
    const ctx = makeCtx();
    const result = await convertToPaper(
      {
        source: SAMPLE_SOURCE,
        title: 'Test Paper',
        authors: [{ name: 'Author' }],
        format: 'paper-ieee',
        abstract: SAMPLE_ABSTRACT,
        bibliography: '@article{smith2020, title={Test}, author={Smith}, year={2020}}',
      },
      ctx,
    );

    expect(result.latex_source).toContain('\\bibliographystyle{ieeetr}');
    expect(result.latex_source).toContain('\\bibliography{references}');
  });
});

// ---------------------------------------------------------------------------
// validateSubmission tests
// ---------------------------------------------------------------------------

describe('validateSubmission', () => {
  it('reports error when abstract is missing for IEEE', async () => {
    const ctx = makeCtx();
    const result = await validateSubmission(
      {
        source: SAMPLE_SOURCE,
        format: 'paper-ieee',
      },
      ctx,
    );

    expect(result.valid).toBe(false);
    expect(result.submission_ready).toBe(false);
    expect(result.errors.some((e) => e.code === 'MISSING_ABSTRACT')).toBe(true);
  });

  it('reports error when abstract is missing for ACM', async () => {
    const ctx = makeCtx();
    const result = await validateSubmission(
      {
        source: SAMPLE_SOURCE,
        format: 'paper-acm',
      },
      ctx,
    );

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'MISSING_ABSTRACT')).toBe(true);
  });

  it('does not require abstract for arXiv', async () => {
    const ctx = makeCtx();
    const result = await validateSubmission(
      {
        source: SAMPLE_SOURCE,
        format: 'paper-arxiv',
      },
      ctx,
    );

    // Should not have MISSING_ABSTRACT error
    expect(result.errors.some((e) => e.code === 'MISSING_ABSTRACT')).toBe(false);
  });

  it('warns when IEEE has more than 6 keywords', async () => {
    const ctx = makeCtx();
    const result = await validateSubmission(
      {
        source: SAMPLE_SOURCE,
        format: 'paper-ieee',
        abstract: SAMPLE_ABSTRACT,
        keywords: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      },
      ctx,
    );

    expect(result.warnings.some((w) => w.code === 'TOO_MANY_KEYWORDS')).toBe(
      true,
    );
  });

  it('does not warn when IEEE has 6 or fewer keywords', async () => {
    const ctx = makeCtx();
    const result = await validateSubmission(
      {
        source: SAMPLE_SOURCE,
        format: 'paper-ieee',
        abstract: SAMPLE_ABSTRACT,
        keywords: ['a', 'b', 'c'],
      },
      ctx,
    );

    expect(result.warnings.some((w) => w.code === 'TOO_MANY_KEYWORDS')).toBe(
      false,
    );
  });

  it('returns submission_ready=true for valid paper', async () => {
    const ctx = makeCtx();
    const result = await validateSubmission(
      {
        source: SAMPLE_SOURCE,
        format: 'paper-ieee',
        abstract: SAMPLE_ABSTRACT,
        keywords: ['quantum', 'error correction'],
      },
      ctx,
    );

    expect(result.valid).toBe(true);
    expect(result.submission_ready).toBe(true);
  });

  it('reports error for empty source', async () => {
    const ctx = makeCtx();
    const result = await validateSubmission(
      {
        source: '',
        format: 'paper-arxiv',
      },
      ctx,
    );

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'EMPTY_SOURCE')).toBe(true);
  });
});
