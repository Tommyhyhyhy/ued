import type { MetadataRoute } from 'next';
import { getCatalog, listDocuments } from '@/lib/repositories';
import { siteUrl } from '@/lib/config';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const catalog = await getCatalog();
  const first = await listDocuments();
  const docs = [...first.items];
  for (let p = 2; p <= Math.min(500, Math.ceil(first.total / first.pageSize)); p++) {
    docs.push(...(await listDocuments({ page: String(p) })).items);
  }
  return [
    ...[
      '',
      '/tai-lieu',
      '/khoa',
      '/gioi-thieu',
      '/quy-dinh',
      '/ban-quyen',
      '/quyen-rieng-tu',
      '/lien-he',
    ].map((path) => ({
      url: base + path,
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.7,
    })),
    ...catalog.faculties.map((f) => ({ url: base + '/khoa/' + f.slug })),
    ...catalog.majors.map((m) => ({ url: base + '/nganh/' + m.slug })),
    ...catalog.courses.map((c) => ({ url: base + '/mon-hoc/' + c.slug })),
    ...docs.map((d) => ({ url: base + '/tai-lieu/' + d.slug, lastModified: new Date(d.updated_at) })),
  ];
}
