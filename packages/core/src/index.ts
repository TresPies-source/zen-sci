// packages/core/src/index.ts — Public API Surface
export { MarkdownParser } from './parsing/markdown-parser.js';
export { FrontmatterExtractor } from './parsing/frontmatter-extractor.js';
export { CitationManager } from './citations/citation-manager.js';
export { BibTeXParser } from './citations/bibtex-parser.js';
export { CSLRenderer } from './citations/csl-renderer.js';
export { SchemaValidator } from './validation/schema-validator.js';
export { MathValidator } from './validation/math-validator.js';
export { LinkChecker } from './validation/link-checker.js';
export { ConversionPipeline } from './pipeline/conversion-pipeline.js';
export { Logger } from './utils/logger.js';
export {
  ZenSciError,
  ParseError,
  ValidationError,
  ConversionError,
} from './utils/error-handler.js';
export type * from './types.js';
