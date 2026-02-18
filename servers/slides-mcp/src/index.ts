// servers/slides-mcp/src/index.ts
// MCP server entry point for Slides MCP

import { z } from 'zod';
import { createZenSciServer } from '@zen-sci/sdk';
import { slidesManifest } from './manifest.js';
import { convertToSlides } from './tools/convert-to-slides.js';
import type { ConvertToSlidesArgs } from './tools/convert-to-slides.js';
import { validateDeck } from './tools/validate-deck.js';
import type { ValidateDeckArgs } from './tools/validate-deck.js';
import { listSlideThemes } from './tools/list-slide-themes.js';
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from '@modelcontextprotocol/ext-apps/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ctx = createZenSciServer({
  name: 'slides-mcp',
  version: '0.3.0',
  manifest: slidesManifest,
});

const { server } = ctx;

// ---------------------------------------------------------------------------
// convert_to_slides
// ---------------------------------------------------------------------------

registerAppTool(
  server,
  'convert_to_slides',
  {
    description: 'Convert markdown to Beamer LaTeX or Reveal.js presentation slides',
    inputSchema: {
      source: z.string().describe('Markdown source content with slides separated by ---'),
      title: z.string().optional().describe('Presentation title (overrides detected title)'),
      author: z.string().optional().describe('Presentation author'),
      format: z
        .enum(['beamer', 'revealjs', 'both'])
        .describe('Output format: beamer for LaTeX/PDF, revealjs for HTML, or both'),
      options: z
        .object({
          theme: z.string().optional().describe('Presentation theme'),
          colorTheme: z.string().optional().describe('Beamer color theme'),
          aspectRatio: z
            .enum(['169', '43', '1610'])
            .optional()
            .describe('Slide aspect ratio (Beamer)'),
          showNotes: z.boolean().optional().describe('Show speaker notes (Beamer)'),
          fontTheme: z.string().optional().describe('Beamer font theme'),
          transition: z.string().optional().describe('Slide transition (Reveal.js)'),
          controls: z.boolean().optional().describe('Show controls (Reveal.js)'),
          progress: z.boolean().optional().describe('Show progress bar (Reveal.js)'),
          katexEnabled: z.boolean().optional().describe('Enable KaTeX math rendering (Reveal.js)'),
        })
        .optional()
        .describe('Renderer-specific options'),
    },
    _meta: {
      ui: { resourceUri: 'ui://slides-mcp/preview.html' },
    },
  },
  async (rawArgs) => {
    // Strip undefined values from Zod output to satisfy exactOptionalPropertyTypes
    const args: ConvertToSlidesArgs = {
      source: rawArgs.source,
      format: rawArgs.format,
    };
    if (rawArgs.title !== undefined) args.title = rawArgs.title;
    if (rawArgs.author !== undefined) args.author = rawArgs.author;
    if (rawArgs.options !== undefined) {
      const opts: Record<string, unknown> = {};
      if (rawArgs.options.theme !== undefined) opts['theme'] = rawArgs.options.theme;
      if (rawArgs.options.colorTheme !== undefined) opts['colorTheme'] = rawArgs.options.colorTheme;
      if (rawArgs.options.aspectRatio !== undefined) opts['aspectRatio'] = rawArgs.options.aspectRatio;
      if (rawArgs.options.showNotes !== undefined) opts['showNotes'] = rawArgs.options.showNotes;
      if (rawArgs.options.fontTheme !== undefined) opts['fontTheme'] = rawArgs.options.fontTheme;
      if (rawArgs.options.transition !== undefined) opts['transition'] = rawArgs.options.transition;
      if (rawArgs.options.controls !== undefined) opts['controls'] = rawArgs.options.controls;
      if (rawArgs.options.progress !== undefined) opts['progress'] = rawArgs.options.progress;
      if (rawArgs.options.katexEnabled !== undefined) opts['katexEnabled'] = rawArgs.options.katexEnabled;
      args.options = opts;
    }

    const result = await convertToSlides(args, ctx);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// ---------------------------------------------------------------------------
// validate_deck
// ---------------------------------------------------------------------------

server.tool(
  'validate_deck',
  'Validate a markdown slide deck for correct structure and content',
  {
    source: z.string().describe('Markdown source content with slides separated by ---'),
  },
  async (rawArgs) => {
    const args: ValidateDeckArgs = { source: rawArgs.source };

    const result = await validateDeck(args, ctx);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// ---------------------------------------------------------------------------
// list_slide_themes
// ---------------------------------------------------------------------------

server.tool(
  'list_slide_themes',
  'List available slide themes for Beamer and Reveal.js formats',
  {
    format: z
      .enum(['beamer', 'revealjs', 'all'])
      .optional()
      .describe('Filter themes by format (default: all)'),
  },
  async (rawArgs) => {
    const result = await listSlideThemes(rawArgs.format ?? 'all');
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// ---------------------------------------------------------------------------
// App Resource: Slides Preview UI
// ---------------------------------------------------------------------------

const APP_DIST_PATH = path.resolve(__dirname, '../../app-dist/index.html');

registerAppResource(
  server,
  'Slides Preview',
  'ui://slides-mcp/preview.html',
  { description: 'Interactive slide deck preview' },
  async () => ({
    contents: [{
      uri: 'ui://slides-mcp/preview.html',
      mimeType: RESOURCE_MIME_TYPE,
      text: await fs.readFile(APP_DIST_PATH, 'utf-8'),
    }],
  }),
);
