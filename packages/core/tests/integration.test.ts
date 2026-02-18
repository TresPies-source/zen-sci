import { describe, it, expect } from 'vitest';
import {
  MarkdownParser,
  FrontmatterExtractor,
  CitationManager,
  BibTeXParser,
  CSLRenderer,
  SchemaValidator,
  MathValidator,
  LinkChecker,
  ConversionPipeline,
  ConversionError,
  ParseError,
  ValidationError,
  ZenSciError,
  Logger,
} from '../src/index.js';
import type {
  DocumentRequest,
  OutputFormat,
  ConversionErrorData,
  SectionNode,
  ParagraphNode,
  CodeBlockNode,
  TableNode,
  FigureNode,
} from '../src/types.js';

// =============================================================================
// Full markdown document for integration testing
// =============================================================================

const FULL_DOCUMENT = `---
title: A Complete Paper
author:
  - Alice Smith
  - Bob Jones
date: "2024-06-15"
tags:
  - physics
  - computing
keywords:
  - quantum
  - algorithms
lang: en
---

# Introduction

This paper explores **quantum algorithms** for *combinatorial optimization*.
We reference prior work by [@smith2020] and [@knuth1997].

## Background

The field of quantum computing has grown rapidly. See [Example](https://example.com).

### Mathematical Foundations

The key equation is:

\`\`\`python
def grover_search(n):
    return sqrt(n)
\`\`\`

| Algorithm | Speedup |
|-----------|---------|
| Grover    | Quadratic |
| Shor      | Exponential |

![Quantum Circuit](circuit.png "A quantum circuit diagram")

## Conclusion

Further work is needed in this area.
`;

const SAMPLE_BIB = `
@article{smith2020,
  title = {Quantum Computing Advances},
  author = {Smith, Alice and Jones, Bob},
  year = {2020},
  journal = {Nature Physics},
  volume = {10},
  pages = {42--55}
}
@book{knuth1997,
  title = {The Art of Computer Programming},
  author = {Knuth, Donald E.},
  year = {1997},
  publisher = {Addison-Wesley}
}
`;

// =============================================================================
// Integration: Full document parsing pipeline
// =============================================================================

describe('Integration: Full document parsing', () => {
  it('parses a complete markdown document into DocumentTree', () => {
    const parser = new MarkdownParser();
    const { tree, frontmatter } = parser.parseComplete(FULL_DOCUMENT);

    expect(tree.type).toBe('document');

    // Frontmatter extracted correctly
    expect(frontmatter.title).toBe('A Complete Paper');
    expect(frontmatter.author).toEqual(['Alice Smith', 'Bob Jones']);
    expect(frontmatter.date).toBe('2024-06-15');
    expect(frontmatter.tags).toEqual(['physics', 'computing']);
    expect(frontmatter.lang).toBe('en');

    // Tree has sections
    const sections = tree.children.filter(
      (n): n is SectionNode => n.type === 'section',
    );
    expect(sections.length).toBeGreaterThan(0);
    expect(sections[0]!.title).toBe('Introduction');

    // Tree has paragraphs with inline content
    const paragraphs = tree.children.filter(
      (n): n is ParagraphNode => n.type === 'paragraph',
    );
    expect(paragraphs.length).toBeGreaterThan(0);

    // Tree has code blocks
    const code = tree.children.filter(
      (n): n is CodeBlockNode => n.type === 'code',
    );
    expect(code.length).toBeGreaterThan(0);
    expect(code[0]!.language).toBe('python');

    // Tree has tables
    const tables = tree.children.filter(
      (n): n is TableNode => n.type === 'table',
    );
    expect(tables.length).toBe(1);
    expect(tables[0]!.headers).toEqual(['Algorithm', 'Speedup']);

    // Tree has figures
    const figures = tree.children.filter(
      (n): n is FigureNode => n.type === 'figure',
    );
    expect(figures.length).toBe(1);
    expect(figures[0]!.src).toBe('circuit.png');
    expect(figures[0]!.alt).toBe('Quantum Circuit');
  });
});

// =============================================================================
// Integration: SchemaValidator with complete request
// =============================================================================

