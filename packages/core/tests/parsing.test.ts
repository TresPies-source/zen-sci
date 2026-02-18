import { describe, it, expect } from 'vitest';
import { MarkdownParser } from '../src/parsing/markdown-parser.js';
import { FrontmatterExtractor } from '../src/parsing/frontmatter-extractor.js';
import type { SectionNode, ParagraphNode, CodeBlockNode, FigureNode, TableNode } from '../src/types.js';

// =============================================================================
// FrontmatterExtractor
// =============================================================================

describe('FrontmatterExtractor', () => {
  const extractor = new FrontmatterExtractor();

  it('extracts YAML frontmatter from source', () => {
    const source = `---\ntitle: Hello\nauthor: Jane\n---\n# Content`;
    const { frontmatter, content } = extractor.extract(source);
    expect(frontmatter.title).toBe('Hello');
    expect(frontmatter.author).toBe('Jane');
    expect(content.trim()).toBe('# Content');
  });

  it('returns empty frontmatter for source without frontmatter', () => {
    const { frontmatter, content } = extractor.extract('# No Frontmatter');
    expect(Object.keys(frontmatter).length).toBe(0);
    expect(content.trim()).toBe('# No Frontmatter');
  });

  it('handles empty source', () => {
    const { frontmatter, content } = extractor.extract('');
    expect(Object.keys(frontmatter).length).toBe(0);
    expect(content).toBe('');
  });

  it('preserves array author field', () => {
    const source = `---\nauthor:\n  - Alice\n  - Bob\n---\nBody`;
    const { frontmatter } = extractor.extract(source);
    expect(Array.isArray(frontmatter.author)).toBe(true);
    expect(frontmatter.author).toEqual(['Alice', 'Bob']);
  });

  it('preserves custom keys in frontmatter', () => {
    const source = `---\ntitle: Test\ncustom_field: value123\n---\nBody`;
    const { frontmatter } = extractor.extract(source);
    expect(frontmatter['custom_field']).toBe('value123');
  });

  it('injects frontmatter into content', () => {
    const result = extractor.inject('# Content', { title: 'Test' });
    expect(result).toContain('title: Test');
    expect(result).toContain('# Content');
  });

  it('validates valid frontmatter', () => {
    const result = extractor.validate({ title: 'Hello', author: 'Jane' });
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('warns when title is missing', () => {
    const result = extractor.validate({});
    expect(result.valid).toBe(true); // missing title is a warning, not error
    expect(result.warnings.some((w) => w.code === 'FRONTMATTER_MISSING_TITLE')).toBe(true);
  });

  it('errors on invalid author type', () => {
    const result = extractor.validate({ author: 42 as unknown as string });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'FRONTMATTER_INVALID_AUTHOR')).toBe(true);
  });

  it('errors on non-string items in tags array', () => {
    const result = extractor.validate({ title: 'X', tags: [123 as unknown as string] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'FRONTMATTER_INVALID_TAGS')).toBe(true);
  });

  it('merges two frontmatter objects', () => {
    const base = { title: 'A', author: 'Jane', tags: ['x'] };
    const override = { title: 'B', description: 'merged' };
    const merged = extractor.merge(base, override);
    expect(merged.title).toBe('B');
    expect(merged.author).toBe('Jane');
    expect(merged.description).toBe('merged');
  });

  it('errors on non-string title', () => {
    const result = extractor.validate({ title: 42 as unknown as string });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'FRONTMATTER_INVALID_TITLE')).toBe(true);
  });

  it('errors on non-string date', () => {
    const result = extractor.validate({ title: 'X', date: 123 as unknown as string });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'FRONTMATTER_INVALID_DATE')).toBe(true);
  });

  it('errors on non-string description', () => {
    const result = extractor.validate({ title: 'X', description: false as unknown as string });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'FRONTMATTER_INVALID_DESCRIPTION')).toBe(true);
  });

  it('errors on non-array keywords', () => {
    const result = extractor.validate({ title: 'X', keywords: 'not-array' as unknown as string[] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'FRONTMATTER_INVALID_KEYWORDS')).toBe(true);
  });

  it('errors on non-string items in keywords array', () => {
    const result = extractor.validate({ title: 'X', keywords: [42 as unknown as string] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'FRONTMATTER_INVALID_KEYWORDS')).toBe(true);
  });

  it('errors on non-string lang', () => {
    const result = extractor.validate({ title: 'X', lang: 123 as unknown as string });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'FRONTMATTER_INVALID_LANG')).toBe(true);
  });

  it('errors on non-array tags field', () => {
    const result = extractor.validate({ title: 'X', tags: 'not-array' as unknown as string[] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'FRONTMATTER_INVALID_TAGS')).toBe(true);
  });

  it('validates valid array author', () => {
    const result = extractor.validate({ title: 'X', author: ['Alice', 'Bob'] });
    expect(result.valid).toBe(true);
  });

  it('merge ignores undefined override values', () => {
    const base = { title: 'A' };
    const override = { title: undefined as unknown as string };
    const merged = extractor.merge(base, override);
    expect(merged.title).toBe('A');
  });

  it('strips null values during normalization', () => {
    const source = `---\ntitle: Test\nnullField: null\n---\nBody`;
    const { frontmatter } = extractor.extract(source);
    // null values should be stripped
    expect(frontmatter.title).toBe('Test');
  });
});

