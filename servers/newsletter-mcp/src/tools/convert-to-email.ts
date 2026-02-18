// servers/newsletter-mcp/src/tools/convert-to-email.ts
// Handler for the convert_to_email MCP tool

import { MarkdownParser } from '@zen-sci/core';
import type { ZenSciContext } from '@zen-sci/sdk';
import { MJMLBuilder } from '../rendering/mjml-builder.js';
import type { EmailOptions } from '../rendering/mjml-builder.js';
import { MJMLCompiler } from '../rendering/mjml-compiler.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConvertToEmailArgs {
  source: string;
  subject: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  platform?: 'mailchimp' | 'substack' | 'smtp' | 'generic';
  previewText?: string;
  brandColor?: string;
  logoUrl?: string;
  footerText?: string;
  unsubscribeUrl?: string;
}

export interface ConvertToEmailResult {
  html: string;
  subject: string;
  from_name?: string;
  from_email?: string;
  reply_to?: string;
  platform?: string;
  preview_text?: string;
  char_count: number;
  estimated_size_bytes: number;
  mjml_errors: Array<{ message: string }>;
  warnings: string[];
  elapsed_ms: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Gmail clips emails larger than ~102KB */
const GMAIL_CLIP_THRESHOLD = 102400;

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function convertToEmail(
  args: ConvertToEmailArgs,
  ctx: ZenSciContext,
): Promise<ConvertToEmailResult> {
  const startTime = Date.now();
  const { logger } = ctx;
  logger.info('Converting markdown to email HTML');

  const warnings: string[] = [];

  // Parse and validate markdown
  const parser = new MarkdownParser();
  const validation = parser.validate(args.source);

  if (!validation.valid) {
    for (const err of validation.errors) {
      warnings.push(`Parse warning: ${err.message}`);
    }
  }

  // Extract frontmatter
  const { frontmatter } = parser.parseComplete(args.source);

  // Build email options with conditional assignment
  const emailOptions: EmailOptions = { subject: args.subject };
  if (args.previewText !== undefined) emailOptions.previewText = args.previewText;
  if (args.brandColor !== undefined) emailOptions.brandColor = args.brandColor;
  if (args.logoUrl !== undefined) emailOptions.logoUrl = args.logoUrl;
  if (args.footerText !== undefined) emailOptions.footerText = args.footerText;
  if (args.unsubscribeUrl !== undefined) emailOptions.unsubscribeUrl = args.unsubscribeUrl;

  // Generate email HTML
  const builder = new MJMLBuilder();
  const html = builder.build(args.source, frontmatter, emailOptions);

  // Validate generated HTML
  const compiler = new MJMLCompiler();
  const { errors: mjmlErrors } = compiler.compile(html);

  // Compute size metrics
  const charCount = html.length;
  const estimatedSizeBytes = Buffer.byteLength(html, 'utf-8');

  if (estimatedSizeBytes > GMAIL_CLIP_THRESHOLD) {
    warnings.push(
      `Email size (${estimatedSizeBytes} bytes) exceeds Gmail clipping threshold (${GMAIL_CLIP_THRESHOLD} bytes). Content may be truncated in Gmail.`,
    );
  }

  // Build result with conditional assignment
  const result: ConvertToEmailResult = {
    html,
    subject: args.subject,
    char_count: charCount,
    estimated_size_bytes: estimatedSizeBytes,
    mjml_errors: mjmlErrors,
    warnings,
    elapsed_ms: Date.now() - startTime,
  };
  if (args.fromName !== undefined) result.from_name = args.fromName;
  if (args.fromEmail !== undefined) result.from_email = args.fromEmail;
  if (args.replyTo !== undefined) result.reply_to = args.replyTo;
  if (args.platform !== undefined) result.platform = args.platform;
  if (args.previewText !== undefined) result.preview_text = args.previewText;

  logger.info('Email HTML generated successfully', {
    charCount,
    estimatedSizeBytes,
    warningCount: warnings.length,
  });

  return result;
}
