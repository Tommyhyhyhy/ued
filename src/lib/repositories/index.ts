import 'server-only';
import { parseFilters } from '@/lib/search-filters';
import { isDemo } from '@/lib/config';
import { readDemo } from './demo-store';
import { filterDocuments, PAGE_SIZE } from './search';
import { supabase } from '@/lib/supabase/server';
import { publicDocument, normalize } from '@/lib/utils';
import type { Catalog, Filters, StudyDocument, DocumentPage, DocumentFile } from '@/types';
type RawDocument = Omit<StudyDocument, 'file' | 'contributor_name'> & {
  document_files: DocumentFile[];
  profiles: { display_name: string } | null;
};
function mapDocument(d: RawDocument): StudyDocument {
  const { document_files, profiles, ...rest } = d;
  return {
    ...rest,
    tags: d.tags ?? [],
    file: document_files[0],
    contributor_name: profiles?.display_name ?? 'Thành viên cộng đồng',
  };
}
const select = '*,document_files!inner(*),profiles!documents_uploader_id_fkey(display_name)';
export async function getPublicStats(): Promise<{
  documents: number;
  downloads: number;
  contributors: number;
  faculties: Record<string, number>;
}> {
  if (isDemo()) {
    const docs = (await readDemo()).documents.filter(publicDocument);
    return {
      documents: docs.length,
      downloads: docs.reduce((n, d) => n + d.download_count, 0),
      contributors: new Set(docs.map((d) => d.uploader_id)).size,
      faculties: docs.reduce(
        (r, d) => ({ ...r, [d.faculty_id]: (r[d.faculty_id] ?? 0) + 1 }),
        {} as Record<string, number>,
      ),
    };
  }
  const { data, error } = await (await supabase()).rpc('library_stats');
  if (error) throw error;
  return data;
}
export async function getCatalog(): Promise<Catalog> {
  if (isDemo()) return (await readDemo()).catalog;
  const db = await supabase();
  const results = await Promise.all(
    ['universities', 'faculties', 'majors', 'courses', 'document_types'].map((t) =>
      db.from(t).select('*').order('name'),
    ),
  );
  results.forEach((r) => {
    if (r.error) throw r.error;
  });
  return {
    document_types: results[4].data!,
    universities: results[0].data!,
    faculties: results[1].data!,
    majors: results[2].data!,
    courses: results[3].data!,
  } as Catalog;
}
export async function listDocuments(filters: Filters = {}): Promise<DocumentPage> {
  filters = parseFilters(filters);
  const page = Math.max(1, Math.min(10000, Math.floor(Number(filters.page) || 1)));
  if (isDemo()) {
    const s = await readDemo();
    const all = filterDocuments(s.documents, filters, s.catalog);
    return {
      items: all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      total: all.length,
      page,
      pageSize: PAGE_SIZE,
    };
  }
  const db = await supabase();
  if (filters.q?.trim() && filters.sort === 'relevance') {
    const { data, error } = await db.rpc('search_documents_page', {
      p_filters: { ...filters, q: normalize(filters.q) },
      p_page: page,
      p_page_size: PAGE_SIZE,
    });
    if (error) throw error;
    const result = data as Omit<DocumentPage, 'items'> & { items: RawDocument[] };
    return { ...result, items: result.items.map(mapDocument) };
  }
  let q = db
    .from('documents')
    .select(select, { count: 'exact' })
    .eq('status', 'approved')
    .eq('visibility', 'public');
  if (filters.q)
    q = q.textSearch('search_vector', normalize(filters.q), { type: 'websearch', config: 'simple' });
  const equals: Record<string, string | undefined> = {
    uploader_id: filters.uploader,
    university_id: filters.university,
    faculty_id: filters.faculty,
    major_id: filters.major,
    course_id: filters.course,
    document_type: filters.type,
    semester: filters.semester,
    academic_year: filters.year,
    language: filters.language,
  };
  for (const [key, value] of Object.entries(equals)) if (value) q = q.eq(key, value);
  if (filters.rating) q = q.gte('average_rating', Number(filters.rating));
  if (filters.since) q = q.gte('created_at', filters.since);
  if (filters.file) {
    const { data: fileRows, error } = await db
      .from('document_files')
      .select('document_id')
      .eq('extension', filters.file);
    if (error) throw error;
    q = q.in(
      'id',
      (fileRows ?? []).map((f) => f.document_id),
    );
  }
  const sort: Record<string, string> = {
    downloads: 'download_count',
    views: 'view_count',
    rating: 'average_rating',
    az: 'title',
  };
  q = q
    .order(sort[filters.sort ?? ''] ?? 'created_at', { ascending: filters.sort === 'az' })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const { data, error, count } = await q;
  if (error) throw error;
  return {
    items: ((data ?? []) as unknown as RawDocument[]).map(mapDocument),
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  };
}
export async function getDocument(slugOrId: string, includePrivate = false): Promise<StudyDocument | null> {
  if (isDemo()) {
    const d = (await readDemo()).documents.find((d) => d.slug === slugOrId || d.id === slugOrId);
    return d && (includePrivate || publicDocument(d)) ? d : null;
  }
  const db = await supabase();
  let q = db.from('documents').select(select);
  q = /^[0-9a-f-]{36}$/.test(slugOrId) ? q.eq('id', slugOrId) : q.eq('slug', slugOrId);
  if (!includePrivate) q = q.eq('status', 'approved').eq('visibility', 'public');
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return data ? mapDocument(data as unknown as RawDocument) : null;
}
export async function userDocuments(userId: string) {
  if (isDemo()) return (await readDemo()).documents.filter((d) => d.uploader_id === userId);
  const db = await supabase();
  const { data, error } = await db
    .from('documents')
    .select(select)
    .eq('uploader_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as RawDocument[]).map(mapDocument);
}
export async function favoriteDocuments(userId: string) {
  if (isDemo()) {
    const s = await readDemo();
    return s.documents.filter(
      (d) => publicDocument(d) && s.favorites.some((f) => f.user_id === userId && f.document_id === d.id),
    );
  }
  const db = await supabase();
  const { data: ids, error } = await db.from('favorites').select('document_id').eq('user_id', userId);
  if (error) throw error;
  const { data } = await db
    .from('documents')
    .select(select)
    .in(
      'id',
      ids.map((f) => f.document_id),
    );
  return ((data ?? []) as unknown as RawDocument[]).map(mapDocument);
}
export async function adminData() {
  if (isDemo()) {
    const s = await readDemo();
    return {
      documents: s.documents,
      profiles: s.profiles,
      reports: s.reports,
      audit: s.audit,
      comments: s.comments,
    };
  }
  const db = await supabase();
  const results = await Promise.all([
    db.from('documents').select(select).order('created_at', { ascending: false }).limit(200),
    db.from('profiles').select('*,user_roles(role)').limit(200),
    db.from('reports').select('*').order('created_at', { ascending: false }).limit(200),
    db.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100),
    db.from('comments').select('*').order('created_at', { ascending: false }).limit(100),
  ]);
  results.forEach((r) => {
    if (r.error) throw r.error;
  });
  return {
    documents: (results[0].data as unknown as RawDocument[]).map(mapDocument),
    profiles: (results[1].data ?? []).map((p) => ({
      ...p,
      role:
        ['admin', 'moderator', 'contributor', 'student'].find((role) =>
          p.user_roles?.some((r: { role: string }) => r.role === role),
        ) ?? 'student',
    })),
    reports: results[2].data ?? [],
    audit: results[3].data ?? [],
    comments: results[4].data ?? [],
  };
}

export async function getContactInbox() {
  if (isDemo()) return (await readDemo()).contacts;
  const { data, error } = await (
    await supabase()
  )
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data as { id: string; name: string; email: string; message: string; created_at: string }[];
}
export async function getDownloadTrend(): Promise<{ day: string; count: number }[]> {
  if (isDemo()) {
    const state = await readDemo();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - 6 + i);
      const day = d.toISOString().slice(0, 10);
      return { day, count: state.downloads.filter((key) => key.endsWith(day)).length };
    });
  }
  const { data, error } = await (await supabase()).rpc('download_trend');
  if (error) throw error;
  return data.map((d: { day: string; count: number | string }) => ({ ...d, count: Number(d.count) }));
}
