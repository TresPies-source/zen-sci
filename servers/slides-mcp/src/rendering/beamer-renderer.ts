// servers/slides-mcp/src/rendering/beamer-renderer.ts
// Renders a SlideStructure into a complete Beamer LaTeX document

import type { SlideStructure, Slide } from './slide-parser.js';

export interface BeamerOptions {
  theme?: 'default' | 'metropolis' | 'madrid' | 'singapore';
  colorTheme?: string;
  aspectRatio?: '169' | '43' | '1610';
  showNotes?: boolean;
  fontTheme?: string;
}

/**
 * BeamerRenderer: Converts a parsed slide deck into Beamer LaTeX source.
 */
export class BeamerRenderer {
  render(deck: SlideStructure, options: BeamerOptions = {}): string {
    const lines: string[] = [];

    // Document class with aspect ratio
    const aspectRatio = options.aspectRatio ?? '169';
    lines.push(`\\documentclass[aspectratio=${aspectRatio}]{beamer}`);
    lines.push('');

    // Theme
    const theme = options.theme ?? 'default';
    lines.push(`\\usetheme{${theme}}`);

    // Color theme
    if (options.colorTheme) {
      lines.push(`\\usecolortheme{${options.colorTheme}}`);
    }

    // Font theme
    if (options.fontTheme) {
      lines.push(`\\usefonttheme{${options.fontTheme}}`);
    }

    // Show notes if requested
    if (options.showNotes) {
      lines.push('\\setbeameroption{show notes}');
    }

    // Packages
    lines.push('');
    lines.push('\\usepackage[utf8]{inputenc}');
    lines.push('\\usepackage{amsmath}');
    lines.push('\\usepackage{graphicx}');
    lines.push('\\usepackage{hyperref}');
    lines.push('');

    // Title
    lines.push(`\\title{${this.escapeLatex(deck.title)}}`);
    lines.push('');
    lines.push('\\begin{document}');
    lines.push('');

    // Render each slide
    for (const slide of deck.slides) {
      lines.push(this.renderSlide(slide, options));
      lines.push('');
    }

    lines.push('\\end{document}');

    return lines.join('\n');
  }

  private renderSlide(slide: Slide, options: BeamerOptions): string {
    const lines: string[] = [];

    // Title slide layout
    if (slide.layout === 'title') {
      lines.push('\\begin{frame}');
      lines.push('\\titlepage');
      lines.push('\\end{frame}');
    } else if (slide.layout === 'two-column') {
      lines.push('\\begin{frame}');
      if (slide.title) {
        lines.push(`\\frametitle{${this.escapeLatex(slide.title)}}`);
      }
      lines.push('\\begin{columns}');
      lines.push('\\begin{column}{0.5\\textwidth}');

      // Split content at pipe separator for two columns
      const { left, right } = this.splitColumns(slide.content);
      lines.push(this.convertContentToLatex(left));

      lines.push('\\end{column}');
      lines.push('\\begin{column}{0.5\\textwidth}');

      lines.push(this.convertContentToLatex(right));

      lines.push('\\end{column}');
      lines.push('\\end{columns}');

      if (slide.notes && options.showNotes) {
        lines.push(`\\note{${this.escapeLatex(slide.notes)}}`);
      }

      lines.push('\\end{frame}');
    } else {
      // Default or blank layout
      lines.push('\\begin{frame}');
      if (slide.title) {
        lines.push(`\\frametitle{${this.escapeLatex(slide.title)}}`);
      }

      lines.push(this.convertContentToLatex(slide.content));

      if (slide.notes && options.showNotes) {
        lines.push(`\\note{${this.escapeLatex(slide.notes)}}`);
      }

      lines.push('\\end{frame}');
    }

    return lines.join('\n');
  }

  /**
   * Split content into left and right columns.
   * Looks for a pipe `|` separator in a table-like row.
   */
  private splitColumns(content: string): { left: string; right: string } {
    const lines = content.split('\n');
    const leftLines: string[] = [];
    const rightLines: string[] = [];

    for (const line of lines) {
      if (line.includes('|')) {
        const parts = line.split('|').map((p) => p.trim());
        if (parts[0]) leftLines.push(parts[0]);
        if (parts[1]) rightLines.push(parts[1]);
      } else {
        leftLines.push(line);
      }
    }

    return {
      left: leftLines.join('\n'),
      right: rightLines.join('\n'),
    };
  }

  /**
   * Basic markdown-to-LaTeX content conversion.
   */
  private convertContentToLatex(content: string): string {
    const lines = content.split('\n');
    const result: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip heading lines (already handled as frametitle)
      if (/^#{1,6}\s+/.test(trimmed)) {
        continue;
      }

      // Skip empty lines but preserve paragraph breaks
      if (trimmed.length === 0) {
        result.push('');
        continue;
      }

      // Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        result.push(`\\item ${trimmed.slice(2)}`);
        continue;
      }

      // Regular content (preserve math delimiters)
      result.push(trimmed);
    }

    // Wrap bullet items in itemize
    const output = result.join('\n');
    if (output.includes('\\item ')) {
      return output
        .replace(/((?:\\item .+\n?)+)/g, '\\begin{itemize}\n$1\\end{itemize}\n')
        .trim();
    }

    return output.trim();
  }

  /**
   * Escape special LaTeX characters (but preserve math delimiters).
   */
  private escapeLatex(text: string): string {
    return text
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/\^/g, '\\textasciicircum{}')
      .replace(/&/g, '\\&')
      .replace(/%/g, '\\%')
      .replace(/#/g, '\\#')
      .replace(/\$/g, '\\$')
      .replace(/_/g, '\\_')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}');
  }
}
