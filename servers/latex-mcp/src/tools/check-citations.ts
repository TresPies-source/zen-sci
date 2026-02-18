// servers/latex-mcp/src/tools/check-citations.ts
// Handler for the check_citations MCP tool

import {
  MarkdownParser,
  CitationManager,
  BibTeXParser,
} from '@zen-sci/core';
import type { CitationRecord } from '@zen-sci/core';
import type { ZenSciContext } from '@zen-sci/sdk';

export interface CheckCitationsArgs {
  source: string;
  bibliography: string;
}

export interface CheckCitationsResult {
  resolved: CitationRecord[];
  unresolved: string[];
  bibliography_entries: number;
  elapsed_ms: number;
}

export async function checkCitations(
  args: CheckCitationsArgs,
  ctx: ZenSciContext,
): Promise<CheckCitationsResult> {
  const startTime = Date.now();
  const { logger } = ctx;
  logger.info('Checking citations');

  // Parse markdown to extract citation keys
  const parser = new MarkdownParser();
  const tree = parser.parse(args.source);

  // Parse bibliography
  const bibParser = new BibTeXParser();
  const bibEntries = bibParser.parse(args.bibliography);

  // Resolve citations
  const citationManager = new CitationManager(args.bibliography);
  const keys = citationManager.extractKeysFromAST(tree);

  const resolved: CitationRecord[] = [];
  const unresolved: string[] = [];

  for (const key of keys) {
    const record = citationManager.resolve(key);
    if (record) {
      resolved.push(record);
    } else {
      unresolved.push(key);
    }
  }

  return {
    resolved,
    unresolved,
    bibliography_entries: bibEntries.length,
    elapsed_ms: Date.now() - startTime,
  };
}
