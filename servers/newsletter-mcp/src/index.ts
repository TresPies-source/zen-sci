// servers/newsletter-mcp/src/index.ts
// MCP server entry point for Newsletter MCP

import { z } from 'zod';
import { createZenSciServer } from '@zen-sci/sdk';
import { newsletterManifest } from './manifest.js';
import { convertToEmail } from './tools/convert-to-email.js';
import type { ConvertToEmailArgs } from './tools/convert-to-email.js';
import { validateEmail } from './tools/validate-email.js';
import type { ValidateEmailArgs } from './tools/validate-email.js';

const ctx = createZenSciServer({
  name: 'newsletter-mcp',
  version: '0.3.0',
  manifest: newsletterManifest,
});

const { server } = ctx;

// ---------------------------------------------------------------------------
// convert_to_email
// ---------------------------------------------------------------------------

server.tool(
  'convert_to_email',
  'Convert markdown to a responsive, email-safe HTML newsletter with CAN-SPAM compliant footer',
  {
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
