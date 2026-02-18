import { describe, it, expect } from 'vitest';
import { BeamerRenderer } from '../../src/rendering/beamer-renderer.js';
import { RevealJsRenderer } from '../../src/rendering/revealjs-renderer.js';
import { SlideParser } from '../../src/rendering/slide-parser.js';

const SAMPLE_DECK_SOURCE = `# Sample Presentation

By Alice Smith

---

## Mathematical Foundations

The equation $E = mc^2$ is fundamental.

> Note: Explain the significance of mass-energy equivalence

---

## Conclusion

Thank you for attending!`;

function parseDeck(source: string = SAMPLE_DECK_SOURCE) {
  const parser = new SlideParser();
  return parser.parse(source);
}

// =============================================================================
// BeamerRenderer
// =============================================================================

describe('BeamerRenderer', () => {
  const renderer = new BeamerRenderer();

  it('generates LaTeX with \\begin{frame} for each slide', () => {
    const deck = parseDeck();
    const latex = renderer.render(deck);

    // Count frame environments
    const frameCount = (latex.match(/\\begin\{frame\}/g) ?? []).length;
    expect(frameCount).toBe(deck.slides.length);
  });

  it('title slide has \\titlepage', () => {
    const deck = parseDeck();
    const latex = renderer.render(deck);

    expect(latex).toContain('\\titlepage');
  });

  it('includes speaker notes when showNotes=true', () => {
    const deck = parseDeck();
    const latex = renderer.render(deck, { showNotes: true });

    expect(latex).toContain('\\note{');
    expect(latex).toContain('\\setbeameroption{show notes}');
  });

  it('does not include notes when showNotes is not set', () => {
    const deck = parseDeck();
    const latex = renderer.render(deck);

    expect(latex).not.toContain('\\note{');
    expect(latex).not.toContain('\\setbeameroption{show notes}');
  });

  it('uses the specified theme', () => {
    const deck = parseDeck();
    const latex = renderer.render(deck, { theme: 'metropolis' });

    expect(latex).toContain('\\usetheme{metropolis}');
  });

  it('uses the specified aspect ratio', () => {
    const deck = parseDeck();
    const latex = renderer.render(deck, { aspectRatio: '43' });

    expect(latex).toContain('aspectratio=43');
  });

  it('renders \\frametitle for non-title slides', () => {
    const deck = parseDeck();
    const latex = renderer.render(deck);

    expect(latex).toContain('\\frametitle{Mathematical Foundations}');
    expect(latex).toContain('\\frametitle{Conclusion}');
  });

  it('renders two-column layout with \\begin{columns}', () => {
    const source = `## Two Columns

<!-- layout: two-column -->

Left side | Right side`;

    const deck = parseDeck(source);
    const latex = renderer.render(deck);

    expect(latex).toContain('\\begin{columns}');
    expect(latex).toContain('\\end{columns}');
  });

  it('includes document structure markers', () => {
    const deck = parseDeck();
    const latex = renderer.render(deck);

    expect(latex).toContain('\\documentclass');
    expect(latex).toContain('\\begin{document}');
    expect(latex).toContain('\\end{document}');
  });
});

// =============================================================================
// RevealJsRenderer
// =============================================================================

describe('RevealJsRenderer', () => {
  const renderer = new RevealJsRenderer();

  it('generates HTML with <section> per slide', () => {
    const deck = parseDeck();
    const html = renderer.render(deck);

    const sectionCount = (html.match(/<section>/g) ?? []).length;
    expect(sectionCount).toBe(deck.slides.length);
  });

  it('loads Reveal.js from CDN', () => {
    const deck = parseDeck();
    const html = renderer.render(deck);

    expect(html).toContain('https://cdn.jsdelivr.net/npm/reveal.js@4');
    expect(html).toContain('Reveal.initialize');
  });

  it('includes speaker notes in <aside class="notes">', () => {
    const deck = parseDeck();
    const html = renderer.render(deck);

    expect(html).toContain('<aside class="notes">');
    expect(html).toContain('Explain the significance');
  });

  it('generates a complete HTML document', () => {
    const deck = parseDeck();
    const html = renderer.render(deck);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
    expect(html).toContain('<head>');
    expect(html).toContain('</head>');
    expect(html).toContain('<body>');
    expect(html).toContain('</body>');
  });

  it('sets the page title to the deck title', () => {
    const deck = parseDeck();
    const html = renderer.render(deck);

    expect(html).toContain(`<title>${deck.title}</title>`);
  });

  it('uses the specified theme', () => {
    const deck = parseDeck();
    const html = renderer.render(deck, { theme: 'moon' });

    expect(html).toContain('/theme/moon.css');
  });

  it('sets the transition option', () => {
    const deck = parseDeck();
    const html = renderer.render(deck, { transition: 'fade' });

    expect(html).toContain("transition: 'fade'");
  });

  it('includes KaTeX when katexEnabled is true', () => {
    const deck = parseDeck();
    const html = renderer.render(deck, { katexEnabled: true });

    expect(html).toContain('katex');
  });

  it('excludes KaTeX when katexEnabled is false', () => {
    const deck = parseDeck();
    const html = renderer.render(deck, { katexEnabled: false });

    expect(html).not.toContain('katex');
  });
});
