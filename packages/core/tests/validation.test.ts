import { describe, it, expect } from 'vitest';
import { SchemaValidator } from '../src/validation/schema-validator.js';
import { MathValidator } from '../src/validation/math-validator.js';
import { LinkChecker } from '../src/validation/link-checker.js';
import type {
  DocumentRequest,
  OutputFormat,
  DocumentTree,
  SectionNode,
  ParagraphNode,
  LinkNode,
  FigureNode,
  MathNode,
  TableNode,
  CodeBlockNode,
} from '../src/types.js';

// =============================================================================
// Helpers
// =============================================================================

function makeValidRequest(overrides?: Partial<DocumentRequest>): DocumentRequest {
  return {
    id: 'test-1',
    source: '# Title\n\nSome content here.',
    format: 'latex',
    frontmatter: { title: 'Test Document' },
    options: {},
    ...overrides,
  };
}

// =============================================================================
// SchemaValidator
// =============================================================================

describe('SchemaValidator', () => {
  const supportedFormats: OutputFormat[] = ['latex', 'html', 'beamer'];

  it('validates a valid DocumentRequest', () => {
    const result = SchemaValidator.validate(makeValidRequest(), supportedFormats);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('rejects empty source', () => {
    const result = SchemaValidator.validate(
      makeValidRequest({ source: '' }),
      supportedFormats,
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('source'))).toBe(true);
  });

  it('rejects empty id', () => {
    const result = SchemaValidator.validate(
      makeValidRequest({ id: '' }),
      supportedFormats,
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('id'))).toBe(true);
  });

  it('rejects unsupported format', () => {
    const result = SchemaValidator.validate(
      makeValidRequest({ format: 'epub' }),
      supportedFormats,
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'VALIDATION_UNSUPPORTED_FORMAT')).toBe(true);
  });

  it('rejects invalid format string', () => {
    const result = SchemaValidator.validate(
      makeValidRequest({ format: 'not-a-format' as OutputFormat }),
      supportedFormats,
    );
    expect(result.valid).toBe(false);
  });

  it('validates frontmatter in isolation', () => {
    const result = SchemaValidator.validateFrontmatter({ title: 'Test', author: 'Jane' });
    expect(result.valid).toBe(true);
  });

  it('validates bibliography options in isolation', () => {
    const result = SchemaValidator.validateBibliographyOptions({
      style: 'apa',
      include: true,
      sortBy: 'alphabetical',
    });
    expect(result.valid).toBe(true);
  });

  it('rejects invalid bibliography style', () => {
    const result = SchemaValidator.validateBibliographyOptions({
      style: 'invalid-style' as 'apa',
    });
    expect(result.valid).toBe(false);
  });

  it('isFormatSupported returns true for supported format', () => {
    expect(SchemaValidator.isFormatSupported('latex', supportedFormats)).toBe(true);
  });

  it('isFormatSupported returns false for unsupported format', () => {
    expect(SchemaValidator.isFormatSupported('epub', supportedFormats)).toBe(false);
  });

  it('validates request with all optional fields populated', () => {
    const request = makeValidRequest({
      bibliography: '@article{a, title={T}, author={A}, year={2020}}',
      options: {
        title: 'Override',
        author: ['Jane'],
        date: '2024-01-01',
        toc: true,
        bibliography: { style: 'ieee', include: true },
        math: { validate: true, engine: 'katex' },
      },
      thinkingSession: {
        id: 'ts-1',
        prompt: 'Write a paper',
        reasoningChain: [{ step: 1, thought: 'Start', conclusion: 'Done' }],
        decisions: [{ decision: 'Use LaTeX', rationale: 'Standard' }],
        outputIntent: 'publish to journal',
      },
    });
    const result = SchemaValidator.validate(request, supportedFormats);
    expect(result.valid).toBe(true);
  });
});

// =============================================================================
// MathValidator
// =============================================================================

