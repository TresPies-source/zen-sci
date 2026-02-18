// servers/paper-mcp/src/index.ts
// MCP server entry point for Paper MCP

import { z } from 'zod';
import { createZenSciServer } from '@zen-sci/sdk';
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from '@modelcontextprotocol/ext-apps/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { paperManifest } from './manifest.js';
import { convertToPaper } from './tools/convert-to-paper.js';
import type { ConvertToPaperArgs } from './tools/convert-to-paper.js';
import { validateSubmission } from './tools/validate-submission.js';
import type { ValidateSubmissionArgs } from './tools/validate-submission.js';
import { listTemplates } from './tools/list-templates.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ctx = createZenSciServer({
  name: 'paper-mcp',
  version: '0.1.0',
  manifest: paperManifest,
});

const { server } = ctx;

// ---------------------------------------------------------------------------
// Shared Zod schemas
// ---------------------------------------------------------------------------

const AuthorSchema = z.object({
  name: z.string().describe('Author name'),
  affiliation: z.string().optional().describe('Author affiliation'),
  email: z.string().optional().describe('Author email'),
});

const PaperFormatSchema = z
  .enum(['paper-ieee', 'paper-acm', 'paper-arxiv'])
  .describe('Target paper format');

// ---------------------------------------------------------------------------
// convert_to_paper (with MCP App UI)
// ---------------------------------------------------------------------------

const RESOURCE_URI = 'ui://paper-mcp/preview.html';

registerAppTool(
  server,
  'convert_to_paper',
  {
    description: 'Convert markdown to publication-ready LaTeX for IEEE, ACM, or arXiv formats',
    inputSchema: {
      source: z.string().describe('Markdown source content'),
      title: z.string().describe('Paper title'),
      authors: z.array(AuthorSchema).describe('List of paper authors'),
      bibliography: z.string().optional().describe('BibTeX bibliography content'),
      abstract: z.string().optional().describe('Paper abstract'),
      format: PaperFormatSchema,
      keywords: z
        .array(z.string())
        .optional()
        .describe('Paper keywords'),
    },
    _meta: {
      ui: {
        resourceUri: RESOURCE_URI,
      },
    },
  },
  async (rawArgs) => {
    // Strip undefined values from Zod output to satisfy exactOptionalPropertyTypes
    const args: ConvertToPaperArgs = {
      source: rawArgs.source,
      title: rawArgs.title,
      authors: rawArgs.authors.map((a) => {
        const author: ConvertToPaperArgs['authors'][number] = { name: a.name };
        if (a.affiliation !== undefined) author.affiliation = a.affiliation;
        if (a.email !== undefined) author.email = a.email;
        return author;
      }),
      format: rawArgs.format,
    };
    if (rawArgs.bibliography !== undefined) args.bibliography = rawArgs.bibliography;
    if (rawArgs.abstract !== undefined) args.abstract = rawArgs.abstract;
    if (rawArgs.keywords !== undefined) args.keywords = rawArgs.keywords;

    const result = await convertToPaper(args, ctx);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// ---------------------------------------------------------------------------
// validate_submission
// ---------------------------------------------------------------------------

server.tool(
  'validate_submission',
  'Validate a paper for submission readiness (abstract, keywords, structure, math)',
  {
    source: z.string().describe('Markdown source content'),
    format: PaperFormatSchema,
    abstract: z.string().optional().describe('Paper abstract'),
    keywords: z
      .array(z.string())
      .optional()
      .describe('Paper keywords'),
  },
  async (rawArgs) => {
    // Strip undefined values from Zod output to satisfy exactOptionalPropertyTypes
    const args: ValidateSubmissionArgs = {
      source: rawArgs.source,
      format: rawArgs.format,
    };
    if (rawArgs.abstract !== undefined) args.abstract = rawArgs.abstract;
    if (rawArgs.keywords !== undefined) args.keywords = rawArgs.keywords;

    const result = await validateSubmission(args, ctx);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// ---------------------------------------------------------------------------
// list_templates
// ---------------------------------------------------------------------------

server.tool(
  'list_templates',
  'List all available academic paper templates with their constraints and citation styles',
  {},
  async () => {
    const result = await listTemplates();
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// ---------------------------------------------------------------------------
// MCP App Resource: Paper Preview UI
// ---------------------------------------------------------------------------

const APP_DIST_PATH = path.resolve(__dirname, '../../app-dist/index.html');

registerAppResource(
  server,
  'Paper Preview',
  RESOURCE_URI,
  {
    description: 'Interactive academic paper preview',
  },
  async () => ({
    contents: [{
      uri: RESOURCE_URI,
      mimeType: RESOURCE_MIME_TYPE,
      text: await fs.readFile(APP_DIST_PATH, 'utf-8'),
    }],
  }),
);
