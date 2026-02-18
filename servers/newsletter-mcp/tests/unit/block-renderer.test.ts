import { describe, it, expect } from 'vitest';
import { BlockRenderer } from '../../src/rendering/block-renderer.js';

// =============================================================================
// BlockRenderer
// =============================================================================

describe('BlockRenderer', () => {
  const renderer = new BlockRenderer('#1a73e8', 'Arial, Helvetica, sans-serif');

  // -------------------------------------------------------------------------
  // renderHeading
  // -------------------------------------------------------------------------

  describe('renderHeading', () => {
    it('renders h1 with 28px font size', () => {
      const html = renderer.renderHeading('Main Title', 1);
      expect(html).toContain('font-size: 28px');
      expect(html).toContain('<h1');
      expect(html).toContain('</h1>');
      expect(html).toContain('Main Title');
    });

    it('renders h2 with 24px font size', () => {
      const html = renderer.renderHeading('Subtitle', 2);
      expect(html).toContain('font-size: 24px');
      expect(html).toContain('<h2');
      expect(html).toContain('</h2>');
    });

    it('renders h3 with 20px font size', () => {
      const html = renderer.renderHeading('Section', 3);
      expect(html).toContain('font-size: 20px');
      expect(html).toContain('<h3');
    });

    it('uses table-based layout', () => {
      const html = renderer.renderHeading('Test', 1);
      expect(html).toContain('role="presentation"');
      expect(html).toContain('<table');
      expect(html).toContain('</table>');
    });

    it('escapes HTML in heading text', () => {
      const html = renderer.renderHeading('Title <script>alert(1)</script>', 1);
      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>');
    });
  });

  // -------------------------------------------------------------------------
  // renderParagraph
  // -------------------------------------------------------------------------

  describe('renderParagraph', () => {
    it('renders text in a table-based layout', () => {
      const html = renderer.renderParagraph('Hello world');
      expect(html).toContain('Hello world');
      expect(html).toContain('<table');
      expect(html).toContain('role="presentation"');
    });

    it('uses 16px font size', () => {
      const html = renderer.renderParagraph('Test');
      expect(html).toContain('font-size: 16px');
    });

    it('includes proper line height', () => {
      const html = renderer.renderParagraph('Test');
      expect(html).toContain('line-height: 1.6');
    });
  });

  // -------------------------------------------------------------------------
  // renderImage
  // -------------------------------------------------------------------------

  describe('renderImage', () => {
    it('renders img tag with src and alt', () => {
      const html = renderer.renderImage('https://example.com/img.png', 'A test image');
      expect(html).toContain('<img');
      expect(html).toContain('src="https://example.com/img.png"');
      expect(html).toContain('alt="A test image"');
    });

    it('uses table-based layout', () => {
      const html = renderer.renderImage('img.png', 'alt');
      expect(html).toContain('<table');
      expect(html).toContain('role="presentation"');
    });

    it('centers the image', () => {
      const html = renderer.renderImage('img.png', 'alt');
      expect(html).toContain('align="center"');
    });

    it('escapes HTML in src and alt', () => {
      const html = renderer.renderImage('img.png?a=1&b=2', 'alt "quoted"');
      expect(html).toContain('&amp;');
      expect(html).toContain('&quot;');
    });
  });

  // -------------------------------------------------------------------------
  // renderButton
  // -------------------------------------------------------------------------

  describe('renderButton', () => {
    it('renders a link with button styling', () => {
      const html = renderer.renderButton('https://example.com', 'Click Me');
      expect(html).toContain('href="https://example.com"');
      expect(html).toContain('Click Me');
    });

    it('uses brand color as background', () => {
      const html = renderer.renderButton('https://example.com', 'Go');
      expect(html).toContain('background-color: #1a73e8');
    });

    it('uses white text color', () => {
      const html = renderer.renderButton('https://example.com', 'Go');
      expect(html).toContain('color: #ffffff');
    });

    it('uses table layout', () => {
      const html = renderer.renderButton('https://example.com', 'Go');
      expect(html).toContain('<table');
      expect(html).toContain('role="presentation"');
    });

    it('opens link in new tab', () => {
      const html = renderer.renderButton('https://example.com', 'Go');
      expect(html).toContain('target="_blank"');
    });
  });

  // -------------------------------------------------------------------------
  // renderDivider
  // -------------------------------------------------------------------------

  describe('renderDivider', () => {
    it('renders an hr element', () => {
      const html = renderer.renderDivider();
      expect(html).toContain('<hr');
    });

    it('uses table layout', () => {
      const html = renderer.renderDivider();
      expect(html).toContain('<table');
    });
  });

  // -------------------------------------------------------------------------
  // renderCode
  // -------------------------------------------------------------------------

  describe('renderCode', () => {
    it('renders code with monospace font', () => {
      const html = renderer.renderCode('const x = 1;');
      expect(html).toContain("'Courier New'");
      expect(html).toContain('monospace');
      expect(html).toContain('const x = 1;');
    });

    it('uses grey background', () => {
      const html = renderer.renderCode('code');
      expect(html).toContain('background-color: #f5f5f5');
    });

    it('uses table layout', () => {
      const html = renderer.renderCode('code');
      expect(html).toContain('<table');
      expect(html).toContain('role="presentation"');
    });

    it('escapes HTML in code', () => {
      const html = renderer.renderCode('<div>test</div>');
      expect(html).toContain('&lt;div&gt;');
    });
  });

  // -------------------------------------------------------------------------
  // Custom brand color
  // -------------------------------------------------------------------------

  describe('custom brand color', () => {
    it('uses custom brand color in button', () => {
      const custom = new BlockRenderer('#ff0000');
      const html = custom.renderButton('https://example.com', 'Go');
      expect(html).toContain('background-color: #ff0000');
    });
  });
});
