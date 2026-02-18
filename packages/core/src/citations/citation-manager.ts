// packages/core/src/citations/citation-manager.ts
// High-level citation manager that coordinates BibTeXParser and CSLRenderer.

import type {
  BibliographyStyle,
  CitationRecord,
  DocumentNode,
  DocumentTree,
  ValidationResult,
  ConversionErrorData,
  ConversionWarning,
} from '../types.js';

import { BibTeXParser } from './bibtex-parser.js';
import { CSLRenderer } from './csl-renderer.js';

// ---- public API -------------------------------------------------------------

/**
 * Coordinates BibTeX parsing and CSL rendering to provide a single entry-point
 * for working with citations within ZenSci documents.
 */
export class CitationManager {
  private readonly parser: BibTeXParser;
  private readonly renderer: CSLRenderer;
  private readonly records: CitationRecord[];
  private readonly recordsByKey: Map<string, CitationRecord>;

  /**
   * Create a new CitationManager.
   *
   * @param bibliography  Raw BibTeX content that serves as the citation
   *                      database for this manager instance.
   */
  constructor(bibliography: string) {
    this.parser = new BibTeXParser();
    this.renderer = new CSLRenderer();
    this.records = this.parser.parse(bibliography);
    this.recordsByKey = new Map(this.records.map((r) => [r.key, r]));
  }

  /**
   * Return all parsed citation records.
   */
  getAllRecords(): CitationRecord[] {
    return [...this.records];
  }

  /**
   * Resolve a single citation key to its record, or `null` if not found.
   */
  resolve(key: string): CitationRecord | null {
    return this.recordsByKey.get(key) ?? null;
  }

  /**
   * Resolve multiple citation keys at once.
   *
   * Keys that do not match any record are silently omitted from the result.
   */
  resolveMultiple(keys: string[]): CitationRecord[] {
    const results: CitationRecord[] = [];
    for (const key of keys) {
      const record = this.recordsByKey.get(key);
      if (record) {
        results.push(record);
      }
    }
    return results;
  }

  /**
   * Search records by a free-text query.
   *
   * The query is matched (case-insensitive) against:
   *  - title
   *  - each author name
   *  - year (as a string)
   */
  search(query: string): CitationRecord[] {
    const q = query.toLowerCase();
    return this.records.filter((record) => {
      if (record.title.toLowerCase().includes(q)) return true;
      if (record.author.some((a) => a.toLowerCase().includes(q))) return true;
      if (String(record.year).includes(q)) return true;
      return false;
    });
  }

  /**
   * Format a single inline citation for the given key.
   *
   * @param key    Citation key to format.
   * @param style  Target bibliography style (defaults to `'ieee'`).
   * @returns      The formatted inline citation string, or the raw key
   *               wrapped in brackets if the key cannot be resolved.
   */
  formatCitation(key: string, style: BibliographyStyle = 'ieee'): string {
    const record = this.recordsByKey.get(key);
    if (!record) {
      return `[${key}]`;
    }
    // For numbered styles, determine the index from insertion order
    const index = this.records.indexOf(record) + 1;
    return this.renderer.formatCitation(record, style, index);
  }

  /**
   * Format a bibliography.
   *
   * @param keys   Optional subset of keys to include.  When omitted all
   *               records are included.
   * @param style  Target bibliography style (defaults to `'ieee'`).
   */
  formatBibliography(
    keys?: string[],
    style: BibliographyStyle = 'ieee',
  ): string {
    const subset = keys ? this.resolveMultiple(keys) : this.records;
    return this.renderer.formatBibliography(subset, style);
  }

  /**
   * Walk a `DocumentTree` and extract all citation keys referenced in it.
   *
   * Looks for nodes with `type === 'citation'` anywhere in the tree.
   */
  extractKeysFromAST(tree: DocumentTree): string[] {
    const keys: string[] = [];
    const seen = new Set<string>();

    const walk = (nodes: DocumentNode[]): void => {
      for (const node of nodes) {
        if (node.type === 'citation') {
          if (!seen.has(node.key)) {
            seen.add(node.key);
            keys.push(node.key);
          }
        }

        // Recurse into children if the node has them
        if ('children' in node && Array.isArray(node.children)) {
          walk(node.children as DocumentNode[]);
        }

        // For ParagraphNode, also check inline children for CitationReferenceNode
        if (node.type === 'paragraph' && 'children' in node && Array.isArray(node.children)) {
          for (const inline of node.children) {
            if (
              inline !== null &&
              typeof inline === 'object' &&
              'type' in inline &&
              inline.type === 'citation-reference' &&
              'key' in inline
            ) {
              const refKey = inline.key as string;
              if (!seen.has(refKey)) {
                seen.add(refKey);
                keys.push(refKey);
              }
            }
          }
        }
      }
    };

    walk(tree.children);
    return keys;
  }

  /**
   * Validate that every citation key referenced in the AST resolves to a
   * record in the bibliography.
   */
  validateAST(tree: DocumentTree): ValidationResult {
    const errors: ConversionErrorData[] = [];
    const warnings: ConversionWarning[] = [];

    const referencedKeys = this.extractKeysFromAST(tree);

    for (const key of referencedKeys) {
      if (!this.recordsByKey.has(key)) {
        errors.push({
          code: 'CITATION_UNRESOLVED',
          message: `Citation key "${key}" referenced in document but not found in bibliography`,
          suggestions: [`Add an entry with key "${key}" to the bibliography`],
        });
      }
    }

    // Also warn about unused bibliography entries
    const referencedSet = new Set(referencedKeys);
    for (const record of this.records) {
      if (!referencedSet.has(record.key)) {
        warnings.push({
          code: 'CITATION_UNUSED',
          message: `Bibliography entry "${record.key}" is not cited in the document`,
          suggestion: `Consider citing "${record.key}" or removing it from the bibliography`,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      validatedAt: new Date().toISOString(),
    };
  }
}
