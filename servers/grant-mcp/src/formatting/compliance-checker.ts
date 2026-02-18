// servers/grant-mcp/src/formatting/compliance-checker.ts
// Grant compliance checking against funder-specific rules

// ---------------------------------------------------------------------------
// Local types (not exported from @zen-sci/core)
// ---------------------------------------------------------------------------

export type SubmissionFileRole =
  | 'specific-aims'
  | 'research-strategy'
  | 'project-description'
  | 'data-management-plan'
  | 'budget-justification'
  | 'facilities'
  | 'equipment'
  | 'biosketch'
  | 'references'
  | 'cover-letter'
  | 'abstract'
  | 'other';

export interface GrantSection {
  role: SubmissionFileRole;
  content: string;
  title?: string;
  pageLimit?: number;
}

export type GrantPlatform =
  | 'grants-gov'
  | 'nih-era-commons'
  | 'nsf-research-gov'
  | 'erc-sep'
  | 'manual';

export interface GrantSubmissionFormat {
  platform: GrantPlatform;
  requiredFiles: SubmissionFileRole[];
  pageLimits: Partial<Record<SubmissionFileRole, number>>;
  acceptedFormats: string[];
  notes?: string;
}

export interface ComplianceViolation {
  section: string;
  rule: string;
  severity: 'error' | 'warning';
  details: string;
}

export interface ComplianceResult {
  compliant: boolean;
  violations: ComplianceViolation[];
  warnings: ComplianceViolation[];
  score: number;
}

// ---------------------------------------------------------------------------
// Funder-specific page-limit rules
// ---------------------------------------------------------------------------

interface FunderPageLimits {
  [section: string]: number;
}

const NIH_PAGE_LIMITS: Record<string, FunderPageLimits> = {
  R01: {
    'specific-aims': 1,
    'research-strategy': 12,
    'budget-justification': 3,
    'facilities': 2,
    'equipment': 1,
    'biosketch': 5,
  },
  R21: {
    'specific-aims': 1,
    'research-strategy': 6,
    'budget-justification': 3,
    'facilities': 2,
    'equipment': 1,
    'biosketch': 5,
  },
  R03: {
    'specific-aims': 1,
    'research-strategy': 6,
    'budget-justification': 3,
    'facilities': 2,
    'equipment': 1,
    'biosketch': 5,
  },
  K99: {
    'specific-aims': 1,
    'research-strategy': 12,
    'budget-justification': 3,
    'biosketch': 5,
  },
  F31: {
    'specific-aims': 1,
    'research-strategy': 6,
    'budget-justification': 1,
    'biosketch': 5,
  },
};

const NSF_PAGE_LIMITS: Record<string, FunderPageLimits> = {
  CAREER: {
    'project-description': 15,
    'data-management-plan': 2,
    'budget-justification': 5,
    'biosketch': 3,
    'references': 10,
    'facilities': 2,
  },
  EAGER: {
    'project-description': 8,
    'data-management-plan': 2,
    'budget-justification': 3,
    'biosketch': 3,
    'references': 10,
  },
  standard: {
    'project-description': 15,
    'data-management-plan': 2,
    'budget-justification': 5,
    'biosketch': 3,
    'references': 10,
    'facilities': 2,
  },
};

const ERC_PAGE_LIMITS: Record<string, FunderPageLimits> = {
  default: {
    'abstract': 1,
    'project-description': 15,
    'budget-justification': 3,
    'biosketch': 2,
  },
};

// ---------------------------------------------------------------------------
// Required sections per funder
// ---------------------------------------------------------------------------

const NIH_REQUIRED_SECTIONS: SubmissionFileRole[] = [
  'specific-aims',
  'research-strategy',
  'budget-justification',
  'biosketch',
];

const NSF_REQUIRED_SECTIONS: SubmissionFileRole[] = [
  'project-description',
  'data-management-plan',
  'budget-justification',
  'biosketch',
  'references',
];

