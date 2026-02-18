import { describe, it, expect } from 'vitest';
import { createZenSciServer } from '@zen-sci/sdk';
import type { ZenSciContext } from '@zen-sci/sdk';
import { grantManifest } from '../../src/manifest.js';
import { generateProposal } from '../../src/tools/generate-proposal.js';
import type { GenerateProposalArgs } from '../../src/tools/generate-proposal.js';
import { validateCompliance } from '../../src/tools/validate-compliance.js';
import type { ValidateComplianceArgs } from '../../src/tools/validate-compliance.js';
import { checkFormat } from '../../src/tools/check-format.js';
import type { CheckFormatArgs } from '../../src/tools/check-format.js';

function makeCtx(): ZenSciContext {
  return createZenSciServer({
    name: 'grant-mcp-test',
    version: '0.4.0',
    manifest: grantManifest,
  });
}

// ---------------------------------------------------------------------------
// generate_proposal — NIH
// ---------------------------------------------------------------------------

describe('generateProposal — NIH', () => {
  it('generates NIH R01 proposal with LaTeX output', async () => {
    const ctx = makeCtx();
    const args: GenerateProposalArgs = {
      sections: [
        { role: 'specific-aims', content: 'We aim to study protein folding mechanisms.' },
        { role: 'research-strategy', content: 'Our approach uses machine learning.' },
        { role: 'budget-justification', content: 'Personnel and equipment costs.' },
        { role: 'biosketch', content: 'Dr. Smith has 20 years of experience.' },
      ],
      funder: 'nih',
      programType: 'R01',
    };

    const result = await generateProposal(args, ctx);

    expect(result.latex_source).toContain('\\documentclass');
    expect(result.latex_source).toContain('helvet');
    expect(result.latex_source).toContain('margin=0.5in');
    expect(result.format).toBe('grant-latex');
    expect(result.compliance.compliant).toBe(true);
    expect(result.page_counts).toBeDefined();
    expect(typeof result.page_counts['specific-aims']).toBe('number');
  });

  it('reports compliance violations for incomplete NIH proposal', async () => {
    const ctx = makeCtx();
    const args: GenerateProposalArgs = {
      sections: [
        { role: 'specific-aims', content: 'Aims only.' },
      ],
      funder: 'nih',
      programType: 'R01',
    };

    const result = await generateProposal(args, ctx);

    expect(result.compliance.compliant).toBe(false);
    expect(result.compliance.violations.length).toBeGreaterThan(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('warns about unknown NIH grant type and defaults to R01', async () => {
    const ctx = makeCtx();
    const args: GenerateProposalArgs = {
      sections: [
        { role: 'specific-aims', content: 'Aims.' },
        { role: 'research-strategy', content: 'Strategy.' },
        { role: 'budget-justification', content: 'Budget.' },
        { role: 'biosketch', content: 'Bio.' },
      ],
      funder: 'nih',
      programType: 'U01',
    };

    const result = await generateProposal(args, ctx);

    expect(result.warnings.some((w) => w.includes('Unknown NIH grant type'))).toBe(true);
    expect(result.latex_source).toContain('\\documentclass');
  });
});

// ---------------------------------------------------------------------------
// generate_proposal — NSF
// ---------------------------------------------------------------------------

describe('generateProposal — NSF', () => {
  it('generates NSF CAREER proposal with LaTeX output', async () => {
    const ctx = makeCtx();
    const args: GenerateProposalArgs = {
      sections: [
        { role: 'project-description', content: 'Project description for CAREER award.' },
        { role: 'data-management-plan', content: 'Data will be open-sourced.' },
        { role: 'budget-justification', content: 'PI salary and student support.' },
        { role: 'biosketch', content: 'Dr. Johnson, CS professor.' },
        { role: 'references', content: 'Pearl 2009, Barocas 2019.' },
      ],
      funder: 'nsf',
      programType: 'CAREER',
    };

    const result = await generateProposal(args, ctx);

    expect(result.latex_source).toContain('\\documentclass');
    expect(result.latex_source).toContain('mathptmx');
    expect(result.latex_source).toContain('margin=1in');
    expect(result.format).toBe('grant-latex');
    expect(result.compliance.compliant).toBe(true);
  });

  it('handles DOCX output format with fallback warning', async () => {
    const ctx = makeCtx();
    const args: GenerateProposalArgs = {
      sections: [
        { role: 'project-description', content: 'Description.' },
        { role: 'data-management-plan', content: 'DMP.' },
        { role: 'budget-justification', content: 'Budget.' },
        { role: 'biosketch', content: 'Bio.' },
        { role: 'references', content: 'Refs.' },
      ],
      funder: 'nsf',
      programType: 'standard',
      options: { outputFormat: 'docx' },
    };

    const result = await generateProposal(args, ctx);

    expect(result.format).toBe('docx');
    expect(result.warnings.some((w) => w.includes('DOCX'))).toBe(true);
    expect(result.latex_source).toContain('\\documentclass');
  });
});

// ---------------------------------------------------------------------------
// generate_proposal — ERC
// ---------------------------------------------------------------------------

describe('generateProposal — ERC', () => {
  it('generates ERC proposal with simplified template', async () => {
    const ctx = makeCtx();
    const args: GenerateProposalArgs = {
      sections: [
        { role: 'abstract', content: 'Project abstract.' },
        { role: 'project-description', content: 'Full description.' },
        { role: 'budget-justification', content: 'Budget details.' },
      ],
      funder: 'erc',
      programType: 'default',
    };

    const result = await generateProposal(args, ctx);

    expect(result.latex_source).toContain('\\documentclass');
    expect(result.format).toBe('grant-latex');
    expect(result.warnings.some((w) => w.includes('ERC'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validate_compliance
// ---------------------------------------------------------------------------

describe('validateCompliance', () => {
  it('validates a complete NIH proposal', async () => {
    const ctx = makeCtx();
    const args: ValidateComplianceArgs = {
      sections: [
        { role: 'specific-aims', content: 'Aims.' },
        { role: 'research-strategy', content: 'Strategy.' },
        { role: 'budget-justification', content: 'Budget.' },
        { role: 'biosketch', content: 'Bio.' },
      ],
      funder: 'nih',
      programType: 'R01',
    };

    const result = await validateCompliance(args, ctx);

    expect(result.compliant).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.score).toBe(100);
  });

  it('reports violations for incomplete NSF proposal', async () => {
    const ctx = makeCtx();
    const args: ValidateComplianceArgs = {
      sections: [
        { role: 'project-description', content: 'Description.' },
      ],
      funder: 'nsf',
      programType: 'CAREER',
    };

    const result = await validateCompliance(args, ctx);

    expect(result.compliant).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(100);
  });
});

// ---------------------------------------------------------------------------
// check_format
// ---------------------------------------------------------------------------

describe('checkFormat', () => {
  it('returns grants-gov format requirements', async () => {
    const ctx = makeCtx();
    const args: CheckFormatArgs = { platform: 'grants-gov' };

    const result = await checkFormat(args, ctx);

    expect(result.platform).toBe('grants-gov');
    expect(result.requiredFiles).toContain('specific-aims');
    expect(result.requiredFiles).toContain('research-strategy');
    expect(result.acceptedFormats).toContain('pdf');
  });

  it('returns nsf-research-gov format with 15-page project description limit', async () => {
    const ctx = makeCtx();
    const args: CheckFormatArgs = { platform: 'nsf-research-gov' };

    const result = await checkFormat(args, ctx);

    expect(result.platform).toBe('nsf-research-gov');
    expect(result.pageLimits['project-description']).toBe(15);
    expect(result.requiredFiles).toContain('data-management-plan');
  });

  it('returns erc-sep format requirements', async () => {
    const ctx = makeCtx();
    const args: CheckFormatArgs = { platform: 'erc-sep' };

    const result = await checkFormat(args, ctx);

    expect(result.platform).toBe('erc-sep');
    expect(result.requiredFiles).toContain('abstract');
    expect(result.requiredFiles).toContain('project-description');
  });

  it('returns manual format with no requirements', async () => {
    const ctx = makeCtx();
    const args: CheckFormatArgs = { platform: 'manual' };

    const result = await checkFormat(args, ctx);

    expect(result.platform).toBe('manual');
    expect(result.requiredFiles).toHaveLength(0);
    expect(result.acceptedFormats).toContain('pdf');
    expect(result.acceptedFormats).toContain('docx');
    expect(result.acceptedFormats).toContain('tex');
  });

  it('returns nih-era-commons format requirements', async () => {
    const ctx = makeCtx();
    const args: CheckFormatArgs = { platform: 'nih-era-commons' };

    const result = await checkFormat(args, ctx);

    expect(result.platform).toBe('nih-era-commons');
    expect(result.requiredFiles).toContain('specific-aims');
    expect(result.requiredFiles).toContain('biosketch');
    expect(result.pageLimits['specific-aims']).toBe(1);
  });
});
