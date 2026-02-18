// servers/latex-mcp/src/manifest.ts
// ModuleManifest for the LaTeX MCP server

import type { ModuleManifest } from '@zen-sci/sdk';

export const latexManifest: ModuleManifest = {
  id: 'latex-mcp',
  name: 'LaTeX MCP',
  version: '0.1.0',
  description:
    'Converts markdown to publication-ready LaTeX and PDF, with math validation, citation resolution, and cross-references.',
  outputFormats: [
    'latex',
    'paper-ieee',
    'paper-acm',
    'paper-arxiv',
    'thesis',
    'patent',
  ],
  inputFormats: ['markdown'],
  features: [
    'math-validation',
    'citation-resolution',
    'cross-references',
    'toc-generation',
    'pdf-compilation',
  ],
  coreCapabilities: ['parser', 'citations', 'validation', 'math'],
  author: 'Cruz Morales / TresPiesDesign.com',
  license: 'Apache-2.0',
  phase: 1,
  status: 'beta',
};