describe('Integration: SchemaValidator validates complete DocumentRequest', () => {
  it('validates a full request with all fields', () => {
    const request: DocumentRequest = {
      id: 'int-test-1',
      source: FULL_DOCUMENT,
      format: 'latex',
      frontmatter: { title: 'A Complete Paper', author: ['Alice Smith', 'Bob Jones'] },
      bibliography: SAMPLE_BIB,
      options: {
        title: 'Override Title',
        author: ['Alice Smith'],
        toc: true,
        bibliography: { style: 'ieee', include: true, sortBy: 'citation-order' },
        math: { validate: true, engine: 'katex' },
      },
    };

    const supported: OutputFormat[] = ['latex', 'html', 'beamer'];
    const result = SchemaValidator.validate(request, supported);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('rejects request with multiple issues', () => {
    const request = {
      id: '',
      source: '',
      format: 'not-a-format' as OutputFormat,
      frontmatter: {},
      options: {},
    } as DocumentRequest;

    const result = SchemaValidator.validate(request, ['latex']);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// Integration: ConversionPipeline lifecycle
// =============================================================================

describe('Integration: ConversionPipeline tracks all stages', () => {
  it('tracks a complete successful pipeline', () => {
    const pipeline = new ConversionPipeline('req-123');
    pipeline.start();

    const state1 = pipeline.getState();
    expect(state1.status).toBe('running');

    // Run through all stages
    pipeline.startStage('parse');
    pipeline.completeStage('parse');

    pipeline.startStage('validate');
    pipeline.completeStage('validate');

    pipeline.startStage('transform');
    pipeline.completeStage('transform');

    pipeline.startStage('render');
    pipeline.completeStage('render');

    pipeline.startStage('compile');
    pipeline.completeStage('compile');

    pipeline.startStage('output');
    pipeline.completeStage('output', 100);

    pipeline.complete(true);

    const state = pipeline.getState();
    expect(state.status).toBe('completed');
    expect(state.stages.length).toBe(6);
    expect(state.stages.every((s) => s.status === 'complete')).toBe(true);
    expect(state.result?.success).toBe(true);
    expect(pipeline.elapsed()).toBeGreaterThanOrEqual(0);
  });

  it('tracks a failed pipeline with error', () => {
    const pipeline = new ConversionPipeline('req-fail');
    pipeline.start();

    pipeline.startStage('parse');
    pipeline.completeStage('parse');

    pipeline.startStage('validate');
    const error: ConversionErrorData = {
      code: 'VALIDATION_ERROR',
      message: 'Source has invalid format',
    };
    pipeline.failStage('validate', error);
    pipeline.complete(false, undefined, error);

    const state = pipeline.getState();
    expect(state.status).toBe('failed');
    expect(state.result?.success).toBe(false);
    expect(state.result?.error?.code).toBe('VALIDATION_ERROR');

    const failedStage = state.stages.find((s) => s.name === 'validate');
    expect(failedStage?.status).toBe('failed');
    expect(failedStage?.error?.code).toBe('VALIDATION_ERROR');
  });
});

// =============================================================================
// Integration: ConversionError bridge
// =============================================================================

describe('Integration: ConversionError fromData/toData bridge', () => {
  it('creates error from data and round-trips', () => {
    const data: ConversionErrorData = {
      code: 'CONVERSION_ERROR',
      message: 'Something went wrong',
      location: { line: 10, column: 5 },
      suggestions: ['Check input', 'Retry'],
    };

    const error = ConversionError.fromData(data);
    expect(error).toBeInstanceOf(ConversionError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Something went wrong');
    expect(error.code).toBe('CONVERSION_ERROR');
    expect(error.location?.line).toBe(10);
    expect(error.suggestions).toEqual(['Check input', 'Retry']);

    const roundTripped = error.toData();
    expect(roundTripped.code).toBe('CONVERSION_ERROR');
    expect(roundTripped.message).toBe('Something went wrong');
    expect(roundTripped.location?.line).toBe(10);
    expect(roundTripped.suggestions).toEqual(['Check input', 'Retry']);
  });
});

// =============================================================================
// Integration: Logger
// =============================================================================

describe('Integration: Logger outputs to stderr', () => {
  it('creates a logger instance and calls all methods without error', () => {
    const logger = new Logger('test-context');
    // These write to stderr; just verify they don't throw
    expect(() => logger.info('test info')).not.toThrow();
    expect(() => logger.warn('test warn', { extra: 'data' })).not.toThrow();
    expect(() => logger.error('test error')).not.toThrow();
    expect(() => logger.debug('test debug')).not.toThrow();
  });
});

// =============================================================================
// Integration: CitationManager with parsed document
// =============================================================================

describe('Integration: CitationManager with document parsing', () => {
  it('validates citations from a parsed tree', () => {
    const parser = new MarkdownParser();
    const tree = parser.parse(FULL_DOCUMENT);
    const manager = new CitationManager(SAMPLE_BIB);

    // Extract keys from tree (may be empty if no remark-cite plugin)
    const keys = manager.extractKeysFromAST(tree);
    // Keys might be empty since standard remark doesn't produce CitationNode,
    // but the API should not throw
    expect(Array.isArray(keys)).toBe(true);

    // Validate should still work
    const result = manager.validateAST(tree);
    expect(typeof result.valid).toBe('boolean');
  });
});

// =============================================================================
// Integration: FrontmatterExtractor + MarkdownParser round-trip
// =============================================================================

describe('Integration: Frontmatter inject + parse round-trip', () => {
  it('injects frontmatter, then parses it back', () => {
    const extractor = new FrontmatterExtractor();
    const parser = new MarkdownParser();

    const injected = extractor.inject('# Hello World\n\nContent.', {
      title: 'Injected Title',
      author: ['Test Author'],
    });

    const { frontmatter } = parser.parseComplete(injected);
    expect(frontmatter.title).toBe('Injected Title');
    expect(frontmatter.author).toEqual(['Test Author']);
  });
});

// =============================================================================
// Integration: Public API exports
// =============================================================================

describe('Integration: Public API exports from index', () => {
  it('exports all required classes', () => {
    expect(MarkdownParser).toBeDefined();
    expect(FrontmatterExtractor).toBeDefined();
    expect(CitationManager).toBeDefined();
    expect(BibTeXParser).toBeDefined();
    expect(CSLRenderer).toBeDefined();
    expect(SchemaValidator).toBeDefined();
    expect(MathValidator).toBeDefined();
    expect(LinkChecker).toBeDefined();
    expect(ConversionPipeline).toBeDefined();
    expect(ConversionError).toBeDefined();
    expect(ParseError).toBeDefined();
    expect(ValidationError).toBeDefined();
    expect(ZenSciError).toBeDefined();
    expect(Logger).toBeDefined();
  });
});

// =============================================================================
// Integration: Error hierarchy
// =============================================================================

describe('Integration: Error class hierarchy', () => {
  it('ParseError extends ZenSciError and Error', () => {
    const err = new ParseError('bad parse', { line: 1 }, ['fix syntax']);
    expect(err).toBeInstanceOf(ParseError);
    expect(err).toBeInstanceOf(ZenSciError);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ParseError');
    expect(err.code).toBe('PARSE_ERROR');
    expect(err.message).toBe('bad parse');
    expect(err.location?.line).toBe(1);
    expect(err.suggestions).toEqual(['fix syntax']);
  });

  it('ValidationError extends ZenSciError and Error', () => {
    const err = new ValidationError('invalid input', undefined, ['check format']);
    expect(err).toBeInstanceOf(ValidationError);
    expect(err).toBeInstanceOf(ZenSciError);
    expect(err.name).toBe('ValidationError');
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('ConversionError fromData preserves stack when present', () => {
    const data: ConversionErrorData = {
      code: 'CONVERSION_ERROR',
      message: 'fail',
      stack: 'Error: fail\n    at <test>',
    };
    const err = ConversionError.fromData(data);
    expect(err.stack).toBe('Error: fail\n    at <test>');
  });

  it('ConversionError toData without optional fields', () => {
    const err = new ConversionError('minimal error');
    const data = err.toData();
    expect(data.code).toBe('CONVERSION_ERROR');
    expect(data.message).toBe('minimal error');
    // location and suggestions not set
  });
});

// =============================================================================
// Integration: Pipeline edge cases
// =============================================================================

describe('Integration: ConversionPipeline edge cases', () => {
  it('completeStage on non-running stage is a no-op', () => {
    const pipeline = new ConversionPipeline('req-edge');
    pipeline.start();
    // Try to complete a stage that was never started
    pipeline.completeStage('render');
    const state = pipeline.getState();
    expect(state.stages.length).toBe(0);
  });

  it('failStage on non-running stage is a no-op', () => {
    const pipeline = new ConversionPipeline('req-edge2');
    pipeline.start();
    pipeline.failStage('compile', { code: 'ERR', message: 'test' });
    const state = pipeline.getState();
    expect(state.stages.length).toBe(0);
  });

  it('pipeline elapsed tracks time', () => {
    const pipeline = new ConversionPipeline('req-time');
    pipeline.start();
    expect(pipeline.elapsed()).toBeGreaterThanOrEqual(0);
  });
});
