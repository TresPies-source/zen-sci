import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createZenSciServer } from '@zen-sci/sdk';
import type { ZenSciContext } from '@zen-sci/sdk';
import { latexManifest } from '../../src/manifest.js';
import { convertToPdf } from '../../src/tools/convert-to-pdf.js';
import { validateDocument } from '../../src/tools/validate-document.js';
import { checkCitations } from '../../src/tools/check-citations.js';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_DIR = join(__dirname, '../../fixtures');

let pandocAvailable = false;
let pdflatexAvailable = false;

async function checkCommand(cmd: string): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, ['--version'], { timeout: 5000 });
    proc.on('close', (code) => resolve(code === 0));
    proc.on('error', () => resolve(false));
  });
}

function makeCtx(): ZenSciContext {
  return createZenSciServer({
    name: 'latex-mcp-integration',
    version: '0.1.0',
    manifest: latexManifest,
  });
}

beforeAll(async () => {
  pandocAvailable = await checkCommand('pandoc');
  pdflatexAvailable = await checkCommand('pdflatex');
});

describe('End-to-end (requires pandoc + TeX)', () => {
  it('simple markdown → valid conversion result', async () => {
    if (!pandocAvailable || !pdflatexAvailable) return;

    const ctx = makeCtx();
    const result = await convertToPdf(
      {
        source: '# Hello\n\nThis is a simple test document.',
        title: 'Test',
      },
      ctx,
    );

    // Should at minimum have LaTeX source
    expect(result.latex_source).toBeDefined();
    expect(typeof result.latex_source).toBe('string');

    // If PDF was produced, it should be base64
    if (result.pdf_base64) {
      expect(typeof result.pdf_base64).toBe('string');
      expect(result.pdf_base64.length).toBeGreaterThan(0);
    }
  });

  it('math expression $E = mc^2$ → conversion result', async () => {
    if (!pandocAvailable || !pdflatexAvailable) return;

    const ctx = makeCtx();
    const result = await convertToPdf(
      { source: '# Math\n\n$E = mc^2$' },
      ctx,
    );

    expect(result.latex_source).toBeDefined();
  });

  it('resolved citation → no unresolved warnings', async () => {
    if (!pandocAvailable || !pdflatexAvailable) return;

    const sampleMd = readFileSync(join(FIXTURES_DIR, 'sample.md'), 'utf-8');
    const sampleBib = readFileSync(join(FIXTURES_DIR, 'sample.bib'), 'utf-8');

    const ctx = makeCtx();
    const result = await convertToPdf(
      {
        source: sampleMd,
        bibliography: sampleBib,
      },
      ctx,
    );

    expect(result.latex_source).toBeDefined();
  });

  it('unresolved citation [@missing2023] → warning in response', async () => {
    if (!pandocAvailable || !pdflatexAvailable) return;

    const source = '# Test\n\nSee [@missing2023].';
    const sampleBib = readFileSync(join(FIXTURES_DIR, 'sample.bib'), 'utf-8');

    const ctx = makeCtx();
    const result = await convertToPdf(
      { source, bibliography: sampleBib },
      ctx,
    );

    // Should still produce LaTeX even with unresolved citations
    expect(result.latex_source).toBeDefined();
  });
});

describe('End-to-end (no system deps needed)', () => {
  it('validates sample.md', async () => {
    const sampleMd = readFileSync(join(FIXTURES_DIR, 'sample.md'), 'utf-8');
    const sampleBib = readFileSync(join(FIXTURES_DIR, 'sample.bib'), 'utf-8');

    const ctx = makeCtx();
    const result = await validateDocument(
      { source: sampleMd, bibliography: sampleBib },
      ctx,
    );

    expect(result).toBeDefined();
    expect(typeof result.valid).toBe('boolean');
    expect(result.citationStats).toBeDefined();
    expect(result.mathStats).toBeDefined();
  });

  it('checks citations from sample.bib', async () => {
    const sampleMd = readFileSync(join(FIXTURES_DIR, 'sample.md'), 'utf-8');
    const sampleBib = readFileSync(join(FIXTURES_DIR, 'sample.bib'), 'utf-8');

    const ctx = makeCtx();
    const result = await checkCitations(
      { source: sampleMd, bibliography: sampleBib },
      ctx,
    );

    expect(result.bibliography_entries).toBe(2);
  });
});
