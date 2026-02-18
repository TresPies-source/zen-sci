// servers/grant-mcp/src/tools/validate-compliance.ts
// Handler for the validate_compliance MCP tool

import type { ZenSciContext } from '@zen-sci/sdk';
import { ComplianceChecker } from '../formatting/compliance-checker.js';
import type {
  GrantSection,
  ComplianceResult,
  SubmissionFileRole,
} from '../formatting/compliance-checker.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidateComplianceSection {
  role: string;
  content: string;
  title?: string;
}

export interface ValidateComplianceArgs {
  sections: ValidateComplianceSection[];
  funder: 'nih' | 'nsf' | 'erc';
  programType: string;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function validateCompliance(
  args: ValidateComplianceArgs,
  ctx: ZenSciContext,
): Promise<ComplianceResult> {
  const { logger } = ctx;
  logger.info('Validating compliance', {
    funder: args.funder,
    programType: args.programType,
    sectionCount: args.sections.length,
  });

  // Map input sections to GrantSection[]
  const grantSections: GrantSection[] = args.sections.map((s) => {
    const section: GrantSection = {
      role: s.role as SubmissionFileRole,
      content: s.content,
    };
    if (s.title !== undefined) {
      section.title = s.title;
    }
    return section;
  });

  const checker = new ComplianceChecker();
  const result = checker.checkCompliance(
    grantSections,
    args.funder,
    args.programType,
  );

  logger.info('Compliance validation complete', {
    compliant: result.compliant,
    violations: result.violations.length,
    warnings: result.warnings.length,
    score: result.score,
  });

  return result;
}
