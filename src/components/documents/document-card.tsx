'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bookmark,
  BadgeCheck,
  Download,
  Eye,
  Star,
  FileText,
  Presentation,
  Table2,
  FileArchive,
} from 'lucide-react';
import type { StudyDocument, Catalog } from '@/types';
import { number, normalize } from '@/lib/utils';
import { toast } from 'sonner';
export function DocumentCard({
  document: d,
  catalog,
  list = false,
  query = '',
}: {
  document: StudyDocument;
  catalog: Catalog;
  list?: boolean;
  query?: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState<boolean | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const c = catalog.courses.find((c) => c.id === d.course_id);
  const f = catalog.faculties.find((f) => f.id === d.faculty_id);
  const Icon =
    d.file.extension === 'pptx'
      ? Presentation
      : d.file.extension === 'xlsx'
        ? Table2
        : d.file.extension === 'zip'
          ? FileArchive
          : FileText;
  async function bookmark() {
    setBusy(true);
    try {
      const r = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'favorite', document_id: d.id }),
      });
      if (r.status === 401) {
        toast('Đăng nhập để lưu tài liệu', {
          action: { label: 'Đăng nhập', onClick: () => router.push('/dang-nhap') },
        });
        return;
      }
      const b = await r.json();
      if (!r.ok) toast.error(b.error);
      else {
        setSaved(b.saved);
        toast.success(b.saved ? 'Đã lưu vào thư viện của bạn' : 'Đã bỏ lưu tài liệu');
      }
    } catch {
      toast.error('Không thể kết nối. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className={'document-card ' + (list ? 'document-list' : '')}>
      <Link
        href={'/tai-lieu/' + d.slug}
        className={'document-cover ' + (f?.color ?? 'blue')}
        tabIndex={-1}
        aria-hidden="true"
      >
        <span className="file-label">{d.file.extension.toUpperCase()}</span>
        <div className="cover-icon">
          <Icon size={36} strokeWidth={1.35} />
        </div>
        <span className="cover-subject">{c?.name}</span>
        <span className="cover-lines" />
      </Link>
      <div className="document-content">
        <div className="card-topline">
          <span className="doc-type">{d.document_type}</span>
          <button
            className="icon-button bookmark"
            onClick={bookmark}
            disabled={busy}
            aria-pressed={saved}
            aria-label={(saved ? 'Bỏ lưu ' : 'Lưu ') + d.title}
          >
            <Bookmark size={18} />
          </button>
        </div>
        <Link href={'/tai-lieu/' + d.slug}>
          <h3>
            {d.title.split(/(\s+)/).map((part, i) =>
              query.trim() &&
              normalize(query)
                .split(/\s+/)
                .some((word) => normalize(part).includes(word)) ? (
                <mark key={i}>{part}</mark>
              ) : (
                part
              ),
            )}{' '}
            <BadgeCheck className="verified-icon" size={16} aria-label="Đã kiểm duyệt" />
          </h3>
        </Link>
        <p className="doc-course">{c?.name}</p>
        <p className="doc-faculty">{f?.name}</p>
        <div className="doc-meta">
          <span>{d.file.page_count ? d.file.page_count + ' trang' : d.file.extension.toUpperCase()}</span>
          <span>•</span>
          <span>{new Date(d.created_at).toLocaleDateString('vi-VN')}</span>
        </div>
        <div className="card-footer">
          <span>
            <Eye size={14} />
            {number(d.view_count)}
          </span>
          <span>
            <Download size={14} />
            {number(d.download_count)}
          </span>
          <span className="rating">
            <Star size={14} fill="currentColor" />
            {d.average_rating.toFixed(1)}
          </span>
        </div>
      </div>
    </article>
  );
}
