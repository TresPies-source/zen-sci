# @zen-sci/core

Shared parsing, pipeline, citation, and validation library for all ZenSci MCP module servers.

## Installation

```bash
pnpm add @zen-sci/core
```

## Quick Start

```typescript
import { MarkdownParser, CitationManager, SchemaValidator } from '@zen-sci/core';

// Parse markdown
const parser = new MarkdownParser();
const { tree, frontmatter } = parser.parseComplete(markdownSource);

// Resolve citations
const citations = new CitationManager(bibtexContent);
const record = citations.resolve('smith2023');

// Validate request
const result = SchemaValidator.validate(request, ['latex', 'html']);
```

## Modules

- **Parsing:** `MarkdownParser`, `FrontmatterExtractor`
- **Citations:** `CitationManager`, `BibTeXParser`, `CSLRenderer`
- **Validation:** `SchemaValidator`, `MathValidator`, `LinkChecker`
- **Pipeline:** `ConversionPipeline`
- **Errors:** `ConversionError`, `ParseError`, `ValidationError`

## License

Apache-2.0
