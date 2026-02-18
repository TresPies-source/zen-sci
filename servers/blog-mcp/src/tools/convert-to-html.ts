// servers/blog-mcp/src/tools/convert-to-html.ts
// Handler for the convert_to_html MCP tool

import {
  MarkdownParser,
  CitationManager,
} from '@zen-sci/core';
import type { FrontmatterMetadata, WebMetadataSchema } from '@zen-sci/core';
import type { ZenSciContext } from '@zen-sci/sdk';
import { HTMLRenderer } from '../rendering/html-renderer.js';
import type { HTMLRenderOptions } from '../rendering/html-renderer.js';
import { buildSEOMetadata } from '../rendering/seo-builder.js';
import type { SEOOptions } from '../rendering/seo-builder.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConvertToHtmlArgs {
  source: string;
  title?: string;
  author?: string;
  bibliography?: string;
  options?: {
    toc?: boolean;
    theme?: 'light' | 'dark' | 'system';
    selfContained?: boolean;
    seoSiteUrl?: string;
    seoSiteName?: string;
    twitterHandle?: string;
  };
}

export interface ConvertToHtmlResult {
  html: string;
  metadata: {
    title?: string;
    author?: string;
    word_count: number;
    reading_time_minutes: number;
  };
  seo: WebMetadataSchema;
  warnings: string[];
  citations: {
    total: number;
    resolved: number;
    unresolved: string[];
  };
  elapsed_ms: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countWords(text: string): number {
  // Strip frontmatter
  const cleaned = text.replace(/^---[\s\S]*?---\s*/, '');
  const words = cleaned
    .replace(/[#*`~>\[\]()!|]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
  return words.length;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function convertToHtml(
  args: ConvertToHtmlArgs,
  ctx: ZenSciContext,
): Promise<ConvertToHtmlResult> {
  const startTime = Date.now();
  const { logger } = ctx;
  logger.info('Converting document to HTML');

  const warnings: string[] = [];

  // Parse frontmatter
  const parser = new MarkdownParser();
  const { frontmatter: parsedFrontmatter } = parser.parseComplete(args.source);

  // Merge tool args into frontmatter (tool args take precedence)
  const frontmatter: FrontmatterMetadata = { ...parsedFrontmatter };
  if (args.title !== undefined) {
    frontmatter.title = args.title;
  }
  if (args.author !== undefined) {
    frontmatter.author = args.author;
  }

  // Citation resolution
  let citationTotal = 0;
  let citationResolved = 0;
  const unresolvedCitations: string[] = [];

  if (args.bibliography !== undefined) {
    const tree = parser.parse(args.source);
    const citationManager = new CitationManager(args.bibliography);
    const keys = citationManager.extractKeysFromAST(tree);
    citationTotal = keys.length;

    for (const key of keys) {
      const record = citationManager.resolve(key);
      if (record) {
        citationResolved++;
      } else {
        unresolvedCitations.push(key);
        warnings.push(`Unresolved citation: ${key}`);
      }
    }
  }

  // Build SEO metadata
  const seoOptions: SEOOptions = {};
  if (args.options?.seoSiteUrl !== undefined) {
    seoOptions.siteUrl = args.options.seoSiteUrl;
  }
  if (args.options?.seoSiteName !== undefined) {
    seoOptions.siteName = args.options.seoSiteName;
  }
  if (args.options?.twitterHandle !== undefined) {
    seoOptions.twitterHandle = args.options.twitterHandle;
  }

  const seo = buildSEOMetadata(frontmatter, seoOptions);

  // Build render options
  const renderOptions: HTMLRenderOptions = {};
  if (args.options?.toc !== undefined) {
    renderOptions.toc = args.options.toc;
  }
  if (args.options?.theme !== undefined) {
    renderOptions.cssTheme = args.options.theme;
  }
  if (args.options?.selfContained !== undefined) {
    renderOptions.selfContained = args.options.selfContained;
  }

  // Render HTML
  const renderer = new HTMLRenderer();
  const html = renderer.render(args.source, frontmatter, seo, renderOptions);

  // Compute word count and reading time
  const wordCount = countWords(args.source);
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Build metadata (conditional assignment for exactOptionalPropertyTypes)
  const metadata: ConvertToHtmlResult['metadata'] = {
    word_count: wordCount,
    reading_time_minutes: readingTime,
  };
  if (frontmatter.title !== undefined) {
    metadata.title = frontmatter.title;
  }
  const author = typeof frontmatter.author === 'string'
    ? frontmatter.author
    : Array.isArray(frontmatter.author) && frontmatter.author.length > 0
      ? frontmatter.author[0]
      : undefined;
  if (author !== undefined) {
    metadata.author = author;
  }

  return {
    html,
    metadata,
    seo,
    warnings,
    citations: {
      total: citationTotal,
      resolved: citationResolved,
      unresolved: unresolvedCitations,
    },
    elapsed_ms: Date.now() - startTime,
  };
}
