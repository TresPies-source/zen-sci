// servers/slides-mcp/src/tools/validate-deck.ts
// Handler for the validate_deck MCP tool

import type { ZenSciContext } from '@zen-sci/sdk';
import { SlideParser } from '../rendering/slide-parser.js';

export interface ValidateDeckArgs {
  source: string;
}

export interface ValidateDeckResult {
  valid: boolean;
  slide_count: number;
  warnings: string[];
  errors: string[];
  elapsed_ms: number;
}

export async function validateDeck(
  args: ValidateDeckArgs,
  ctx: ZenSciContext,
): Promise<ValidateDeckResult> {
  const startTime = Date.now();
  const { logger } = ctx;
  logger.info('Validating slide deck');

  const warnings: string[] = [];
  const errors: string[] = [];

  // Parse the slide deck
  const parser = new SlideParser();
  const deck = parser.parse(args.source);

  // Validate slide count
  if (deck.slides.length === 0) {
    errors.push('Deck contains no slides. Ensure slides are separated by --- horizontal rules.');
  }

  // Check for empty slides
  for (const slide of deck.slides) {
    if (slide.content.trim().length === 0 && slide.layout !== 'title') {
      warnings.push(`Slide ${slide.index} has no content.`);
    }
  }

  // Check for missing deck title
  if (deck.title.length === 0) {
    warnings.push('Deck has no title. Add a # heading to the first slide or use frontmatter.');
  }

  // Check for slides without titles
  const untitledSlides = deck.slides.filter((s) => s.title === undefined);
  if (untitledSlides.length > 0) {
    warnings.push(
      `${untitledSlides.length} slide(s) have no title heading.`,
    );
  }

  const valid = errors.length === 0;

  return {
    valid,
    slide_count: deck.slides.length,
    warnings,
    errors,
    elapsed_ms: Date.now() - startTime,
  };
}
