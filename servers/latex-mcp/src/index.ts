// servers/latex-mcp/src/index.ts
// MCP server entry point for LaTeX MCP

import { z } from 'zod';
import { createZenSciServer } from '@zen-sci/sdk';
import { latexManifest } from './manifest.js';
import { convertToPdf } from './tools/convert-to-pdf.js';
import type { ConvertToPdfArgs } from './tools/convert-to-pdf.js';
import { validateDocument } from './tools/validate-document.js';
import type { ValidateDocumentArgs } from './tools/validate-document.js';
import { checkCitations } from './tools/check-citations.js';
import type { CheckCitationsArgs } from './tools/check-citations.js';

const ctx = createZenSciServer({
  name: 'latex-mcp',
  version: '0.1.0',
  manifest: latexManifest,
});

const { server } = ctx;

// ---------------------------------------------------------------------------
// convert_to_pdf
// ---------------------------------------------------------------------------

server.tool(
  'convert_to_pdf',
  'Convert markdown to publication-ready LaTeX and PDF',
  {
    source: z.string().describe('Markdown source content'),
    title: z.string().optional().describe('Document title'),
    author: z.array(z.string()).optional().describe('Author list'),
    bibliography: z.string().optional().describe('BibTeX bibliography content'),
    bibliography_style: z.string().optional().describe('Citation style (apa, ieee, etc.)'),
    latex_preamble: z.string().optional().describe('Custom LaTeX preamble'),
    output_dir: z.string().optional().describe('Output directory path'),
    options: z.object({
      engine: z.string().optional().describe('LaTeX engine (pdflatex, xelatex, lualatex)'),
      toc: z.boolean().optional().describe('Generate table of contents'),
      geometry: z.string().optional().describe('Page geometry string'),
      font: z.string().optional().describe('Font family'),
      draft_mode: z.boolean().optional().describe('Enable draft mode'),
    }).optional().describe('Conversion options'),
  },
  async (rawArgs) => {
    // Strip undefined values from Zod output to satisfy exactOptionalPropertyTypes
    const args: ConvertToPdfArgs = { source: rawArgs.source };
    if (rawArgs.title !== undefined) args.title = rawArgs.title;
    if (rawArgs.author !== undefined) args.author = rawArgs.author;
    if (rawArgs.bibliography !== undefined) args.bibliography = rawArgs.bibliography;
    if (rawArgs.bibliography_style !== undefined) args.bibliography_style = rawArgs.bibliography_style;
    if (rawArgs.latex_preamble !== undefined) args.latex_preamble = rawArgs.latex_preamble;
    if (rawArgs.output_dir !== undefined) args.output_dir = rawArgs.output_dir;
    if (rawArgs.options !== undefined) {
      const opts: NonNullable<ConvertToPdfArgs['options']> = {};
      if (rawArgs.options.engine !== undefined) opts.engine = rawArgs.options.engine;
      if (rawArgs.options.toc !== undefined) opts.toc = rawArgs.options.toc;
      if (rawArgs.options.geometry !== undefined) opts.geometry = rawArgs.options.geometry;
      if (rawArgs.options.font !== undefined) opts.font = rawArgs.options.font;
      if (rawArgs.options.draft_mode !== undefined) opts.draft_mode = rawArgs.options.draft_mode;
      args.options = opts;
    }

    const result = await convertToPdf(args, ctx);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// ---------------------------------------------------------------------------
// validate_document
// ---------------------------------------------------------------------------

server.tool(
  'validate_document',
  'Validate LaTeX math expressions and check a markdown document for conversion readiness',
  {
    source: z.string().describe('Markdown source content'),
    bibliography: z.string().optional().describe('BibTeX bibliography content'),
  },
  async (rawArgs) => {
    const args: ValidateDocumentArgs = { source: rawArgs.source };
    if (rawArgs.bibliography !== undefined) args.bibliography = rawArgs.bibliography;

    const result = await validateDocument(args, ctx);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// ---------------------------------------------------------------------------
// check_citations
// ---------------------------------------------------------------------------

server.tool(
  'check_citations',
  'Validate BibTeX bibliography content and check citation resolution',
  {
    source: z.string().describe('Markdown source content'),
    bibliography: z.string().describe('BibTeX bibliography content'),
  },
  async (rawArgs) => {
    const args: CheckCitationsArgs = {
      source: rawArgs.source,
      bibliography: rawArgs.bibliography,
    };

    const result = await checkCitations(args, ctx);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);
