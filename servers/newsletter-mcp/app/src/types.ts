export interface CompileNewsletterResult {
  compiled_html: string;
  mjml_source: string;
  metadata: {
    subject_line: string;
    preview_text: string;
    sender_name: string;
    total_size_kb: number;
  };
  block_count: number;
  link_list: Array<{ text: string; url: string }>;
  compliance: {
    footer_present: boolean;
    unsubscribe_link_present: boolean;
  };
  size_warning: boolean;
}
