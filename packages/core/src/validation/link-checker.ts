// packages/core/src/validation/link-checker.ts
// External URL checking and internal cross-reference validation

import type {
  LinkCheckResult,
  LinkCheckOptions,
  Link,
  DocumentTree,
  DocumentNode,
  InlineNode,
  ValidationResult,
  ConversionErrorData,
  ConversionWarning,
  DocumentLocation,
} from '../types.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_TIMEOUT = 3_000; // 3 seconds
const MAX_CONCURRENT = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResult(
  errors: ConversionErrorData[],
  warnings: ConversionWarning[],
): ValidationResult {
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    validatedAt: new Date().toISOString(),
  };
}

/**
 * Run an array of async tasks with limited concurrency.
 */
async function pLimit<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function runNext(): Promise<void> {
    while (index < tasks.length) {
      const current = index;
      index++;
      const task = tasks[current];
      if (task) {
        results[current] = await task();
      }
    }
  }

  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(concurrency, tasks.length); i++) {
    workers.push(runNext());
  }

  await Promise.all(workers);
  return results;
}

/**
 * Walk inline nodes to extract links.
 */
function extractInlineLinks(nodes: InlineNode[], location?: DocumentLocation): Link[] {
  const links: Link[] = [];
  for (const node of nodes) {
    if (node.type === 'link') {
      const url = node.url;
      let linkType: Link['type'];
      if (url.startsWith('#')) {
        linkType = 'anchor';
      } else if (/^https?:\/\//i.test(url)) {
        linkType = 'external';
      } else {
        linkType = 'internal';
      }
      const link: Link = { type: linkType, url };
      if (location) {
        link.location = location;
      }
      links.push(link);
    }

    // Recurse into children of emphasis, strong, link
    if ('children' in node && Array.isArray(node.children)) {
      links.push(...extractInlineLinks(node.children as InlineNode[], location));
    }
  }
  return links;
}

/**
 * Recursively walk document nodes and extract all links.
 */
function extractDocumentLinks(nodes: DocumentNode[]): Link[] {
  const links: Link[] = [];
  for (const node of nodes) {
    switch (node.type) {
      case 'section':
        links.push(...extractDocumentLinks(node.children));
        break;
      case 'paragraph':
        links.push(...extractInlineLinks(node.children));
        break;
      case 'figure':
        if (node.src && /^https?:\/\//i.test(node.src)) {
          links.push({ type: 'external', url: node.src });
        } else if (node.src) {
          links.push({ type: 'internal', url: node.src });
        }
        break;
      case 'citation':
        if (node.resolved?.url) {
          links.push({ type: 'external', url: node.resolved.url });
        }
        break;
      case 'table':
        for (const row of node.rows) {
          for (const cell of row) {
            if (Array.isArray(cell)) {
              links.push(...extractInlineLinks(cell as InlineNode[]));
            }
          }
        }
        break;
      // code, math nodes have no links
    }
  }
  return links;
}

/**
 * Collect all node IDs (section ids, figure labels, table labels, code labels)
 * that can serve as internal cross-reference targets.
 */
function collectTargetIds(nodes: DocumentNode[]): Set<string> {
  const ids = new Set<string>();

  for (const node of nodes) {
    switch (node.type) {
      case 'section':
        if (node.id) ids.add(node.id);
        collectTargetIds(node.children).forEach((id) => ids.add(id));
        break;
      case 'figure':
        if (node.label) ids.add(node.label);
        break;
      case 'table':
        if (node.label) ids.add(node.label);
        break;
      case 'code':
        if (node.label) ids.add(node.label);
        break;
    }
  }

  return ids;
}

/**
 * Collect all cross-reference anchor targets (links starting with `#`).
 */
function collectAnchorRefs(nodes: DocumentNode[]): Link[] {
  const allLinks = extractDocumentLinks(nodes);
  return allLinks.filter((l) => l.type === 'anchor');
}

// ---------------------------------------------------------------------------
// LinkChecker
// ---------------------------------------------------------------------------

export class LinkChecker {
  /**
   * Check a single URL using an HTTP HEAD request.
   */
  async checkUrl(url: string, timeout?: number): Promise<LinkCheckResult> {
    const effectiveTimeout = timeout ?? DEFAULT_TIMEOUT;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), effectiveTimeout);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timer);

      return {
        valid: response.ok,
        url,
        statusCode: response.status,
        checkedAt: new Date(),
      };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unknown fetch error';
      return {
        valid: false,
        url,
        error: message,
        checkedAt: new Date(),
      };
    }
  }

  /**
   * Check all links in a DocumentTree.
   *
   * External dead links produce **warnings** (not errors).
   * Internal reference mismatches produce **errors**.
   */
  async checkTree(
    tree: DocumentTree,
    options?: LinkCheckOptions,
  ): Promise<ValidationResult> {
    const errors: ConversionErrorData[] = [];
    const warnings: ConversionWarning[] = [];

    const links = this.extractLinks(tree);

    // --- Internal references ---
    if (!options?.skipInternal) {
      const internalResult = this.validateInternalReferences(tree);
      errors.push(...internalResult.errors);
      warnings.push(...internalResult.warnings);
    }

    // --- External URLs ---
    if (!options?.skipExternal) {
      const externalLinks = links.filter((l) => l.type === 'external');
      const timeout = options?.timeout ?? DEFAULT_TIMEOUT;

      const tasks = externalLinks.map(
        (link) => () => this.checkUrl(link.url, timeout),
      );

      const results = await pLimit(tasks, MAX_CONCURRENT);

      for (const result of results) {
        if (!result.valid) {
          warnings.push({
            code: 'LINK_DEAD',
            message: `Dead link: ${result.url}${result.statusCode ? ` (HTTP ${result.statusCode})` : ''}${result.error ? ` - ${result.error}` : ''}`,
            suggestion: 'Verify the URL is correct and the server is reachable',
          });
        }
      }
    }

    return makeResult(errors, warnings);
  }

  /**
   * Validate that all internal anchor references (`#id`) point to existing
   * target IDs in the document tree.
   */
  validateInternalReferences(tree: DocumentTree): ValidationResult {
    const errors: ConversionErrorData[] = [];
    const warnings: ConversionWarning[] = [];

    const targetIds = collectTargetIds(tree.children);
    const anchorRefs = collectAnchorRefs(tree.children);

    for (const ref of anchorRefs) {
      // Strip the leading `#`
      const targetId = ref.url.slice(1);
      if (!targetIds.has(targetId)) {
        errors.push({
          code: 'LINK_MISSING_TARGET',
          message: `Internal reference "#${targetId}" does not match any element ID in the document`,
          suggestions: [
            `Add an id="${targetId}" to the target element`,
            'Check for typos in the reference',
          ],
        });
      }
    }

    return makeResult(errors, warnings);
  }

  /**
   * Extract all links (external, internal, anchor) from a DocumentTree.
   */
  extractLinks(tree: DocumentTree): Link[] {
    return extractDocumentLinks(tree.children);
  }
}
