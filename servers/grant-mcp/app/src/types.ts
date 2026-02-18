export interface GrantComplianceData {
  id: string;
  format: string;
  content: string;
  artifacts: Array<{
    type: string;
    filename: string;
    content: string;
  }>;
  metadata: GrantMetadata;
  elapsed: number;
}

export interface GrantMetadata {
  funder: 'nih' | 'nsf' | 'erc';
  program_type: string;
  page_count: number;
  word_count: number;
  budget_total: number;
  budget_overhead: number;
  compliance_status: 'compliant' | 'warning' | 'error';
  validation_messages: string[];
  sections: SectionStatus[];
  attachments: AttachmentStatus[];
}

export interface SectionStatus {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  page_count: number;
  required_pages: number | string;
  word_count: number;
  required: boolean;
}

export interface AttachmentStatus {
  role: string;
  required: boolean;
  present: boolean;
}