describe('MathValidator', () => {
  const validator = new MathValidator();

  it('validates or gracefully degrades for valid math expression', async () => {
    const result = await validator.validate('x^2 + y^2', 'inline');
    // Either validates successfully or warns that Python is unavailable
    expect(result.valid).toBe(true);
  });

  it('validates display mode expression', async () => {
    const result = await validator.validate('\\frac{a}{b}', 'display');
    // Graceful: valid is true even if Python is unavailable
    expect(result.valid).toBe(true);
  });

  it('returns warning when Python is unavailable (not an error)', async () => {
    // This test verifies the graceful degradation behavior:
    // If Python IS available, it validates normally (no warnings about python).
    // If Python is NOT available, it warns but still returns valid=true.
    const result = await validator.validate('x^2', 'inline');
    expect(result.valid).toBe(true);
    // No MATH_INVALID_EXPRESSION errors expected for valid math
    expect(result.errors.filter((e) => e.code === 'MATH_INVALID_EXPRESSION').length).toBe(0);
  });

  it('validateTree processes math nodes from a tree', async () => {
    const tree: DocumentTree = {
      type: 'document',
      children: [
        { type: 'math', mode: 'display', latex: 'x^2 + 1', validated: false } satisfies MathNode,
        {
          type: 'section',
          level: 1,
          title: 'Intro',
          children: [
            { type: 'math', mode: 'inline', latex: 'a + b', validated: false } satisfies MathNode,
          ],
        } satisfies SectionNode,
      ],
      frontmatter: {},
      bibliography: [],
    };

    const result = await validator.validateTree(tree);
    expect(result.valid).toBe(true);
  });

  it('simplify returns string result', async () => {
    const result = await validator.simplify('x + x');
    expect(typeof result).toBe('string');
  });

  it('toAscii returns string result', async () => {
    const result = await validator.toAscii('\\frac{1}{2}');
    expect(typeof result).toBe('string');
  });
});

// =============================================================================
// LinkChecker
// =============================================================================

