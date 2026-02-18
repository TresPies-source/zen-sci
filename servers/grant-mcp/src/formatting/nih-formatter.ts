// servers/grant-mcp/src/formatting/nih-formatter.ts
// NIH grant proposal LaTeX formatter

import type { GrantSection } from './compliance-checker.js';

// ---------------------------------------------------------------------------
// NIH Format Options
// ---------------------------------------------------------------------------

export interface NIHFormatOptions {
  grantType: 'R01' | 'R21' | 'R03' | 'K99' | 'F31';
  pageNumbering: 'section' | 'continuous';
  fontFamily?: string;
}

// ---------------------------------------------------------------------------
// Section-to-LaTeX command mapping
// ---------------------------------------------------------------------------

const SECTION_COMMANDS: Record<string, string> = {
  'specific-aims': 'section',
  'research-strategy': 'section',
  'budget-justification': 'section',
  'facilities': 'section',
  'equipment': 'section',
  'biosketch': 'section',
  'references': 'section',
  'cover-letter': 'section',
  'abstract': 'section',
  'other': 'section',
  'project-description': 'section',
  'data-management-plan': 'section',
};

const SECTION_TITLES: Record<string, string> = {
  'specific-aims': 'Specific Aims',
  'research-strategy': 'Research Strategy',
  'budget-justification': 'Budget Justification',
  'facilities': 'Facilities \\& Other Resources',
  'equipment': 'Equipment',
  'biosketch': 'Biographical Sketch',
  'references': 'References Cited',
  'cover-letter': 'Cover Letter',
  'abstract': 'Abstract',
  'project-description': 'Project Description',
  'data-management-plan': 'Data Management Plan',
  'other': 'Other',
};

// ---------------------------------------------------------------------------
// NIHFormatter
// ---------------------------------------------------------------------------

export class NIHFormatter {
  /**
   * Format grant sections into NIH-compliant LaTeX.
   *
   * NIH formatting rules:
   * - 11pt Arial (Helvetica in LaTeX)
   * - 0.5" margins on all sides
   * - Continuous or per-section page numbering
   */
  format(sections: GrantSection[], options: NIHFormatOptions): string {
    const lines: string[] = [];

    // Document class
    lines.push('\\documentclass[11pt,letterpaper]{article}');
    lines.push('');

    // Required packages
    lines.push('% NIH-compliant formatting');
    lines.push('\\usepackage[utf8]{inputenc}');
    lines.push('\\usepackage[T1]{fontenc}');

    // Font: Arial (Helvetica in LaTeX)
    const font = options.fontFamily ?? 'helvet';
    lines.push(`\\usepackage{${font}}`);
    lines.push('\\renewcommand{\\familydefault}{\\sfdefault}');
    lines.push('');

    // Margins: 0.5" on all sides
    lines.push('\\usepackage[margin=0.5in]{geometry}');
    lines.push('');

    // Additional packages
    lines.push('\\usepackage{amsmath}');
    lines.push('\\usepackage{amssymb}');
    lines.push('\\usepackage{graphicx}');
    lines.push('\\usepackage{hyperref}');
    lines.push('\\usepackage{setspace}');
    lines.push('\\usepackage{enumitem}');
    lines.push('');

    // Page numbering
    if (options.pageNumbering === 'continuous') {
      lines.push('\\pagestyle{plain}');
    } else {
      lines.push('\\usepackage{fancyhdr}');
      lines.push('\\pagestyle{fancy}');
      lines.push('\\fancyhf{}');
      lines.push('\\rfoot{\\thepage}');
    }
    lines.push('');

    // Grant type header
    lines.push(`% NIH ${options.grantType} Proposal`);
    lines.push('');

    // Begin document
    lines.push('\\begin{document}');
    lines.push('');

    // Render each section
    for (const section of sections) {
      const cmd = SECTION_COMMANDS[section.role] ?? 'section';
      const title = section.title ?? SECTION_TITLES[section.role] ?? section.role;

      lines.push(`\\${cmd}{${escapeLatex(title)}}`);
      lines.push('');
      lines.push(convertMarkdownToLatex(section.content));
      lines.push('');

      // Page break between major sections
      if (section.role === 'specific-aims' || section.role === 'research-strategy') {
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
 * Escape special LaTeX characters in text.
 */
function escapeLatex(text: string): string {
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

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
      // Detect start of list
      if (lines.length === 0 || !lines[lines.length - 1]!.includes('\\item')) {
        lines.push('\\begin{itemize}');
      }
      lines.push(`  \\item ${trimmed.slice(2)}`);
    } else {
      // Close itemize if previous was an item and this is not
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
