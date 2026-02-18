// servers/paper-mcp/src/tools/validate-submission.ts
// Handler for the validate_submission MCP tool

import { MarkdownParser, MathValidator } from '@zen-sci/core';
import type { ZenSciContext } from '@zen-sci/sdk';
import type { PaperFormat } from '../templates/template-registry.js';

// ---------------------------------------------------------------------------
// Args / Result types
// ---------------------------------------------------------------------------

export interface ValidateSubmissionArgs {
  source: string;
  format: PaperFormat;
  abstract?: string;
  keywords?: string[];
}

export interface ValidateSubmissionResult {
  valid: boolean;
  submission_ready: boolean;
  errors: Array<{ code: string; message: string }>;
  warnings: Array<{ code: string; message: string }>;
}

// ---------------------------------------------------------------------------
// Constants for format-specific rules
// ---------------------------------------------------------------------------

const IEEE_MAX_KEYWORDS = 6;

// ---------------------------------------------------------------------------
// validateSubmission handler
// ---------------------------------------------------------------------------

export async function validateSubmission(
  args: ValidateSubmissionArgs,
  ctx: ZenSciContext,
): Promise<ValidateSubmissionResult> {
  const { logger } = ctx;
  logger.info('Validating submission', { format: args.format });

  const errors: Array<{ code: string; message: string }> = [];
  const warnings: Array<{ code: string; message: string }> = [];

  // -------------------------------------------------------------------------
  // Check: abstract presence (IEEE and ACM require it)
  // -------------------------------------------------------------------------
  if (args.format === 'paper-ieee' || args.format === 'paper-acm') {
    if (args.abstract === undefined || args.abstract.trim().length === 0) {
      errors.push({
        code: 'MISSING_ABSTRACT',
        message: `Abstract is required for ${args.format === 'paper-ieee' ? 'IEEE' : 'ACM'} submissions.`,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Check: keywords count (IEEE max 6)
  // -------------------------------------------------------------------------
  if (args.format === 'paper-ieee' && args.keywords !== undefined) {
    if (args.keywords.length > IEEE_MAX_KEYWORDS) {
      warnings.push({
        code: 'TOO_MANY_KEYWORDS',
        message: `IEEE submissions recommend at most ${String(IEEE_MAX_KEYWORDS)} keywords; found ${String(args.keywords.length)}.`,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Check: source is not empty
  // -------------------------------------------------------------------------
  if (args.source.trim().length === 0) {
    errors.push({
      code: 'EMPTY_SOURCE',
      message: 'Source document is empty.',
    });
  }

  // -------------------------------------------------------------------------
  // Math validation via core MathValidator
  // -------------------------------------------------------------------------
  try {
    const parser = new MarkdownParser();
    const tree = parser.parse(args.source);
    const mathValidator = new MathValidator();
    const mathResult = await mathValidator.validateTree(tree);

    for (const err of mathResult.errors) {
      errors.push({
        code: err.code,
        message: err.message,
      });
    }

    for (const warn of mathResult.warnings) {
      warnings.push({
        code: warn.code,
        message: warn.message,
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    warnings.push({
      code: 'MATH_VALIDATION_SKIPPED',
      message: `Math validation could not run: ${msg}`,
    });
  }

  // -------------------------------------------------------------------------
  // Determine submission readiness
  // -------------------------------------------------------------------------
  const valid = errors.length === 0;
  const submissionReady = valid;

  return {
    valid,
    submission_ready: submissionReady,
    errors,
    warnings,
  };
}
