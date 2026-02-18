// servers/paper-mcp/src/templates/ieee-injector.ts
// Utility to inject IEEE-specific LaTeX structures (author blocks, abstract, keywords)

// ---------------------------------------------------------------------------
// Author type
// ---------------------------------------------------------------------------

export interface Author {
  name: string;
  affiliation?: string;
  email?: string;
}

// ---------------------------------------------------------------------------
// IEEEInjector
// ---------------------------------------------------------------------------

export class IEEEInjector {
  /**
   * Inject IEEE-specific author blocks, abstract, and keywords into a LaTeX
   * document string. The injection targets the area between \begin{document}
   * and the first \section command.
   */
  injectIEEEStructure(
    latex: string,
    authors: Author[],
    abstract?: string,
    keywords?: string[],
  ): string {
    const lines = latex.split('\n');
    const result: string[] = [];
    let injected = false;

    for (const line of lines) {
      result.push(line);

      // Inject right after \begin{document}
      if (!injected && line.trim() === '\\begin{document}') {
        // Title (already present if inserted by caller, but we inject author blocks)
        result.push('');

        // Author blocks
        if (authors.length > 0) {
          result.push('\\author{');
          for (let i = 0; i < authors.length; i++) {
            const author = authors[i]!;
            result.push(`\\IEEEauthorblockN{${author.name}}`);
            const affiliationParts: string[] = [];
            if (author.affiliation !== undefined) {
              affiliationParts.push(author.affiliation);
            }
            if (author.email !== undefined) {
              affiliationParts.push(`Email: ${author.email}`);
            }
            if (affiliationParts.length > 0) {
              result.push(
                `\\IEEEauthorblockA{${affiliationParts.join(' \\\\ ')}}`,
              );
            }
            if (i < authors.length - 1) {
              result.push('\\and');
            }
          }
          result.push('}');
          result.push('');
        }

        result.push('\\maketitle');
        result.push('');

        // Abstract
        if (abstract !== undefined) {
          result.push('\\begin{abstract}');
          result.push(abstract);
          result.push('\\end{abstract}');
          result.push('');
        }

        // Keywords
        if (keywords !== undefined && keywords.length > 0) {
          result.push('\\begin{IEEEkeywords}');
          result.push(keywords.join(', '));
          result.push('\\end{IEEEkeywords}');
          result.push('');
        }

        injected = true;
      }
    }

    return result.join('\n');
  }
}
