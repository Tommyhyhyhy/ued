import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BadgeCheck, Download, Eye, Star, FileText, ChevronRight, Calendar, ShieldCheck } from 'lucide-react';
import { getCatalog, getDocument, listDocuments } from '@/lib/repositories';
import { Badge, SectionHeading } from '@/components/common/ui';
import { DocumentCard } from '@/components/documents/document-card';
import { PdfPreview } from '@/components/documents/pdf-preview';
import { DocumentInteractions } from '@/components/documents/interactions';
import { date, fileSize, number } from '@/lib/utils';
import { siteUrl } from '@/lib/config';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const d = await getDocument((await params).slug);
  return {
    title: d?.title ?? 'Không tìm thấy tài liệu',
    description: d?.description,
    alternates: { canonical: '/tai-lieu/' + (await params).slug },
    openGraph: {
      title: d?.title,
      description: d?.description,
      images: [{ url: '/og.png', width: 1731, height: 909, alt: 'UEDocs – Học liệu được sẻ chia' }],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: d?.title,
      description: d?.description,
      images: [{ url: '/og.png', width: 1731, height: 909, alt: 'UEDocs – Học liệu được sẻ chia' }],
    },
  };
}
export default async function Detail({ params }: { params: Promise<{ slug: string }> }) {
  const d = await getDocument((await params).slug);
  if (!d) notFound();
  const [catalog, related, sameCourse, fromContributor] = await Promise.all([
    getCatalog(),
    listDocuments({ faculty: d.faculty_id }),
    listDocuments({ course: d.course_id }),
    listDocuments({ uploader: d.uploader_id }),
  ]);
  const f = catalog.faculties.find((x) => x.id === d.faculty_id);
  const c = catalog.courses.find((x) => x.id === d.course_id);
  const major = catalog.majors.find((x) => x.id === d.major_id);
  const url = siteUrl() + '/tai-lieu/' + d.slug;
  const breadcrumb = [
    ['Trang chủ', siteUrl()],
    ['Tài liệu', siteUrl() + '/tai-lieu'],
    [d.title, url],
  ];
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      name: d.title,
      description: d.description,
      inLanguage: d.language,
      learningResourceType: d.document_type,
      dateModified: d.updated_at,
      url,
      author: { '@type': 'Person', name: d.contributor_name },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumb.map(([name, item], i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name,
        item,
      })),
    },
  ];
  return (
    <div className="container page-space">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <nav className="breadcrumb" aria-label="Đường dẫn">
        <Link href="/">Trang chủ</Link>
        <ChevronRight size={13} />
        <Link href="/tai-lieu">Tài liệu</Link>
        <ChevronRight size={13} />
        <Link href={'/khoa/' + f?.slug}>{f?.name}</Link>
      </nav>
      <div className="detail-layout">
        <div>
          <div className="detail-heading">
            <div className="inline-badges">
              <Badge>{d.document_type}</Badge>
              <Badge tone="green">
                <BadgeCheck size={13} />
                Đã kiểm duyệt
              </Badge>
            </div>
            <h1>{d.title}</h1>
            <div className="detail-stats">
              <span>
                <Eye size={15} />
                {number(d.view_count)} lượt xem
              </span>
              <span>
                <Download size={15} />
                {number(d.download_count)} lượt tải
              </span>
              <span>
                <Star size={15} />
                {d.average_rating.toFixed(1)} ({d.rating_count} đánh giá)
              </span>
            </div>
            <p>{d.description}</p>
          </div>
          {d.file.extension === 'pdf' ? (
            <PdfPreview url={'/api/documents/' + d.id + '/file'} />
          ) : (
            <div className="unsupported-preview">
              <FileText size={50} />
              <h2>Tài liệu {d.file.extension.toUpperCase()}</h2>
              <p>Định dạng này chưa hỗ trợ xem trước. Tải về để mở bằng ứng dụng phù hợp.</p>
              <a className="button primary" href={'/api/documents/' + d.id + '/file?download=1'}>
                Tải tài liệu
              </a>
            </div>
          )}
          <DocumentInteractions id={d.id} />
        </div>
        <aside className="detail-sidebar">
          <div className="panel download-panel">
            <div className="download-file">
              <span>
                <FileText size={28} />
              </span>
              <div>
                <strong>{d.file.extension.toUpperCase()}</strong>
                <p>
                  {fileSize(d.file.size_bytes)}
                  {d.file.page_count ? ' · ' + d.file.page_count + ' trang' : ''}
                </p>
              </div>
            </div>
            <a className="button primary full" href={'/api/documents/' + d.id + '/file?download=1'}>
              <Download size={18} />
              Tải tài liệu miễn phí
            </a>
            <p className="download-note">
              <ShieldCheck size={14} />
              Đã qua kiểm duyệt nội dung thủ công
            </p>
            <div className="divider" />
            <h3>Thông tin học liệu</h3>
            <dl>
              {[
                ['Trường', catalog.universities.find((u) => u.id === d.university_id)?.name],
                ['Khoa', f?.name],
                ['Ngành', major?.name],
                ['Môn học', c?.name],
                ['Mã học phần', c?.code],
                ['Giảng viên', d.lecturer_name || 'Chưa cung cấp'],
                ['Học kỳ', 'Học kỳ ' + d.semester],
                ['Năm học', d.academic_year],
                ['Ngôn ngữ', d.language === 'vi' ? 'Tiếng Việt' : 'Tiếng Anh'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{k === 'Môn học' ? <Link href={'/mon-hoc/' + c?.slug}>{v}</Link> : v}</dd>
                </div>
              ))}
            </dl>
            <div className="detail-updated">
              <Calendar size={14} />
              Cập nhật {date(d.updated_at)}
            </div>
          </div>
          <div className="panel contributor-panel">
            <span className="contributor-avatar">{d.contributor_name.slice(0, 1)}</span>
            <h3>{d.contributor_name}</h3>
            <p>Người đóng góp học liệu</p>
            <Link href={'/tai-lieu?course=' + d.course_id} className="text-link">
              Học liệu cùng môn <ChevronRight size={15} />
            </Link>
          </div>
          <div className="tag-list">
            {d.tags.map((t) => (
              <Link href={'/tim-kiem?q=' + encodeURIComponent(t)} key={t}>
                #{t}
              </Link>
            ))}
          </div>
        </aside>
      </div>
      <section className="section related-section">
        <SectionHeading
          title="Tiếp tục khám phá"
          description="Tài liệu liên quan và học liệu cùng môn."
          href={'/tai-lieu?faculty=' + d.faculty_id}
        />
        <div className="document-grid">
          {related.items
            .filter((x) => x.id !== d.id)
            .slice(0, 3)
            .map((x) => (
              <DocumentCard key={x.id} document={x} catalog={catalog} />
            ))}
        </div>
      </section>
      {[
        ['Học liệu cùng môn', sameCourse.items, 'course=' + d.course_id],
        ['Thêm từ ' + d.contributor_name, fromContributor.items, 'uploader=' + d.uploader_id],
      ].map(([title, items, query]) => {
        const docs = (items as typeof sameCourse.items).filter((x) => x.id !== d.id).slice(0, 3);
        return (
          docs.length > 0 && (
            <section className="section related-section" key={title as string}>
              <SectionHeading title={title as string} href={'/tai-lieu?' + query} />
              <div className="document-grid">
                {docs.map((x) => (
                  <DocumentCard key={x.id} document={x} catalog={catalog} />
                ))}
              </div>
            </section>
          )
        );
      })}
    </div>
  );
}
