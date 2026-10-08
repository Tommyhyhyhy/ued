import { CategoryPage } from '@/components/common/category-page';
import { getCatalog } from '@/lib/repositories';
import type { Filters } from '@/types';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalog();
  return {
    title: catalog.courses.find((x) => x.slug === slug)?.name ?? 'Danh mục',
    alternates: { canonical: '/mon-hoc/' + slug },
  };
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Filters>;
}) {
  return <CategoryPage kind="courses" slug={(await params).slug} filters={await searchParams} />;
}
