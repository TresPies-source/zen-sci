// packages/core/src/types.ts
// All TypeScript interfaces for ZenSci core

// =============================================================================
// § 3.1 Core Data Contracts
// =============================================================================

export interface DocumentRequest {
  id: string;
  source: string;
  format: OutputFormat;
  frontmatter: FrontmatterMetadata;
  bibliography?: string;
  options: DocumentOptions;
  thinkingSession?: ThinkingSession;
}

export type OutputFormat =
  | 'latex'
  | 'beamer'
  | 'grant-latex'
  | 'paper-ieee'
  | 'paper-acm'
  | 'paper-arxiv'
  | 'thesis'
  | 'patent'
  | 'revealjs'
  | 'pptx'
  | 'html'
  | 'email'
  | 'epub'
  | 'mobi'
  | 'docs'
  | 'docx'
  | 'lab-notebook'
  | 'policy-brief'
  | 'proposal'
  | 'podcast-notes'
  | 'resume'
  | 'whitepaper';

export interface DocumentOptions {
  title?: string;
  author?: string[];
  date?: string;
  toc?: boolean;
  bibliography?: BibliographyOptions;
  math?: MathOptions;
  moduleOptions?: Record<string, unknown>;
}

export interface FrontmatterMetadata {
  title?: string;
  author?: string | string[];
  date?: string;
  tags?: string[];
  description?: string;
  keywords?: string[];
  lang?: string;
  [key: string]: unknown;
}

export interface BibliographyOptions {
  style?: BibliographyStyle;
  include?: boolean;
  sortBy?: 'citation-order' | 'alphabetical';
  link?: boolean;
}

export type BibliographyStyle =
  | 'apa'
  | 'ieee'
  | 'chicago'
  | 'mla'
  | 'harvard'
  | 'vancouver'
  | 'nature'
  | 'arxiv'
  | 'custom';

export interface MathOptions {
  validate?: boolean;
  engine?: 'mathjax' | 'katex' | 'unicode';
  numberEquations?: boolean;
  inlineDelimiter?: string;
  displayDelimiter?: string;
}

export interface DocumentResponse {
  id: string;
  requestId: string;
  format: OutputFormat;
  content: string | Buffer;
  artifacts: Artifact[];
  warnings: ConversionWarning[];
  metadata: ResponseMetadata;
  elapsed: number;
}

export interface Artifact {
  name: string;
  path: string;
  mimeType: string;
  size: number;
  content?: Buffer;
}

export interface ConversionWarning {
  code: string;
  message: string;
  location?: DocumentLocation;
  suggestion?: string;
}

export interface ConversionErrorData {
  code: string;
  message: string;
  location?: DocumentLocation;
  suggestions?: string[];
  stack?: string;
}

export interface DocumentLocation {
  line?: number;
  column?: number;
  path?: string;
}

export interface ResponseMetadata {
  title?: string;
  author?: string[];
  generatedAt: string;
  wordCount?: number;
  pageCount?: number;
  bibliographyStyle?: BibliographyStyle;
  citationCount?: number;
  sources?: string[];
}

export interface ConversionPipelineData {
  id: string;
  requestId: string;
  stages: PipelineStage[];
  startedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: { success: boolean; error?: ConversionErrorData };
}

export interface PipelineStage {
  name: 'parse' | 'validate' | 'transform' | 'render' | 'compile' | 'output';
  status: 'pending' | 'running' | 'complete' | 'failed';
  startedAt?: Date;
  elapsed?: number;
  error?: ConversionErrorData;
  progress?: number;
}

export interface ThinkingSession {
  id: string;
  prompt: string;
  reasoningChain: ReasoningStep[];
  decisions: SessionDecision[];
  outputIntent: string;
}

export interface ReasoningStep {
  step: number;
  thought: string;
  conclusion: string;
}

export interface SessionDecision {
  decision: string;
  rationale: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ConversionErrorData[];
  warnings: ConversionWarning[];
  validatedAt: string;
}

// =============================================================================
// § 3.2 Document Tree & AST Nodes
// =============================================================================

export interface DocumentTree {
  type: 'document';
  children: DocumentNode[];
  frontmatter: FrontmatterMetadata;
  bibliography: CitationRecord[];
}

export type DocumentNode =
  | SectionNode
  | ParagraphNode
  | MathNode
  | CodeBlockNode
  | FigureNode
  | TableNode
  | CitationNode;

export interface SectionNode {
  type: 'section';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  id?: string;
  children: DocumentNode[];
}

export interface ParagraphNode {
  type: 'paragraph';
  children: InlineNode[];
}

export interface MathNode {
  type: 'math';
  mode: 'inline' | 'display';
  latex: string;
  validated: boolean;
  alt?: string;
}

export interface CodeBlockNode {
  type: 'code';
  language: string;
  content: string;
  lineNumbers?: boolean;
  highlight?: [number, number][];
  label?: string;
}

export interface FigureNode {
  type: 'figure';
  src: string;
  caption?: string;
  label?: string;
  width?: string;
  height?: string;
  alt: string;
}

export interface TableNode {
  type: 'table';
  headers: string[];
  rows: (InlineNode[] | string)[][];
  caption?: string;
  label?: string;
}

