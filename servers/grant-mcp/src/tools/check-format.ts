// servers/grant-mcp/src/tools/check-format.ts
// Handler for the check_format MCP tool

import type { ZenSciContext } from '@zen-sci/sdk';
import type {
  GrantPlatform,
  GrantSubmissionFormat,
} from '../formatting/compliance-checker.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CheckFormatArgs {
  platform: GrantPlatform;
}

// ---------------------------------------------------------------------------
// Platform format definitions
// ---------------------------------------------------------------------------

const PLATFORM_FORMATS: Record<GrantPlatform, GrantSubmissionFormat> = {
  'grants-gov': {
    platform: 'grants-gov',
    requiredFiles: [
      'specific-aims',
      'research-strategy',
      'budget-justification',
      'biosketch',
    ],
    pageLimits: {
      'specific-aims': 1,
      'research-strategy': 12,
      'budget-justification': 3,
      'biosketch': 5,
    },
    acceptedFormats: ['pdf'],
    notes: 'All documents must be uploaded as PDF. Maximum file size: 100MB per attachment.',
  },
  'nih-era-commons': {
    platform: 'nih-era-commons',
    requiredFiles: [
      'specific-aims',
      'research-strategy',
      'budget-justification',
      'biosketch',
    ],
    pageLimits: {
      'specific-aims': 1,
      'research-strategy': 12,
      'budget-justification': 3,
      'biosketch': 5,
      'facilities': 2,
      'equipment': 1,
    },
    acceptedFormats: ['pdf'],
    notes: 'Use NIH-compliant formatting: 11pt Arial, 0.5" margins. Submit via eRA Commons ASSIST.',
  },
  'nsf-research-gov': {
    platform: 'nsf-research-gov',
    requiredFiles: [
      'project-description',
      'data-management-plan',
      'budget-justification',
      'biosketch',
      'references',
    ],
    pageLimits: {
      'project-description': 15,
      'data-management-plan': 2,
      'budget-justification': 5,
      'biosketch': 3,
      'references': 10,
    },
    acceptedFormats: ['pdf'],
    notes: 'Use NSF formatting: 11pt font, 1" margins. Submit via Research.gov.',
  },
  'erc-sep': {
    platform: 'erc-sep',
    requiredFiles: [
      'abstract',
      'project-description',
      'budget-justification',
    ],
    pageLimits: {
      'abstract': 1,
      'project-description': 15,
      'budget-justification': 3,
    },
    acceptedFormats: ['pdf'],
    notes: 'Submit via the ERC Submission & Evaluation Portal (SEP). Follow Horizon Europe guidelines.',
  },
  'manual': {
    platform: 'manual',
    requiredFiles: [],
    pageLimits: {},
    acceptedFormats: ['pdf', 'docx', 'tex'],
    notes: 'No specific submission platform requirements. Format according to funder guidelines.',
  },
};

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function checkFormat(
  args: CheckFormatArgs,
  ctx: ZenSciContext,
): Promise<GrantSubmissionFormat> {
  const { logger } = ctx;
  logger.info('Checking submission format', { platform: args.platform });

  const format = PLATFORM_FORMATS[args.platform];
  if (!format) {
    logger.warn('Unknown platform, returning manual format', {
      platform: args.platform,
    });
    return PLATFORM_FORMATS['manual'];
  }

  return format;
}