// =============================================================================
// MarkdownParser
// =============================================================================

describe('MarkdownParser', () => {
  const parser = new MarkdownParser();

  it('parses simple markdown into a DocumentTree', () => {
    const tree = parser.parse('# Title\n\nParagraph text.');
    expect(tree.type).toBe('document');
    expect(tree.children.length).toBeGreaterThan(0);
  });

  it('detects headings at levels h1-h6', () => {
    const source = [1, 2, 3, 4, 5, 6]
      .map((n) => `${'#'.repeat(n)} Heading ${n}`)
      .join('\n\n');
    const tree = parser.parse(source);

    const sections = tree.children.filter(
      (n): n is SectionNode => n.type === 'section',
    );
    expect(sections.length).toBe(6);
    for (let i = 0; i < 6; i++) {
      expect(sections[i]!.level).toBe(i + 1);
      expect(sections[i]!.title).toBe(`Heading ${i + 1}`);
    }
  });

  it('maps code blocks to CodeBlockNode with language', () => {
    const source = '```python\nprint("hi")\n```';
    const tree = parser.parse(source);
    const code = tree.children.find(
      (n): n is CodeBlockNode => n.type === 'code',
    );
    expect(code).toBeDefined();
    expect(code!.language).toBe('python');
    expect(code!.content).toBe('print("hi")');
  });

  it('maps inline code to CodeNode in paragraphs', () => {
    const tree = parser.parse('Use `npm install` here.');
    const para = tree.children.find(
      (n): n is ParagraphNode => n.type === 'paragraph',
    );
    expect(para).toBeDefined();
    const codeNode = para!.children.find((n) => n.type === 'code');
    expect(codeNode).toBeDefined();
    if (codeNode && codeNode.type === 'code') {
      expect(codeNode.code).toBe('npm install');
    }
  });

  it('maps images to FigureNode', () => {
    const tree = parser.parse('![alt text](image.png "caption")');
    const figure = tree.children.find(
      (n): n is FigureNode => n.type === 'figure',
    );
    expect(figure).toBeDefined();
    expect(figure!.src).toBe('image.png');
    expect(figure!.alt).toBe('alt text');
    expect(figure!.caption).toBe('caption');
  });

  it('maps tables to TableNode', () => {
    const source = '| A | B |\n|---|---|\n| 1 | 2 |';
    const tree = parser.parse(source);
    const table = tree.children.find(
      (n): n is TableNode => n.type === 'table',
    );
    expect(table).toBeDefined();
    expect(table!.headers).toEqual(['A', 'B']);
    expect(table!.rows.length).toBe(1);
  });

  it('extracts frontmatter via parseComplete', () => {
    const source = `---\ntitle: My Doc\nauthor: Cruz\n---\n# Hello`;
    const { tree, frontmatter } = parser.parseComplete(source);
    expect(frontmatter.title).toBe('My Doc');
    expect(frontmatter.author).toBe('Cruz');
    expect(tree.frontmatter).toEqual(frontmatter);
  });

  it('handles empty source gracefully', () => {
    const tree = parser.parse('');
    expect(tree.type).toBe('document');
    expect(tree.children.length).toBe(0);
  });

  it('handles source with only frontmatter', () => {
    const source = '---\ntitle: Only Meta\n---\n';
    const tree = parser.parse(source);
    expect(tree.type).toBe('document');
    expect(tree.frontmatter.title).toBe('Only Meta');
  });

  it('handles unicode content', () => {
    const source = '# 数学 Mathématiques\n\nÉmilie Nöether proved 定理。';
    const tree = parser.parse(source);
    const section = tree.children.find(
      (n): n is SectionNode => n.type === 'section',
    );
    expect(section?.title).toBe('数学 Mathématiques');
  });

  it('maps emphasis and strong inline nodes', () => {
    const tree = parser.parse('This is *italic* and **bold**.');
    const para = tree.children.find(
      (n): n is ParagraphNode => n.type === 'paragraph',
    );
    expect(para).toBeDefined();
    expect(para!.children.some((n) => n.type === 'emphasis')).toBe(true);
    expect(para!.children.some((n) => n.type === 'strong')).toBe(true);
  });

  it('maps links to LinkNode', () => {
    const tree = parser.parse('Visit [Example](https://example.com).');
    const para = tree.children.find(
      (n): n is ParagraphNode => n.type === 'paragraph',
    );
    expect(para).toBeDefined();
    const link = para!.children.find((n) => n.type === 'link');
    expect(link).toBeDefined();
    if (link && link.type === 'link') {
      expect(link.url).toBe('https://example.com');
    }
  });

  it('validates source and returns ValidationResult', () => {
    const result = parser.validate('# Valid Doc\n\nContent here.');
    expect(result.valid).toBe(true);
  });

  it('validate warns on empty content', () => {
    const result = parser.validate('---\ntitle: T\n---\n');
    expect(result.warnings.some((w) => w.code === 'EMPTY_CONTENT')).toBe(true);
  });
});
