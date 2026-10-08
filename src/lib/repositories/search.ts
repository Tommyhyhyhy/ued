import type { Filters, StudyDocument, Catalog } from '@/types';
import { normalize, publicDocument } from '@/lib/utils';
export const PAGE_SIZE = 9;
export function filterDocuments(
  documents: StudyDocument[],
  f: Filters,
  catalog: Catalog,
  includePrivate = false,
) {
  const words = normalize(f.q ?? '')
    .split(/\s+/)
    .filter(Boolean);
  const result = documents.filter((d) => {
    if (!includePrivate && !publicDocument(d)) return false;
    const course = catalog.courses.find((c) => c.id === d.course_id);
    const text = normalize([d.title, d.description, course?.name, course?.code, ...d.tags].join(' '));
    return (
      (!f.uploader || d.uploader_id === f.uploader) &&
      words.every((w) => text.includes(w)) &&
      (!f.university || d.university_id === f.university) &&
      (!f.faculty || d.faculty_id === f.faculty) &&
      (!f.major || d.major_id === f.major) &&
      (!f.course || d.course_id === f.course) &&
      (!f.type || d.document_type === f.type) &&
      (!f.file || d.file.extension === f.file) &&
      (!f.semester || d.semester === f.semester) &&
      (!f.year || d.academic_year === f.year) &&
      (!f.language || d.language === f.language) &&
      (!f.rating || d.average_rating >= Number(f.rating)) &&
      (!f.verified || d.status === 'approved') &&
      (!f.since || new Date(d.created_at) >= new Date(f.since))
    );
  });
  result.sort((a, b) =>
    f.sort === 'downloads'
      ? b.download_count - a.download_count
      : f.sort === 'views'
        ? b.view_count - a.view_count
        : f.sort === 'rating'
          ? b.average_rating - a.average_rating
          : f.sort === 'az'
            ? a.title.localeCompare(b.title, 'vi')
            : f.sort === 'relevance' && words.length
              ? Number(normalize(b.title).includes(words.join(' '))) -
                Number(normalize(a.title).includes(words.join(' ')))
              : b.created_at.localeCompare(a.created_at),
  );
  return result;
}
