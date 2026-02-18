export interface ConvertToHtmlResult {
  html: string;
  frontmatter: {
    title?: string;
    date?: string;
    tags?: string[];
    slug?: string;
    [key: string]: unknown;
  };
  seo: {
    og: {
      title?: string;
      description?: string;
      type?: string;
      image?: string;
      [key: string]: unknown;
    };
    twitter: {
      card?: string;
      title?: string;
      description?: string;
      [key: string]: unknown;
    };
    schema_org: {
      '@type'?: string;
      headline?: string;
      author?: string;
      datePublished?: string;
      [key: string]: unknown;
    };
  };
  word_count: number;
  reading_time_minutes: number;
  citations: {
    total: number;
    resolved: number;
    unresolved?: string[];
  };
  warnings?: string[];
  elapsed_ms: number;
}
