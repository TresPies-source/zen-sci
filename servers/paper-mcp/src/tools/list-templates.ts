// servers/paper-mcp/src/tools/list-templates.ts
// Handler for the list_templates MCP tool

export interface PaperTemplateInfo {
  id: string;
  name: string;
  description: string;
  venue_type: 'conference' | 'journal' | 'preprint';
  max_pages: number;
  citation_style: string;
  columns: number;
}

export interface ListTemplatesResult {
  templates: PaperTemplateInfo[];
}

const TEMPLATES: PaperTemplateInfo[] = [
  {
    id: 'paper-ieee',
    name: 'IEEE Conference',
    description: 'IEEE two-column conference paper format (IEEEtran). Used for IEEE conferences including CVPR, ICCV, ICRA, etc.',
    venue_type: 'conference',
    max_pages: 8,
    citation_style: 'ieeetr',
    columns: 2,
  },
  {
    id: 'paper-acm',
    name: 'ACM SIG Proceedings',
    description: 'ACM SIG conference paper format (acmart sigconf). Used for ACM conferences including CHI, SIGRAPH, PLDI, etc.',
    venue_type: 'conference',
    max_pages: 10,
    citation_style: 'acm',
    columns: 2,
  },
  {
    id: 'paper-arxiv',
    name: 'arXiv Preprint',
    description: 'Standard article format suitable for arXiv preprint submissions. Single-column with author-date citations.',
    venue_type: 'preprint',
    max_pages: 0,
    citation_style: 'plainnat',
    columns: 1,
  },
];

export function listTemplates(): ListTemplatesResult {
  return { templates: TEMPLATES };
}
