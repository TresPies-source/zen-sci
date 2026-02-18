// servers/newsletter-mcp/src/rendering/mjml-builder.ts
// Builds complete email HTML from markdown source + frontmatter.
// Does NOT use the mjml npm package; generates email-compatible HTML directly.

import type { FrontmatterMetadata } from '@zen-sci/core';
import { BlockRenderer } from './block-renderer.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailOptions {
  subject: string;
  previewText?: string;
  brandColor?: string;
  fontFamily?: string;
  logoUrl?: string;
  footerText?: string;
  unsubscribeUrl?: string;
}

// ---------------------------------------------------------------------------
// MJMLBuilder
// ---------------------------------------------------------------------------

/**
 * MJMLBuilder generates complete, email-client-safe HTML from markdown
 * source and frontmatter metadata.
 *
 * The output uses a table-based layout with inline styles for maximum
 * compatibility across email clients (Gmail, Outlook, Apple Mail, etc.).
 */
export class MJMLBuilder {
  /**
   * Build a complete email HTML document from markdown source.
   */
  build(
    source: string,
    frontmatter: FrontmatterMetadata,
    options: EmailOptions,
  ): string {
    const brandColor = options.brandColor ?? '#1a73e8';
    const fontFamily = options.fontFamily ?? 'Arial, Helvetica, sans-serif';

    const renderer = new BlockRenderer(brandColor, fontFamily);
    const contentHtml = this.renderMarkdownToEmail(source, renderer);
    const headerHtml = this.buildHeader(frontmatter, options, fontFamily);
    const footerHtml = this.buildFooter(options, fontFamily);
    const previewHtml = this.buildPreviewText(options);
    const title = typeof frontmatter.title === 'string' ? frontmatter.title : options.subject;

    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .fluid { max-width: 100% !important; height: auto !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: ${fontFamily};">
${previewHtml}
  <!-- Wrapper table -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <!-- Email container -->
        <table class="email-container" role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
${headerHtml}
          <!-- Content -->
          <tr>
            <td style="padding: 24px 32px;">
${contentHtml}
            </td>
          </tr>
${footerHtml}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  // ---------------------------------------------------------------------------
  // Private: Section builders
  // ---------------------------------------------------------------------------

  /**
   * Build the preview text (hidden text shown in email client list view).
   */
  private buildPreviewText(options: EmailOptions): string {
    if (options.previewText === undefined) {
      return '';
    }
    // Use a hidden span with the preview text, followed by zero-width
    // characters to prevent the rest of the email from leaking in.
    return `  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    ${escapeHtml(options.previewText)}
  </div>
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    ${'&#847; '.repeat(80)}
  </div>`;
  }

  /**
   * Build the header section with optional logo and title.
   */
  private buildHeader(
    frontmatter: FrontmatterMetadata,
    options: EmailOptions,
    fontFamily: string,
  ): string {
    const brandColor = options.brandColor ?? '#1a73e8';
    const title = typeof frontmatter.title === 'string' ? frontmatter.title : options.subject;

    let logoHtml = '';
    if (options.logoUrl !== undefined) {
      logoHtml = `
              <img src="${escapeHtml(options.logoUrl)}" alt="Logo" width="48" height="48" style="display: block; margin: 0 auto 12px auto; border: 0;" />`;
    }

    const dateStr = typeof frontmatter.date === 'string' ? frontmatter.date : '';
    let dateHtml = '';
    if (dateStr.length > 0) {
      dateHtml = `
              <p style="margin: 4px 0 0 0; font-family: ${fontFamily}; font-size: 13px; color: #ffffff; opacity: 0.85;">${escapeHtml(dateStr)}</p>`;
    }

    return `          <!-- Header -->
          <tr>
            <td style="background-color: ${brandColor}; padding: 24px 32px; text-align: center;">
${logoHtml}
              <h1 style="margin: 0; font-family: ${fontFamily}; font-size: 24px; font-weight: bold; color: #ffffff; line-height: 1.3;">${escapeHtml(title)}</h1>${dateHtml}
            </td>
          </tr>`;
  }

  /**
   * Build the footer with unsubscribe link and brand text (CAN-SPAM).
   */
  private buildFooter(options: EmailOptions, fontFamily: string): string {
    const footerText = options.footerText ?? 'You are receiving this email because you subscribed to our newsletter.';

    let unsubscribeHtml = '';
    if (options.unsubscribeUrl !== undefined) {
      unsubscribeHtml = `
                <a href="${escapeHtml(options.unsubscribeUrl)}" style="color: #999999; text-decoration: underline;">Unsubscribe</a>`;
    }

    return `          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 32px; text-align: center; border-top: 1px solid #e0e0e0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family: ${fontFamily}; font-size: 12px; line-height: 1.5; color: #999999; text-align: center;">
                    <p style="margin: 0 0 8px 0;">${escapeHtml(footerText)}</p>${unsubscribeHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
  }

  // ---------------------------------------------------------------------------
  // Private: Markdown → email HTML
  // ---------------------------------------------------------------------------

  /**
   * Convert raw markdown source to email-safe HTML blocks.
   *
   * This is a lightweight markdown-to-email renderer that handles:
   *  - Headings (# to ######)
   *  - Paragraphs
   *  - Images (![alt](src))
   *  - CTA buttons ([text](url){.button} or [CTA: text](url))
   *  - Code blocks (``` ... ```)
   *  - Horizontal rules (--- or ***)
   *  - Bold (**text**) and italic (*text*)
   *  - Links [text](url)
   *  - Inline code `code`
   */
  private renderMarkdownToEmail(source: string, renderer: BlockRenderer): string {
    // Strip frontmatter
    const content = source.replace(/^---[\s\S]*?---\s*/, '');
    const lines = content.split('\n');
    const blocks: string[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i] ?? '';

      // Skip empty lines
      if (line.trim() === '') {
        i++;
        continue;
      }

      // Code block
      if (line.trim().startsWith('```')) {
        const codeLines: string[] = [];
        i++; // skip opening fence
        while (i < lines.length) {
          const codeLine = lines[i] ?? '';
          if (codeLine.trim().startsWith('```')) {
            i++;
            break;
          }
          codeLines.push(codeLine);
          i++;
        }
        blocks.push(renderer.renderCode(codeLines.join('\n')));
        continue;
      }

      // Heading
      const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);
      if (headingMatch) {
        const level = (headingMatch[1] ?? '').length;
        const text = headingMatch[2] ?? '';
        blocks.push(renderer.renderHeading(text, level));
        i++;
        continue;
      }

      // Horizontal rule
      if (/^[-*_]{3,}\s*$/.test(line.trim())) {
        blocks.push(renderer.renderDivider());
        i++;
        continue;
      }

      // Image (standalone line)
      const imageMatch = /^!\[([^\]]*)\]\(([^)]+)\)\s*$/.exec(line.trim());
      if (imageMatch) {
        const alt = imageMatch[1] ?? '';
        const src = imageMatch[2] ?? '';
        blocks.push(renderer.renderImage(src, alt));
        i++;
        continue;
      }

      // CTA button: [CTA: text](url) or [text](url){.button}
      const ctaMatch = /^\[CTA:\s*([^\]]+)\]\(([^)]+)\)\s*$/.exec(line.trim()) ??
        /^\[([^\]]+)\]\(([^)]+)\)\{\.button\}\s*$/.exec(line.trim());
      if (ctaMatch) {
        const text = ctaMatch[1] ?? '';
        const url = ctaMatch[2] ?? '';
        blocks.push(renderer.renderButton(url, text));
        i++;
        continue;
      }

      // Unordered list: lines starting with - or *
      const unorderedMatch = /^[-*]\s+(.+)$/.exec(line.trim());
      if (unorderedMatch) {
        const listItems: string[] = [];
        while (i < lines.length) {
          const lLine = (lines[i] ?? '').trim();
          const itemMatch = /^[-*]\s+(.+)$/.exec(lLine);
          if (!itemMatch) break;
          listItems.push(itemMatch[1] ?? '');
          i++;
        }
        blocks.push(renderer.renderList(listItems, false));
        continue;
      }

      // Ordered list: lines starting with 1. 2. etc.
      const orderedMatch = /^\d+\.\s+(.+)$/.exec(line.trim());
      if (orderedMatch) {
        const listItems: string[] = [];
        while (i < lines.length) {
          const lLine = (lines[i] ?? '').trim();
          const itemMatch = /^\d+\.\s+(.+)$/.exec(lLine);
          if (!itemMatch) break;
          listItems.push(itemMatch[1] ?? '');
          i++;
        }
        blocks.push(renderer.renderList(listItems, true));
        continue;
      }

      // Paragraph: accumulate consecutive non-empty, non-special lines
      const paraLines: string[] = [];
      while (i < lines.length) {
        const pLine = lines[i] ?? '';
        if (pLine.trim() === '') break;
        if (/^#{1,6}\s+/.test(pLine)) break;
        if (/^[-*_]{3,}\s*$/.test(pLine.trim())) break;
        if (pLine.trim().startsWith('```')) break;
        if (/^!\[/.test(pLine.trim())) break;
        if (/^\[CTA:/.test(pLine.trim())) break;
        if (/\{\.button\}\s*$/.test(pLine.trim())) break;
        if (/^[-*]\s+/.test(pLine.trim())) break;
        if (/^\d+\.\s+/.test(pLine.trim())) break;
        paraLines.push(pLine);
        i++;
      }
      if (paraLines.length > 0) {
        const text = this.processInlineMarkdown(paraLines.join(' '));
        blocks.push(renderer.renderParagraph(text));
      }
    }

    return blocks.join('\n');
  }

  /**
   * Process inline markdown formatting (bold, italic, links, inline code).
   */
  private processInlineMarkdown(text: string): string {
    // Escape HTML entities first, before applying inline markdown
    let result = escapeHtml(text);

    // Inline code: `code`
    result = result.replace(/`([^`]+)`/g, '<code style="background-color: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-family: \'Courier New\', Courier, monospace; font-size: 14px;">$1</code>');

    // Bold: **text**
    result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic: *text*
    result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Links: [text](url)
    result = result.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" style="color: #1a73e8; text-decoration: underline;">$1</a>',
    );

    return result;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
