import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

interface Props {
  pdfBase64: string;
  currentSlide: number;
  onPrev: () => void;
  onNext: () => void;
  slideCount: number;
}

export function BeamerViewer({ pdfBase64, currentSlide, onPrev, onNext, slideCount }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);

  useEffect(() => {
    const loadPdf = async () => {
      const binaryString = atob(pdfBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const doc = await pdfjsLib.getDocument(bytes).promise;
      setPdf(doc);
    };
    if (pdfBase64) loadPdf();
  }, [pdfBase64]);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;
    const renderPage = async () => {
      const page = await pdf.getPage(currentSlide);
      const scale = 1.5;
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current!;
      const context = canvas.getContext('2d')!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport }).promise;
    };
    renderPage();
  }, [pdf, currentSlide]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#ddd', overflow: 'auto', maxHeight: '60vh' }}>
        <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderTop: 'var(--zen-border)' }}>
        <button onClick={onPrev} disabled={currentSlide === 1} style={{ padding: '6px 12px', border: 'var(--zen-border)', borderRadius: '4px', cursor: currentSlide === 1 ? 'not-allowed' : 'pointer', background: 'var(--mcp-bg-primary, #fff)' }}>Prev</button>
        <span style={{ fontSize: '13px', color: 'var(--mcp-text-secondary, #666)' }}>Slide {currentSlide} of {slideCount}</span>
        <button onClick={onNext} disabled={currentSlide === slideCount} style={{ padding: '6px 12px', border: 'var(--zen-border)', borderRadius: '4px', cursor: currentSlide === slideCount ? 'not-allowed' : 'pointer', background: 'var(--mcp-bg-primary, #fff)' }}>Next</button>
      </div>
    </div>
  );
}
