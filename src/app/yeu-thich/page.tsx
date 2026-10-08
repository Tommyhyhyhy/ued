import { redirect } from 'next/navigation';
import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { favoriteDocuments, getCatalog } from '@/lib/repositories';
import { DocumentCard } from '@/components/documents/document-card';
import { PageHeading, EmptyState } from '@/components/common/ui';
export const metadata = { title: 'Tài liệu đã lưu', robots: { index: false, follow: false } };
export default async function Favorites() {
  const user = await currentUser();
  if (!user) redirect('/dang-nhap');
  const [docs, catalog] = await Promise.all([favoriteDocuments(user.id), getCatalog()]);
  return (
    <div className="container page-space">
      <PageHeading eyebrow="THƯ VIỆN CÁ NHÂN" title="Dành để đọc. Lưu để nhớ.">
        {docs.length} tài liệu đã lưu cho hành trình học tập của bạn.
      </PageHeading>
      <div className="document-grid">
        {docs.map((d) => (
          <DocumentCard key={d.id} document={d} catalog={catalog} />
        ))}
        {!docs.length && (
          <EmptyState
            title="Thư viện của bạn đang chờ những khám phá mới"
            description="Nhấn biểu tượng lưu trên tài liệu bạn yêu thích để tìm lại dễ dàng."
            action={
              <Link className="button primary" href="/tai-lieu">
                Khám phá học liệu
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