const ERC_REQUIRED_SECTIONS: SubmissionFileRole[] = [
  'abstract',
  'project-description',
  'budget-justification',
];

// ---------------------------------------------------------------------------
// Page estimation
// ---------------------------------------------------------------------------

const WORDS_PER_PAGE = 250;

/**
 * Estimate the number of pages based on word count.
 * Uses ~250 words per page as a standard estimate.
 */
export function estimatePages(content: string): number {
  const words = content
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  return Math.ceil(words / WORDS_PER_PAGE);
}

// ---------------------------------------------------------------------------
// ComplianceChecker
// ---------------------------------------------------------------------------

export class ComplianceChecker {
  /**
   * Check compliance of grant sections against funder rules.
   *
   * @param sections - The grant sections to validate
   * @param funder - The funding agency ('nih' | 'nsf' | 'erc')
   * @param programType - The program type (e.g., 'R01', 'CAREER', etc.)
   * @returns ComplianceResult with violations and score
   */
  checkCompliance(
    sections: GrantSection[],
    funder: 'nih' | 'nsf' | 'erc',
    programType: string,
  ): ComplianceResult {
    const violations: ComplianceViolation[] = [];
    const warnings: ComplianceViolation[] = [];

    // Get funder-specific rules
    const pageLimits = this.getPageLimits(funder, programType);
    const requiredSections = this.getRequiredSections(funder);

    // Check required sections
    const providedRoles = new Set(sections.map((s) => s.role));
    for (const required of requiredSections) {
      if (!providedRoles.has(required)) {
        violations.push({
          section: required,
          rule: 'required-section',
          severity: 'error',
          details: `Required section "${required}" is missing for ${funder.toUpperCase()} ${programType} proposal.`,
        });
      }
    }

    // Check page limits
    for (const section of sections) {
      const limit = pageLimits[section.role];
      if (limit !== undefined) {
        const estimatedPages = estimatePages(section.content);
        if (estimatedPages > limit) {
          violations.push({
            section: section.role,
            rule: 'page-limit',
            severity: 'error',
            details: `Section "${section.role}" exceeds page limit: estimated ${estimatedPages} pages (limit: ${limit}).`,
          });
        } else if (estimatedPages === limit) {
          warnings.push({
            section: section.role,
            rule: 'page-limit-near',
            severity: 'warning',
            details: `Section "${section.role}" is at the page limit: estimated ${estimatedPages} pages (limit: ${limit}).`,
          });
        }
      }
    }

    // Check for empty sections
    for (const section of sections) {
      if (section.content.trim().length === 0) {
        warnings.push({
          section: section.role,
          rule: 'empty-section',
          severity: 'warning',
          details: `Section "${section.role}" is empty.`,
        });
      }
    }

    // Compute compliance score
    const totalChecks = requiredSections.length + sections.length;
    const failedChecks = violations.length;
    const score = totalChecks > 0
      ? Math.max(0, Math.round(((totalChecks - failedChecks) / totalChecks) * 100))
      : 100;

    return {
      compliant: violations.length === 0,
      violations,
      warnings,
      score,
    };
  }

  private getPageLimits(funder: string, programType: string): FunderPageLimits {
    switch (funder) {
      case 'nih':
        return NIH_PAGE_LIMITS[programType] ?? NIH_PAGE_LIMITS['R01']!;
      case 'nsf':
        return NSF_PAGE_LIMITS[programType] ?? NSF_PAGE_LIMITS['standard']!;
      case 'erc':
        return ERC_PAGE_LIMITS[programType] ?? ERC_PAGE_LIMITS['default']!;
      default:
        return {};
    }
  }

  private getRequiredSections(funder: string): SubmissionFileRole[] {
    switch (funder) {
      case 'nih':
        return NIH_REQUIRED_SECTIONS;
      case 'nsf':
        return NSF_REQUIRED_SECTIONS;
      case 'erc':
        return ERC_REQUIRED_SECTIONS;
      default:
        return [];
    }
  }
}
