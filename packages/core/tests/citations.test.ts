import { describe, it, expect } from 'vitest';
import { BibTeXParser } from '../src/citations/bibtex-parser.js';
import { CSLRenderer } from '../src/citations/csl-renderer.js';
import { CitationManager } from '../src/citations/citation-manager.js';
import type { DocumentTree, CitationNode, ParagraphNode, CitationReferenceNode } from '../src/types.js';

// =============================================================================
// Sample BibTeX fixtures
// =============================================================================

const VALID_BIBTEX = `
@article{smith2020,
  title = {Quantum Computing in the Wild},
  author = {Smith, John and Doe, Jane},
  year = {2020},
  journal = {Nature Computing},
  volume = {42},
  number = {3},
  pages = {100--115},
  doi = {10.1234/nc.2020.42}
}

@book{knuth1997,
  title = {The Art of Computer Programming},
  author = {Knuth, Donald E.},
  year = {1997},
  publisher = {Addison-Wesley}
}

@inproceedings{lee2021,
  title = {Deep Learning for Science},
  author = {Lee, Alice and Park, Bob and Kim, Charlie},
  year = {2021},
  booktitle = {Proceedings of NeurIPS},
  pages = {200--210}
}
`;

const MALFORMED_BIBTEX = `
@article{broken,
  title = {No closing brace
`;

// =============================================================================
// BibTeXParser
// =============================================================================

describe('BibTeXParser', () => {
  const parser = new BibTeXParser();

  it('parses valid BibTeX into CitationRecord array', () => {
    const records = parser.parse(VALID_BIBTEX);
    expect(records.length).toBe(3);
  });

  it('correctly parses article entry', () => {
    const records = parser.parse(VALID_BIBTEX);
    const smith = records.find((r) => r.key === 'smith2020');
    expect(smith).toBeDefined();
    expect(smith!.type).toBe('article');
    expect(smith!.title).toBe('Quantum Computing in the Wild');
    expect(smith!.author).toEqual(['Smith, John', 'Doe, Jane']);
    expect(smith!.year).toBe(2020);
    expect(smith!.journal).toBe('Nature Computing');
    expect(smith!.volume).toBe('42');
    expect(smith!.pages).toBe('100--115');
    expect(smith!.doi).toBe('10.1234/nc.2020.42');
  });

  it('correctly parses book entry', () => {
    const records = parser.parse(VALID_BIBTEX);
    const knuth = records.find((r) => r.key === 'knuth1997');
    expect(knuth).toBeDefined();
    expect(knuth!.type).toBe('book');
    expect(knuth!.publisher).toBe('Addison-Wesley');
  });

  it('correctly parses inproceedings entry', () => {
    const records = parser.parse(VALID_BIBTEX);
    const lee = records.find((r) => r.key === 'lee2021');
    expect(lee).toBeDefined();
    expect(lee!.type).toBe('inproceedings');
    expect(lee!.author.length).toBe(3);
    expect(lee!.booktitle).toBe('Proceedings of NeurIPS');
  });

  it('handles malformed BibTeX gracefully (partial results)', () => {
    const records = parser.parse(MALFORMED_BIBTEX);
    // Should still attempt to parse the entry
    expect(records.length).toBeGreaterThanOrEqual(0);
  });

  it('validate detects unbalanced braces', () => {
    const result = parser.validate(MALFORMED_BIBTEX);
    expect(result.errors.some((e) => e.code === 'BIBTEX_UNBALANCED_BRACES')).toBe(true);
  });

  it('validate detects missing fields', () => {
    const bibtex = `@article{nofields,\n}`;
    const result = parser.validate(bibtex);
    expect(result.warnings.some((w) => w.code === 'BIBTEX_MISSING_TITLE')).toBe(true);
    expect(result.warnings.some((w) => w.code === 'BIBTEX_MISSING_AUTHOR')).toBe(true);
    expect(result.warnings.some((w) => w.code === 'BIBTEX_MISSING_YEAR')).toBe(true);
  });

  it('validate detects duplicate keys', () => {
    const bibtex = `@article{dup,\n  title={A},\n  author={X},\n  year={2020}\n}\n@article{dup,\n  title={B},\n  author={Y},\n  year={2021}\n}`;
    const result = parser.validate(bibtex);
    expect(result.errors.some((e) => e.code === 'BIBTEX_DUPLICATE_KEY')).toBe(true);
  });

  it('generates BibTeX from records', () => {
    const records = parser.parse(VALID_BIBTEX);
    const output = parser.generate(records);
    expect(output).toContain('@article{smith2020,');
    expect(output).toContain('@book{knuth1997,');
    expect(output).toContain('Smith, John and Doe, Jane');
  });

  it('skips @comment and @preamble entries', () => {
    const bibtex = `@comment{This is a comment}\n@preamble{"Preamble"}\n@article{real,\n  title={Real},\n  author={Author},\n  year={2020}\n}`;
    const records = parser.parse(bibtex);
    expect(records.length).toBe(1);
    expect(records[0]!.key).toBe('real');
  });
});

