import { useRef, useEffect } from 'react';

interface Props {
  htmlContent: string;
}

export function RevealViewer({ htmlContent }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = htmlContent;
    }
  }, [htmlContent]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <iframe ref={iframeRef} style={{ flex: 1, border: 'none', width: '100%', height: '60vh' }} sandbox="allow-scripts allow-same-origin" title="Reveal.js Presentation" />
    </div>
  );
}
