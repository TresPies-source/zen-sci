// servers/blog-mcp/src/tools/validate-post.ts
// Handler for the validate_post MCP tool

import {
  MarkdownParser,
  MathValidator,
  CitationManager,
} from '@zen-sci/core';
import type { DocumentNode, MathNode } from '@zen-sci/core';
import type { ZenSciContext } from '@zen-sci/sdk';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidatePostArgs {
  source: string;
  bibliography?: string;
}

export interface AccessibilityIssue {
  type: 'error' | 'warning';
  message: string;
  suggestion: string;
}

export interface ValidatePostResult {
  valid: boolean;
  errors: Array<{ code: string; message: string }>;
  warnings: Array<{ code: string; message: string }>;
  accessibility_issues: AccessibilityIssue[];
  citation_stats: {
    total: number;
    resolved: number;
    unresolved: string[];
  };
  math_stats: {
    total: number;
    valid: number;
    invalid: string[];
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function collectMathNodes(nodes: DocumentNode[]): MathNode[] {
  const result: MathNode[] = [];
  for (const node of nodes) {
    if (node.type === 'math') {
      result.push(node);
    } else if (node.type === 'section') {
      result.push(...collectMathNodes(node.children));
    }
  }
  return result;
}

/**
 * Check WCAG heading hierarchy:
 * - Headings should not skip levels (e.g., h1 -> h3 without h2)
 * - There should ideally be a single h1
 */
function checkHeadingHierarchy(nodes: DocumentNode[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const headings: Array<{ level: number; title: string }> = [];

  function walkHeadings(children: DocumentNode[]): void {
    for (const node of children) {
      if (node.type === 'section') {
        headings.push({ level: node.level, title: node.title });
        walkHeadings(node.children);
      }
    }
  }

  walkHeadings(nodes);

  // Check for skipped levels
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1];
    const curr = headings[i];
    if (prev !== undefined && curr !== undefined && curr.level > prev.level + 1) {
      issues.push({
        type: 'error',
        message: `Heading level skipped: h${prev.level} ("${prev.title}") followed by h${curr.level} ("${curr.title}")`,
        suggestion: `Use h${prev.level + 1} instead of h${curr.level} to maintain proper heading hierarchy.`,
      });
    }
  }

  // Check for multiple h1s
  const h1Count = headings.filter((h) => h.level === 1).length;
  if (h1Count > 1) {
    issues.push({
      type: 'warning',
      message: `Multiple h1 headings found (${h1Count}). A page should have a single h1.`,
      suggestion: 'Use h2 or lower for sub-sections; keep a single h1 for the page title.',
    });
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function validatePost(
  args: ValidatePostArgs,
  ctx: ZenSciContext,
): Promise<ValidatePostResult> {
  const { logger } = ctx;
  logger.info('Validating blog post');

  const errors: Array<{ code: string; message: string }> = [];
  const warnings: Array<{ code: string; message: string }> = [];

  // Parse markdown
  const parser = new MarkdownParser();
  const tree = parser.parse(args.source);

  // Check frontmatter
  const fm = tree.frontmatter;
  if (!fm.title) {
    warnings.push({
      code: 'missing-title',
      message: 'Blog post is missing a title in frontmatter',
    });
  }
  if (!fm.date) {
    warnings.push({
      code: 'missing-date',
      message: 'Blog post is missing a date in frontmatter',
    });
  }
  if (!fm.description) {
    warnings.push({
      code: 'missing-description',
      message: 'Blog post is missing a description in frontmatter (important for SEO)',
    });
  }

  // Accessibility checks (WCAG heading hierarchy)
  const accessibilityIssues = checkHeadingHierarchy(tree.children);

  // Math validation
  const mathNodes = collectMathNodes(tree.children);
  const mathValidator = new MathValidator();
  const invalidMath: string[] = [];
  let validMathCount = 0;

  for (const mathNode of mathNodes) {
    const result = await mathValidator.validate(mathNode.latex, mathNode.mode);
    if (result.valid) {
      validMathCount++;
    } else {
      invalidMath.push(mathNode.latex);
      errors.push({
        code: 'math-validation-failed',
        message: `Invalid math expression: ${mathNode.latex}`,
      });
    }
  }

  // Citation resolution
  let citationTotal = 0;
  let citationResolved = 0;
  const unresolvedCitations: string[] = [];

  if (args.bibliography !== undefined) {
    const citationManager = new CitationManager(args.bibliography);
    const keys = citationManager.extractKeysFromAST(tree);
    citationTotal = keys.length;

    for (const key of keys) {
      const record = citationManager.resolve(key);
      if (record) {
        citationResolved++;
      } else {
        unresolvedCitations.push(key);
      }
    }

    if (unresolvedCitations.length > 0) {
      warnings.push({
        code: 'unresolved-citation',
        message: `Unresolved citations: ${unresolvedCitations.join(', ')}`,
      });
    }
  }

  const valid = errors.length === 0;

  return {
    valid,
    errors,
    warnings,
    accessibility_issues: accessibilityIssues,
    citation_stats: {
      total: citationTotal,
      resolved: citationResolved,
      unresolved: unresolvedCitations,
    },
    math_stats: {
      total: mathNodes.length,
      valid: validMathCount,
      invalid: invalidMath,
    },
  };
}
