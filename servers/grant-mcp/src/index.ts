// servers/grant-mcp/src/index.ts
// MCP server entry point for Grant MCP

import { z } from 'zod';
import { createZenSciServer } from '@zen-sci/sdk';
import { grantManifest } from './manifest.js';
import { generateProposal } from './tools/generate-proposal.js';
import type { GenerateProposalArgs, GenerateProposalSection } from './tools/generate-proposal.js';
import { validateCompliance } from './tools/validate-compliance.js';
import type { ValidateComplianceArgs, ValidateComplianceSection } from './tools/validate-compliance.js';
import { checkFormat } from './tools/check-format.js';
import type { CheckFormatArgs } from './tools/check-format.js';
import type { GrantPlatform } from './formatting/compliance-checker.js';

const ctx = createZenSciServer({
  name: 'grant-mcp',
  version: '0.4.0',
  manifest: grantManifest,
});

const { server } = ctx;

// ---------------------------------------------------------------------------
// generate_proposal
// ---------------------------------------------------------------------------

const sectionSchema = z.object({
  role: z.string().describe('Section role (e.g., specific-aims, research-strategy)'),
  content: z.string().describe('Section content in markdown'),
  title: z.string().optional().describe('Optional custom section title'),
});

server.tool(
  'generate_proposal',
  'Convert structured grant sections to funder-compliant LaTeX format (NIH, NSF, ERC)',
  {
    sections: z.array(sectionSchema).describe('Array of proposal sections'),
    funder: z.enum(['nih', 'nsf', 'erc']).describe('Funding agency'),
    programType: z.string().describe('Program type (e.g., R01, CAREER, standard)'),
    bibliography: z.string().optional().describe('BibTeX bibliography content'),
    options: z.object({
      outputFormat: z.enum(['grant-latex', 'docx']).optional().describe('Output format'),
      engine: z.string().optional().describe('LaTeX engine'),
    }).optional().describe('Generation options'),
  },
  async (rawArgs) => {
    // Strip undefined values from Zod output to satisfy exactOptionalPropertyTypes
    const sections: GenerateProposalSection[] = rawArgs.sections.map((s) => {
      const section: GenerateProposalSection = {
        role: s.role,
        content: s.content,
      };
      if (s.title !== undefined) section.title = s.title;
      return section;
    });

    const args: GenerateProposalArgs = {
      sections,
      funder: rawArgs.funder,
      programType: rawArgs.programType,
    };
    if (rawArgs.bibliography !== undefined) args.bibliography = rawArgs.bibliography;
    if (rawArgs.options !== undefined) {
      const opts: NonNullable<GenerateProposalArgs['options']> = {};
      if (rawArgs.options.outputFormat !== undefined) opts.outputFormat = rawArgs.options.outputFormat;
      if (rawArgs.options.engine !== undefined) opts.engine = rawArgs.options.engine;
      args.options = opts;
    }

    const result = await generateProposal(args, ctx);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// ---------------------------------------------------------------------------
// validate_compliance
// ---------------------------------------------------------------------------

server.tool(
  'validate_compliance',
  'Validate grant proposal sections against funder-specific compliance rules',
  {
    sections: z.array(sectionSchema).describe('Array of proposal sections to validate'),
    funder: z.enum(['nih', 'nsf', 'erc']).describe('Funding agency'),
    programType: z.string().describe('Program type (e.g., R01, CAREER)'),
  },
  async (rawArgs) => {
    const sections: ValidateComplianceSection[] = rawArgs.sections.map((s) => {
      const section: ValidateComplianceSection = {
        role: s.role,
        content: s.content,
      };
      if (s.title !== undefined) section.title = s.title;
      return section;
    });

    const args: ValidateComplianceArgs = {
      sections,
      funder: rawArgs.funder,
      programType: rawArgs.programType,
    };

    const result = await validateCompliance(args, ctx);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// ---------------------------------------------------------------------------
// check_format
// ---------------------------------------------------------------------------

server.tool(
  'check_format',
  'List supported grant funders, programs, and their submission format requirements',
  {
    platform: z.enum([
      'grants-gov',
      'nih-era-commons',
      'nsf-research-gov',
      'erc-sep',
      'manual',
    ]).describe('Submission platform'),
  },
  async (rawArgs) => {
    const args: CheckFormatArgs = {
      platform: rawArgs.platform as GrantPlatform,
    };

    const result = await checkFormat(args, ctx);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);
