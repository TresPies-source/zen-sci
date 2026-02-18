// servers/paper-mcp/src/tools/convert-to-paper.ts
// Handler for the convert_to_paper MCP tool

import type { ZenSciContext } from '@zen-sci/sdk';
import { TemplateRegistry } from '../templates/template-registry.js';
import type { PaperFormat } from '../templates/template-registry.js';
import { IEEEInjector } from '../templates/ieee-injector.js';
import type { Author } from '../templates/ieee-injector.js';

// ---------------------------------------------------------------------------
// Args / Result types
// ---------------------------------------------------------------------------

export interface ConvertToPaperArgs {
  source: string;
  title: string;
  authors: Author[];
  bibliography?: string;
  abstract?: string;
  format: PaperFormat;
  keywords?: string[];
}

export interface ConvertToPaperResult {
  latex_source: string;
  format: PaperFormat;
  page_count?: number;
  column_count: number;
  abstract_word_count?: number;
  warnings: string[];
  elapsed_ms: number;
}

// ---------------------------------------------------------------------------
// Markdown-to-LaTeX body conversion (simple, no Python dependency)
// ---------------------------------------------------------------------------

/**
 * Convert markdown body text into basic LaTeX.
 * Handles: headings -> sections, paragraphs, math passthrough, frontmatter skip.
 */
function markdownToLatexBody(source: string): string {
  const lines = source.split('\n');
  const result: string[] = [];
  let inFrontmatter = false;
  let frontmatterCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip YAML frontmatter
    if (trimmed === '---') {
      frontmatterCount++;
      if (frontmatterCount <= 2) {
        inFrontmatter = !inFrontmatter;
        continue;
      }
    }
    if (inFrontmatter) {
      continue;
    }

    // Headings
    if (trimmed.startsWith('#### ')) {
      result.push(`\\paragraph{${trimmed.slice(5)}}`);
    } else if (trimmed.startsWith('### ')) {
      result.push(`\\subsubsection{${trimmed.slice(4)}}`);
    } else if (trimmed.startsWith('## ')) {
      result.push(`\\subsection{${trimmed.slice(3)}}`);
    } else if (trimmed.startsWith('# ')) {
      result.push(`\\section{${trimmed.slice(2)}}`);
    } else if (trimmed.length === 0) {
      // Blank line -> paragraph break
      result.push('');
    } else {
      // Pass through everything else (including math blocks, citations, etc.)
      result.push(trimmed);
    }
  }

  return result.join('\n');
}

// ---------------------------------------------------------------------------
// convertToPaper handler
// ---------------------------------------------------------------------------

export async function convertToPaper(
  args: ConvertToPaperArgs,
  ctx: ZenSciContext,
): Promise<ConvertToPaperResult> {
  const startTime = Date.now();
  const { logger } = ctx;
  logger.info('Converting document to paper format', { format: args.format });

  const warnings: string[] = [];
  const registry = new TemplateRegistry();
  const template = registry.getTemplate(args.format);

  // Build LaTeX document
  const lines: string[] = [];

  // Document class
  const classOpts =
    template.classOptions.length > 0
      ? `[${template.classOptions.join(',')}]`
      : '';
  lines.push(`\\documentclass${classOpts}{${template.documentClass}}`);
  lines.push('');

  // Preamble
  for (const preambleLine of template.preambleLines) {
    lines.push(preambleLine);
  }
  lines.push('');

  // Title
  lines.push(`\\title{${args.title}}`);
  lines.push('');

  // Begin document
  lines.push('\\begin{document}');

  // Format-specific author/abstract/keywords injection
  if (args.format === 'paper-ieee') {
    // Use IEEEInjector to handle IEEE author blocks
    // We'll build the partial document, then inject
    const partialDoc = lines.join('\n');
    const injector = new IEEEInjector();
    const injectedDoc = injector.injectIEEEStructure(
      partialDoc,
      args.authors,
      args.abstract,
      args.keywords,
    );

    // Replace lines with injected content and continue building
    lines.length = 0;
    lines.push(injectedDoc);
  } else {
    // ACM and arXiv: standard \author + \maketitle + abstract
    if (args.authors.length > 0) {
      if (args.format === 'paper-acm') {
        // ACM format: each author gets its own \author block
        for (const author of args.authors) {
          lines.push(`\\author{${author.name}}`);
          if (author.affiliation !== undefined) {
            lines.push(`\\affiliation{\\institution{${author.affiliation}}}`);
          }
          if (author.email !== undefined) {
            lines.push(`\\email{${author.email}}`);
          }
        }
      } else {
        // arXiv: standard \author with \and separation
        const authorNames = args.authors.map((a) => a.name);
        lines.push(`\\author{${authorNames.join(' \\and ')}}`);
      }
    }

    lines.push('');
    lines.push('\\maketitle');
    lines.push('');

    // Abstract
    if (args.abstract !== undefined) {
      lines.push('\\begin{abstract}');
      lines.push(args.abstract);
      lines.push('\\end{abstract}');
      lines.push('');
    }

    // Keywords (ACM uses \keywords, arXiv uses a simple keywords section)
    if (args.keywords !== undefined && args.keywords.length > 0) {
      if (args.format === 'paper-acm') {
        lines.push(`\\keywords{${args.keywords.join(', ')}}`);
      } else {
        lines.push(`\\paragraph{Keywords:} ${args.keywords.join(', ')}`);
      }
      lines.push('');
    }
  }

  // Body content from markdown source
  const body = markdownToLatexBody(args.source);
  lines.push('');
  lines.push(body);

  // Bibliography — use format-appropriate style
  if (args.bibliography !== undefined) {
    const bibStyles: Record<PaperFormat, string> = {
      'paper-ieee': 'ieeetr',
      'paper-acm': 'acm',
      'paper-arxiv': 'plainnat',
    };
    const bibStyle = bibStyles[args.format];
    lines.push('');
    lines.push(`\\bibliographystyle{${bibStyle}}`);
    lines.push('\\bibliography{references}');
  }

  // End document
  lines.push('');
  lines.push('\\end{document}');

  const latexSource = lines.join('\n');

  // Compute abstract word count
  let abstractWordCount: number | undefined;
  if (args.abstract !== undefined) {
    abstractWordCount = args.abstract
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
  }

  // Column count from template
  const columnCount = template.columnsMode === 'two' ? 2 : 1;

  // Build result without assigning undefined to optional properties
  const result: ConvertToPaperResult = {
    latex_source: latexSource,
    format: args.format,
    column_count: columnCount,
    warnings,
    elapsed_ms: Date.now() - startTime,
  };

  if (abstractWordCount !== undefined) {
    result.abstract_word_count = abstractWordCount;
  }

  return result;
}
