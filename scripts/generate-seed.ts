import { writeFile, mkdir } from 'node:fs/promises';
import { catalog, contributors, demoDocuments, uid } from '../src/data/demo';
function literal(v: unknown): string {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean') return String(v);
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) return 'ARRAY[' + v.map(literal).join(',') + ']::text[]';
  return "'" + String(v).replaceAll("'", "''") + "'";
}
function insert(table: string, rows: object[]) {
  return (
    rows
      .map(
        (row) =>
          'insert into ' +
          table +
          ' (' +
          Object.keys(row).join(',') +
          ') values (' +
          Object.values(row).map(literal).join(',') +
          ') on conflict do nothing;',
      )
      .join('\n') + '\n'
  );
}
let sql =
  '-- Synthetic demonstration data. Authors cannot sign in: no passwords or email confirmation.\n-- Apply only to a new demo project. Remove demo content before accepting real uploads.\nbegin;\n';
sql += insert('public.document_types', catalog.document_types);
sql += insert('public.universities', catalog.universities);
sql += insert('public.faculties', catalog.faculties);
sql += insert('public.majors', catalog.majors);
sql += insert('public.courses', catalog.courses);
const profiles = [
  ...contributors,
  {
    id: uid(204),
    display_name: 'Ban kiểm duyệt mẫu',
    bio: 'Tài khoản hệ thống minh họa',
    university_id: uid(1),
    role: 'moderator' as const,
    created_at: '2026-01-01T00:00:00.000Z',
  },
];
sql += insert(
  'auth.users',
  profiles.map((p) => ({
    id: p.id,
    email: 'seed.' + p.id.slice(-4) + '@example.invalid',
    raw_user_meta_data: JSON.stringify({ display_name: p.display_name }),
  })),
);
sql +=
  profiles
    .map(
      (p) =>
        'update public.profiles set display_name=' +
        literal(p.display_name) +
        ',bio=' +
        literal(p.bio) +
        ',university_id=' +
        literal(p.university_id) +
        ' where id=' +
        literal(p.id) +
        ';',
    )
    .join('\n') + '\n';
sql += insert(
  'public.user_roles',
  profiles.filter((p) => p.role === 'contributor').map((p) => ({ user_id: p.id, role: 'contributor' })),
);
sql += insert('public.academic_terms', [
  { university_id: uid(1), academic_year: '2025–2026', semester: '1' },
  { university_id: uid(1), academic_year: '2025–2026', semester: '2' },
]);
sql += insert(
  'public.documents',
  demoDocuments.map((d) => {
    const { file, contributor_name, ...row } = d;
    void file;
    void contributor_name;
    return row;
  }),
);
sql += insert(
  'public.document_files',
  demoDocuments.map((d) => ({
    ...d.file,
    storage_path: d.uploader_id + '/' + d.id + '/' + d.file.safe_name,
  })),
);
sql += 'commit;\n';
await mkdir('supabase', { recursive: true });
await writeFile('supabase/seed.sql', sql);
console.log('Generated seed: 1 university, 8 faculties, 8 majors, 20 courses, 28 documents, 4 contributors.');
