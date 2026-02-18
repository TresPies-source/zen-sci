// packages/core/src/citations/bibtex-parser.ts
// BibTeX parser for ZenSci — hand-rolled, no external dependencies.

import type {
  CitationRecord,
  ValidationResult,
  ConversionErrorData,
  ConversionWarning,
} from '../types.js';

// ---- helpers ----------------------------------------------------------------

/** BibTeX entry types that map directly to CitationRecord.type */
const BIBTEX_TYPE_MAP: Record<string, CitationRecord['type']> = {
  article: 'article',
  book: 'book',
  inbook: 'book',
  incollection: 'book',
  inproceedings: 'inproceedings',
  conference: 'inproceedings',
  techreport: 'techreport',
  phdthesis: 'thesis',
  mastersthesis: 'thesis',
  misc: 'misc',
  unpublished: 'misc',
  online: 'misc',
  manual: 'other',
  proceedings: 'other',
  booklet: 'other',
};

/**
 * Resolve a BibTeX entry type string to the CitationRecord union type.
 */
function resolveType(bibtexType: string): CitationRecord['type'] {
  const normalised = bibtexType.trim().toLowerCase();
  return BIBTEX_TYPE_MAP[normalised] ?? 'other';
}

/**
 * Strip surrounding braces **or** quotes from a BibTeX field value.
 *
 * Examples:
 *   `{Quantum Computing}`  -> `Quantum Computing`
 *   `"Quantum Computing"`  -> `Quantum Computing`
 *   `2023`                 -> `2023`
 */
