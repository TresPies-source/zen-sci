// servers/slides-mcp/src/tools/convert-to-slides.ts
// Handler for the convert_to_slides MCP tool

import type { ZenSciContext } from '@zen-sci/sdk';
import { SlideParser } from '../rendering/slide-parser.js';
import { BeamerRenderer } from '../rendering/beamer-renderer.js';
import type { BeamerOptions } from '../rendering/beamer-renderer.js';
import { RevealJsRenderer } from '../rendering/revealjs-renderer.js';
import type { RevealJsOptions } from '../rendering/revealjs-renderer.js';

export interface ConvertToSlidesArgs {
  source: string;
  title?: string;
  author?: string;
  format: 'beamer' | 'revealjs' | 'both';
  options?: BeamerOptions | RevealJsOptions;
}

export interface ConvertToSlidesResult {
  output: string;
  format: 'beamer' | 'revealjs' | 'both';
  slide_count: number;
  has_notes: boolean;
  warnings: string[];
  beamer_output?: string;
  revealjs_output?: string;
  elapsed_ms: number;
}

export async function convertToSlides(
  args: ConvertToSlidesArgs,
  ctx: ZenSciContext,
): Promise<ConvertToSlidesResult> {
  const startTime = Date.now();
  const { logger } = ctx;
  logger.info('Converting markdown to slides', { format: args.format });

  const warnings: string[] = [];

  // Parse the slide deck
  const parser = new SlideParser();
  const deck = parser.parse(args.source);

  // Override deck title if provided
  if (args.title !== undefined) {
    deck.title = args.title;
  }

  // Check for empty deck
  if (deck.slides.length === 0) {
    warnings.push('No slides found in the source document. Check that slides are separated by --- horizontal rules.');
  }

  // Check for speaker notes
  const hasNotes = deck.slides.some((s) => s.notes !== undefined);

  // Route to the appropriate renderer
  let output: string;
  const result: ConvertToSlidesResult = {
    output: '',
    format: args.format,
    slide_count: deck.slides.length,
    has_notes: hasNotes,
    warnings,
    elapsed_ms: 0,
  };

  if (args.format === 'beamer') {
    const renderer = new BeamerRenderer();
    const beamerOpts = (args.options ?? {}) as BeamerOptions;
    output = renderer.render(deck, beamerOpts);
    result.output = output;
  } else if (args.format === 'revealjs') {
    const renderer = new RevealJsRenderer();
    const revealOpts = (args.options ?? {}) as RevealJsOptions;
    output = renderer.render(deck, revealOpts);
    result.output = output;
  } else {
    // 'both': render in both formats
    const beamerRenderer = new BeamerRenderer();
    const revealRenderer = new RevealJsRenderer();
    const beamerOpts = (args.options ?? {}) as BeamerOptions;
    const revealOpts = (args.options ?? {}) as RevealJsOptions;
    const beamerOut = beamerRenderer.render(deck, beamerOpts);
    const revealOut = revealRenderer.render(deck, revealOpts);
    result.beamer_output = beamerOut;
    result.revealjs_output = revealOut;
    result.output = beamerOut; // primary output is beamer for 'both'
  }

  result.elapsed_ms = Date.now() - startTime;
  return result;
}
