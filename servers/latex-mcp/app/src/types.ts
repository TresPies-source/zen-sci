export interface ConvertToPdfResult {
  pdf_path: string;
  pdf_base64: string;
  latex_source: string;
  page_count: number;
  metadata: {
    title?: string;
    author?: string[];
    date?: string;
  };
  warnings?: string[];
  citations: {
    total: number;
    resolved: number;
    unresolved?: string[];
  };
  elapsed_ms: number;
}

export type TexEngine = 'pdflatex' | 'xelatex' | 'lualatex';
