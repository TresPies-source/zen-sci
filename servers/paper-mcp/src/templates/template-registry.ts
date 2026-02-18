// servers/paper-mcp/src/templates/template-registry.ts
// TemplateRegistry: maps paper formats to LaTeX document class + preamble config

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// PaperTemplate interface
// ---------------------------------------------------------------------------

export interface PaperTemplate {
  documentClass: string;
  classOptions: string[];
  preambleLines: string[];
  pandocArgs: string[];
  columnsMode: 'one' | 'two';
}

// ---------------------------------------------------------------------------
// PaperFormat type
// ---------------------------------------------------------------------------

export type PaperFormat = 'paper-ieee' | 'paper-acm' | 'paper-arxiv';

// ---------------------------------------------------------------------------
// Template directory resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the path to a preamble.tex file for a given format.
 * Templates are stored at `../../templates/{format}/preamble.tex` relative to
 * the dist output of this file.
 */
function resolvePreamblePath(format: PaperFormat): string {
  // Template directories use short names: ieee, acm, arxiv (without the 'paper-' prefix)
  const dirName = format.replace(/^paper-/, '');
  return join(__dirname, '../../templates', dirName, 'preamble.tex');
}

/**
 * Read preamble lines from the template file for the given format.
 * Falls back to built-in defaults if the file cannot be read.
 */
function readPreambleLines(format: PaperFormat): string[] {
  try {
    const content = readFileSync(resolvePreamblePath(format), 'utf-8');
    return content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  } catch {
    // Fall back to built-in defaults
    return getDefaultPreambleLines(format);
  }
}

function getDefaultPreambleLines(format: PaperFormat): string[] {
  switch (format) {
    case 'paper-ieee':
      return [
        '\\usepackage{cite}',
        '\\usepackage{amsmath,amssymb,amsfonts}',
        '\\usepackage{algorithmic}',
        '\\usepackage{graphicx}',
        '\\usepackage{textcomp}',
        '\\usepackage{xcolor}',
        '\\usepackage{hyperref}',
      ];
    case 'paper-acm':
      return [
        '\\usepackage{booktabs}',
        '\\usepackage{microtype}',
        '\\usepackage{graphicx}',
        '\\usepackage{hyperref}',
        '\\usepackage{amsmath}',
      ];
    case 'paper-arxiv':
      return [
        '\\usepackage[margin=1in]{geometry}',
        '\\usepackage{amsmath,amssymb}',
        '\\usepackage{graphicx}',
        '\\usepackage{hyperref}',
        '\\usepackage{natbib}',
        '\\usepackage{microtype}',
      ];
  }
}

// ---------------------------------------------------------------------------
// TemplateRegistry
// ---------------------------------------------------------------------------

export class TemplateRegistry {
  /**
   * Get the PaperTemplate for a given paper format.
   */
  getTemplate(format: PaperFormat): PaperTemplate {
    switch (format) {
      case 'paper-ieee':
        return {
          documentClass: 'IEEEtran',
          classOptions: ['conference'],
          preambleLines: readPreambleLines('paper-ieee'),
          pandocArgs: [
            '--variable=documentclass:IEEEtran',
            '--variable=classoption:conference',
          ],
          columnsMode: 'two',
        };
      case 'paper-acm':
        return {
          documentClass: 'acmart',
          classOptions: ['sigconf'],
          preambleLines: readPreambleLines('paper-acm'),
          pandocArgs: [
            '--variable=documentclass:acmart',
            '--variable=classoption:sigconf',
          ],
          columnsMode: 'two',
        };
      case 'paper-arxiv':
        return {
          documentClass: 'article',
          classOptions: ['a4paper'],
          preambleLines: readPreambleLines('paper-arxiv'),
          pandocArgs: [
            '--variable=documentclass:article',
            '--variable=classoption:a4paper',
          ],
          columnsMode: 'one',
        };
    }
  }
}
