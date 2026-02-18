// servers/blog-mcp/src/rendering/syntax-highlighter.ts
// Basic syntax highlighting without the highlight.js npm package.
// Wraps code blocks in appropriate HTML with language classes.

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
 * Wrap code in a `<code>` block with language class and HTML-escaped content.
 */
export function highlight(code: string, language?: string): string {
  const escaped = escapeHtml(code);
  const langClass = language ? ` language-${language}` : '';
  return `<pre><code class="hljs${langClass}">${escaped}</code></pre>`;
}

/**
 * Return minimal CSS for code blocks.
 */
export function getEmbeddedCSS(): string {
  return `
pre {
  background: #f6f8fa;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
  line-height: 1.45;
}
code.hljs {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.875em;
  color: #24292f;
  background: transparent;
  padding: 0;
}
:not(pre) > code {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.875em;
  background: #f6f8fa;
  border-radius: 3px;
  padding: 0.2em 0.4em;
}`.trim();
}
