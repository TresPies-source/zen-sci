export interface ConvertToPaperResult {
  pdf_base64: string;
  latex_source: string;
  paper_format: 'paper-ieee' | 'paper-acm' | 'paper-arxiv';
  page_count: number;
  section_count: number;
  figure_count: number;
  table_count: number;
  citation_count: number;
  abstract_text: string;
  author_affiliations: Array<{ name: string; affiliation: string }>;
  warnings: Array<{ type: 'warning' | 'error'; message: string }>;
}
