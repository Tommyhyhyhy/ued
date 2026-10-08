import { CategoryPage } from '@/components/common/category-page';
import { getCatalog } from '@/lib/repositories';
import type { Filters } from '@/types';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalog();
  return {
    title: catalog.faculties.find((x) => x.slug === slug)?.name ?? 'Danh mục',
    alternates: { canonical: '/khoa/' + slug },
  };
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Filters>;
}) {
  return <CategoryPage kind="faculties" slug={(await params).slug} filters={await searchParams} />;
}
