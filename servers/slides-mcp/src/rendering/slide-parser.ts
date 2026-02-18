// servers/slides-mcp/src/rendering/slide-parser.ts
// Parses markdown into a structured slide deck

export type SlideLayout = 'default' | 'title' | 'blank' | 'two-column';

export interface Slide {
  index: number;
  title?: string;
  content: string;
  notes?: string;
  layout?: SlideLayout;
}

export interface SlideStructure {
  title: string;
  slides: Slide[];
  theme?: string;
  transition?: string;
}

/**
 * SlideParser: Splits markdown source into a structured slide deck.
 *
 * - Slides are separated by `---` horizontal rules.
 * - The first slide's first `# Title` becomes the deck title.
 * - Blockquotes starting with `> Note:` are extracted as speaker notes.
 * - `<!-- layout: two-column -->` sets the slide layout to two-column.
 * - A slide whose first line is `# Title` gets layout='title'.
 */
export class SlideParser {
  parse(source: string): SlideStructure {
    const rawSlides = this.splitSlides(source);
    let deckTitle = '';
    const slides: Slide[] = [];

    for (let i = 0; i < rawSlides.length; i++) {
      const raw = rawSlides[i]!;
      const trimmed = raw.trim();

      // Skip empty slide segments (e.g., leading ---)
      if (trimmed.length === 0) {
        continue;
      }

      // Skip frontmatter block (first segment that looks like YAML frontmatter)
      if (slides.length === 0 && deckTitle === '' && this.isFrontmatter(trimmed)) {
        // Extract title from frontmatter if present
        const fmTitle = this.extractFrontmatterTitle(trimmed);
        if (fmTitle) {
          deckTitle = fmTitle;
        }
        continue;
      }

      const { content, notes } = this.extractNotes(trimmed);
      const slideTitle = this.extractSlideTitle(content);
      const layout = this.detectLayout(content, slideTitle);

      // Set deck title from first slide's # heading if not already set
      if (deckTitle === '' && slideTitle) {
        deckTitle = slideTitle;
      }

      const slide: Slide = {
        index: slides.length,
        content: this.cleanContent(content),
      };
      if (slideTitle !== undefined) {
        slide.title = slideTitle;
      }
      if (notes !== undefined) {
        slide.notes = notes;
      }
      if (layout !== undefined) {
        slide.layout = layout;
      }

      slides.push(slide);
    }

    return {
      title: deckTitle,
      slides,
    };
  }

  /**
   * Split source by --- horizontal rule separators.
   * Handles --- at the beginning (frontmatter delimiter).
   */
  private splitSlides(source: string): string[] {
    // Split on lines that are exactly --- (horizontal rules)
    // but not inside frontmatter blocks
    const lines = source.split('\n');
    const segments: string[] = [];
    let current: string[] = [];
    let inFrontmatter = false;
    let frontmatterClosed = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const trimmedLine = line.trim();

      // Detect frontmatter boundaries
      if (i === 0 && trimmedLine === '---') {
        inFrontmatter = true;
        current.push(line);
        continue;
      }

      if (inFrontmatter && !frontmatterClosed && trimmedLine === '---') {
        // Closing frontmatter delimiter
        current.push(line);
        inFrontmatter = false;
        frontmatterClosed = true;
        segments.push(current.join('\n'));
        current = [];
        continue;
      }

      // Regular --- slide separator
      if (!inFrontmatter && trimmedLine === '---') {
        segments.push(current.join('\n'));
        current = [];
        continue;
      }

      current.push(line);
    }

    // Don't forget the last segment
    if (current.length > 0) {
      segments.push(current.join('\n'));
    }

    return segments;
  }

  /**
   * Check if a text segment looks like YAML frontmatter.
   */
  private isFrontmatter(text: string): boolean {
    const lines = text.split('\n');
    if (lines.length < 2) return false;
    const first = lines[0]?.trim();
    const last = lines[lines.length - 1]?.trim();
    // Frontmatter: starts with --- and ends with ---
    if (first === '---' && last === '---') return true;
    // Or contains key: value patterns without headings
    const hasHeading = lines.some((l) => l.trim().startsWith('#'));
    const hasKeyValue = lines.some((l) => /^\w+\s*:/.test(l.trim()));
    return !hasHeading && hasKeyValue;
  }

  /**
   * Extract title from YAML frontmatter.
   */
  private extractFrontmatterTitle(text: string): string | undefined {
    const match = text.match(/^title\s*:\s*(.+)$/m);
    if (match?.[1]) {
      // Strip quotes if present
      return match[1].trim().replace(/^["']|["']$/g, '');
    }
    return undefined;
  }

  /**
   * Extract speaker notes from blockquotes starting with `> Note:`.
   */
  private extractNotes(content: string): { content: string; notes?: string } {
    const lines = content.split('\n');
    const contentLines: string[] = [];
    const noteLines: string[] = [];
    let inNote = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('> Note:')) {
        inNote = true;
        const noteText = trimmed.slice('> Note:'.length).trim();
        if (noteText.length > 0) {
          noteLines.push(noteText);
        }
        continue;
      }

      // Continuation of note (still in blockquote)
      if (inNote && trimmed.startsWith('>')) {
        const noteText = trimmed.slice(1).trim();
        noteLines.push(noteText);
        continue;
      }

      // End of note blockquote
      if (inNote && !trimmed.startsWith('>')) {
        inNote = false;
      }

      contentLines.push(line);
    }

    const result: { content: string; notes?: string } = {
      content: contentLines.join('\n'),
    };
    if (noteLines.length > 0) {
      result.notes = noteLines.join(' ');
    }
    return result;
  }

  /**
   * Extract slide title from the first heading line.
   */
  private extractSlideTitle(content: string): string | undefined {
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      // Match # or ## headings
      const match = trimmed.match(/^#{1,2}\s+(.+)$/);
      if (match?.[1]) {
        return match[1].trim();
      }
    }
    return undefined;
  }

  /**
   * Detect slide layout based on content.
   */
  private detectLayout(content: string, slideTitle?: string): SlideLayout | undefined {
    // Check for explicit layout comment
    if (content.includes('<!-- layout: two-column -->')) {
      return 'two-column';
    }

    // First line is a level-1 heading → title layout
    const firstContentLine = content.split('\n').find((l) => l.trim().length > 0);
    if (firstContentLine && /^\s*#\s+/.test(firstContentLine)) {
      return 'title';
    }

    return undefined;
  }

  /**
   * Clean content by removing layout comments.
   */
  private cleanContent(content: string): string {
    return content
      .replace(/<!--\s*layout:\s*\S+\s*-->/g, '')
      .trim();
  }
}
