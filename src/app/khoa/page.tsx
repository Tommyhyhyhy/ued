import Link from 'next/link';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import { getCatalog } from '@/lib/repositories';
import { PageHeading } from '@/components/common/ui';
export const metadata = { title: 'Khoa và ngành học', alternates: { canonical: '/khoa' } };
export const dynamic = 'force-dynamic';
export default async function Page() {
  const catalog = await getCatalog();
  return (
    <div className="container page-space">
      <PageHeading eyebrow="TÌM ĐIỀU BẠN ĐANG HỌC" title="Các khoa tại UED">
        Một điểm bắt đầu cho từng ngành, từng môn học.
      </PageHeading>
      <div className="faculty-grid">
        {catalog.faculties.map((f) => (
          <Link className={'faculty-card ' + f.color} key={f.id} href={'/khoa/' + f.slug}>
            <span className="faculty-icon">
              <BookOpen />
            </span>
            <h3>{f.name}</h3>
            <span className="faculty-count">
              {catalog.courses.filter((c) => c.faculty_id === f.id).length} môn học
            </span>
            <ArrowUpRight className="faculty-arrow" size={18} />
          </Link>
        ))}
      </div>
    </div>
  );
}
