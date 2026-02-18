import { describe, it, expect } from 'vitest';
import { createZenSciServer } from '@zen-sci/sdk';
import type { ZenSciContext } from '@zen-sci/sdk';
import { slidesManifest } from '../../src/manifest.js';
import { convertToSlides } from '../../src/tools/convert-to-slides.js';
import { validateDeck } from '../../src/tools/validate-deck.js';

const SAMPLE_DECK = `---
title: Integration Test Deck
author: Test Author
---

# Integration Test Deck

By Test Author

---

## Slide One

- Point A
- Point B

> Note: Remember to elaborate on Point B

---

## Slide Two

The formula $E = mc^2$ is important.

$$\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$`;

function makeCtx(): ZenSciContext {
  return createZenSciServer({
    name: 'slides-mcp-test',
    version: '0.3.0',
    manifest: slidesManifest,
  });
}

describe('Slide Generation Integration', () => {
  it('converts markdown deck to Beamer LaTeX with correct structure', async () => {
    const ctx = makeCtx();
    const result = await convertToSlides(
      { source: SAMPLE_DECK, format: 'beamer' },
      ctx,
    );

    expect(result.format).toBe('beamer');
    expect(result.slide_count).toBe(3);
    expect(result.output).toContain('\\documentclass');
    expect(result.output).toContain('\\begin{frame}');
    expect(result.output).toContain('\\end{frame}');
    expect(result.output).toContain('\\begin{document}');
    expect(result.output).toContain('\\end{document}');
    expect(result.has_notes).toBe(true);
  });

  it('converts markdown deck to Reveal.js HTML with <section> elements', async () => {
    const ctx = makeCtx();
    const result = await convertToSlides(
      { source: SAMPLE_DECK, format: 'revealjs' },
      ctx,
    );

    expect(result.format).toBe('revealjs');
    expect(result.slide_count).toBe(3);
    expect(result.output).toContain('<section>');
    expect(result.output).toContain('</section>');
    expect(result.output).toContain('reveal.js');
    expect(result.output).toContain('<!DOCTYPE html>');
    expect(result.has_notes).toBe(true);
  });

  it('validates a valid deck successfully', async () => {
    const ctx = makeCtx();
    const result = await validateDeck(
      { source: SAMPLE_DECK },
      ctx,
    );

    expect(result.valid).toBe(true);
    expect(result.slide_count).toBe(3);
    expect(result.errors).toHaveLength(0);
  });

  it('validates empty deck as invalid', async () => {
    const ctx = makeCtx();
    const result = await validateDeck(
      { source: '' },
      ctx,
    );

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('passes through custom title override', async () => {
    const ctx = makeCtx();
    const result = await convertToSlides(
      { source: SAMPLE_DECK, format: 'beamer', title: 'Custom Title' },
      ctx,
    );

    expect(result.output).toContain('Custom Title');
  });

  it('beamer output includes speaker notes when showNotes=true', async () => {
    const ctx = makeCtx();
    const result = await convertToSlides(
      {
        source: SAMPLE_DECK,
        format: 'beamer',
        options: { showNotes: true },
      },
      ctx,
    );

    expect(result.output).toContain('\\note{');
    expect(result.has_notes).toBe(true);
  });

  it('revealjs output includes speaker notes', async () => {
    const ctx = makeCtx();
    const result = await convertToSlides(
      { source: SAMPLE_DECK, format: 'revealjs' },
      ctx,
    );

    expect(result.output).toContain('<aside class="notes">');
  });
});
