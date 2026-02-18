import { describe, it, expect } from 'vitest';
import { NIHFormatter } from '../../src/formatting/nih-formatter.js';
import type { NIHFormatOptions } from '../../src/formatting/nih-formatter.js';
import { NSFFormatter } from '../../src/formatting/nsf-formatter.js';
import type { NSFFormatOptions } from '../../src/formatting/nsf-formatter.js';
import type { GrantSection } from '../../src/formatting/compliance-checker.js';

// ---------------------------------------------------------------------------
// NIHFormatter
// ---------------------------------------------------------------------------

describe('NIHFormatter', () => {
  const formatter = new NIHFormatter();

  const sampleSections: GrantSection[] = [
    {
      role: 'specific-aims',
      content: 'We propose to develop novel computational methods for protein structure prediction.',
    },
    {
      role: 'research-strategy',
      content: '## A. Significance\n\nThis research addresses a critical gap.\n\n## B. Innovation\n\nOur approach is novel.\n\n## C. Approach\n\nWe will use machine learning.',
    },
  ];

  it('generates valid LaTeX document', () => {
    const options: NIHFormatOptions = {
      grantType: 'R01',
      pageNumbering: 'continuous',
    };
    const result = formatter.format(sampleSections, options);

    expect(result).toContain('\\documentclass[11pt,letterpaper]{article}');
    expect(result).toContain('\\begin{document}');
    expect(result).toContain('\\end{document}');
  });

  it('applies NIH formatting: helvet font and 0.5in margins', () => {
    const options: NIHFormatOptions = {
      grantType: 'R01',
      pageNumbering: 'continuous',
    };
    const result = formatter.format(sampleSections, options);

    expect(result).toContain('\\usepackage{helvet}');
    expect(result).toContain('\\renewcommand{\\familydefault}{\\sfdefault}');
    expect(result).toContain('\\usepackage[margin=0.5in]{geometry}');
  });

  it('includes grant type comment', () => {
    const options: NIHFormatOptions = {
      grantType: 'R21',
      pageNumbering: 'continuous',
    };
    const result = formatter.format(sampleSections, options);

    expect(result).toContain('% NIH R21 Proposal');
  });

  it('uses continuous page numbering when specified', () => {
    const options: NIHFormatOptions = {
      grantType: 'R01',
      pageNumbering: 'continuous',
    };
    const result = formatter.format(sampleSections, options);

    expect(result).toContain('\\pagestyle{plain}');
  });

  it('uses section page numbering with fancyhdr when specified', () => {
    const options: NIHFormatOptions = {
      grantType: 'R01',
      pageNumbering: 'section',
    };
    const result = formatter.format(sampleSections, options);

    expect(result).toContain('\\usepackage{fancyhdr}');
    expect(result).toContain('\\pagestyle{fancy}');
  });

  it('renders section titles from role names', () => {
    const options: NIHFormatOptions = {
      grantType: 'R01',
      pageNumbering: 'continuous',
    };
    const result = formatter.format(sampleSections, options);

    expect(result).toContain('Specific Aims');
    expect(result).toContain('Research Strategy');
  });

  it('uses custom section title when provided', () => {
    const sections: GrantSection[] = [
      {
        role: 'specific-aims',
        content: 'Content here.',
        title: 'My Custom Aims Title',
      },
    ];
    const options: NIHFormatOptions = {
      grantType: 'R01',
      pageNumbering: 'continuous',
    };
    const result = formatter.format(sections, options);

    expect(result).toContain('My Custom Aims Title');
  });

  it('handles custom font family option', () => {
    const options: NIHFormatOptions = {
      grantType: 'R01',
      pageNumbering: 'continuous',
      fontFamily: 'mathptmx',
    };
    const result = formatter.format(sampleSections, options);

    expect(result).toContain('\\usepackage{mathptmx}');
  });

  it('converts markdown headings to LaTeX commands', () => {
    const sections: GrantSection[] = [
      {
        role: 'research-strategy',
        content: '## Significance\n\nImportant work.\n\n### Sub-topic\n\nDetails.',
      },
    ];
    const options: NIHFormatOptions = {
      grantType: 'R01',
      pageNumbering: 'continuous',
    };
    const result = formatter.format(sections, options);

    expect(result).toContain('\\subsection{Significance}');
    expect(result).toContain('\\subsubsection{Sub-topic}');
  });

  it('adds page break after specific-aims section', () => {
    const options: NIHFormatOptions = {
      grantType: 'R01',
      pageNumbering: 'continuous',
    };
    const result = formatter.format(sampleSections, options);

    // specific-aims content followed by \newpage
    expect(result).toContain('\\newpage');
  });
});

// ---------------------------------------------------------------------------
// NSFFormatter
// ---------------------------------------------------------------------------

describe('NSFFormatter', () => {
  const formatter = new NSFFormatter();

  const sampleSections: GrantSection[] = [
    {
      role: 'project-description',
      content: 'This project aims to advance the state of the art in causal reasoning for AI fairness.',
    },
    {
      role: 'data-management-plan',
      content: 'All data will be made publicly available under open-source licenses.',
    },
    {
      role: 'budget-justification',
      content: 'Budget includes PI salary, graduate student support, and computing resources.',
    },
  ];

  it('generates valid LaTeX document', () => {
    const options: NSFFormatOptions = {
      programType: 'CAREER',
      includeDataManagementPlan: true,
    };
    const result = formatter.format(sampleSections, options);

    expect(result).toContain('\\documentclass[11pt,letterpaper]{article}');
    expect(result).toContain('\\begin{document}');
    expect(result).toContain('\\end{document}');
  });

  it('applies NSF formatting: Times font and 1in margins', () => {
    const options: NSFFormatOptions = {
      programType: 'standard',
      includeDataManagementPlan: true,
    };
    const result = formatter.format(sampleSections, options);

    expect(result).toContain('\\usepackage{mathptmx}');
    expect(result).toContain('\\usepackage[margin=1in]{geometry}');
  });

  it('includes program type comment', () => {
    const options: NSFFormatOptions = {
      programType: 'CAREER',
      includeDataManagementPlan: true,
    };
    const result = formatter.format(sampleSections, options);

    expect(result).toContain('% NSF CAREER Proposal');
  });

  it('includes data management plan when flag is true', () => {
    const options: NSFFormatOptions = {
      programType: 'standard',
      includeDataManagementPlan: true,
    };
    const result = formatter.format(sampleSections, options);

    expect(result).toContain('Data Management Plan');
  });

  it('excludes data management plan when flag is false', () => {
    const options: NSFFormatOptions = {
      programType: 'standard',
      includeDataManagementPlan: false,
    };
    const result = formatter.format(sampleSections, options);

    expect(result).not.toContain('Data Management Plan');
  });

  it('renders section titles correctly', () => {
    const options: NSFFormatOptions = {
      programType: 'standard',
      includeDataManagementPlan: true,
    };
    const result = formatter.format(sampleSections, options);

    expect(result).toContain('Project Description');
    expect(result).toContain('Budget Justification');
  });

  it('includes natbib package for references', () => {
    const options: NSFFormatOptions = {
      programType: 'standard',
      includeDataManagementPlan: true,
    };
    const result = formatter.format(sampleSections, options);

    expect(result).toContain('\\usepackage{natbib}');
  });

  it('adds page break after project description', () => {
    const options: NSFFormatOptions = {
      programType: 'standard',
      includeDataManagementPlan: true,
    };
    const result = formatter.format(sampleSections, options);

    expect(result).toContain('\\newpage');
  });
});
