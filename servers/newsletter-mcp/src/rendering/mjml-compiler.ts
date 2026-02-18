// servers/newsletter-mcp/src/rendering/mjml-compiler.ts
// Simplified MJML-like compiler that validates and wraps email HTML.
// Does NOT use the actual mjml npm package.

// ---------------------------------------------------------------------------
// MJMLCompiler
// ---------------------------------------------------------------------------

/**
 * MJMLCompiler validates email HTML for structural correctness.
 *
 * Since we generate HTML directly (no MJML), this class serves as a
 * validation layer to ensure the generated HTML meets email standards.
 */
export class MJMLCompiler {
  /**
   * Compile (validate and pass through) the given email HTML.
   *
   * Returns the HTML alongside any validation errors found.
   */
  compile(htmlSource: string): { html: string; errors: Array<{ message: string }> } {
    const errors: Array<{ message: string }> = [];

    if (!htmlSource.includes('<!DOCTYPE')) {
      errors.push({ message: 'Missing DOCTYPE declaration' });
    }

    if (!/<html[\s>]/i.test(htmlSource)) {
      errors.push({ message: 'Missing <html> tag' });
    }

    if (!/<body[\s>]/i.test(htmlSource)) {
      errors.push({ message: 'Missing <body> tag' });
    }

    if (!/<\/html>/i.test(htmlSource)) {
      errors.push({ message: 'Missing closing </html> tag' });
    }

    if (!/<\/body>/i.test(htmlSource)) {
      errors.push({ message: 'Missing closing </body> tag' });
    }

    if (!/<head[\s>]/i.test(htmlSource)) {
      errors.push({ message: 'Missing <head> tag' });
    }

    if (!/<meta[^>]*charset/i.test(htmlSource)) {
      errors.push({ message: 'Missing charset meta tag' });
    }

    if (!/<meta[^>]*viewport/i.test(htmlSource)) {
      errors.push({ message: 'Missing viewport meta tag' });
    }

    return { html: htmlSource, errors };
  }

  /**
   * Validate the given HTML source.
   * Returns true if no structural errors are found.
   */
  validate(htmlSource: string): boolean {
    const { errors } = this.compile(htmlSource);
    return errors.length === 0;
  }
}
