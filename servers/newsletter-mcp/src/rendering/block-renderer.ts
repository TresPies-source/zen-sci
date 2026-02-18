// servers/newsletter-mcp/src/rendering/block-renderer.ts
// Renders individual content blocks as email-safe, table-based HTML.

/**
 * BlockRenderer produces table-based HTML fragments for individual
 * content blocks (headings, paragraphs, images, buttons, etc.).
 *
 * All output uses `<table>` layout with inline styles for maximum
 * email client compatibility (no CSS grid, no flexbox).
 */
export class BlockRenderer {
  private readonly brandColor: string;
  private readonly fontFamily: string;

  constructor(brandColor = '#1a73e8', fontFamily = 'Arial, Helvetica, sans-serif') {
    this.brandColor = brandColor;
    this.fontFamily = fontFamily;
  }

  /**
   * Render a heading element with the appropriate font size for
   * the given heading level (1-6).
   */
  renderHeading(text: string, level: number): string {
    const sizes: Record<number, string> = {
      1: '28px',
      2: '24px',
      3: '20px',
      4: '18px',
      5: '16px',
      6: '14px',
    };
    const fontSize = sizes[level] ?? '16px';
    const paddingTop = level <= 2 ? '24px' : '16px';

    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding: ${paddingTop} 0 8px 0;">
      <h${level} style="margin: 0; font-family: ${this.fontFamily}; font-size: ${fontSize}; font-weight: bold; color: #1a1a1a; line-height: 1.3;">${escapeHtml(text)}</h${level}>
    </td>
  </tr>
</table>`;
  }

  /**
   * Render a paragraph inside a table cell with email-safe styles.
   */
  renderParagraph(text: string): string {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding: 0 0 16px 0; font-family: ${this.fontFamily}; font-size: 16px; line-height: 1.6; color: #333333;">
      ${text}
    </td>
  </tr>
</table>`;
  }

  /**
   * Render an image block with alt text, centered within its container.
   */
  renderImage(src: string, alt: string): string {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding: 16px 0;">
      <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" width="100%" style="max-width: 600px; height: auto; display: block; border: 0;" />
    </td>
  </tr>
</table>`;
  }

  /**
   * Render a call-to-action button with the brand color.
   */
  renderButton(url: string, text: string): string {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding: 16px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="background-color: ${this.brandColor}; border-radius: 4px;">
            <a href="${escapeHtml(url)}" target="_blank" style="display: inline-block; padding: 12px 24px; font-family: ${this.fontFamily}; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 4px;">${escapeHtml(text)}</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
  }

  /**
   * Render an unordered or ordered list as email-safe HTML.
   */
  renderList(items: string[], ordered: boolean): string {
    const tag = ordered ? 'ol' : 'ul';
    const listItems = items
      .map((item) => `      <li style="margin-bottom: 4px;">${escapeHtml(item)}</li>`)
      .join('\n');

    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding: 0 0 16px 0; font-family: ${this.fontFamily}; font-size: 16px; line-height: 1.6; color: #333333;">
      <${tag} style="margin: 0; padding-left: 24px;">
${listItems}
      </${tag}>
    </td>
  </tr>
</table>`;
  }

  /**
   * Render a horizontal divider line.
   */
  renderDivider(): string {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding: 16px 0;">
      <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 0;" />
    </td>
  </tr>
</table>`;
  }

  /**
   * Render a code block using monospace font, with a grey background.
   */
  renderCode(code: string): string {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding: 8px 0 16px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; border-radius: 4px;">
        <tr>
          <td style="padding: 12px 16px; font-family: 'Courier New', Courier, monospace; font-size: 14px; line-height: 1.5; color: #333333; white-space: pre-wrap; word-break: break-all;">
${escapeHtml(code)}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Escape HTML entities in a string.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
