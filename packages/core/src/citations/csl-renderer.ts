// packages/core/src/citations/csl-renderer.ts
// Citation Style Language renderer for ZenSci — IEEE & APA built-in.

import type { CitationRecord, BibliographyStyle } from '../types.js';

// ---- author-formatting helpers ----------------------------------------------

/**
 * Extract the *last name* from a single author string.
 *
 * Handles two conventions:
 *   "Last, First"  ->  "Last"
 *   "First Last"   ->  "Last"
 */
function lastName(author: string): string {
  const trimmed = author.trim();
  if (trimmed.includes(',')) {
    return (trimmed.split(',')[0] ?? '').trim();
  }
  const parts = trimmed.split(/\s+/);
  return parts[parts.length - 1] ?? '';
}

/**
 * Extract the first-name initial(s) from a single author string.
 *
 * "Last, First Middle" -> "F. M."
 * "First Middle Last"  -> "F. M."
 */
function firstInitials(author: string): string {
  const trimmed = author.trim();
  let firstNames: string;
  if (trimmed.includes(',')) {
    firstNames = trimmed.split(',').slice(1).join(' ').trim();
  } else {
    const parts = trimmed.split(/\s+/);
    firstNames = parts.slice(0, -1).join(' ');
  }
  if (!firstNames) return '';
  return firstNames
    .split(/\s+/)
    .map((n) => (n.length > 0 ? `${n.charAt(0)}.` : ''))
    .join(' ');
}

// ---- IEEE style -------------------------------------------------------------

/**
 * Format an inline citation in IEEE style:  `[N]`
 *
 * IEEE numbers citations in the order they appear; here we simply generate a
 * placeholder since the manager assigns the number.  When called standalone
 * we use `1` as the number.
 */
function ieeeInline(record: CitationRecord, index: number): string {
  return `[${index}]`;
}

/**
 * Format a bibliography entry in IEEE style.
 *
 * Pattern: [N] F. I. Last, F. I. Last, and F. I. Last, "Title," Journal,
 *          vol. V, no. N, pp. P, Year.
 */
function ieeeBibliographyEntry(record: CitationRecord, index: number): string {
  const parts: string[] = [];

  // prefix
  parts.push(`[${index}]`);

  // authors
  if (record.author.length > 0) {
    const formatted = record.author.map(
      (a) => `${firstInitials(a)} ${lastName(a)}`.trim(),
    );
    if (formatted.length === 1) {
      parts.push(formatted[0] ?? '');
    } else if (formatted.length === 2) {
      parts.push(`${formatted[0] ?? ''} and ${formatted[1] ?? ''}`);
    } else {
      const allButLast = formatted.slice(0, -1).join(', ');
      parts.push(`${allButLast}, and ${formatted[formatted.length - 1] ?? ''}`);
    }
    parts.push(',');
  }

  // title in quotes
  parts.push(` "${record.title},"`);

  // journal / booktitle
  if (record.journal) {
    parts.push(` ${record.journal},`);
  } else if (record.booktitle) {
    parts.push(` in ${record.booktitle},`);
  }

  // volume, number, pages
  if (record.volume) parts.push(` vol. ${record.volume},`);
  if (record.issue) parts.push(` no. ${record.issue},`);
  if (record.pages) parts.push(` pp. ${record.pages},`);

  // year
  if (record.year !== 0) parts.push(` ${record.year}.`);
  else parts.push('.');

  return parts.join('').replace(/,\./g, '.').replace(/\s{2,}/g, ' ').trim();
}

// ---- APA style --------------------------------------------------------------

/**
 * Format an inline citation in APA style:  `(Author, Year)`
 *
 * For two authors: `(Author & Author, Year)`
 * For three or more: `(Author et al., Year)`
 */
function apaInline(record: CitationRecord): string {
  if (record.author.length === 0) {
    return `(${record.year || 'n.d.'})`;
  }
  const firstAuthor = record.author[0];
  if (!firstAuthor) return `(${record.year || 'n.d.'})`;
  const first = lastName(firstAuthor);
  if (record.author.length === 1) {
    return `(${first}, ${record.year || 'n.d.'})`;
  }
  const secondAuthor = record.author[1];
  if (record.author.length === 2 && secondAuthor) {
    return `(${first} & ${lastName(secondAuthor)}, ${record.year || 'n.d.'})`;
  }
  return `(${first} et al., ${record.year || 'n.d.'})`;
}

/**
 * Format a bibliography entry in APA style.
 *
 * Pattern: Last, F. I. (Year). Title. Journal, V(N), P.
 */
