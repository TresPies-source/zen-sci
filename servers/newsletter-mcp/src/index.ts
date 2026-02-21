// servers/newsletter-mcp/src/index.ts
// MCP server entry point for Newsletter MCP

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
import { newsletterManifest } from './manifest.js';
import { convertToEmail } from './tools/convert-to-email.js';
import type { ConvertToEmailArgs } from './tools/convert-to-email.js';
import { validateEmail } from './tools/validate-email.js';
import type { ValidateEmailArgs } from './tools/validate-email.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ctx = createZenSciServer({
  name: 'newsletter-mcp',
  version: '0.3.0',
  manifest: newsletterManifest,
});

const { server } = ctx;

// ---------------------------------------------------------------------------
// convert_to_email
// ---------------------------------------------------------------------------

registerAppTool(
  server,
  'convert_to_email',
  {
    description: 'Convert markdown to a responsive, email-safe HTML newsletter with CAN-SPAM compliant footer',
    inputSchema: {
      source: z.string().describe('Markdown source content'),
      subject: z.string().describe('Email subject line'),
      fromName: z.string().optional().describe('Sender display name'),
      fromEmail: z.string().optional().describe('Sender email address'),
      replyTo: z.string().optional().describe('Reply-to email address'),
      platform: z
        .enum(['mailchimp', 'substack', 'smtp', 'generic'])
        .optional()
        .describe('Target email platform (default: generic)'),
      previewText: z
        .string()
        .optional()
        .describe('Preview text shown in email client list view'),
      brandColor: z
        .string()
        .optional()
        .describe('Brand color hex code (default: #1a73e8)'),
      logoUrl: z.string().optional().describe('URL to the logo image'),
      footerText: z
        .string()
        .optional()
        .describe('Custom footer text (default: subscription notice)'),
      unsubscribeUrl: z
        .string()
        .optional()
        .describe('Unsubscribe link URL (CAN-SPAM compliance)'),
    },
    _meta: {
      ui: { resourceUri: 'ui://newsletter-mcp/preview.html' },
    },
  },
  async (rawArgs) => {
    // Strip undefined values from Zod output to satisfy exactOptionalPropertyTypes
    const args: ConvertToEmailArgs = {
      source: rawArgs.source,
      subject: rawArgs.subject,
    };
    if (rawArgs.fromName !== undefined) args.fromName = rawArgs.fromName;
    if (rawArgs.fromEmail !== undefined) args.fromEmail = rawArgs.fromEmail;
    if (rawArgs.replyTo !== undefined) args.replyTo = rawArgs.replyTo;
    if (rawArgs.platform !== undefined) args.platform = rawArgs.platform;
    if (rawArgs.previewText !== undefined) args.previewText = rawArgs.previewText;
    if (rawArgs.brandColor !== undefined) args.brandColor = rawArgs.brandColor;
    if (rawArgs.logoUrl !== undefined) args.logoUrl = rawArgs.logoUrl;
    if (rawArgs.footerText !== undefined) args.footerText = rawArgs.footerText;
    if (rawArgs.unsubscribeUrl !== undefined) args.unsubscribeUrl = rawArgs.unsubscribeUrl;

    const result = await convertToEmail(args, ctx);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// ---------------------------------------------------------------------------
// validate_email
// ---------------------------------------------------------------------------

server.tool(
  'validate_email',
  'Validate a markdown newsletter for email structure, accessibility, and size constraints',
  {
    source: z.string().describe('Markdown source content'),
    subject: z
      .string()
      .optional()
      .describe('Email subject line (used if missing from frontmatter)'),
  },
  async (rawArgs) => {
    // Strip undefined values from Zod output to satisfy exactOptionalPropertyTypes
    const args: ValidateEmailArgs = { source: rawArgs.source };
    if (rawArgs.subject !== undefined) args.subject = rawArgs.subject;

    const result = await validateEmail(args, ctx);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// ---------------------------------------------------------------------------
// App resource: Newsletter Preview UI
// ---------------------------------------------------------------------------

// Resolve app-dist path for both unbundled (dist/src/) and bundled (dist/) layouts.
const APP_DIST_PATH = __filename.includes('bundle')
  ? path.resolve(__dirname, '../app-dist/index.html')
  : path.resolve(__dirname, '../../app-dist/index.html');

registerAppResource(
  server,
  'Newsletter Preview',
  'ui://newsletter-mcp/preview.html',
  { description: 'Interactive email newsletter preview' },
  async () => ({
    contents: [{
      uri: 'ui://newsletter-mcp/preview.html',
      mimeType: RESOURCE_MIME_TYPE,
      text: await fs.readFile(APP_DIST_PATH, 'utf-8'),
    }],
  }),
);

// Start the MCP server — connects stdio transport and begins processing requests.
ctx.start();
