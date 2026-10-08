'use client';
import dynamic from 'next/dynamic';
const PdfViewer = dynamic(() => import('./pdf-viewer'), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: 650 }} aria-label="Đang tải trình xem PDF" />,
});
export function PdfPreview({ url }: { url: string }) {
  return <PdfViewer url={url} />;
}