function stripDelimiters(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

/**
 * Parse the *body* of a single BibTeX entry (everything between the outermost
 * braces after the citation key) into a flat key-value map.
 *
 * We iterate character-by-character to handle nested braces inside values.
 */
function parseFields(body: string): Record<string, string> {
  const fields: Record<string, string> = {};

  let i = 0;
  const len = body.length;

  while (i < len) {
    // skip whitespace and commas
    while (i < len && (body[i] === ',' || body[i] === ' ' || body[i] === '\t' || body[i] === '\n' || body[i] === '\r')) {
      i++;
    }
    if (i >= len) break;

    // read key (up to '=')
    const eqIdx = body.indexOf('=', i);
    if (eqIdx === -1) break;

    const key = body.slice(i, eqIdx).trim().toLowerCase();
    i = eqIdx + 1;

    // skip whitespace after '='
    while (i < len && (body[i] === ' ' || body[i] === '\t' || body[i] === '\n' || body[i] === '\r')) {
      i++;
    }
    if (i >= len) break;

    // read value — handle brace-delimited, quote-delimited, or bare (numeric)
    let value = '';
    const startChar = body[i];

    if (startChar === '{') {
      // brace-delimited — track nesting
      let depth = 0;
      const start = i;
      while (i < len) {
        if (body[i] === '{') depth++;
        else if (body[i] === '}') {
          depth--;
          if (depth === 0) {
            i++; // consume closing brace
            break;
          }
        }
        i++;
      }
      value = body.slice(start, i);
    } else if (startChar === '"') {
      // quote-delimited — find matching unescaped quote
      const start = i;
      i++; // skip opening quote
      while (i < len) {
        if (body[i] === '"' && body[i - 1] !== '\\') {
          i++; // consume closing quote
          break;
        }
        i++;
      }
      value = body.slice(start, i);
    } else {
      // bare value (e.g. a number or a macro)
      const start = i;
      while (i < len && body[i] !== ',' && body[i] !== '}' && body[i] !== '\n') {
        i++;
      }
      value = body.slice(start, i);
    }

    if (key) {
      fields[key] = stripDelimiters(value);
    }
  }

  return fields;
}

/**
 * Split an author string on ` and ` (case-insensitive) and trim each name.
 */
function parseAuthors(authorField: string): string[] {
  return authorField
    .split(/\s+and\s+/i)
    .map((a) => a.trim())
    .filter((a) => a.length > 0);
}

/**
 * Parse year from a field value. Returns NaN when unparseable.
 */
function parseYear(yearField: string | undefined): number {
  if (yearField === undefined) return NaN;
  const n = parseInt(yearField, 10);
  return n;
}

// ---- top-level entry regex --------------------------------------------------

/**
 * Match BibTeX entries.  We use a two-pass approach:
 *   1. find `@type{key,` opening markers
 *   2. from each marker, scan forward counting braces to find the matching `}`
 */
function extractRawEntries(
  content: string,
): { type: string; key: string; body: string; offset: number }[] {
  const results: { type: string; key: string; body: string; offset: number }[] = [];

  // Pattern: @type{ or @type(  — we normalise to brace style
  const entryStart = /@(\w+)\s*\{/g;
  let match: RegExpExecArray | null;

  while ((match = entryStart.exec(content)) !== null) {
    const entryType = match[1] as string; // group 1 always captured when regex matches
    const openBrace = match.index + match[0].length; // position right after '{'

    // Find the citation key (everything up to the first comma)
    const commaIdx = content.indexOf(',', openBrace);
    if (commaIdx === -1) continue; // malformed — skip

    const key = content.slice(openBrace, commaIdx).trim();

    // Now scan for the matching closing brace
    let depth = 1;
    let pos = commaIdx + 1;
    while (pos < content.length && depth > 0) {
      if (content[pos] === '{') depth++;
      else if (content[pos] === '}') depth--;
      pos++;
    }

    if (depth !== 0) {
      // unmatched braces — take what we have
      results.push({
        type: entryType,
        key,
        body: content.slice(commaIdx + 1),
        offset: match.index,
      });
    } else {
      // pos now points one past the closing brace
      results.push({
        type: entryType,
        key,
        body: content.slice(commaIdx + 1, pos - 1),
        offset: match.index,
      });
    }
  }

  return results;
}

// ---- public API -------------------------------------------------------------

/**
 * A hand-rolled BibTeX parser that produces `CitationRecord[]` from raw BibTeX
 * content.  No external dependencies required.
 */
export class BibTeXParser {
  /**
   * Parse a BibTeX string into an array of `CitationRecord` objects.
   *
   * Malformed entries are skipped — call `validate()` to get diagnostics.
   */
  parse(content: string): CitationRecord[] {
    const rawEntries = extractRawEntries(content);
    const records: CitationRecord[] = [];

    for (const entry of rawEntries) {
      // Skip comment/preamble/string entries
      const typeLower = entry.type.toLowerCase();
      if (typeLower === 'comment' || typeLower === 'preamble' || typeLower === 'string') {
        continue;
      }

      const fields = parseFields(entry.body);
      const authorRaw = fields['author'] ?? '';
      const year = parseYear(fields['year']);

      // Build record with only defined optional fields to satisfy
      // exactOptionalPropertyTypes (cannot assign undefined to optional props).
      const record: CitationRecord = {
        key: entry.key,
        type: resolveType(entry.type),
        title: fields['title'] ?? '',
        author: authorRaw ? parseAuthors(authorRaw) : [],
        year: isNaN(year) ? 0 : year,
        raw: fields,
      };

      // Conditionally assign optional fields only when present
      const journal = fields['journal'];
      if (journal !== undefined) record.journal = journal;

      const booktitle = fields['booktitle'];
      if (booktitle !== undefined) record.booktitle = booktitle;

      const publisher = fields['publisher'];
      if (publisher !== undefined) record.publisher = publisher;

      const volume = fields['volume'];
      if (volume !== undefined) record.volume = volume;

      const issue = fields['number'] ?? fields['issue'];
      if (issue !== undefined) record.issue = issue;

      const pages = fields['pages'];
      if (pages !== undefined) record.pages = pages;

      const doi = fields['doi'];
      if (doi !== undefined) record.doi = doi;

      const url = fields['url'];
      if (url !== undefined) record.url = url;

      const accessed = fields['accessed'] ?? fields['urldate'];
      if (accessed !== undefined) record.accessed = accessed;

      records.push(record);
    }

    return records;
  }

  /**
   * Validate BibTeX content and return diagnostics.
   *
   * Checks performed:
   *  - balanced braces per entry
   *  - presence of mandatory fields (title, author, year)
   *  - duplicate keys
   */
  validate(content: string): ValidationResult {
    const errors: ConversionErrorData[] = [];
    const warnings: ConversionWarning[] = [];

    // ---- global brace balance ----
    let globalDepth = 0;
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '{') globalDepth++;
      else if (content[i] === '}') globalDepth--;
    }
    if (globalDepth !== 0) {
      errors.push({
        code: 'BIBTEX_UNBALANCED_BRACES',
        message: `Unbalanced braces in BibTeX content (depth delta: ${globalDepth})`,
      });
    }

    // ---- per-entry checks ----
    const rawEntries = extractRawEntries(content);
    const seenKeys = new Set<string>();

    for (const entry of rawEntries) {
      const typeLower = entry.type.toLowerCase();
      if (typeLower === 'comment' || typeLower === 'preamble' || typeLower === 'string') {
        continue;
      }

      // duplicate keys
      if (seenKeys.has(entry.key)) {
        errors.push({
          code: 'BIBTEX_DUPLICATE_KEY',
          message: `Duplicate citation key: "${entry.key}"`,
        });
      }
      seenKeys.add(entry.key);

      const fields = parseFields(entry.body);

      // mandatory fields
      if (!fields['title']) {
        warnings.push({
          code: 'BIBTEX_MISSING_TITLE',
          message: `Entry "${entry.key}" is missing a title field`,
          suggestion: 'Add a title = {...} field to the entry',
        });
      }
      if (!fields['author']) {
        warnings.push({
          code: 'BIBTEX_MISSING_AUTHOR',
          message: `Entry "${entry.key}" is missing an author field`,
          suggestion: 'Add an author = {...} field to the entry',
        });
      }
      if (!fields['year']) {
        warnings.push({
          code: 'BIBTEX_MISSING_YEAR',
          message: `Entry "${entry.key}" is missing a year field`,
          suggestion: 'Add a year = {...} field to the entry',
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

  /**
   * Generate BibTeX content from an array of `CitationRecord` objects.
   */
  generate(records: CitationRecord[]): string {
    const lines: string[] = [];

    for (const record of records) {
      const bibtexType = this.recordTypeToBibtex(record.type);
      lines.push(`@${bibtexType}{${record.key},`);

      // Always emit core fields
      lines.push(`  title = {${record.title}},`);
      if (record.author.length > 0) {
        lines.push(`  author = {${record.author.join(' and ')}},`);
      }
      if (record.year !== 0) {
        lines.push(`  year = {${record.year}},`);
      }

      // Optional fields
      if (record.journal) lines.push(`  journal = {${record.journal}},`);
      if (record.booktitle) lines.push(`  booktitle = {${record.booktitle}},`);
      if (record.publisher) lines.push(`  publisher = {${record.publisher}},`);
      if (record.volume) lines.push(`  volume = {${record.volume}},`);
      if (record.issue) lines.push(`  number = {${record.issue}},`);
      if (record.pages) lines.push(`  pages = {${record.pages}},`);
      if (record.doi) lines.push(`  doi = {${record.doi}},`);
      if (record.url) lines.push(`  url = {${record.url}},`);

      lines.push('}');
      lines.push('');
    }

    return lines.join('\n');
  }

  // ---- private helpers ------------------------------------------------------

  /**
   * Map a `CitationRecord.type` back to a conventional BibTeX entry type.
   */
  private recordTypeToBibtex(type: CitationRecord['type']): string {
    switch (type) {
      case 'article':
        return 'article';
      case 'book':
        return 'book';
      case 'inproceedings':
        return 'inproceedings';
      case 'techreport':
        return 'techreport';
      case 'thesis':
        return 'phdthesis';
      case 'misc':
        return 'misc';
      case 'other':
      default:
        return 'misc';
    }
  }
}
