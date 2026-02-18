// packages/core/src/validation/schema-validator.ts
// Schema validation for DocumentRequest and related types using Zod v3

import { z } from 'zod';
import type {
  DocumentRequest,
  FrontmatterMetadata,
  BibliographyOptions,
  OutputFormat,
  ValidationResult,
  ConversionErrorData,
  ConversionWarning,
} from '../types.js';

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const OUTPUT_FORMAT_VALUES = [
  'latex',
  'beamer',
  'grant-latex',
  'paper-ieee',
  'paper-acm',
  'paper-arxiv',
  'thesis',
  'patent',
  'revealjs',
  'pptx',
  'html',
  'email',
  'epub',
  'mobi',
  'docs',
  'docx',
  'lab-notebook',
  'policy-brief',
  'proposal',
  'podcast-notes',
  'resume',
  'whitepaper',
] as const;

const OutputFormatSchema = z.enum(OUTPUT_FORMAT_VALUES);

const BibliographyStyleSchema = z.enum([
  'apa',
  'ieee',
  'chicago',
  'mla',
  'harvard',
  'vancouver',
  'nature',
  'arxiv',
  'custom',
]);

const BibliographyOptionsSchema = z.object({
  style: BibliographyStyleSchema.optional(),
  include: z.boolean().optional(),
  sortBy: z.enum(['citation-order', 'alphabetical']).optional(),
  link: z.boolean().optional(),
});

const MathOptionsSchema = z.object({
  validate: z.boolean().optional(),
  engine: z.enum(['mathjax', 'katex', 'unicode']).optional(),
  numberEquations: z.boolean().optional(),
  inlineDelimiter: z.string().optional(),
  displayDelimiter: z.string().optional(),
});

const DocumentOptionsSchema = z.object({
  title: z.string().optional(),
  author: z.array(z.string()).optional(),
  date: z.string().optional(),
  toc: z.boolean().optional(),
  bibliography: BibliographyOptionsSchema.optional(),
  math: MathOptionsSchema.optional(),
  moduleOptions: z.record(z.string(), z.unknown()).optional(),
});

const FrontmatterMetadataSchema = z
  .object({
    title: z.string().optional(),
    author: z.union([z.string(), z.array(z.string())]).optional(),
    date: z.string().optional(),
    tags: z.array(z.string()).optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    lang: z.string().optional(),
  })
  .catchall(z.unknown());

const ThinkingSessionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  reasoningChain: z.array(
    z.object({
      step: z.number(),
      thought: z.string(),
      conclusion: z.string(),
    }),
  ),
  decisions: z.array(
    z.object({
      decision: z.string(),
      rationale: z.string(),
    }),
  ),
  outputIntent: z.string(),
});

const DocumentRequestSchema = z.object({
  id: z.string().min(1, 'id must be a non-empty string'),
  source: z.string().min(1, 'source must be a non-empty string'),
  format: OutputFormatSchema,
  frontmatter: FrontmatterMetadataSchema,
  bibliography: z.string().optional(),
  options: DocumentOptionsSchema,
  thinkingSession: ThinkingSessionSchema.optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function zodIssuesToErrors(issues: z.ZodIssue[]): ConversionErrorData[] {
  return issues.map((issue) => {
    const error: ConversionErrorData = {
      code: `VALIDATION_${issue.code.toUpperCase()}`,
      message: `${issue.path.join('.')}: ${issue.message}`,
    };
    return error;
  });
}

function makeResult(
  errors: ConversionErrorData[],
  warnings: ConversionWarning[] = [],
): ValidationResult {
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    validatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// SchemaValidator
// ---------------------------------------------------------------------------

export class SchemaValidator {
  /**
   * Validate a full DocumentRequest including format support check.
   */
  static validate(
    request: DocumentRequest,
    supportedFormats: OutputFormat[],
  ): ValidationResult {
    const errors: ConversionErrorData[] = [];
    const warnings: ConversionWarning[] = [];

    // --- Structural validation via Zod ---
    const parsed = DocumentRequestSchema.safeParse(request);
    if (!parsed.success) {
      errors.push(...zodIssuesToErrors(parsed.error.issues));
    }

    // --- Manual checks that Zod may have already caught, but we want
    //     explicit error codes for each requirement ---

    if (typeof request.source !== 'string' || request.source.length === 0) {
      if (!errors.some((e) => e.message.includes('source'))) {
        errors.push({
          code: 'VALIDATION_SOURCE_EMPTY',
          message: 'source must be a non-empty string',
        });
      }
    }

    if (typeof request.id !== 'string' || request.id.length === 0) {
      if (!errors.some((e) => e.message.includes('id'))) {
        errors.push({
          code: 'VALIDATION_ID_EMPTY',
          message: 'id must be a non-empty string',
        });
      }
    }

    if (!OUTPUT_FORMAT_VALUES.includes(request.format as typeof OUTPUT_FORMAT_VALUES[number])) {
      if (!errors.some((e) => e.message.includes('format'))) {
        errors.push({
          code: 'VALIDATION_INVALID_FORMAT',
          message: `format "${String(request.format)}" is not a valid OutputFormat`,
        });
      }
    }

    if (!SchemaValidator.isFormatSupported(request.format, supportedFormats)) {
      errors.push({
        code: 'VALIDATION_UNSUPPORTED_FORMAT',
        message: `format "${request.format}" is not in the list of supported formats`,
      });
    }

    if (request.options == null) {
      if (!errors.some((e) => e.message.includes('options'))) {
        errors.push({
          code: 'VALIDATION_OPTIONS_MISSING',
          message: 'options is required',
        });
      }
    }

    return makeResult(errors, warnings);
  }

  /**
   * Validate frontmatter metadata in isolation.
   */
  static validateFrontmatter(frontmatter: FrontmatterMetadata): ValidationResult {
    const parsed = FrontmatterMetadataSchema.safeParse(frontmatter);
    if (!parsed.success) {
      return makeResult(zodIssuesToErrors(parsed.error.issues));
    }
    return makeResult([]);
  }

  /**
   * Validate bibliography options in isolation.
   */
  static validateBibliographyOptions(options: BibliographyOptions): ValidationResult {
    const parsed = BibliographyOptionsSchema.safeParse(options);
    if (!parsed.success) {
      return makeResult(zodIssuesToErrors(parsed.error.issues));
    }
    return makeResult([]);
  }

  /**
   * Check whether a given format is included in the supported formats list.
   */
  static isFormatSupported(
    format: OutputFormat,
    supportedFormats: OutputFormat[],
  ): boolean {
    return supportedFormats.includes(format);
  }
}
