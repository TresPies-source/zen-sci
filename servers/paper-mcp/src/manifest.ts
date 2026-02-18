// servers/paper-mcp/src/manifest.ts
// ModuleManifest for the Paper MCP server

import type { ModuleManifest } from '@zen-sci/sdk';

export const paperManifest: ModuleManifest = {
  id: 'paper-mcp',
  name: 'Paper MCP',
  version: '0.1.0',
  description:
    'Generates publication-ready LaTeX for IEEE, ACM, and arXiv paper formats from markdown source.',
  outputFormats: ['paper-ieee', 'paper-acm', 'paper-arxiv'],
  inputFormats: ['markdown'],
  features: [
    'ieee-formatting',
    'acm-formatting',
    'arxiv-formatting',
    'two-column-layout',
    'citation-management',
  ],
  coreCapabilities: ['parser', 'citations', 'validation', 'math'],
  author: 'Cruz Morales / TresPiesDesign.com',
  license: 'Apache-2.0',
  phase: 3,
  status: 'beta',
};
