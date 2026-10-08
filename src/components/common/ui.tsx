import Link from 'next/link';
import { ArrowRight, BookOpen, SearchX } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="UEDocs — Trang chủ">
      <span className="logo-mark">
        <BookOpen size={23} />
        <i />
      </span>
      <span>
        UE<span className="brand-blue">Docs</span>
        <small>HỌC LIỆU SINH VIÊN</small>
      </span>
    </Link>
  );
}
export function PageHeading({
  eyebrow,
  title,
  children,
  action,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
      {action}
    </header>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {href && (
        <Link className="text-link" href={href}>
          Xem tất cả <ArrowRight size={17} />
        </Link>
      )}
    </div>
  );
}
export function Badge({ children, tone = 'blue' }: { children: ReactNode; tone?: string }) {
  return <span className={cn('badge', tone)}>{children}</span>;
}
export function EmptyState({
  title = 'Chưa tìm thấy tài liệu',
  description = 'Thử một từ khóa khác hoặc điều chỉnh bộ lọc.',
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span>
        <SearchX size={38} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}
