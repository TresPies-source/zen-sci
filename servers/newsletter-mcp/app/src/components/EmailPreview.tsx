interface Props {
  htmlContent: string;
  viewportWidth: number;
  isDarkMode: boolean;
}

export function EmailPreview({ htmlContent, viewportWidth, isDarkMode }: Props) {
  const processedHtml = isDarkMode
    ? `<style>@media (prefers-color-scheme: dark) { body { background: #1a1a1a; color: #e0e0e0; } }</style>${htmlContent}`
    : htmlContent;

  return (
    <div style={{ display: 'flex', justifyContent: viewportWidth === 375 ? 'center' : 'flex-start', overflow: 'auto', backgroundColor: isDarkMode ? '#1a1a1a' : 'var(--mcp-bg-primary, #fff)', borderRadius: 'var(--zen-radius)', border: 'var(--zen-border)', padding: '16px' }}>
      <iframe title={`Email preview - ${viewportWidth}px`} srcDoc={processedHtml} sandbox="allow-scripts allow-same-origin allow-popups" style={{ width: `${viewportWidth}px`, border: 'none', backgroundColor: isDarkMode ? '#1a1a1a' : '#fff', minHeight: '400px' }} />
    </div>
  );
}
