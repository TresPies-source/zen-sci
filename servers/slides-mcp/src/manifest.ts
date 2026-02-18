// servers/slides-mcp/src/manifest.ts
// ModuleManifest for the Slides MCP server

import type { ModuleManifest } from '@zen-sci/sdk';

export const slidesManifest: ModuleManifest = {
  id: 'slides-mcp',
  name: 'Slides MCP',
  version: '0.3.0',
  description:
    'Converts markdown to Beamer LaTeX and Reveal.js presentations with speaker notes, math rendering, and multiple layout support.',
  outputFormats: ['beamer', 'revealjs'],
  inputFormats: ['markdown'],
  features: [
    'slide-parsing',
    'beamer-rendering',
    'revealjs-rendering',
    'speaker-notes',
    'math-rendering',
  ],
  coreCapabilities: ['parser', 'math'],
  author: 'Cruz Morales / TresPiesDesign.com',
  license: 'Apache-2.0',
  phase: 3,
  status: 'beta',
};