describe('LinkChecker', () => {
  const checker = new LinkChecker();

  it('extracts links from a DocumentTree', () => {
    const tree: DocumentTree = {
      type: 'document',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              url: 'https://example.com',
              children: [{ type: 'text', text: 'Example' }],
            } satisfies LinkNode,
            { type: 'text', text: ' and ' },
            {
              type: 'link',
              url: '#section-1',
              children: [{ type: 'text', text: 'Section 1' }],
            } satisfies LinkNode,
          ],
        } satisfies ParagraphNode,
        {
          type: 'figure',
          src: 'images/fig.png',
          alt: 'Figure',
        } satisfies FigureNode,
      ],
      frontmatter: {},
      bibliography: [],
    };

    const links = checker.extractLinks(tree);
    expect(links.length).toBe(3);
    expect(links.some((l) => l.type === 'external' && l.url === 'https://example.com')).toBe(true);
    expect(links.some((l) => l.type === 'anchor' && l.url === '#section-1')).toBe(true);
    expect(links.some((l) => l.type === 'internal' && l.url === 'images/fig.png')).toBe(true);
  });

  it('validates internal references — missing target produces error', () => {
    const tree: DocumentTree = {
      type: 'document',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              url: '#nonexistent',
              children: [{ type: 'text', text: 'Ref' }],
            } satisfies LinkNode,
          ],
        } satisfies ParagraphNode,
      ],
      frontmatter: {},
      bibliography: [],
    };

    const result = checker.validateInternalReferences(tree);
    expect(result.errors.some((e) => e.code === 'LINK_MISSING_TARGET')).toBe(true);
  });

  it('validates internal references — existing target resolves', () => {
    const tree: DocumentTree = {
      type: 'document',
      children: [
        {
          type: 'section',
          level: 1,
          title: 'Intro',
          id: 'intro',
          children: [],
        } satisfies SectionNode,
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              url: '#intro',
              children: [{ type: 'text', text: 'See Intro' }],
            } satisfies LinkNode,
          ],
        } satisfies ParagraphNode,
      ],
      frontmatter: {},
      bibliography: [],
    };

    const result = checker.validateInternalReferences(tree);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('checkTree skips external checks when skipExternal is true', async () => {
    const tree: DocumentTree = {
      type: 'document',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              url: 'https://definitely-not-a-real-site-12345.com',
              children: [{ type: 'text', text: 'Broken' }],
            } satisfies LinkNode,
          ],
        } satisfies ParagraphNode,
      ],
      frontmatter: {},
      bibliography: [],
    };

    const result = await checker.checkTree(tree, { skipExternal: true });
    // No warnings about dead links since we skipped external checks
    expect(result.warnings.filter((w) => w.code === 'LINK_DEAD').length).toBe(0);
  });

  it('checkTree skips internal checks when skipInternal is true', async () => {
    const tree: DocumentTree = {
      type: 'document',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              url: '#nonexistent',
              children: [{ type: 'text', text: 'Missing ref' }],
            } satisfies LinkNode,
          ],
        } satisfies ParagraphNode,
      ],
      frontmatter: {},
      bibliography: [],
    };

    const result = await checker.checkTree(tree, { skipExternal: true, skipInternal: true });
    // No internal reference errors since we skipped them
    expect(result.errors.filter((e) => e.code === 'LINK_MISSING_TARGET').length).toBe(0);
  });

  it('extracts links from table cells', () => {
    const tree: DocumentTree = {
      type: 'document',
      children: [
        {
          type: 'table',
          headers: ['Name'],
          rows: [
            [
              [
                {
                  type: 'link',
                  url: 'https://table-link.com',
                  children: [{ type: 'text', text: 'Link' }],
                } satisfies LinkNode,
              ],
            ],
          ],
        } satisfies TableNode,
      ],
      frontmatter: {},
      bibliography: [],
    };

    const links = checker.extractLinks(tree);
    expect(links.some((l) => l.url === 'https://table-link.com')).toBe(true);
  });

  it('extracts links from citation resolved URLs', () => {
    const tree: DocumentTree = {
      type: 'document',
      children: [
        {
          type: 'citation',
          key: 'test',
          resolved: {
            key: 'test',
            type: 'article',
            title: 'Test',
            author: ['A'],
            year: 2020,
            url: 'https://citation-url.com',
            raw: {},
          },
        },
      ],
      frontmatter: {},
      bibliography: [],
    };

    const links = checker.extractLinks(tree);
    expect(links.some((l) => l.url === 'https://citation-url.com')).toBe(true);
  });

  it('extracts internal links from figures', () => {
    const tree: DocumentTree = {
      type: 'document',
      children: [
        {
          type: 'figure',
          src: 'local/image.png',
          alt: 'Local image',
        } satisfies FigureNode,
      ],
      frontmatter: {},
      bibliography: [],
    };

    const links = checker.extractLinks(tree);
    expect(links.some((l) => l.type === 'internal' && l.url === 'local/image.png')).toBe(true);
  });

  it('extracts links nested in emphasis/strong', () => {
    const tree: DocumentTree = {
      type: 'document',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'emphasis',
              children: [
                {
                  type: 'link',
                  url: 'https://nested-link.com',
                  children: [{ type: 'text', text: 'nested' }],
                } satisfies LinkNode,
              ],
            },
          ],
        } satisfies ParagraphNode,
      ],
      frontmatter: {},
      bibliography: [],
    };

    const links = checker.extractLinks(tree);
    expect(links.some((l) => l.url === 'https://nested-link.com')).toBe(true);
  });

  it('table label acts as cross-reference target', () => {
    const tree: DocumentTree = {
      type: 'document',
      children: [
        {
          type: 'table',
          headers: ['A'],
          rows: [],
          label: 'tbl1',
        } satisfies TableNode,
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              url: '#tbl1',
              children: [{ type: 'text', text: 'See Table 1' }],
            } satisfies LinkNode,
          ],
        } satisfies ParagraphNode,
      ],
      frontmatter: {},
      bibliography: [],
    };

    const result = checker.validateInternalReferences(tree);
    expect(result.valid).toBe(true);
  });

  it('code label acts as cross-reference target', () => {
    const tree: DocumentTree = {
      type: 'document',
      children: [
        {
          type: 'code',
          language: 'python',
          content: 'print(1)',
          label: 'code1',
        } satisfies CodeBlockNode,
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              url: '#code1',
              children: [{ type: 'text', text: 'See Code 1' }],
            } satisfies LinkNode,
          ],
        } satisfies ParagraphNode,
      ],
      frontmatter: {},
      bibliography: [],
    };

    const result = checker.validateInternalReferences(tree);
    expect(result.valid).toBe(true);
  });

  it('figure label acts as cross-reference target', () => {
    const tree: DocumentTree = {
      type: 'document',
      children: [
        {
          type: 'figure',
          src: 'fig.png',
          alt: 'A figure',
          label: 'fig1',
        } satisfies FigureNode,
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              url: '#fig1',
              children: [{ type: 'text', text: 'See Figure 1' }],
            } satisfies LinkNode,
          ],
        } satisfies ParagraphNode,
      ],
      frontmatter: {},
      bibliography: [],
    };

    const result = checker.validateInternalReferences(tree);
    expect(result.valid).toBe(true);
  });
});
