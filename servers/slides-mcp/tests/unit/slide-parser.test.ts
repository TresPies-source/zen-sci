import { describe, it, expect } from 'vitest';
import { SlideParser } from '../../src/rendering/slide-parser.js';

describe('SlideParser', () => {
  const parser = new SlideParser();

  it('splits a 3-slide deck into 3 slides', () => {
    const source = `# Slide One

Content one

---

## Slide Two

Content two

---

## Slide Three

Content three`;

    const deck = parser.parse(source);
    expect(deck.slides).toHaveLength(3);
  });

  it('extracts speaker notes from > Note: blockquotes', () => {
    const source = `## My Slide

Some content here.

> Note: This is a speaker note

More content.`;

    const deck = parser.parse(source);
    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0]!.notes).toBe('This is a speaker note');
    // Notes should be removed from content
    expect(deck.slides[0]!.content).not.toContain('> Note:');
  });

  it('detects two-column layout from HTML comment', () => {
    const source = `## Two Column Slide

<!-- layout: two-column -->

Left side | Right side`;

    const deck = parser.parse(source);
    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0]!.layout).toBe('two-column');
  });

  it('extracts deck title from first slide heading', () => {
    const source = `# My Presentation

Author line

---

## Second Slide

Content`;

    const deck = parser.parse(source);
    expect(deck.title).toBe('My Presentation');
  });

  it('returns 0 slides for empty input', () => {
    const deck = parser.parse('');
    expect(deck.slides).toHaveLength(0);
  });

  it('handles frontmatter block and extracts title', () => {
    const source = `---
title: Frontmatter Title
author: Alice
---

# Visible Title

Content

---

## Slide Two

More content`;

    const deck = parser.parse(source);
    // Frontmatter title takes precedence
    expect(deck.title).toBe('Frontmatter Title');
    // Frontmatter is not a slide
    expect(deck.slides).toHaveLength(2);
  });

  it('detects title layout for slides starting with # heading', () => {
    const source = `# Title Slide

By Author`;

    const deck = parser.parse(source);
    expect(deck.slides[0]!.layout).toBe('title');
  });

  it('assigns sequential indices to slides', () => {
    const source = `## A

---

## B

---

## C`;

    const deck = parser.parse(source);
    expect(deck.slides[0]!.index).toBe(0);
    expect(deck.slides[1]!.index).toBe(1);
    expect(deck.slides[2]!.index).toBe(2);
  });

  it('handles multi-line speaker notes', () => {
    const source = `## Slide

Content

> Note: First line of notes
> continuation of notes`;

    const deck = parser.parse(source);
    expect(deck.slides[0]!.notes).toBe('First line of notes continuation of notes');
  });
});