function apaBibliographyEntry(record: CitationRecord): string {
  const parts: string[] = [];

  // authors — "Last, F. I., & Last, F. I."
  if (record.author.length > 0) {
    const formatted = record.author.map(
      (a) => `${lastName(a)}, ${firstInitials(a)}`.trim(),
    );
    if (formatted.length === 1) {
      parts.push(formatted[0] ?? '');
    } else if (formatted.length === 2) {
      parts.push(`${formatted[0] ?? ''}, & ${formatted[1] ?? ''}`);
    } else {
      const allButLast = formatted.slice(0, -1).join(', ');
      parts.push(`${allButLast}, & ${formatted[formatted.length - 1] ?? ''}`);
    }
  }

  // year
  parts.push(` (${record.year || 'n.d.'}).`);

  // title
  parts.push(` ${record.title}.`);

  // journal / booktitle
  if (record.journal) {
    let journalPart = ` ${record.journal}`;
    if (record.volume) {
      journalPart += `, ${record.volume}`;
      if (record.issue) journalPart += `(${record.issue})`;
    }
    if (record.pages) journalPart += `, ${record.pages}`;
    journalPart += '.';
    parts.push(journalPart);
  } else if (record.booktitle) {
    parts.push(` In ${record.booktitle}.`);
  }

  // DOI or URL
  if (record.doi) {
    parts.push(` https://doi.org/${record.doi}`);
  } else if (record.url) {
    parts.push(` ${record.url}`);
  }

  return parts.join('').replace(/\s{2,}/g, ' ').trim();
}

// ---- generic fallback -------------------------------------------------------

function genericInline(record: CitationRecord): string {
  const firstAuthor = record.author[0];
  if (firstAuthor) {
    return `(${lastName(firstAuthor)}, ${record.year || 'n.d.'})`;
  }
  return `(${record.key}, ${record.year || 'n.d.'})`;
}

function genericBibliographyEntry(record: CitationRecord): string {
  const authorStr =
    record.author.length > 0 ? record.author.join(', ') : 'Unknown';
  return `${authorStr}. "${record.title}." ${record.year || 'n.d.'}.`;
}

// ---- built-in available styles ----------------------------------------------

const BUILT_IN_STYLES: BibliographyStyle[] = [
  'apa',
  'ieee',
  'chicago',
  'mla',
  'harvard',
  'vancouver',
  'nature',
  'arxiv',
];

// ---- public API -------------------------------------------------------------

/**
 * Renders citations and bibliographies in various CSL-like styles.
 *
 * For v0.1 IEEE and APA are fully implemented; all other styles fall back to a
 * generic renderer.  Custom styles can be registered via `registerCustomStyle`.
 */
export class CSLRenderer {
  /**
   * Registered custom style names.  In a future version these will be backed by
   * parsed CSL XML; for now we simply track the names so `listStyles` includes
   * them.
   */
  private customStyles: Map<string, string> = new Map();

  /**
   * Format a single inline citation string for the given record and style.
   *
   * @param record  The citation record to format.
   * @param style   Target bibliography style.
   * @param index   1-based citation number (used by numbered styles like IEEE).
   */
  formatCitation(
    record: CitationRecord,
    style: BibliographyStyle,
    index: number = 1,
  ): string {
    switch (style) {
      case 'ieee':
        return ieeeInline(record, index);
      case 'apa':
        return apaInline(record);
      default:
        return genericInline(record);
    }
  }

  /**
   * Format a full bibliography from an array of records.
   *
   * Records are numbered sequentially starting at 1 (for IEEE and similar
   * numbered styles).
   */
  formatBibliography(
    records: CitationRecord[],
    style: BibliographyStyle,
  ): string {
    const entries = records.map((record, idx) => {
      const num = idx + 1;
      switch (style) {
        case 'ieee':
          return ieeeBibliographyEntry(record, num);
        case 'apa':
          return apaBibliographyEntry(record);
        default:
          return genericBibliographyEntry(record);
      }
    });

    return entries.join('\n');
  }

  /**
   * Return the list of all available bibliography styles (built-in + custom).
   */
  listStyles(): BibliographyStyle[] {
    // Return unique built-in styles plus 'custom' if any custom style is registered
    if (this.customStyles.size > 0) {
      return [...BUILT_IN_STYLES, 'custom'];
    }
    return [...BUILT_IN_STYLES];
  }

  /**
   * Register a custom CSL style.
   *
   * In a future version `styleXML` will be parsed and used for rendering.
   * Currently the name is tracked so it appears in `listStyles()`, and
   * rendering falls back to the generic formatter.
   *
   * @param styleName  Unique name for the custom style.
   * @param styleXML   CSL XML content (stored for future use).
   */
  registerCustomStyle(styleName: string, styleXML: string): void {
    this.customStyles.set(styleName, styleXML);
  }
}