export interface CitationNode {
  type: 'citation';
  key: string;
  resolved?: CitationRecord;
}

export type InlineNode =
  | TextNode
  | EmphasisNode
  | StrongNode
  | CodeNode
  | LinkNode
  | CitationReferenceNode;

export interface TextNode {
  type: 'text';
  text: string;
}

export interface EmphasisNode {
  type: 'emphasis';
  children: InlineNode[];
}

export interface StrongNode {
  type: 'strong';
  children: InlineNode[];
}

export interface CodeNode {
  type: 'code';
  code: string;
}

export interface LinkNode {
  type: 'link';
  url: string;
  title?: string;
  children: InlineNode[];
}

export interface CitationReferenceNode {
  type: 'citation-reference';
  key: string;
  prefix?: string;
  suffix?: string;
}

// =============================================================================
// § 3.3 Citation Types
// =============================================================================

export interface CitationRecord {
  key: string;
  type: 'article' | 'book' | 'inproceedings' | 'techreport' | 'thesis' | 'misc' | 'other';
  title: string;
  author: string[];
  year: number;
  journal?: string;
  booktitle?: string;
  publisher?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  accessed?: string;
  raw: Record<string, string>;
}

// =============================================================================
// § 3.4 Extension & Processing Types
// =============================================================================

export interface ConversionRule {
  sourceType: string;
  targetFormat: OutputFormat;
  transform: string;
  priority: number;
  required: boolean;
  description?: string;
  options?: Record<string, unknown>;
}

export interface FormatConstraint {
  format: OutputFormat;
  maxWidth?: number;
  aspectRatio?: '16:9' | '4:3' | '1:1' | '3:2' | '21:9';
  margins?: { top: number; right: number; bottom: number; left: number };
  minFontSize?: number;
  maxPages?: number;
  maxWords?: number;
  maxFileSizeBytes?: number;
  supportsImages?: boolean;
}

export interface ImageProcessingOptions {
  width?: number | null;
  height?: number | null;
  format?: 'png' | 'jpg' | 'webp' | 'svg' | 'original';
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  alt?: string;
  generateAlt?: boolean;
}

export interface ImageProcessingResult {
  source: string;
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
  alt: string;
  warnings: ConversionWarning[];
}

export interface AccessibilityReport {
  level: 'AAA' | 'AA' | 'A' | 'none';
  format: OutputFormat;
  isCompliant: boolean;
  violations: AccessibilityViolation[];
  warnings: AccessibilityWarning[];
  score: number;
  validatedAt: string;
}

export interface AccessibilityViolation {
  criterion: string;
  description: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  location?: string;
  remediation: string;
}

export interface AccessibilityWarning {
  check: string;
  description: string;
  recommendation: string;
}

export interface WebMetadataSchema {
  og?: OpenGraphMetadata;
  twitter?: TwitterCardMetadata;
  structuredData?: SchemaOrgData;
  canonical?: string;
  lang?: string;
  description?: string;
  robots?: 'index,follow' | 'noindex,follow' | 'index,nofollow' | 'noindex,nofollow';
}

export interface OpenGraphMetadata {
  title: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  type: 'article' | 'website' | 'profile';
  url?: string;
  siteName?: string;
  locale?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

export interface TwitterCardMetadata {
  card: 'summary' | 'summary_large_image' | 'app' | 'player';
  site?: string;
  creator?: string;
  title?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
}

export interface SchemaOrgData {
  '@context': 'https://schema.org';
  '@type': 'Article' | 'BlogPosting' | 'NewsArticle' | 'ScholarlyArticle' | 'WebPage';
  headline?: string;
  description?: string;
  author?: { '@type': 'Person' | 'Organization'; name: string };
  datePublished?: string;
  dateModified?: string;
  image?: string;
  url?: string;
  keywords?: string;
  publisher?: {
    '@type': 'Organization';
    name: string;
    logo?: { '@type': 'ImageObject'; url: string };
  };
}

export interface DocumentVersion {
  version: string;
  author: string;
  createdAt: string;
  summary: string;
  changes: DocumentChange[];
  tag?: 'draft' | 'under-review' | 'final' | 'submitted' | 'archived';
  contentHash?: string;
  parentVersion?: string;
}

export interface DocumentChange {
  type: 'addition' | 'deletion' | 'modification' | 'restructure';
  section?: string;
  description: string;
  comment?: string;
}

export interface DocumentVersionHistory {
  documentId: string;
  versions: DocumentVersion[];
  currentVersion: string;
}

// =============================================================================
// Additional types from spec §4 (class-related)
// =============================================================================

export interface MarkdownParseOptions {
  strict?: boolean;
  includePositions?: boolean;
  lang?: string;
}

export interface LinkCheckResult {
  valid: boolean;
  url: string;
  statusCode?: number;
  error?: string;
  checkedAt: Date;
}

export interface LinkCheckOptions {
  skipExternal?: boolean;
  skipInternal?: boolean;
  timeout?: number;
  retries?: number;
}

export interface Link {
  type: 'external' | 'internal' | 'anchor';
  url: string;
  location?: DocumentLocation;
}
