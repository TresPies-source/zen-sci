// servers/blog-mcp/src/tools/generate-feed.ts
// Handler for the generate_feed MCP tool

import type { ZenSciContext } from '@zen-sci/sdk';
import { generateFeed } from '../rendering/rss-generator.js';
import type { PostMetadata, FeedOptions } from '../rendering/rss-generator.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GenerateFeedArgs {
  posts: PostMetadata[];
  feedTitle: string;
  feedUrl: string;
  siteUrl: string;
  description?: string;
}

export interface GenerateFeedResult {
  feed_xml: string;
  post_count: number;
  generated_at: string;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function generateFeedTool(
  args: GenerateFeedArgs,
  ctx: ZenSciContext,
): Promise<GenerateFeedResult> {
  const { logger } = ctx;
  logger.info('Generating RSS/Atom feed', { postCount: args.posts.length });

  const feedOptions: FeedOptions = {
    feedTitle: args.feedTitle,
    feedUrl: args.feedUrl,
    siteUrl: args.siteUrl,
  };
  if (args.description !== undefined) {
    feedOptions.description = args.description;
  }

  const feedXml = generateFeed(args.posts, feedOptions);

  return {
    feed_xml: feedXml,
    post_count: args.posts.length,
    generated_at: new Date().toISOString(),
  };
}
