// packages/core/src/parsing/markdown-parser.ts
// Parses markdown into DocumentTree using remark/unified ecosystem.

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkStringify from 'remark-stringify';
import type { Root, RootContent, PhrasingContent } from 'mdast';

import type {
  DocumentTree,
  DocumentNode,
  SectionNode,
  ParagraphNode,
  MathNode,
  CodeBlockNode,
  FigureNode,
  TableNode,
  InlineNode,
  TextNode,
  EmphasisNode,
  StrongNode,
  CodeNode,
  LinkNode,
  FrontmatterMetadata,
  MarkdownParseOptions,
  ValidationResult,
  ConversionErrorData,
  ConversionWarning,
} from '../types.js';
import { FrontmatterExtractor } from './frontmatter-extractor.js';

/**
 * Internal interface representing an mdast node that carries math data.
 * remark-math plugin produces nodes with type 'math' or 'inlineMath'.
 */
interface MdastMathNode {
  type: 'math' | 'inlineMath';
  value: string;
  data?: Record<string, unknown>;
  position?: unknown;
}

/**
 * Parses markdown source into a DocumentTree AST,
 * leveraging remark/unified for parsing and FrontmatterExtractor
 * for YAML frontmatter handling.
 */
export class MarkdownParser {
  private readonly frontmatterExtractor: FrontmatterExtractor;

  constructor() {
    this.frontmatterExtractor = new FrontmatterExtractor();
  }