// =============================================================================
// CSLRenderer
// =============================================================================

describe('CSLRenderer', () => {
  const renderer = new CSLRenderer();
  const records = new BibTeXParser().parse(VALID_BIBTEX);
  const smith = records.find((r) => r.key === 'smith2020')!;
  const lee = records.find((r) => r.key === 'lee2021')!;

  it('formats IEEE inline citation as [N]', () => {
    expect(renderer.formatCitation(smith, 'ieee', 1)).toBe('[1]');
    expect(renderer.formatCitation(smith, 'ieee', 5)).toBe('[5]');
  });

  it('formats APA inline citation as (Author, Year)', () => {
    const apa = renderer.formatCitation(smith, 'apa');
    expect(apa).toContain('Smith');
    expect(apa).toContain('Doe');
    expect(apa).toContain('2020');
  });

  it('formats APA with 3+ authors as et al.', () => {
    const apa = renderer.formatCitation(lee, 'apa');
    expect(apa).toContain('et al.');
    expect(apa).toContain('2021');
  });

  it('formats IEEE bibliography entry', () => {
    const bib = renderer.formatBibliography([smith], 'ieee');
    expect(bib).toContain('[1]');
    expect(bib).toContain('Quantum Computing in the Wild');
    expect(bib).toContain('Nature Computing');
  });

  it('formats APA bibliography entry', () => {
    const bib = renderer.formatBibliography([smith], 'apa');
    expect(bib).toContain('Smith');
    expect(bib).toContain('(2020)');
    expect(bib).toContain('Quantum Computing in the Wild');
  });

  it('lists built-in styles', () => {
    const styles = renderer.listStyles();
    expect(styles).toContain('ieee');
    expect(styles).toContain('apa');
    expect(styles).toContain('nature');
    expect(styles).toContain('arxiv');
  });

  it('registers custom style and includes it in list', () => {
    renderer.registerCustomStyle('my-style', '<csl/>');
    const styles = renderer.listStyles();
    expect(styles).toContain('custom');
  });

  it('falls back to generic style for unsupported styles', () => {
    const citation = renderer.formatCitation(smith, 'chicago');
    expect(typeof citation).toBe('string');
    expect(citation.length).toBeGreaterThan(0);
  });

  it('formats IEEE with single author', () => {
    const knuth = records.find((r) => r.key === 'knuth1997')!;
    const bib = renderer.formatBibliography([knuth], 'ieee');
    expect(bib).toContain('[1]');
    expect(bib).toContain('Knuth');
  });

  it('formats IEEE with two authors', () => {
    const bib = renderer.formatBibliography([smith], 'ieee');
    expect(bib).toContain('and');
  });

  it('formats IEEE with three authors', () => {
    const bib = renderer.formatBibliography([lee], 'ieee');
    expect(bib).toContain('and');
  });

  it('formats APA with single author', () => {
    const knuth = records.find((r) => r.key === 'knuth1997')!;
    const apa = renderer.formatCitation(knuth, 'apa');
    expect(apa).toContain('Knuth');
    expect(apa).toContain('1997');
  });

  it('formats APA with two authors', () => {
    const apa = renderer.formatCitation(smith, 'apa');
    expect(apa).toContain('&');
  });

  it('handles record with no authors in APA', () => {
    const noAuthor = { ...smith, author: [], year: 0 };
    const apa = renderer.formatCitation(noAuthor, 'apa');
    expect(apa).toContain('n.d.');
  });

  it('formats generic inline for unknown record', () => {
    const noAuthor = { ...smith, author: [] };
    const generic = renderer.formatCitation(noAuthor, 'harvard');
    expect(generic).toContain(noAuthor.key);
  });

  it('formats APA bibliography with booktitle', () => {
    const bib = renderer.formatBibliography([lee], 'apa');
    expect(bib).toContain('In Proceedings of NeurIPS');
  });

  it('formats APA bibliography with DOI', () => {
    const bib = renderer.formatBibliography([smith], 'apa');
    expect(bib).toContain('doi.org');
  });

  it('formats APA bibliography with URL when no DOI', () => {
    const withUrl = { ...smith, doi: undefined, url: 'https://example.com' };
    const bib = renderer.formatBibliography([withUrl], 'apa');
    expect(bib).toContain('https://example.com');
  });

  it('formats generic bibliography entry', () => {
    const bib = renderer.formatBibliography([smith], 'vancouver');
    expect(bib).toContain('Smith, John');
    expect(bib).toContain('2020');
  });

  it('formats APA bibliography with volume and issue', () => {
    const withIssue = { ...smith, issue: '3' };
    const bib = renderer.formatBibliography([withIssue], 'apa');
    expect(bib).toContain('42');
    expect(bib).toContain('(3)');
  });

  it('formats IEEE bibliography with inproceedings booktitle', () => {
    const bib = renderer.formatBibliography([lee], 'ieee');
    expect(bib).toContain('in Proceedings of NeurIPS');
  });

  it('formats IEEE bibliography entry with year 0 gracefully', () => {
    const noYear = { ...smith, year: 0 };
    const bib = renderer.formatBibliography([noYear], 'ieee');
    expect(bib).toContain('[1]');
  });

  it('formats generic bibliography for record with no authors', () => {
    const noAuthor = { ...smith, author: [] };
    const bib = renderer.formatBibliography([noAuthor], 'mla');
    expect(bib).toContain('Unknown');
  });
});

