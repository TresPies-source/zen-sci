// servers/grant-mcp/src/formatting/nsf-formatter.ts
// NSF grant proposal LaTeX formatter

import type { GrantSection } from './compliance-checker.js';

// ---------------------------------------------------------------------------
// NSF Format Options
// ---------------------------------------------------------------------------

export interface NSFFormatOptions {
  programType: 'CAREER' | 'EAGER' | 'standard';
  includeDataManagementPlan: boolean;
}

// ---------------------------------------------------------------------------
// Section title mapping
// ---------------------------------------------------------------------------

const SECTION_TITLES: Record<string, string> = {
  'project-description': 'Project Description',
  'data-management-plan': 'Data Management Plan',
  'budget-justification': 'Budget Justification',
  'biosketch': 'Biographical Sketch',
  'references': 'References Cited',
  'facilities': 'Facilities, Equipment \\& Other Resources',
  'equipment': 'Equipment',
  'cover-letter': 'Cover Letter',
  'abstract': 'Project Summary',
  'specific-aims': 'Specific Aims',
  'research-strategy': 'Research Strategy',
  'other': 'Supplementary Documents',
};

// ---------------------------------------------------------------------------
// NSFFormatter
// ---------------------------------------------------------------------------

export class NSFFormatter {
  /**
   * Format grant sections into NSF-compliant LaTeX.
   *
   * NSF formatting rules:
   * - 11pt Computer Modern or Times
   * - 1" margins on all sides
   * - Single-spaced text
   */
  format(sections: GrantSection[], options: NSFFormatOptions): string {
    const lines: string[] = [];

    // Document class
    lines.push('\\documentclass[11pt,letterpaper]{article}');
    lines.push('');

    // Required packages
    lines.push('% NSF-compliant formatting');
    lines.push('\\usepackage[utf8]{inputenc}');
    lines.push('\\usepackage[T1]{fontenc}');
    lines.push('\\usepackage{mathptmx}'); // Times font
    lines.push('');

    // Margins: 1" on all sides
    lines.push('\\usepackage[margin=1in]{geometry}');
    lines.push('');

    // Additional packages
    lines.push('\\usepackage{amsmath}');
    lines.push('\\usepackage{amssymb}');
    lines.push('\\usepackage{graphicx}');
    lines.push('\\usepackage{hyperref}');
    lines.push('\\usepackage{setspace}');
    lines.push('\\usepackage{enumitem}');
    lines.push('\\usepackage{natbib}');
    lines.push('');

    // Page numbering
    lines.push('\\pagestyle{plain}');
    lines.push('');

    // Program type header
    lines.push(`% NSF ${options.programType} Proposal`);
    lines.push('');

    // Begin document
    lines.push('\\begin{document}');
    lines.push('');

    // Filter sections: skip DMP if not included
    const filteredSections = sections.filter((s) => {
      if (s.role === 'data-management-plan' && !options.includeDataManagementPlan) {
        return false;
      }
      return true;
    });

    // Render each section
    for (const section of filteredSections) {
      const title = section.title ?? SECTION_TITLES[section.role] ?? section.role;

      lines.push(`\\section{${title}}`);
      lines.push('');
      lines.push(convertMarkdownToLatex(section.content));
      lines.push('');

      // Page break between major sections
      if (section.role === 'project-description') {
        lines.push('\\newpage');
        lines.push('');
      }
    }

    // End document
    lines.push('\\end{document}');

    return lines.join('\n');
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Basic markdown-to-LaTeX conversion for section content.
 */
function convertMarkdownToLatex(markdown: string): string {
  const lines: string[] = [];

  for (const line of markdown.split('\n')) {
    const trimmed = line.trim();

    if (trimmed.startsWith('### ')) {
      lines.push(`\\subsubsection{${trimmed.slice(4)}}`);
    } else if (trimmed.startsWith('## ')) {
      lines.push(`\\subsection{${trimmed.slice(3)}}`);
    } else if (trimmed.startsWith('# ')) {
      lines.push(`\\section{${trimmed.slice(2)}}`);
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (lines.length === 0 || !lines[lines.length - 1]!.includes('\\item')) {
        lines.push('\\begin{itemize}');
      }
      lines.push(`  \\item ${trimmed.slice(2)}`);
    } else {
      if (lines.length > 0 && lines[lines.length - 1]!.includes('\\item') && trimmed.length > 0) {
        lines.push('\\end{itemize}');
      }
      lines.push(trimmed);
    }
  }

  // Close any dangling itemize
  const joined = lines.join('\n');
  const opens = (joined.match(/\\begin\{itemize\}/g) ?? []).length;
  const closes = (joined.match(/\\end\{itemize\}/g) ?? []).length;
  if (opens > closes) {
    lines.push('\\end{itemize}');
  }

  return lines.join('\n');
}
