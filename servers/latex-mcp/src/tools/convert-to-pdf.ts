// servers/latex-mcp/src/tools/convert-to-pdf.ts
// Handler for the convert_to_pdf MCP tool

import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MarkdownParser,
  CitationManager,
} from '@zen-sci/core';
import type { ZenSciContext } from '@zen-sci/sdk';
import { generateRequestId } from '@zen-sci/sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Resolve engine path for both unbundled (dist/tools/) and bundled (dist/) layouts.
// In unbundled mode __dirname is <server>/dist/tools/ → ../../engine/ works.
// In bundled mode __dirname is <server>/dist/ → ../engine/ is needed.
// Detect bundle: if basename of __filename contains "bundle", use ../engine.
const LATEX_ENGINE_PATH = __filename.includes('bundle')
  ? join(__dirname, '../engine/latex_engine.py')
  : join(__dirname, '../../engine/latex_engine.py');

export interface ConvertToPdfArgs {
  source: string;
  title?: string;
  author?: string[];
  bibliography?: string;
  bibliography_style?: string;
  latex_preamble?: string;
  output_dir?: string;
  options?: {
    engine?: string;
    toc?: boolean;
    geometry?: string;
    font?: string;
    draft_mode?: boolean;
  };
}

export interface ConvertToPdfResult {
  pdf_path?: string;
  pdf_base64?: string;
  latex_source: string;
  page_count?: number;
  metadata: {
    title?: string;
    author?: string[];
    generated_at: string;
  };
  warnings: string[];
  citations: {
    total: number;
    resolved: number;
    unresolved: string[];
  };
  elapsed_ms: number;
}

export async function convertToPdf(
  args: ConvertToPdfArgs,
  ctx: ZenSciContext,
): Promise<ConvertToPdfResult> {
  const startTime = Date.now();
  const { logger, pythonEngine } = ctx;
  logger.info('Converting document to PDF');

  const warnings: string[] = [];

  // Build frontmatter for DocumentRequest
  const frontmatter: Record<string, unknown> = {};
  if (args.title !== undefined) {
    frontmatter['title'] = args.title;
  }
  if (args.author !== undefined) {
    frontmatter['author'] = args.author;
  }

  // Build options
  const requestOptions: Record<string, unknown> = {};
  if (args.options !== undefined) {
    if (args.options.toc !== undefined) requestOptions['toc'] = args.options.toc;
    if (args.options.engine !== undefined) requestOptions['moduleOptions'] = { engine: args.options.engine };
    if (args.options.geometry !== undefined) requestOptions['geometry'] = args.options.geometry;
    if (args.options.font !== undefined) requestOptions['font'] = args.options.font;
    if (args.options.draft_mode !== undefined) requestOptions['draft_mode'] = args.options.draft_mode;
  }

  // Resolve citations
  let citationTotal = 0;
  let citationResolved = 0;
  const unresolvedCitations: string[] = [];

  if (args.bibliography) {
    const parser = new MarkdownParser();
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

  // Try Python engine for full conversion
  let latexSource: string;
  let pdfBase64: string | undefined;
  let pageCount: number | undefined;

  try {
    const available = await pythonEngine.checkAvailable();
    if (!available) {
      throw new Error('Python engine not available');
    }

    const requestId = generateRequestId();
    const engineInput = {
      request_id: requestId,
      source: args.source,
      frontmatter,
      bibliography: args.bibliography ?? null,
      bibliography_style: args.bibliography_style ?? 'apa',
      latex_preamble: args.latex_preamble ?? null,
      options: requestOptions,
    };

    const result = await pythonEngine.runJSON<{
      pdf_base64?: string;
      latex_source: string;
      page_count?: number;
      warnings?: string[];
      error?: { code: string; message: string };
    }>(LATEX_ENGINE_PATH, engineInput);

    if (result.error) {
      throw new Error(`Engine error (${result.error.code}): ${result.error.message}`);
    }

    latexSource = result.latex_source;
    pdfBase64 = result.pdf_base64;
    pageCount = result.page_count;
    if (result.warnings) {
      warnings.push(...result.warnings);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn('Python engine unavailable, using basic LaTeX fallback', { error: msg });
    warnings.push(`Python engine unavailable: ${msg}. Using basic LaTeX generator.`);
    latexSource = generateBasicLatex(args);
  }

  // Build metadata without assigning undefined to optional fields
  const metadata: ConvertToPdfResult['metadata'] = {
    generated_at: new Date().toISOString(),
  };
  if (args.title !== undefined) {
    metadata.title = args.title;
  }
  if (args.author !== undefined) {
    metadata.author = args.author;
  }

  const result: ConvertToPdfResult = {
    latex_source: latexSource,
    metadata,
    warnings,
    citations: {
      total: citationTotal,
      resolved: citationResolved,
      unresolved: unresolvedCitations,
    },
    elapsed_ms: Date.now() - startTime,
  };

  if (pdfBase64 !== undefined) {
    result.pdf_base64 = pdfBase64;
  }
  if (pageCount !== undefined) {
    result.page_count = pageCount;
  }

  return result;
}

/**
 * Generate basic LaTeX when the Python engine is unavailable.
 */
function generateBasicLatex(args: ConvertToPdfArgs): string {
  const lines: string[] = [];
  lines.push('\\documentclass{article}');
  lines.push('\\usepackage[utf8]{inputenc}');
  lines.push('\\usepackage{amsmath}');
  lines.push('\\usepackage{hyperref}');

  if (args.latex_preamble) {
    lines.push(args.latex_preamble);
  }

  lines.push('\\begin{document}');

  if (args.title) {
    lines.push(`\\title{${args.title}}`);
  }
  if (args.author && args.author.length > 0) {
    lines.push(`\\author{${args.author.join(' \\and ')}}`);
  }
  if (args.title) {
    lines.push('\\maketitle');
  }

  // Simple markdown-to-LaTeX for headings and paragraphs
  const sourceLines = args.source.split('\n');
  let inFrontmatter = false;
  let frontmatterDelimiterCount = 0;

  for (const line of sourceLines) {
    const trimmed = line.trim();

    // Track YAML frontmatter boundaries
    if (trimmed === '---') {
      frontmatterDelimiterCount++;
      if (frontmatterDelimiterCount <= 2) {
        inFrontmatter = !inFrontmatter;
        continue;
      }
    }
    if (inFrontmatter) {
      continue;
    }

    if (trimmed.startsWith('# ')) {
      lines.push(`\\section{${trimmed.slice(2)}}`);
    } else if (trimmed.startsWith('## ')) {
      lines.push(`\\subsection{${trimmed.slice(3)}}`);
    } else if (trimmed.startsWith('### ')) {
      lines.push(`\\subsubsection{${trimmed.slice(4)}}`);
    } else if (trimmed.length > 0) {
      lines.push(trimmed);
    }
  }

  lines.push('\\end{document}');
  return lines.join('\n');
}
