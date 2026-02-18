// servers/grant-mcp/src/tools/generate-proposal.ts
// Handler for the generate_proposal MCP tool

import type { ZenSciContext } from '@zen-sci/sdk';
import { NIHFormatter } from '../formatting/nih-formatter.js';
import type { NIHFormatOptions } from '../formatting/nih-formatter.js';
import { NSFFormatter } from '../formatting/nsf-formatter.js';
import type { NSFFormatOptions } from '../formatting/nsf-formatter.js';
import { ComplianceChecker } from '../formatting/compliance-checker.js';
import type {
  GrantSection,
  ComplianceResult,
  SubmissionFileRole,
} from '../formatting/compliance-checker.js';
import { estimatePages } from '../formatting/compliance-checker.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GenerateProposalSection {
  role: string;
  content: string;
  title?: string;
}

export interface GenerateProposalArgs {
  sections: GenerateProposalSection[];
  funder: 'nih' | 'nsf' | 'erc';
  programType: string;
  bibliography?: string;
  options?: {
    outputFormat?: 'grant-latex' | 'docx';
    engine?: string;
  };
}

export interface GenerateProposalResult {
  latex_source: string;
  format: string;
  compliance: ComplianceResult;
  warnings: string[];
  page_counts: Record<string, number>;
  elapsed_ms: number;
}

// ---------------------------------------------------------------------------
// NIH grant type mapping
// ---------------------------------------------------------------------------

type NIHGrantType = 'R01' | 'R21' | 'R03' | 'K99' | 'F31';

const VALID_NIH_TYPES: Set<string> = new Set(['R01', 'R21', 'R03', 'K99', 'F31']);

function isValidNIHType(type: string): type is NIHGrantType {
  return VALID_NIH_TYPES.has(type);
}

// ---------------------------------------------------------------------------
// NSF program type mapping
// ---------------------------------------------------------------------------

type NSFProgramType = 'CAREER' | 'EAGER' | 'standard';

const VALID_NSF_TYPES: Set<string> = new Set(['CAREER', 'EAGER', 'standard']);

function isValidNSFType(type: string): type is NSFProgramType {
  return VALID_NSF_TYPES.has(type);
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function generateProposal(
  args: GenerateProposalArgs,
  ctx: ZenSciContext,
): Promise<GenerateProposalResult> {
  const startTime = Date.now();
  const { logger } = ctx;
  logger.info('Generating grant proposal', {
    funder: args.funder,
    programType: args.programType,
    sectionCount: args.sections.length,
  });

  const warnings: string[] = [];

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

  // Run compliance check
  const checker = new ComplianceChecker();
  const compliance = checker.checkCompliance(
    grantSections,
    args.funder,
    args.programType,
  );

  // Add compliance violations as warnings
  for (const v of compliance.violations) {
    warnings.push(`[${v.severity.toUpperCase()}] ${v.section}: ${v.details}`);
  }
  for (const w of compliance.warnings) {
    warnings.push(`[${w.severity.toUpperCase()}] ${w.section}: ${w.details}`);
  }

  // Compute page counts
  const pageCounts: Record<string, number> = {};
  for (const section of grantSections) {
    pageCounts[section.role] = estimatePages(section.content);
  }

  // Generate LaTeX output
  let latexSource: string;
  const outputFormat = args.options?.outputFormat ?? 'grant-latex';

  switch (args.funder) {
    case 'nih': {
      const nihFormatter = new NIHFormatter();
      const grantType: NIHGrantType = isValidNIHType(args.programType)
        ? args.programType
        : 'R01';
      if (!isValidNIHType(args.programType)) {
        warnings.push(
          `Unknown NIH grant type "${args.programType}", defaulting to R01.`,
        );
      }
      const nihOpts: NIHFormatOptions = {
        grantType,
        pageNumbering: 'continuous',
      };
      latexSource = nihFormatter.format(grantSections, nihOpts);
      break;
    }
    case 'nsf': {
      const nsfFormatter = new NSFFormatter();
      const programType: NSFProgramType = isValidNSFType(args.programType)
        ? args.programType
        : 'standard';
      if (!isValidNSFType(args.programType)) {
        warnings.push(
          `Unknown NSF program type "${args.programType}", defaulting to standard.`,
        );
      }
      const nsfOpts: NSFFormatOptions = {
        programType,
        includeDataManagementPlan: grantSections.some(
          (s) => s.role === 'data-management-plan',
        ),
      };
      latexSource = nsfFormatter.format(grantSections, nsfOpts);
      break;
    }
    case 'erc': {
      // ERC uses a simplified formatting similar to NSF
      const nsfFormatter = new NSFFormatter();
      const ercOpts: NSFFormatOptions = {
        programType: 'standard',
        includeDataManagementPlan: false,
      };
      latexSource = nsfFormatter.format(grantSections, ercOpts);
      warnings.push('ERC formatting uses simplified template. Review for ERC-specific requirements.');
      break;
    }
    default: {
      // Fallback to basic formatting
      latexSource = generateFallbackLatex(grantSections);
      warnings.push(`Unknown funder "${args.funder}", using basic LaTeX formatting.`);
    }
  }

  // Handle DOCX output format
  if (outputFormat === 'docx') {
    warnings.push(
      'DOCX output requested but python-docx engine is not available in this environment. ' +
      'LaTeX source is provided instead. Use pandoc to convert: pandoc output.tex -o output.docx',
    );
  }

  return {
    latex_source: latexSource,
    format: outputFormat,
    compliance,
    warnings,
    page_counts: pageCounts,
    elapsed_ms: Date.now() - startTime,
  };
}

// ---------------------------------------------------------------------------
// Fallback LaTeX generator
// ---------------------------------------------------------------------------

function generateFallbackLatex(sections: GrantSection[]): string {
  const lines: string[] = [];
  lines.push('\\documentclass[11pt,letterpaper]{article}');
  lines.push('\\usepackage[utf8]{inputenc}');
  lines.push('\\usepackage[margin=1in]{geometry}');
  lines.push('\\usepackage{amsmath}');
  lines.push('\\usepackage{hyperref}');
  lines.push('');
  lines.push('\\begin{document}');
  lines.push('');

  for (const section of sections) {
    const title = section.title ?? section.role;
    lines.push(`\\section{${title}}`);
    lines.push('');
    lines.push(section.content);
    lines.push('');
  }

  lines.push('\\end{document}');
  return lines.join('\n');
}
