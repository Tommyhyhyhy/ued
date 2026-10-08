import { parseFilters } from '@/lib/search-filters';
import { getCatalog, listDocuments } from '@/lib/repositories';
import { PageHeading } from '@/components/common/ui';
import { DocumentBrowser } from '@/components/search/browser';
import type { Filters } from '@/types';
export const metadata = {
  title: 'Khám phá tài liệu',
  description: 'Tìm và lọc giáo trình, đề thi, bài giảng theo khoa và môn học.',
  alternates: { canonical: '/tai-lieu' },
};
export default async function Browse({ searchParams }: { searchParams: Promise<Filters> }) {
  const filters = parseFilters(await searchParams);
  const [catalog, initial] = await Promise.all([getCatalog(), listDocuments(filters)]);
  return (
    <div className="container page-space">
      <PageHeading eyebrow="THƯ VIỆN CỦA CỘNG ĐỒNG" title="Tìm đúng tài liệu. Học theo cách của bạn.">
        Khám phá học liệu được chia sẻ theo từng khoa, ngành và môn học.
      </PageHeading>
      <DocumentBrowser catalog={catalog} initial={initial} filters={filters} />
    </div>
  );
}
