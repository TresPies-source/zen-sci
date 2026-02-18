// servers/blog-mcp/src/rendering/katex-renderer.ts
// Lightweight math rendering without the KaTeX npm package.
// Wraps math expressions in styled spans/divs for CSS-based rendering.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Render an inline math expression into an HTML span.
 */
export function renderInlineMath(expression: string): string {
  return `<span class="math-inline">${escapeHtml(expression)}</span>`;
}

/**
 * Render a display (block) math expression into an HTML div.
 */
export function renderDisplayMath(expression: string): string {
  return `<div class="math-display">${escapeHtml(expression)}</div>`;
}

/**
 * Process an HTML string and replace `$$...$$` and `$...$` patterns
 * with rendered math elements.
 *
 * Display math (`$$...$$`) is processed first to avoid partial matches
 * with inline math (`$...$`).
 */
export function renderAllMath(html: string): string {
  // Replace display math: $$...$$  (non-greedy, may span lines)
  let result = html.replace(
    /\$\$([\s\S]+?)\$\$/g,
    (_match, expr: string) => renderDisplayMath(expr.trim()),
  );

  // Replace inline math: $...$  (single line only, not preceded/followed by $)
  result = result.replace(
    /(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g,
    (_match, expr: string) => renderInlineMath(expr),
  );

  return result;
}

/**
 * Return minimal CSS styles for math elements.
 */
export function getMathCSS(): string {
  return `
.math-inline {
  font-family: 'Cambria Math', 'Latin Modern Math', serif;
  font-style: italic;
  white-space: nowrap;
}
.math-display {
  font-family: 'Cambria Math', 'Latin Modern Math', serif;
  font-style: italic;
  text-align: center;
  margin: 1em 0;
  padding: 0.5em;
  overflow-x: auto;
}`.trim();
}
