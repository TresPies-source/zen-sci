// servers/newsletter-mcp/src/manifest.ts
// ModuleManifest for the Newsletter MCP server

import type { ModuleManifest } from '@zen-sci/sdk';

export const newsletterManifest: ModuleManifest = {
  id: 'newsletter-mcp',
  name: 'Newsletter MCP',
  version: '0.3.0',
  description:
    'Converts markdown to email-safe HTML newsletters with responsive table-based layout, inline CSS, and CAN-SPAM compliance.',
  outputFormats: ['email'],
  inputFormats: ['markdown'],
  features: [
    'email-rendering',
    'responsive-layout',
    'inline-css',
    'footer-compliance',
  ],
  coreCapabilities: ['parser'],
  author: 'Cruz Morales / TresPiesDesign.com',
  license: 'Apache-2.0',
  phase: 3,
  status: 'beta',
};
