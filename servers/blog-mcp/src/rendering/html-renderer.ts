// servers/blog-mcp/src/rendering/html-renderer.ts
// Renders markdown to a complete standalone HTML blog page.

import type {
  FrontmatterMetadata,
  WebMetadataSchema,
  DocumentTree,
  DocumentNode,
  InlineNode,
  SectionNode,
  ParagraphNode,
  CodeBlockNode,
  MathNode,
  FigureNode,
  TableNode,
} from '@zen-sci/core';
import { MarkdownParser } from '@zen-sci/core';
import { renderToHtmlHead } from './seo-builder.js';
import { highlight, getEmbeddedCSS } from './syntax-highlighter.js';
import { renderInlineMath, renderDisplayMath, getMathCSS } from './katex-renderer.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HTMLRenderOptions {
  toc?: boolean;
  selfContained?: boolean;
  cssTheme?: 'light' | 'dark' | 'system';
  embedCSS?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(value: unknown): string {
  const str = value instanceof Date
    ? value.toISOString().split('T')[0] ?? String(value)
    : String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

// ---------------------------------------------------------------------------
// HTMLRenderer
// ---------------------------------------------------------------------------

export class HTMLRenderer {
  private readonly parser: MarkdownParser;

  constructor() {
    this.parser = new MarkdownParser();
  }

  /**
   * Render a complete standalone HTML page from markdown source.
   */
  render(
    source: string,
    frontmatter: FrontmatterMetadata,
    meta: WebMetadataSchema,
    options: HTMLRenderOptions = {},
  ): string {
    const tree = this.parser.parse(source);
    const bodyHtml = this.renderTree(tree);
    const postProcessed = this.postProcess(bodyHtml);
    const title = frontmatter.title ?? 'Untitled';
    const lang = frontmatter.lang ?? 'en';
    const theme = options.cssTheme ?? 'system';

    const seoHead = renderToHtmlHead(meta);

    const lines: string[] = [];
    lines.push(`<!DOCTYPE html>`);
    lines.push(`<html lang="${escapeHtml(lang)}" data-theme="${theme}">`);
    lines.push(`<head>`);
    lines.push(`<meta charset="utf-8" />`);
    lines.push(`<meta name="viewport" content="width=device-width, initial-scale=1" />`);
    lines.push(`<title>${escapeHtml(title)}</title>`);
    lines.push(seoHead);

    if (options.embedCSS !== false) {
      lines.push(`<style>`);
      lines.push(this.getBaseCSS(theme));
      lines.push(getEmbeddedCSS());
      lines.push(getMathCSS());
      lines.push(`</style>`);
    }

    lines.push(`</head>`);
    lines.push(`<body>`);
    lines.push(`<article role="main">`);

    // Article header
    lines.push(`<header>`);
    lines.push(`<h1>${escapeHtml(title)}</h1>`);
    if (frontmatter.author !== undefined) {
      const authorStr = Array.isArray(frontmatter.author)
        ? frontmatter.author.join(', ')
        : frontmatter.author;
      lines.push(`<p class="author">By ${escapeHtml(authorStr)}</p>`);
    }
    if (frontmatter.date !== undefined) {
      lines.push(`<time datetime="${escapeHtml(frontmatter.date)}">${escapeHtml(frontmatter.date)}</time>`);
    }
    if (frontmatter.tags !== undefined && frontmatter.tags.length > 0) {
      const tagHtml = frontmatter.tags
        .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
        .join(' ');
      lines.push(`<div class="tags">${tagHtml}</div>`);
    }
    lines.push(`</header>`);

    // Table of contents
    if (options.toc) {
      const tocHtml = this.buildTOC(tree);
      if (tocHtml.length > 0) {
        lines.push(`<nav role="navigation" aria-label="Table of Contents">`);
        lines.push(`<h2>Table of Contents</h2>`);
        lines.push(tocHtml);
        lines.push(`</nav>`);
      }
    }

    lines.push(postProcessed);
    lines.push(`</article>`);
    lines.push(`</body>`);
    lines.push(`</html>`);

    return lines.join('\n');
  }

  // ---------------------------------------------------------------------------
  // AST to HTML
  // ---------------------------------------------------------------------------

  private renderTree(tree: DocumentTree): string {
    return tree.children.map((node) => this.renderNode(node)).join('\n');
  }

  private renderNode(node: DocumentNode): string {
    switch (node.type) {
      case 'section':
        return this.renderSection(node);
      case 'paragraph':
        return this.renderParagraph(node);
      case 'code':
        return this.renderCodeBlock(node);
      case 'math':
        return this.renderMath(node);
      case 'figure':
        return this.renderFigure(node);
      case 'table':
        return this.renderTable(node);
      case 'citation':
        return `<cite>[${escapeHtml(node.key)}]</cite>`;
      default:
        return '';
    }
  }

  private renderSection(node: SectionNode): string {
    const id = slugify(node.title);
    const tag = `h${node.level}` as const;
    const childrenHtml = node.children.map((c) => this.renderNode(c)).join('\n');
    return `<${tag} id="${id}">${escapeHtml(node.title)}</${tag}>\n${childrenHtml}`;
  }

  private renderParagraph(node: ParagraphNode): string {
    const inlineHtml = node.children.map((c) => this.renderInline(c)).join('');
    return `<p>${inlineHtml}</p>`;
  }

  private renderCodeBlock(node: CodeBlockNode): string {
    return highlight(node.content, node.language || undefined);
  }

  private renderMath(node: MathNode): string {
    if (node.mode === 'display') {
      return renderDisplayMath(node.latex);
    }
    return renderInlineMath(node.latex);
  }

  private renderFigure(node: FigureNode): string {
    const lines: string[] = [];
    lines.push(`<figure>`);
    lines.push(`<img src="${escapeHtml(node.src)}" alt="${escapeHtml(node.alt)}" />`);
    if (node.caption !== undefined) {
      lines.push(`<figcaption>${escapeHtml(node.caption)}</figcaption>`);
    }
    lines.push(`</figure>`);
    return lines.join('\n');
  }

  private renderTable(node: TableNode): string {
    const lines: string[] = [];
    lines.push(`<table>`);
    if (node.caption !== undefined) {
      lines.push(`<caption>${escapeHtml(node.caption)}</caption>`);
    }
    lines.push(`<thead><tr>`);
    for (const header of node.headers) {
      lines.push(`<th>${escapeHtml(header)}</th>`);
    }
    lines.push(`</tr></thead>`);
    lines.push(`<tbody>`);
    for (const row of node.rows) {
      lines.push(`<tr>`);
      for (const cell of row) {
        if (typeof cell === 'string') {
          lines.push(`<td>${escapeHtml(cell)}</td>`);
        } else if (Array.isArray(cell)) {
          const cellHtml = cell.map((c) => this.renderInline(c)).join('');
          lines.push(`<td>${cellHtml}</td>`);
        }
      }
      lines.push(`</tr>`);
    }
    lines.push(`</tbody>`);
    lines.push(`</table>`);
    return lines.join('\n');
  }

  private renderInline(node: InlineNode): string {
    switch (node.type) {
      case 'text':
        return escapeHtml(node.text);
      case 'emphasis':
        return `<em>${node.children.map((c) => this.renderInline(c)).join('')}</em>`;
      case 'strong':
        return `<strong>${node.children.map((c) => this.renderInline(c)).join('')}</strong>`;
      case 'code':
        return `<code>${escapeHtml(node.code)}</code>`;
      case 'link': {
        const childrenHtml = node.children.map((c) => this.renderInline(c)).join('');
        const external = isExternalUrl(node.url);
        const attrs = external
          ? ` target="_blank" rel="noopener noreferrer"`
          : '';
        return `<a href="${escapeHtml(node.url)}"${attrs}>${childrenHtml}</a>`;
      }
      case 'citation-reference':
        return `<cite>[${escapeHtml(node.key)}]</cite>`;
      default:
        return '';
    }
  }

  // ---------------------------------------------------------------------------
  // Post-processing
  // ---------------------------------------------------------------------------

  /**
   * Post-process rendered HTML:
   * - Add id attributes to headings (if not already present)
   * - Add target=_blank to external links (if not already present)
   */
  private postProcess(html: string): string {
    let result = html;

    // Add id to headings that don't have one
    result = result.replace(
      /<(h[1-6])>([^<]+)<\/\1>/g,
      (_match, tag: string, content: string) => {
        const id = slugify(content);
        return `<${tag} id="${id}">${content}</${tag}>`;
      },
    );

    // Add target=_blank to external links that don't have it
    result = result.replace(
      /<a href="(https?:\/\/[^"]*)"(?![^>]*target=)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer"',
    );

    return result;
  }

  // ---------------------------------------------------------------------------
  // Table of Contents
  // ---------------------------------------------------------------------------

  private buildTOC(tree: DocumentTree): string {
    const headings: Array<{ level: number; title: string; id: string }> = [];

    const walk = (nodes: DocumentNode[]): void => {
      for (const node of nodes) {
        if (node.type === 'section') {
          headings.push({
            level: node.level,
            title: node.title,
            id: slugify(node.title),
          });
          walk(node.children);
        }
      }
    };

    walk(tree.children);

    if (headings.length === 0) return '';

    const items = headings.map(
      (h) =>
        `<li style="margin-left:${(h.level - 1) * 1.5}em"><a href="#${h.id}">${escapeHtml(h.title)}</a></li>`,
    );
    return `<ul>\n${items.join('\n')}\n</ul>`;
  }

  // ---------------------------------------------------------------------------
  // CSS
  // ---------------------------------------------------------------------------

  private getBaseCSS(theme: string): string {
    const lightVars = `
  --bg: #ffffff;
  --text: #24292f;
  --link: #0969da;
  --border: #d0d7de;
  --code-bg: #f6f8fa;
  --tag-bg: #ddf4ff;
  --tag-text: #0969da;`;

    const darkVars = `
  --bg: #0d1117;
  --text: #c9d1d9;
  --link: #58a6ff;
  --border: #30363d;
  --code-bg: #161b22;
  --tag-bg: #1f2937;
  --tag-text: #58a6ff;`;

    let themeCSS: string;
    if (theme === 'dark') {
      themeCSS = `:root {${darkVars}\n}`;
    } else if (theme === 'light') {
      themeCSS = `:root {${lightVars}\n}`;
    } else {
      themeCSS = `:root {${lightVars}\n}\n@media (prefers-color-scheme: dark) {\n  :root {${darkVars}\n  }\n}`;
    }

    return `${themeCSS}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
  line-height: 1.6;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
  background: var(--bg);
  color: var(--text);
}
a { color: var(--link); text-decoration: none; }
a:hover { text-decoration: underline; }
article { margin-top: 2rem; }
header { margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; }
.author { font-style: italic; color: var(--text); opacity: 0.8; }
time { display: block; font-size: 0.875em; color: var(--text); opacity: 0.6; margin-top: 0.25rem; }
.tags { margin-top: 0.5rem; }
.tag { display: inline-block; background: var(--tag-bg); color: var(--tag-text); padding: 0.15em 0.5em; border-radius: 3px; font-size: 0.8em; margin-right: 0.25em; }
figure { margin: 1.5em 0; text-align: center; }
figure img { max-width: 100%; height: auto; }
figcaption { font-size: 0.875em; color: var(--text); opacity: 0.7; margin-top: 0.5em; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid var(--border); padding: 0.5em 0.75em; text-align: left; }
th { background: var(--code-bg); }
blockquote { border-left: 4px solid var(--border); margin: 1em 0; padding: 0.5em 1em; }
nav[role="navigation"] { margin-bottom: 2rem; padding: 1em; background: var(--code-bg); border-radius: 6px; }
nav ul { list-style: none; padding-left: 0; }
nav li { margin: 0.25em 0; }`;
  }
}
