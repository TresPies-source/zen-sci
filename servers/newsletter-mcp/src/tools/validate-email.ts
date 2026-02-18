// servers/newsletter-mcp/src/tools/validate-email.ts
// Handler for the validate_email MCP tool

import { MarkdownParser } from '@zen-sci/core';
import type { ZenSciContext } from '@zen-sci/sdk';
import { MJMLBuilder } from '../rendering/mjml-builder.js';
import type { EmailOptions } from '../rendering/mjml-builder.js';
import { MJMLCompiler } from '../rendering/mjml-compiler.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidateEmailArgs {
  source: string;
  subject?: string;
}

export interface ValidateEmailResult {
  valid: boolean;
  errors: Array<{ code: string; message: string }>;
  warnings: Array<{ code: string; message: string }>;
  accessibility_issues: Array<{ code: string; message: string }>;
  estimated_size_bytes: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GMAIL_CLIP_THRESHOLD = 102400;

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function validateEmail(
  args: ValidateEmailArgs,
  ctx: ZenSciContext,
): Promise<ValidateEmailResult> {
  const { logger } = ctx;
  logger.info('Validating email markdown');

  const errors: Array<{ code: string; message: string }> = [];
  const warnings: Array<{ code: string; message: string }> = [];
  const accessibilityIssues: Array<{ code: string; message: string }> = [];

  // Validate markdown structure
  const parser = new MarkdownParser();
  const validation = parser.validate(args.source);

  for (const err of validation.errors) {
    errors.push({ code: err.code, message: err.message });
  }

  for (const warn of validation.warnings) {
    warnings.push({ code: warn.code, message: warn.message });
  }

  // Check frontmatter
  const { frontmatter, tree } = parser.parseComplete(args.source);

  if (frontmatter.title === undefined || frontmatter.title === '') {
    warnings.push({
      code: 'missing-title',
      message: 'No title found in frontmatter. The subject line will be used as the title.',
    });
  }

  // Check heading hierarchy for accessibility
  let prevLevel = 0;
  for (const node of tree.children) {
    if (node.type === 'section') {
      if (prevLevel > 0 && node.level > prevLevel + 1) {
        accessibilityIssues.push({
          code: 'heading-skip',
          message: `Heading level skipped from h${prevLevel} to h${node.level}. This may cause issues with screen readers.`,
        });
      }
      prevLevel = node.level;
    }
  }

  // Check for images without alt text
  for (const node of tree.children) {
    if (node.type === 'figure' && (!node.alt || node.alt.trim() === '')) {
      accessibilityIssues.push({
        code: 'missing-alt',
        message: `Image "${node.src}" is missing alt text.`,
      });
    }
  }

  // Estimate size by generating the email HTML
  const subject = args.subject ?? (typeof frontmatter.title === 'string' ? frontmatter.title : 'Newsletter');
  const emailOptions: EmailOptions = { subject };
  const builder = new MJMLBuilder();
  const html = builder.build(args.source, frontmatter, emailOptions);
  const estimatedSizeBytes = Buffer.byteLength(html, 'utf-8');

  // Validate generated HTML structure
  const compiler = new MJMLCompiler();
  const { errors: compileErrors } = compiler.compile(html);
  for (const compileError of compileErrors) {
    errors.push({ code: 'html-structure', message: compileError.message });
  }

  // Size warning
  if (estimatedSizeBytes > GMAIL_CLIP_THRESHOLD) {
    warnings.push({
      code: 'size-warning',
      message: `Estimated email size (${estimatedSizeBytes} bytes) exceeds Gmail clipping threshold (${GMAIL_CLIP_THRESHOLD} bytes).`,
    });
  }

  const valid = errors.length === 0;

  logger.info('Email validation complete', {
    valid,
    errorCount: errors.length,
    warningCount: warnings.length,
    accessibilityIssueCount: accessibilityIssues.length,
  });

  return {
    valid,
    errors,
    warnings,
    accessibility_issues: accessibilityIssues,
    estimated_size_bytes: estimatedSizeBytes,
  };
}