// =============================================================================
// CitationManager
// =============================================================================

describe('CitationManager', () => {
  it('resolves citation by key', () => {
    const manager = new CitationManager(VALID_BIBTEX);
    const record = manager.resolve('smith2020');
    expect(record).not.toBeNull();
    expect(record!.title).toBe('Quantum Computing in the Wild');
  });

  it('returns null for unknown key', () => {
    const manager = new CitationManager(VALID_BIBTEX);
    expect(manager.resolve('nonexistent')).toBeNull();
  });

  it('returns all records', () => {
    const manager = new CitationManager(VALID_BIBTEX);
    expect(manager.getAllRecords().length).toBe(3);
  });

  it('resolves multiple keys', () => {
    const manager = new CitationManager(VALID_BIBTEX);
    const resolved = manager.resolveMultiple(['smith2020', 'knuth1997', 'nonexistent']);
    expect(resolved.length).toBe(2);
  });

  it('searches records by query', () => {
    const manager = new CitationManager(VALID_BIBTEX);
    const results = manager.search('quantum');
    expect(results.length).toBe(1);
    expect(results[0]!.key).toBe('smith2020');
  });

  it('searches records by author name', () => {
    const manager = new CitationManager(VALID_BIBTEX);
    const results = manager.search('Knuth');
    expect(results.length).toBe(1);
    expect(results[0]!.key).toBe('knuth1997');
  });

  it('formats citation in IEEE style', () => {
    const manager = new CitationManager(VALID_BIBTEX);
    const citation = manager.formatCitation('smith2020', 'ieee');
    expect(citation).toMatch(/\[\d+\]/);
  });

  it('formats citation for unresolved key', () => {
    const manager = new CitationManager(VALID_BIBTEX);
    const citation = manager.formatCitation('unknown');
    expect(citation).toBe('[unknown]');
  });

  it('formats bibliography for all entries', () => {
    const manager = new CitationManager(VALID_BIBTEX);
    const bib = manager.formatBibliography();
    expect(bib).toContain('Quantum Computing');
    expect(bib).toContain('Art of Computer Programming');
    expect(bib).toContain('Deep Learning');
  });

  it('formats bibliography for a subset of keys', () => {
    const manager = new CitationManager(VALID_BIBTEX);
    const bib = manager.formatBibliography(['smith2020'], 'apa');
    expect(bib).toContain('Smith');
    expect(bib).not.toContain('Knuth');
  });

  it('extracts citation keys from AST', () => {
    const manager = new CitationManager(VALID_BIBTEX);
    const tree: DocumentTree = {
      type: 'document',
      children: [
        { type: 'citation', key: 'smith2020' } satisfies CitationNode,
        { type: 'citation', key: 'knuth1997' } satisfies CitationNode,
      ],
      frontmatter: {},
      bibliography: [],
    };
    const keys = manager.extractKeysFromAST(tree);
    expect(keys).toEqual(['smith2020', 'knuth1997']);
  });

  it('extracts citation-reference keys from paragraph children', () => {
    const manager = new CitationManager(VALID_BIBTEX);
    const tree: DocumentTree = {
      type: 'document',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', text: 'See ' },
            { type: 'citation-reference', key: 'lee2021' } satisfies CitationReferenceNode,
          ],
        } satisfies ParagraphNode,
      ],
      frontmatter: {},
      bibliography: [],
    };
    const keys = manager.extractKeysFromAST(tree);
    expect(keys).toContain('lee2021');
  });

  it('validates AST — missing citation key produces error', () => {
    const manager = new CitationManager(VALID_BIBTEX);
    const tree: DocumentTree = {
      type: 'document',
      children: [
        { type: 'citation', key: 'nonexistent' } satisfies CitationNode,
      ],
      frontmatter: {},
      bibliography: [],
    };
    const result = manager.validateAST(tree);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'CITATION_UNRESOLVED')).toBe(true);
  });

  it('validates AST — warns about unused bibliography entries', () => {
    const manager = new CitationManager(VALID_BIBTEX);
    const tree: DocumentTree = {
      type: 'document',
      children: [
        { type: 'citation', key: 'smith2020' } satisfies CitationNode,
      ],
      frontmatter: {},
      bibliography: [],
    };
    const result = manager.validateAST(tree);
    // knuth1997 and lee2021 are unused
    expect(result.warnings.some((w) => w.code === 'CITATION_UNUSED')).toBe(true);
  });

  it('handles malformed BibTeX gracefully', () => {
    const manager = new CitationManager(MALFORMED_BIBTEX);
    const records = manager.getAllRecords();
    // Should not throw; may have partial results
    expect(Array.isArray(records)).toBe(true);
  });
});
