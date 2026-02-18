export interface SlideDeckData {
  id: string;
  format: 'slides-beamer' | 'slides-html' | 'slides-both';
  content: {
    beamer?: string;
    reveal?: string;
  };
  artifacts: Array<{
    type: string;
    filename: string;
    content: string;
  }>;
  metadata: SlideDeckMetadata;
  elapsed: number;
}

export interface SlideDeckMetadata {
  slide_count: number;
  title: string;
  author?: string;
  theme: string;
  has_speaker_notes: boolean;
  bibliography_count: number;
  math_expressions: number;
  slides: SlideData[];
}

export interface SlideData {
  slide_number: number;
  title?: string;
  body: string;
  speaker_notes?: string;
}
