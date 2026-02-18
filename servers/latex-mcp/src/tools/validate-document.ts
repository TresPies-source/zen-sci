// servers/latex-mcp/src/tools/validate-document.ts
// Handler for the validate_document MCP tool

import {
  MarkdownParser,
  MathValidator,
  CitationManager,
  BibTeXParser,
} from '@zen-sci/core';
import type { ZenSciContext } from '@zen-sci/sdk';

export interface ValidateDocumentArgs {
  source: string;
  bibliography?: string;
}

export interface ValidateDocumentResult {
  valid: boolean;
  errors: Array<{ code: string; message: string }>;
  warnings: Array<{ code: string; message: string }>;
  citationStats: { total: number; resolved: number; unresolved: string[] };
  mathStats: { total: number; valid: number; invalid: string[] };
  elapsed_ms: number;
}

export async function validateDocument(
  args: ValidateDocumentArgs,
  ctx: ZenSciContext,
): Promise<ValidateDocumentResult> {
  const startTime = Date.now();
  const { logger } = ctx;
  logger.info('Validating document');

  const errors: Array<{ code: string; message: string }> = [];
  const warnings: Array<{ code: string; message: string }> = [];

  // Parse markdown
  const parser = new MarkdownParser();
  const tree = parser.parse(args.source);

  // Math validation — collect math nodes from the AST
  const mathNodes: Array<{ latex: string; mode: string }> = [];
  function walkNodes(nodes: unknown[]): void {
    for (const node of nodes) {
      const n = node as Record<string, unknown>;
      if (n['type'] === 'math') {
        mathNodes.push({ latex: n['latex'] as string, mode: n['mode'] as string });
      }
      if (Array.isArray(n['children'])) {
        walkNodes(n['children'] as unknown[]);
      }
    }
  }
  walkNodes(tree.children);

  const mathValidator = new MathValidator();
  const invalidMath: string[] = [];
  let validMathCount = 0;

  for (const mathNode of mathNodes) {
    const result = await mathValidator.validate(
      mathNode.latex,
      mathNode.mode as 'inline' | 'display',
    );
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

  if (args.bibliography) {
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
    citationStats: {
      total: citationTotal,
      resolved: citationResolved,
      unresolved: unresolvedCitations,
    },
    mathStats: {
      total: mathNodes.length,
      valid: validMathCount,
      invalid: invalidMath,
    },
    elapsed_ms: Date.now() - startTime,
  };
}
