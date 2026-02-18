import { describe, it, expect } from 'vitest';
import { generateFeed } from '../../src/rendering/rss-generator.js';
import type { PostMetadata, FeedOptions } from '../../src/rendering/rss-generator.js';

const SAMPLE_POSTS: PostMetadata[] = [
  {
    title: 'First Post',
    url: 'https://example.com/blog/first',
    date: '2026-01-10',
    author: 'Alice',
    summary: 'This is the first post.',
    tags: ['intro', 'blog'],
  },
  {
    title: 'Second Post',
    url: 'https://example.com/blog/second',
    date: '2026-01-20',
    author: 'Bob',
    summary: 'This is the second post.',
  },
];

const SAMPLE_OPTIONS: FeedOptions = {
  feedTitle: 'Test Blog Feed',
  feedUrl: 'https://example.com/feed.xml',
  siteUrl: 'https://example.com',
  description: 'A test blog feed',
  author: 'Test Author',
};

// =============================================================================
// generateFeed
// =============================================================================

describe('generateFeed', () => {
  it('produces valid Atom XML', () => {
    const xml = generateFeed(SAMPLE_POSTS, SAMPLE_OPTIONS);
    expect(xml).toContain('<?xml version="1.0" encoding="utf-8"?>');
    expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
    expect(xml).toContain('</feed>');
  });

  it('includes feed title', () => {
    const xml = generateFeed(SAMPLE_POSTS, SAMPLE_OPTIONS);
    expect(xml).toContain('<title>Test Blog Feed</title>');
  });

  it('includes self link', () => {
    const xml = generateFeed(SAMPLE_POSTS, SAMPLE_OPTIONS);
    expect(xml).toContain('href="https://example.com/feed.xml"');
    expect(xml).toContain('rel="self"');
  });

  it('includes alternate link', () => {
    const xml = generateFeed(SAMPLE_POSTS, SAMPLE_OPTIONS);
    expect(xml).toContain('href="https://example.com"');
    expect(xml).toContain('rel="alternate"');
  });

  it('includes feed description as subtitle', () => {
    const xml = generateFeed(SAMPLE_POSTS, SAMPLE_OPTIONS);
    expect(xml).toContain('<subtitle>A test blog feed</subtitle>');
  });

  it('includes feed author', () => {
    const xml = generateFeed(SAMPLE_POSTS, SAMPLE_OPTIONS);
    expect(xml).toContain('<name>Test Author</name>');
  });

  it('includes generator', () => {
    const xml = generateFeed(SAMPLE_POSTS, SAMPLE_OPTIONS);
    expect(xml).toContain('<generator>ZenSci Blog MCP v0.2.0</generator>');
  });

  it('includes entries for each post', () => {
    const xml = generateFeed(SAMPLE_POSTS, SAMPLE_OPTIONS);
    expect(xml).toContain('<entry>');
    expect(xml).toContain('<title>First Post</title>');
    expect(xml).toContain('<title>Second Post</title>');
  });

  it('includes entry links', () => {
    const xml = generateFeed(SAMPLE_POSTS, SAMPLE_OPTIONS);
    expect(xml).toContain('href="https://example.com/blog/first"');
    expect(xml).toContain('href="https://example.com/blog/second"');
  });

  it('includes entry authors', () => {
    const xml = generateFeed(SAMPLE_POSTS, SAMPLE_OPTIONS);
    expect(xml).toContain('<name>Alice</name>');
    expect(xml).toContain('<name>Bob</name>');
  });

  it('includes entry summaries', () => {
    const xml = generateFeed(SAMPLE_POSTS, SAMPLE_OPTIONS);
    expect(xml).toContain('<summary type="text">This is the first post.</summary>');
    expect(xml).toContain('<summary type="text">This is the second post.</summary>');
  });

  it('includes category tags', () => {
    const xml = generateFeed(SAMPLE_POSTS, SAMPLE_OPTIONS);
    expect(xml).toContain('<category term="intro" />');
    expect(xml).toContain('<category term="blog" />');
  });

  it('includes published and updated dates', () => {
    const xml = generateFeed(SAMPLE_POSTS, SAMPLE_OPTIONS);
    expect(xml).toContain('<published>');
    expect(xml).toContain('<updated>');
  });

  it('handles empty posts array', () => {
    const xml = generateFeed([], SAMPLE_OPTIONS);
    expect(xml).toContain('<feed');
    expect(xml).toContain('</feed>');
    expect(xml).not.toContain('<entry>');
  });

  it('escapes XML special characters', () => {
    const posts: PostMetadata[] = [
      {
        title: 'Post with <special> & "chars"',
        url: 'https://example.com/blog/special',
        date: '2026-01-15',
      },
    ];
    const xml = generateFeed(posts, SAMPLE_OPTIONS);
    expect(xml).toContain('&lt;special&gt;');
    expect(xml).toContain('&amp;');
    expect(xml).toContain('&quot;chars&quot;');
  });

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  it('throws on empty feedTitle', () => {
    const opts: FeedOptions = { ...SAMPLE_OPTIONS, feedTitle: '' };
    expect(() => generateFeed([], opts)).toThrow('feedTitle');
  });

  it('throws on empty feedUrl', () => {
    const opts: FeedOptions = { ...SAMPLE_OPTIONS, feedUrl: '' };
    expect(() => generateFeed([], opts)).toThrow('feedUrl');
  });

  it('throws on empty siteUrl', () => {
    const opts: FeedOptions = { ...SAMPLE_OPTIONS, siteUrl: '' };
    expect(() => generateFeed([], opts)).toThrow('siteUrl');
  });

  it('throws on invalid post date', () => {
    const posts: PostMetadata[] = [
      { title: 'Bad Date', url: 'https://example.com', date: 'not-a-date' },
    ];
    expect(() => generateFeed(posts, SAMPLE_OPTIONS)).toThrow('Invalid date');
  });
});
