// servers/slides-mcp/src/tools/list-slide-themes.ts
// Handler for the list_slide_themes MCP tool

export interface SlideTheme {
  name: string;
  format: 'beamer' | 'revealjs';
  description: string;
  colors: {
    primary: string;
    background: string;
    text: string;
  };
  customizable_options: string[];
}

export interface ListSlideThemesResult {
  themes: SlideTheme[];
}

const BEAMER_THEMES: SlideTheme[] = [
  {
    name: 'metropolis',
    format: 'beamer',
    description: 'Modern, minimal Beamer theme with clean typography and flat design',
    colors: { primary: '#23373B', background: '#FAFAFA', text: '#23373B' },
    customizable_options: ['colorTheme', 'fontTheme', 'aspectRatio', 'showNotes'],
  },
  {
    name: 'default',
    format: 'beamer',
    description: 'Standard Beamer theme with navigation bars',
    colors: { primary: '#003366', background: '#FFFFFF', text: '#000000' },
    customizable_options: ['colorTheme', 'fontTheme', 'aspectRatio', 'showNotes'],
  },
  {
    name: 'madrid',
    format: 'beamer',
    description: 'Classic Beamer theme with footer navigation and institutional styling',
    colors: { primary: '#2F4F4F', background: '#FFFFFF', text: '#000000' },
    customizable_options: ['colorTheme', 'fontTheme', 'aspectRatio', 'showNotes'],
  },
  {
    name: 'singapore',
    format: 'beamer',
    description: 'Clean Beamer theme with mini-frame navigation in header',
    colors: { primary: '#003366', background: '#FFFFFF', text: '#000000' },
    customizable_options: ['colorTheme', 'fontTheme', 'aspectRatio', 'showNotes'],
  },
];

const REVEALJS_THEMES: SlideTheme[] = [
  {
    name: 'black',
    format: 'revealjs',
    description: 'Dark background with white text; high contrast for projectors',
    colors: { primary: '#42AFFA', background: '#191919', text: '#FFFFFF' },
    customizable_options: ['transition', 'controls', 'progress', 'katexEnabled'],
  },
  {
    name: 'white',
    format: 'revealjs',
    description: 'Clean white background; ideal for printed handouts',
    colors: { primary: '#2A76DD', background: '#FFFFFF', text: '#222222' },
    customizable_options: ['transition', 'controls', 'progress', 'katexEnabled'],
  },
  {
    name: 'moon',
    format: 'revealjs',
    description: 'Dark blue theme; elegant for technical presentations',
    colors: { primary: '#93A1A1', background: '#002B36', text: '#93A1A1' },
    customizable_options: ['transition', 'controls', 'progress', 'katexEnabled'],
  },
  {
    name: 'serif',
    format: 'revealjs',
    description: 'Warm beige theme with serif typography for academic presentations',
    colors: { primary: '#8B2252', background: '#F0EDE0', text: '#000000' },
    customizable_options: ['transition', 'controls', 'progress', 'katexEnabled'],
  },
];

export function listSlideThemes(
  format: 'beamer' | 'revealjs' | 'all',
): ListSlideThemesResult {
  let themes: SlideTheme[];

  switch (format) {
    case 'beamer':
      themes = BEAMER_THEMES;
      break;
    case 'revealjs':
      themes = REVEALJS_THEMES;
      break;
    default:
      themes = [...BEAMER_THEMES, ...REVEALJS_THEMES];
  }

  return { themes };
}
