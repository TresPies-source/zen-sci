// servers/blog-mcp/src/index.ts
// MCP server entry point for Blog MCP

import { z } from 'zod';
import { createZenSciServer } from '@zen-sci/sdk';
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from '@modelcontextprotocol/ext-apps/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blogManifest } from './manifest.js';
import { convertToHtml } from './tools/convert-to-html.js';
import type { ConvertToHtmlArgs } from './tools/convert-to-html.js';
import { generateFeedTool } from './tools/generate-feed.js';
import type { GenerateFeedArgs } from './tools/generate-feed.js';
import { validatePost } from './tools/validate-post.js';
import type { ValidatePostArgs } from './tools/validate-post.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ctx = createZenSciServer({
  name: 'blog-mcp',
  version: '0.2.0',
  manifest: blogManifest,
});

const { server } = ctx;

// ---------------------------------------------------------------------------
// convert_to_html (with MCP App UI)
// ---------------------------------------------------------------------------

const RESOURCE_URI = 'ui://blog-mcp/preview.html';

registerAppTool(
  server,
  'convert_to_html',
  {
    description: 'Convert markdown to a responsive HTML blog post with SEO metadata',
    inputSchema: {
      source: z.string().describe('Markdown source content'),
      title: z.string().optional().describe('Blog post title (overrides frontmatter)'),
      author: z.string().optional().describe('Blog post author (overrides frontmatter)'),
      bibliography: z.string().optional().describe('BibTeX bibliography content'),
      options: z
        .object({
          toc: z.boolean().optional().describe('Generate table of contents'),
          theme: z
            .enum(['light', 'dark', 'system'])
            .optional()
            .describe('CSS theme'),
          selfContained: z
            .boolean()
            .optional()
            .describe('Produce a self-contained HTML file'),
          seoSiteUrl: z.string().optional().describe('Site URL for SEO metadata'),
          seoSiteName: z
            .string()
            .optional()
            .describe('Site name for SEO metadata'),
          twitterHandle: z
            .string()
            .optional()
            .describe('Twitter handle for card metadata'),
        })
        .optional()
        .describe('Conversion options'),
    },
    _meta: {
      ui: {
        resourceUri: RESOURCE_URI,
      },
    },
  },
  async (rawArgs) => {
    // Strip undefined values from Zod output to satisfy exactOptionalPropertyTypes
    const args: ConvertToHtmlArgs = { source: rawArgs.source };
    if (rawArgs.title !== undefined) args.title = rawArgs.title;
    if (rawArgs.author !== undefined) args.author = rawArgs.author;
    if (rawArgs.bibliography !== undefined) args.bibliography = rawArgs.bibliography;
    if (rawArgs.options !== undefined) {
      const opts: NonNullable<ConvertToHtmlArgs['options']> = {};
      if (rawArgs.options.toc !== undefined) opts.toc = rawArgs.options.toc;
      if (rawArgs.options.theme !== undefined) opts.theme = rawArgs.options.theme;
      if (rawArgs.options.selfContained !== undefined)
        opts.selfContained = rawArgs.options.selfContained;
      if (rawArgs.options.seoSiteUrl !== undefined)
        opts.seoSiteUrl = rawArgs.options.seoSiteUrl;
      if (rawArgs.options.seoSiteName !== undefined)
        opts.seoSiteName = rawArgs.options.seoSiteName;
      if (rawArgs.options.twitterHandle !== undefined)
        opts.twitterHandle = rawArgs.options.twitterHandle;
      args.options = opts;
    }

    const result = await convertToHtml(args, ctx);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// ---------------------------------------------------------------------------
// generate_feed
// ---------------------------------------------------------------------------

const PostMetadataSchema = z.object({
  title: z.string().describe('Post title'),
  url: z.string().describe('Post URL'),
  date: z.string().describe('Publication date (ISO 8601)'),
  author: z.string().optional().describe('Post author'),
  summary: z.string().optional().describe('Post summary'),
  content: z.string().optional().describe('Post HTML content'),
  tags: z.array(z.string()).optional().describe('Post tags'),
});

server.tool(
  'generate_feed',
  'Generate an Atom 1.0 RSS feed from a list of blog post metadata',
  {
    posts: z.array(PostMetadataSchema).describe('List of post metadata'),
    feedTitle: z.string().describe('Feed title'),
    feedUrl: z.string().describe('Feed URL (self link)'),
    siteUrl: z.string().describe('Site URL'),
    description: z.string().optional().describe('Feed description'),
  },
  async (rawArgs) => {
    const args: GenerateFeedArgs = {
      posts: rawArgs.posts.map((p) => {
        const post: GenerateFeedArgs['posts'][number] = {
          title: p.title,
          url: p.url,
          date: p.date,
        };
        if (p.author !== undefined) post.author = p.author;
        if (p.summary !== undefined) post.summary = p.summary;
        if (p.content !== undefined) post.content = p.content;
        if (p.tags !== undefined) post.tags = p.tags;
        return post;
      }),
      feedTitle: rawArgs.feedTitle,
      feedUrl: rawArgs.feedUrl,
      siteUrl: rawArgs.siteUrl,
    };
    if (rawArgs.description !== undefined) args.description = rawArgs.description;

    const result = await generateFeedTool(args, ctx);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// ---------------------------------------------------------------------------
// validate_post
// ---------------------------------------------------------------------------

server.tool(
  'validate_post',
  'Validate a markdown blog post for structure, accessibility, math, and citations',
  {
    source: z.string().describe('Markdown source content'),
    bibliography: z.string().optional().describe('BibTeX bibliography content'),
  },
  async (rawArgs) => {
    const args: ValidatePostArgs = { source: rawArgs.source };
    if (rawArgs.bibliography !== undefined) args.bibliography = rawArgs.bibliography;

    const result = await validatePost(args, ctx);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// ---------------------------------------------------------------------------
// MCP App Resource: Blog Preview UI
// ---------------------------------------------------------------------------

// Resolve app-dist path for both unbundled (dist/src/) and bundled (dist/) layouts.
const APP_DIST_PATH = __filename.includes('bundle')
  ? path.resolve(__dirname, '../app-dist/index.html')
  : path.resolve(__dirname, '../../app-dist/index.html');

registerAppResource(
  server,
  'Blog Preview',
  RESOURCE_URI,
  {
    description: 'Interactive blog post preview with SEO analysis',
  },
  async () => ({
    contents: [{
      uri: RESOURCE_URI,
      mimeType: RESOURCE_MIME_TYPE,
      text: await fs.readFile(APP_DIST_PATH, 'utf-8'),
    }],
  }),
);

// Start the MCP server — connects stdio transport and begins processing requests.
ctx.start();
