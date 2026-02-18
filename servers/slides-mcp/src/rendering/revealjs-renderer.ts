// servers/slides-mcp/src/rendering/revealjs-renderer.ts
// Renders a SlideStructure into a standalone Reveal.js HTML page

import type { SlideStructure, Slide } from './slide-parser.js';

export interface RevealJsOptions {
  theme?: string;
  transition?: string;
  controls?: boolean;
  progress?: boolean;
  katexEnabled?: boolean;
}

const REVEAL_CDN = 'https://cdn.jsdelivr.net/npm/reveal.js@4';

/**
 * RevealJsRenderer: Converts a parsed slide deck into a self-contained
 * Reveal.js HTML page with CSS/JS loaded from CDN.
 */
export class RevealJsRenderer {
  render(deck: SlideStructure, options: RevealJsOptions = {}): string {
    const theme = options.theme ?? 'white';
    const transition = options.transition ?? 'slide';
    const controls = options.controls !== false;
    const progress = options.progress !== false;
    const katexEnabled = options.katexEnabled !== false;

    const slideSections = deck.slides
      .map((slide) => this.renderSlide(slide))
      .join('\n');

    const katexBlock = katexEnabled
      ? `
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.css">
      <script src="https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.js"></script>
      <script src="${REVEAL_CDN}/plugin/math/math.js"></script>`
      : '';

    const katexPlugin = katexEnabled ? ', RevealMath.KaTeX' : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(deck.title)}</title>
  <link rel="stylesheet" href="${REVEAL_CDN}/dist/reveal.css">
  <link rel="stylesheet" href="${REVEAL_CDN}/dist/theme/${theme}.css">${katexBlock}
</head>
<body>
  <div class="reveal">
    <div class="slides">
${slideSections}
    </div>
  </div>

  <script src="${REVEAL_CDN}/dist/reveal.js"></script>
  <script>
    Reveal.initialize({
      controls: ${controls},
      progress: ${progress},
      transition: '${transition}'${katexPlugin ? `,\n      plugins: [${katexPlugin.slice(2)}]` : ''}
    });
  </script>
</body>
</html>`;
  }

  private renderSlide(slide: Slide): string {
    const lines: string[] = [];
    lines.push('      <section>');

    if (slide.title) {
      const tag = slide.layout === 'title' ? 'h1' : 'h2';
      lines.push(`        <${tag}>${this.escapeHtml(slide.title)}</${tag}>`);
    }

    // Convert content to HTML
    const htmlContent = this.convertContentToHtml(slide.content, slide.title);
    if (htmlContent.trim().length > 0) {
      lines.push(htmlContent);
    }

    // Speaker notes
    if (slide.notes) {
      lines.push(`        <aside class="notes">${this.escapeHtml(slide.notes)}</aside>`);
    }

    lines.push('      </section>');
    return lines.join('\n');
  }

  /**
   * Convert markdown content to basic HTML.
   */
  private convertContentToHtml(content: string, slideTitle?: string): string {
    const lines = content.split('\n');
    const result: string[] = [];
    let inList = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip heading lines (already rendered as slide title)
      if (/^#{1,2}\s+/.test(trimmed)) {
        // Only skip if it matches the slide title
        const headingText = trimmed.replace(/^#{1,6}\s+/, '');
        if (headingText === slideTitle) {
          continue;
        }
        // Sub-headings
        const level = (trimmed.match(/^(#+)/)?.[1]?.length ?? 3) + 1;
        const clampedLevel = Math.min(level, 6);
        if (inList) {
          result.push('        </ul>');
          inList = false;
        }
        result.push(`        <h${clampedLevel}>${this.escapeHtml(headingText)}</h${clampedLevel}>`);
        continue;
      }

      // Skip layout comments
      if (trimmed.startsWith('<!--') && trimmed.endsWith('-->')) {
        continue;
      }

      // Empty lines
      if (trimmed.length === 0) {
        if (inList) {
          result.push('        </ul>');
          inList = false;
        }
        continue;
      }

      // Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (!inList) {
          result.push('        <ul>');
          inList = true;
        }
        result.push(`          <li>${this.convertInlineMarkdown(trimmed.slice(2))}</li>`);
        continue;
      }

      // Display math
      if (trimmed.startsWith('$$')) {
        // Collect math block
        result.push(`        ${trimmed}`);
        continue;
      }

      // Regular paragraph content
      if (inList) {
        result.push('        </ul>');
        inList = false;
      }
      result.push(`        <p>${this.convertInlineMarkdown(trimmed)}</p>`);
    }

    if (inList) {
      result.push('        </ul>');
    }

    return result.join('\n');
  }

  /**
   * Convert inline markdown (bold, italic, code, math) to HTML.
   */
  private convertInlineMarkdown(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>');
    // Inline math $...$ is left as-is for KaTeX to process
  }

  /**
   * Escape HTML special characters.
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
