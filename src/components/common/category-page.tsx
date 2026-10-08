import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCatalog, listDocuments } from '@/lib/repositories';
import { PageHeading } from './ui';
import { DocumentBrowser } from '@/components/search/browser';
import type { Filters } from '@/types';
export async function CategoryPage({
  kind,
  slug,
  filters,
}: {
  kind: 'faculties' | 'majors' | 'courses';
  slug: string;
  filters: Filters;
}) {
  const catalog = await getCatalog();
  const record = catalog[kind].find((x) => x.slug === slug);
  if (!record) notFound();
  const key = kind === 'faculties' ? 'faculty' : kind === 'majors' ? 'major' : 'course';
  const applied = { ...filters, [key]: record.id };
  const data = await listDocuments(applied);
  const children =
    kind === 'faculties'
      ? catalog.majors.filter((m) => m.faculty_id === record.id)
      : kind === 'majors'
        ? catalog.courses.filter((c) => c.major_id === record.id)
        : [];
  return (
    <div className="container page-space">
      <nav className="breadcrumb">
        <Link href="/">Trang chủ</Link>
        <span>/</span>
        <Link href="/tai-lieu">Thư viện</Link>
        <span>/</span>
        <span>{record.name}</span>
      </nav>
      <PageHeading
        eyebrow={
          kind === 'faculties'
            ? 'KHÁM PHÁ THEO KHOA'
            : kind === 'majors'
              ? 'KHÁM PHÁ THEO NGÀNH'
              : 'HỌC LIỆU THEO MÔN'
        }
        title={record.name}
      >
        Học liệu được cộng đồng sẻ chia, đồng hành cùng từng học phần của bạn.
      </PageHeading>
      {children.length > 0 && (
        <div className="category-links">
          {children.map((x) => (
            <Link href={'/' + (kind === 'faculties' ? 'nganh' : 'mon-hoc') + '/' + x.slug} key={x.id}>
              {x.name}
            </Link>
          ))}
        </div>
      )}
      <DocumentBrowser catalog={catalog} initial={data} filters={applied} />
    </div>
  );
}
