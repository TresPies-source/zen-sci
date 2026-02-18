import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

interface Props {
  pdfBase64: string;
  pageCount: number;
}

export function PDFPreview({ pdfBase64, pageCount }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);

  useEffect(() => {
    const loadPDF = async () => {
      const binaryString = atob(pdfBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
      setPdf(doc);
    };
    if (pdfBase64) loadPDF();
  }, [pdfBase64]);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;
    const renderPage = async () => {
      const page = await pdf.getPage(currentPage);
      const scale = 1.5;
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current!;
      const context = canvas.getContext('2d')!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport }).promise;
    };
    renderPage();
  }, [pdf, currentPage]);

  return (
    <div style={{ marginTop: '12px' }}>
      <canvas ref={canvasRef} style={{ width: '100%', maxWidth: '600px', border: 'var(--zen-border)', borderRadius: 'var(--zen-radius)', marginBottom: '12px' }} />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
        <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1} style={{ padding: '6px 12px', backgroundColor: currentPage <= 1 ? '#ccc' : 'var(--zen-tab-active-bg, #2563eb)', color: '#fff', border: 'none', borderRadius: 'var(--zen-radius)', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
        <span>Page {currentPage} of {pageCount}</span>
        <button onClick={() => setCurrentPage(Math.min(pageCount, currentPage + 1))} disabled={currentPage >= pageCount} style={{ padding: '6px 12px', backgroundColor: currentPage >= pageCount ? '#ccc' : 'var(--zen-tab-active-bg, #2563eb)', color: '#fff', border: 'none', borderRadius: 'var(--zen-radius)', cursor: currentPage >= pageCount ? 'not-allowed' : 'pointer' }}>Next</button>
      </div>
    </div>
  );
}
