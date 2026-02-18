// servers/grant-mcp/src/manifest.ts
// ModuleManifest for the Grant MCP server

import type { ModuleManifest } from '@zen-sci/sdk';

export const grantManifest: ModuleManifest = {
  id: 'grant-mcp',
  name: 'Grant MCP',
  version: '0.4.0',
  description:
    'Generates academic grant proposals in LaTeX and Word with NIH, NSF, and ERC formatting, compliance validation, and submission packaging.',
  outputFormats: ['grant-latex', 'docx'],
  inputFormats: ['markdown'],
  features: [
    'nih-formatting',
    'nsf-formatting',
    'erc-formatting',
    'compliance-validation',
    'submission-packaging',
  ],
  coreCapabilities: ['parser', 'citations', 'validation'],
  author: 'Cruz Morales / TresPiesDesign.com',
  license: 'Apache-2.0',
  phase: 2,
  status: 'beta',
};