  /**
   * Build a fresh remark processor pipeline.
   */
  private createProcessor() {
    return unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkFrontmatter, ['yaml'])
      .use(remarkStringify);
  }

  /**
   * Parse markdown source into a DocumentTree.
   * Strips frontmatter before building the tree.
   */
  parse(source: string, _options?: MarkdownParseOptions): DocumentTree {
    const { frontmatter, content } = this.frontmatterExtractor.extract(source);
    const processor = this.createProcessor();
    const mdast = processor.parse(content) as Root;
    const children = this.mapRootChildren(mdast.children);

    return {
      type: 'document',
      children,
      frontmatter,
      bibliography: [],
    };
  }

  /**
   * Extract only frontmatter from a markdown source string.
   * Delegates entirely to FrontmatterExtractor.
   */
  extractFrontmatter(source: string): FrontmatterMetadata {
    const { frontmatter } = this.frontmatterExtractor.extract(source);
    return frontmatter;
  }

  /**
   * Parse the complete document, returning both the tree and the frontmatter.
   */
  parseComplete(
    source: string
  ): { tree: DocumentTree; frontmatter: FrontmatterMetadata } {
    const tree = this.parse(source);
    return { tree, frontmatter: tree.frontmatter };
  }

  /**
   * Validate a markdown source string.
   * Checks that the document can be parsed and that frontmatter is valid.
   */
  validate(source: string): ValidationResult {
    const errors: ConversionErrorData[] = [];
    const warnings: ConversionWarning[] = [];

    // Attempt to extract frontmatter
    let frontmatter: FrontmatterMetadata;
    try {
      const extracted = this.frontmatterExtractor.extract(source);
      frontmatter = extracted.frontmatter;
    } catch {
      errors.push({
        code: 'PARSE_FRONTMATTER_ERROR',
        message: 'Failed to extract frontmatter from source.',
      });
      return {
        valid: false,
        errors,
        warnings,
        validatedAt: new Date().toISOString(),
      };
    }

    // Validate frontmatter shape
    const fmValidation = this.frontmatterExtractor.validate(frontmatter);
    errors.push(...fmValidation.errors);
    warnings.push(...fmValidation.warnings);

    // Attempt to parse the markdown
    try {
      this.parse(source);
    } catch {
      errors.push({
        code: 'PARSE_MARKDOWN_ERROR',
        message: 'Failed to parse markdown source.',
      });
    }

    // Check for empty content
    const { content } = this.frontmatterExtractor.extract(source);
    if (content.trim().length === 0) {
      warnings.push({
        code: 'EMPTY_CONTENT',
        message: 'Document has no content beyond frontmatter.',
        suggestion: 'Add content to the document body.',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      validatedAt: new Date().toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // Private: mdast-to-DocumentNode mapping
  // ---------------------------------------------------------------------------

  /**
   * Map the children of the mdast Root node to DocumentNode[].
   */
  private mapRootChildren(children: RootContent[]): DocumentNode[] {
    const nodes: DocumentNode[] = [];

    for (const child of children) {
      const mapped = this.mapBlockNode(child);
      if (mapped !== null) {
        nodes.push(mapped);
      }
    }

    return nodes;
  }

  /**
   * Map a single mdast block-level node to a DocumentNode (or null to skip).
   */
  private mapBlockNode(node: RootContent): DocumentNode | null {
    switch (node.type) {
      case 'heading':
        return this.mapHeading(node);
      case 'paragraph':
        return this.mapParagraph(node);
      case 'code':
        return this.mapCodeBlock(node);
      case 'table':
        return this.mapTable(node);
      case 'image':
        return this.mapImage(node);
      case 'yaml':
        // Frontmatter yaml nodes are already handled by FrontmatterExtractor;
        // skip them in the AST.
        return null;
      default: {
        // Check for math nodes produced by remark-math plugins.
        // Use string cast because 'math'/'inlineMath' are not part of the
        // standard mdast union but are added by remark-math at runtime.
        const nodeType = node.type as string;
        if (nodeType === 'math' || nodeType === 'inlineMath') {
          return this.mapMathNode(node as unknown as MdastMathNode);
        }
        // Unsupported node types are silently skipped
        return null;
      }
    }
  }

  /**
   * Map an mdast heading to a SectionNode.
   */
  private mapHeading(
    node: Extract<RootContent, { type: 'heading' }>
  ): SectionNode {
    const title = this.extractTextFromPhrasing(node.children);
    return {
      type: 'section',
      level: node.depth,
      title,
      children: [],
    };
  }

  /**
   * Map an mdast paragraph to a ParagraphNode.
   */
  private mapParagraph(
    node: Extract<RootContent, { type: 'paragraph' }>
  ): ParagraphNode | FigureNode | MathNode {
    // Check if the paragraph contains a single image (common markdown pattern
    // for figures: a paragraph wrapping an image).
    if (
      node.children.length === 1 &&
      node.children[0] !== undefined &&
      node.children[0].type === 'image'
    ) {
      return this.mapImage(node.children[0]);
    }

    // Check if paragraph contains a single math inline node
    if (node.children.length === 1 && node.children[0] !== undefined) {
      const childType = node.children[0].type as string;
      if (childType === 'math' || childType === 'inlineMath') {
        return this.mapMathNode(
          node.children[0] as unknown as MdastMathNode
        );
      }
    }

    return {
      type: 'paragraph',
      children: this.mapPhrasingChildren(node.children),
    };
  }

  /**
   * Map an mdast code (fenced code block) to a CodeBlockNode.
   */
  private mapCodeBlock(
    node: Extract<RootContent, { type: 'code' }>
  ): CodeBlockNode {
    return {
      type: 'code',
      language: node.lang ?? '',
      content: node.value,
    };
  }

  /**
   * Map an mdast table to a TableNode.
   */
  private mapTable(
    node: Extract<RootContent, { type: 'table' }>
  ): TableNode {
    const rows = node.children; // TableRow[]

    // First row is the header row
    const headerRow = rows[0];
    const headers: string[] = headerRow
      ? headerRow.children.map((cell) =>
          this.extractTextFromPhrasing(cell.children)
        )
      : [];

    // Remaining rows are data rows
    const dataRows: (InlineNode[] | string)[][] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row) {
        const cells: (InlineNode[] | string)[] = row.children.map((cell) => {
          const inlineNodes = this.mapPhrasingChildren(cell.children);
          // If the cell contains a single text node, return just the string
          if (
            inlineNodes.length === 1 &&
            inlineNodes[0] !== undefined &&
            inlineNodes[0].type === 'text'
          ) {
            return inlineNodes[0].text;
          }
          return inlineNodes;
        });
        dataRows.push(cells);
      }
    }

    return {
      type: 'table',
      headers,
      rows: dataRows,
    };
  }

  /**
   * Map an mdast image to a FigureNode.
   */
  private mapImage(
    node: Extract<RootContent, { type: 'image' }>
  ): FigureNode {
    const figure: FigureNode = {
      type: 'figure',
      src: node.url,
      alt: node.alt ?? '',
    };
    if (node.title != null) {
      figure.caption = node.title;
    }
    return figure;
  }

  /**
   * Map a math/inlineMath mdast node to a MathNode.
   */
  private mapMathNode(node: MdastMathNode): MathNode {
    return {
      type: 'math',
      mode: node.type === 'inlineMath' ? 'inline' : 'display',
      latex: node.value,
      validated: false,
    };
  }

  // ---------------------------------------------------------------------------
  // Private: phrasing / inline node mapping
  // ---------------------------------------------------------------------------

  /**
   * Map an array of mdast PhrasingContent nodes to InlineNode[].
   */
  private mapPhrasingChildren(children: PhrasingContent[]): InlineNode[] {
    const result: InlineNode[] = [];

    for (const child of children) {
      const mapped = this.mapPhrasingNode(child);
      if (mapped !== null) {
        result.push(mapped);
      }
    }

    return result;
  }

  /**
   * Map a single mdast PhrasingContent node to an InlineNode (or null).
   */
  private mapPhrasingNode(node: PhrasingContent): InlineNode | null {
    switch (node.type) {
      case 'text':
        return this.mapText(node);
      case 'emphasis':
        return this.mapEmphasis(node);
      case 'strong':
        return this.mapStrong(node);
      case 'inlineCode':
        return this.mapInlineCode(node);
      case 'link':
        return this.mapLink(node);
      default: {
        // Check for inline math nodes added by remark-math at runtime
        const nodeType = node.type as string;
        if (nodeType === 'inlineMath') {
          const mathNode = node as unknown as MdastMathNode;
          return {
            type: 'text',
            text: `$${mathNode.value}$`,
          } satisfies TextNode;
        }
        // Unsupported inline node types are skipped
        return null;
      }
    }
  }

  /**
   * Map mdast text to TextNode.
   */
  private mapText(node: Extract<PhrasingContent, { type: 'text' }>): TextNode {
    return {
      type: 'text',
      text: node.value,
    };
  }

  /**
   * Map mdast emphasis to EmphasisNode.
   */
  private mapEmphasis(
    node: Extract<PhrasingContent, { type: 'emphasis' }>
  ): EmphasisNode {
    return {
      type: 'emphasis',
      children: this.mapPhrasingChildren(node.children),
    };
  }

  /**
   * Map mdast strong to StrongNode.
   */
  private mapStrong(
    node: Extract<PhrasingContent, { type: 'strong' }>
  ): StrongNode {
    return {
      type: 'strong',
      children: this.mapPhrasingChildren(node.children),
    };
  }

  /**
   * Map mdast inlineCode to CodeNode.
   */
  private mapInlineCode(
    node: Extract<PhrasingContent, { type: 'inlineCode' }>
  ): CodeNode {
    return {
      type: 'code',
      code: node.value,
    };
  }

  /**
   * Map mdast link to LinkNode.
   */
  private mapLink(
    node: Extract<PhrasingContent, { type: 'link' }>
  ): LinkNode {
    const link: LinkNode = {
      type: 'link',
      url: node.url,
      children: this.mapPhrasingChildren(node.children),
    };
    if (node.title != null) {
      link.title = node.title;
    }
    return link;
  }

  // ---------------------------------------------------------------------------
  // Private: text extraction utilities
  // ---------------------------------------------------------------------------

  /**
   * Extract plain text from an array of phrasing content nodes.
   * Used primarily to get heading title text.
   */
  private extractTextFromPhrasing(children: PhrasingContent[]): string {
    const parts: string[] = [];

    for (const child of children) {
      parts.push(this.extractTextFromPhrasingNode(child));
    }

    return parts.join('');
  }

  /**
   * Recursively extract plain text from a single phrasing node.
   */
  private extractTextFromPhrasingNode(node: PhrasingContent): string {
    switch (node.type) {
      case 'text':
        return node.value;
      case 'inlineCode':
        return node.value;
      case 'emphasis':
      case 'strong':
      case 'delete':
      case 'link':
        return this.extractTextFromPhrasing(node.children);
      default:
        return '';
    }
  }
}
