// packages/core/src/parsing/frontmatter-extractor.ts
// Extracts, injects, validates, and merges YAML frontmatter using gray-matter.

import matter from 'gray-matter';
import type {
  FrontmatterMetadata,
  ValidationResult,
  ConversionErrorData,
  ConversionWarning,
} from '../types.js';

/**
 * Extracts and manages YAML frontmatter in markdown documents.
 */
export class FrontmatterExtractor {
  /**
   * Parse YAML frontmatter from a source string.
   * Returns the parsed frontmatter metadata and the remaining content.
   * If no frontmatter is present, returns an empty object for frontmatter.
   */
  extract(source: string): { frontmatter: FrontmatterMetadata; content: string } {
    try {
      const result = matter(source);
      const frontmatter = this.normalizeMetadata(result.data);
      return { frontmatter, content: result.content };
    } catch {
      // If parsing fails, return empty frontmatter and the original source as content
      return { frontmatter: {}, content: source };
    }
  }

  /**
   * Prepend a YAML frontmatter block to the given content string.
   */
  inject(content: string, frontmatter: FrontmatterMetadata): string {
    return matter.stringify(content, frontmatter);
  }

  /**
   * Validate the shape of a FrontmatterMetadata object.
   * Checks that known fields have the expected types.
   */
  validate(frontmatter: FrontmatterMetadata): ValidationResult {
    const errors: ConversionErrorData[] = [];
    const warnings: ConversionWarning[] = [];

    // Validate title
    if ('title' in frontmatter && frontmatter.title !== undefined) {
      if (typeof frontmatter.title !== 'string') {
        errors.push({
          code: 'FRONTMATTER_INVALID_TITLE',
          message: 'Field "title" must be a string.',
        });
      }
    }

    // Validate author (string or string[])
    if ('author' in frontmatter && frontmatter.author !== undefined) {
      const author = frontmatter.author;
      if (typeof author !== 'string' && !Array.isArray(author)) {
        errors.push({
          code: 'FRONTMATTER_INVALID_AUTHOR',
          message: 'Field "author" must be a string or an array of strings.',
        });
      } else if (Array.isArray(author)) {
        const hasNonString = author.some(
          (item: unknown) => typeof item !== 'string'
        );
        if (hasNonString) {
          errors.push({
            code: 'FRONTMATTER_INVALID_AUTHOR',
            message:
              'Field "author" array must contain only strings.',
          });
        }
      }
    }

    // Validate date
    if ('date' in frontmatter && frontmatter.date !== undefined) {
      if (typeof frontmatter.date !== 'string') {
        errors.push({
          code: 'FRONTMATTER_INVALID_DATE',
          message: 'Field "date" must be a string.',
        });
      }
    }

    // Validate tags
    if ('tags' in frontmatter && frontmatter.tags !== undefined) {
      if (!Array.isArray(frontmatter.tags)) {
        errors.push({
          code: 'FRONTMATTER_INVALID_TAGS',
          message: 'Field "tags" must be an array of strings.',
        });
      } else {
        const hasNonString = (frontmatter.tags as unknown[]).some(
          (item: unknown) => typeof item !== 'string'
        );
        if (hasNonString) {
          errors.push({
            code: 'FRONTMATTER_INVALID_TAGS',
            message: 'Field "tags" array must contain only strings.',
          });
        }
      }
    }

    // Validate description
    if ('description' in frontmatter && frontmatter.description !== undefined) {
      if (typeof frontmatter.description !== 'string') {
        errors.push({
          code: 'FRONTMATTER_INVALID_DESCRIPTION',
          message: 'Field "description" must be a string.',
        });
      }
    }

    // Validate keywords
    if ('keywords' in frontmatter && frontmatter.keywords !== undefined) {
      if (!Array.isArray(frontmatter.keywords)) {
        errors.push({
          code: 'FRONTMATTER_INVALID_KEYWORDS',
          message: 'Field "keywords" must be an array of strings.',
        });
      } else {
        const hasNonString = (frontmatter.keywords as unknown[]).some(
          (item: unknown) => typeof item !== 'string'
        );
        if (hasNonString) {
          errors.push({
            code: 'FRONTMATTER_INVALID_KEYWORDS',
            message: 'Field "keywords" array must contain only strings.',
          });
        }
      }
    }

    // Validate lang
    if ('lang' in frontmatter && frontmatter.lang !== undefined) {
      if (typeof frontmatter.lang !== 'string') {
        errors.push({
          code: 'FRONTMATTER_INVALID_LANG',
          message: 'Field "lang" must be a string.',
        });
      }
    }

    // Warn if no title is present
    if (!frontmatter.title) {
      warnings.push({
        code: 'FRONTMATTER_MISSING_TITLE',
        message: 'No "title" field found in frontmatter.',
        suggestion: 'Add a "title" field to the frontmatter for better document identification.',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      validatedAt: new Date().toISOString(),
    };
  }

  /**
   * Deep-merge two FrontmatterMetadata objects. The override takes precedence
   * for top-level keys. Array fields are replaced, not concatenated.
   */
  merge(
    base: FrontmatterMetadata,
    override: FrontmatterMetadata
  ): FrontmatterMetadata {
    const merged: FrontmatterMetadata = { ...base };

    for (const key of Object.keys(override)) {
      const value = override[key];
      if (value !== undefined) {
        merged[key] = value;
      }
    }

    return merged;
  }

  /**
   * Normalize the raw data from gray-matter into FrontmatterMetadata.
   * Handles edge cases such as the author field being a single string
   * vs. an array. Keeps the value as-is (string or string[]) per the
   * FrontmatterMetadata interface definition.
   */
  private normalizeMetadata(
    data: Record<string, unknown>
  ): FrontmatterMetadata {
    const metadata: FrontmatterMetadata = {};

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined || value === null) {
        continue;
      }
      metadata[key] = value;
    }

    return metadata;
  }
}
