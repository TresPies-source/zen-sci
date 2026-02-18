import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PdfToolbar } from './PdfToolbar';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfViewerProps {
  pdfBase64: string;
  pageCount: number;
}

export function PdfViewer({ pdfBase64, pageCount }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        const binaryString = atob(pdfBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
        setPdf(doc);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load PDF');
      }
    };
    loadPdf();
  }, [pdfBase64]);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;
    const renderPage = async () => {
      try {
        const page = await pdf.getPage(currentPage);
        const viewport = page.getViewport({ scale: zoom / 100 });
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to render page');
      }
    };
    renderPage();
  }, [pdf, currentPage, zoom]);

  if (error) {
    return (
      <div style={{ padding: '16px', background: '#f8d7da', color: '#721c24', borderRadius: 'var(--zen-radius)', fontSize: '13px' }}>
        <strong>PDF Error:</strong> {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <PdfToolbar currentPage={currentPage} pageCount={pageCount} zoom={zoom} onPageChange={setCurrentPage} onZoomChange={setZoom} />
      <div style={{
        border: 'var(--zen-border)',
        borderRadius: 'var(--zen-radius)',
        overflow: 'auto',
        maxHeight: '600px',
        display: 'flex',
        justifyContent: 'center',
        background: 'var(--mcp-bg-secondary, #f5f5f5)',
      }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
