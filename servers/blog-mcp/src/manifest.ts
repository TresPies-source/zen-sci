// servers/blog-mcp/src/manifest.ts
// ModuleManifest for the Blog MCP server

import type { ModuleManifest } from '@zen-sci/sdk';

export const blogManifest: ModuleManifest = {
  id: 'blog-mcp',
  name: 'Blog MCP',
  version: '0.2.0',
  description:
    'Converts markdown to responsive HTML blog posts with SEO metadata, RSS feed generation, syntax highlighting, and accessibility validation.',
  outputFormats: ['html', 'email'],
  inputFormats: ['markdown'],
  features: [
    'seo-metadata',
    'rss-feed',
    'syntax-highlighting',
    'math-rendering',
    'accessibility-validation',
  ],
  coreCapabilities: ['parser', 'citations', 'validation', 'math'],
  author: 'Cruz Morales / TresPiesDesign.com',
  license: 'Apache-2.0',
  phase: 2,
  status: 'beta',
};
