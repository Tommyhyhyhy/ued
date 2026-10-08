'use client';
import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, Minus, Plus, Maximize, ScanLine } from 'lucide-react';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
export default function PdfViewer({ url }: { url: string }) {
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(650);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new ResizeObserver((entries) => setWidth(Math.max(200, entries[0].contentRect.width - 32)));
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div className="pdf-viewer" ref={ref}>
      <div className="pdf-toolbar">
        <div>
          <button
            className="icon-button"
            aria-label="Trang trước"
            disabled={page <= 1}
            onClick={() => setPage((n) => n - 1)}
          >
            <ChevronLeft size={19} />
          </button>
          <span>
            Trang {page} / {pages || '…'}
          </span>
          <button
            className="icon-button"
            aria-label="Trang tiếp"
            disabled={page >= pages}
            onClick={() => setPage((n) => n + 1)}
          >
            <ChevronRight size={19} />
          </button>
        </div>
        <div>
          <button
            className="icon-button"
            aria-label="Thu nhỏ"
            disabled={zoom <= 0.6}
            onClick={() => setZoom((v) => v - 0.2)}
          >
            <Minus size={16} />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            className="icon-button"
            aria-label="Phóng to"
            disabled={zoom >= 2}
            onClick={() => setZoom((v) => v + 0.2)}
          >
            <Plus size={16} />
          </button>
          <button className="icon-button" aria-label="Vừa chiều rộng" onClick={() => setZoom(1)}>
            <ScanLine size={17} />
          </button>
          <button
            className="icon-button"
            aria-label="Toàn màn hình"
            onClick={() => {
              if (document.fullscreenElement) void document.exitFullscreen();
              else void ref.current?.requestFullscreen().catch(() => {});
            }}
          >
            <Maximize size={17} />
          </button>
        </div>
      </div>
      <div className="pdf-canvas">
        <Document
          file={url}
          suspense={false}
          onLoadSuccess={({ numPages }) => setPages(numPages)}
          loading={<div className="pdf-loading skeleton" />}
          error={
            <div className="empty-state">
              <h3>Không thể mở bản xem trước</h3>
              <p>Bạn vẫn có thể tải file để đọc trên thiết bị.</p>
              <a className="button secondary" href={url}>
                Mở tài liệu
              </a>
            </div>
          }
        >
          <Page
            pageNumber={page}
            width={Math.min(width, 850) * zoom}
            renderTextLayer
            renderAnnotationLayer
            loading={<div className="pdf-loading skeleton" />}
          />
        </Document>
      </div>
      <div className="pdf-footnote">
        Tài liệu được xem trước bằng PDF.js · Nội dung do người đóng góp cung cấp.
      </div>
    </div>
  );
}
