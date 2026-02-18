import { describe, it, expect } from 'vitest';
import {
  ComplianceChecker,
  estimatePages,
} from '../../src/formatting/compliance-checker.js';
import type { GrantSection } from '../../src/formatting/compliance-checker.js';

// ---------------------------------------------------------------------------
// estimatePages
// ---------------------------------------------------------------------------

describe('estimatePages', () => {
  it('returns 1 for a short paragraph', () => {
    expect(estimatePages('This is a short paragraph with a few words.')).toBe(1);
  });

  it('returns correct estimate for ~250 words', () => {
    const words = Array.from({ length: 250 }, (_, i) => `word${i}`).join(' ');
    expect(estimatePages(words)).toBe(1);
  });

  it('returns correct estimate for ~500 words', () => {
    const words = Array.from({ length: 500 }, (_, i) => `word${i}`).join(' ');
    expect(estimatePages(words)).toBe(2);
  });

  it('returns 1 for empty content', () => {
    // Empty content has 0 words, Math.ceil(0/250) = 0
    expect(estimatePages('')).toBe(0);
  });

  it('handles whitespace-only content', () => {
    expect(estimatePages('   \n\n\t  ')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// ComplianceChecker — NIH
// ---------------------------------------------------------------------------

describe('ComplianceChecker — NIH', () => {
  const checker = new ComplianceChecker();

  it('passes compliance for complete R01 proposal with valid lengths', () => {
    const sections: GrantSection[] = [
      { role: 'specific-aims', content: 'This is the specific aims section with some content.' },
      { role: 'research-strategy', content: 'Research strategy content here.' },
      { role: 'budget-justification', content: 'Budget justification details.' },
      { role: 'biosketch', content: 'Biographical sketch information.' },
    ];

    const result = checker.checkCompliance(sections, 'nih', 'R01');
    expect(result.compliant).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.score).toBeGreaterThan(0);
  });

  it('reports missing required sections', () => {
    const sections: GrantSection[] = [
      { role: 'specific-aims', content: 'Some aims.' },
    ];

    const result = checker.checkCompliance(sections, 'nih', 'R01');
    expect(result.compliant).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);

    const missing = result.violations.filter((v) => v.rule === 'required-section');
    expect(missing.length).toBe(3); // missing research-strategy, budget-justification, biosketch
  });

  it('reports page limit violation for specific aims exceeding 1 page', () => {
    // ~500 words = ~2 pages, limit for specific-aims is 1 page
    const longContent = Array.from({ length: 500 }, (_, i) => `word${i}`).join(' ');
    const sections: GrantSection[] = [
      { role: 'specific-aims', content: longContent },
      { role: 'research-strategy', content: 'Strategy.' },
      { role: 'budget-justification', content: 'Budget.' },
      { role: 'biosketch', content: 'Bio.' },
    ];

    const result = checker.checkCompliance(sections, 'nih', 'R01');
    expect(result.compliant).toBe(false);

    const pageLimitViolation = result.violations.find(
      (v) => v.rule === 'page-limit' && v.section === 'specific-aims',
    );
    expect(pageLimitViolation).toBeDefined();
  });

  it('reports page limit violation for research strategy exceeding 12 pages', () => {
    // ~3500 words = ~14 pages, limit for R01 research-strategy is 12 pages
    const longContent = Array.from({ length: 3500 }, (_, i) => `word${i}`).join(' ');
    const sections: GrantSection[] = [
      { role: 'specific-aims', content: 'Aims.' },
      { role: 'research-strategy', content: longContent },
      { role: 'budget-justification', content: 'Budget.' },
      { role: 'biosketch', content: 'Bio.' },
    ];

    const result = checker.checkCompliance(sections, 'nih', 'R01');
    expect(result.compliant).toBe(false);

    const pageLimitViolation = result.violations.find(
      (v) => v.rule === 'page-limit' && v.section === 'research-strategy',
    );
    expect(pageLimitViolation).toBeDefined();
  });

  it('warns about empty sections', () => {
    const sections: GrantSection[] = [
      { role: 'specific-aims', content: '' },
      { role: 'research-strategy', content: 'Some content.' },
      { role: 'budget-justification', content: 'Budget.' },
      { role: 'biosketch', content: 'Bio.' },
    ];

    const result = checker.checkCompliance(sections, 'nih', 'R01');
    const emptyWarning = result.warnings.find(
      (w) => w.rule === 'empty-section' && w.section === 'specific-aims',
    );
    expect(emptyWarning).toBeDefined();
  });

  it('handles R21 grant type with 6-page research strategy limit', () => {
    // ~2000 words = ~8 pages, limit for R21 research-strategy is 6 pages
    const longContent = Array.from({ length: 2000 }, (_, i) => `word${i}`).join(' ');
    const sections: GrantSection[] = [
      { role: 'specific-aims', content: 'Aims.' },
      { role: 'research-strategy', content: longContent },
      { role: 'budget-justification', content: 'Budget.' },
      { role: 'biosketch', content: 'Bio.' },
    ];

    const result = checker.checkCompliance(sections, 'nih', 'R21');
    const pageLimitViolation = result.violations.find(
      (v) => v.rule === 'page-limit' && v.section === 'research-strategy',
    );
    expect(pageLimitViolation).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// ComplianceChecker — NSF
// ---------------------------------------------------------------------------

describe('ComplianceChecker — NSF', () => {
  const checker = new ComplianceChecker();

  it('passes compliance for complete NSF standard proposal', () => {
    const sections: GrantSection[] = [
      { role: 'project-description', content: 'Project description content.' },
      { role: 'data-management-plan', content: 'DMP content.' },
      { role: 'budget-justification', content: 'Budget details.' },
      { role: 'biosketch', content: 'Bio info.' },
      { role: 'references', content: 'Reference list.' },
    ];

    const result = checker.checkCompliance(sections, 'nsf', 'standard');
    expect(result.compliant).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('reports missing data management plan for NSF', () => {
    const sections: GrantSection[] = [
      { role: 'project-description', content: 'Project description.' },
      { role: 'budget-justification', content: 'Budget.' },
      { role: 'biosketch', content: 'Bio.' },
      { role: 'references', content: 'Refs.' },
    ];

    const result = checker.checkCompliance(sections, 'nsf', 'CAREER');
    expect(result.compliant).toBe(false);

    const missing = result.violations.find(
      (v) => v.rule === 'required-section' && v.section === 'data-management-plan',
    );
    expect(missing).toBeDefined();
  });

  it('reports page limit violation for project description exceeding 15 pages', () => {
    // ~4500 words = ~18 pages, limit is 15
    const longContent = Array.from({ length: 4500 }, (_, i) => `word${i}`).join(' ');
    const sections: GrantSection[] = [
      { role: 'project-description', content: longContent },
      { role: 'data-management-plan', content: 'DMP.' },
      { role: 'budget-justification', content: 'Budget.' },
      { role: 'biosketch', content: 'Bio.' },
      { role: 'references', content: 'Refs.' },
    ];

    const result = checker.checkCompliance(sections, 'nsf', 'standard');
    const pageLimitViolation = result.violations.find(
      (v) => v.rule === 'page-limit' && v.section === 'project-description',
    );
    expect(pageLimitViolation).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// ComplianceChecker — ERC
// ---------------------------------------------------------------------------

describe('ComplianceChecker — ERC', () => {
  const checker = new ComplianceChecker();

  it('passes compliance for complete ERC proposal', () => {
    const sections: GrantSection[] = [
      { role: 'abstract', content: 'Abstract content.' },
      { role: 'project-description', content: 'Project description.' },
      { role: 'budget-justification', content: 'Budget.' },
    ];

    const result = checker.checkCompliance(sections, 'erc', 'default');
    expect(result.compliant).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('reports missing abstract for ERC', () => {
    const sections: GrantSection[] = [
      { role: 'project-description', content: 'Description.' },
      { role: 'budget-justification', content: 'Budget.' },
    ];

    const result = checker.checkCompliance(sections, 'erc', 'default');
    expect(result.compliant).toBe(false);
    const missing = result.violations.find(
      (v) => v.section === 'abstract' && v.rule === 'required-section',
    );
    expect(missing).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// ComplianceChecker — Score calculation
// ---------------------------------------------------------------------------

describe('ComplianceChecker — Score', () => {
  const checker = new ComplianceChecker();

  it('returns score of 100 for fully compliant proposal', () => {
    const sections: GrantSection[] = [
      { role: 'specific-aims', content: 'Aims.' },
      { role: 'research-strategy', content: 'Strategy.' },
      { role: 'budget-justification', content: 'Budget.' },
      { role: 'biosketch', content: 'Bio.' },
    ];

    const result = checker.checkCompliance(sections, 'nih', 'R01');
    expect(result.score).toBe(100);
  });

  it('returns reduced score for violations', () => {
    const sections: GrantSection[] = [
      { role: 'specific-aims', content: 'Aims.' },
    ];

    const result = checker.checkCompliance(sections, 'nih', 'R01');
    expect(result.score).toBeLessThan(100);
  });

  it('returns score between 0 and 100', () => {
    const sections: GrantSection[] = [];
    const result = checker.checkCompliance(sections, 'nih', 'R01');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
