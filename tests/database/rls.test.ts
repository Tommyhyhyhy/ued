import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { PGlite, type Transaction } from '@electric-sql/pglite';
import { unaccent } from '@electric-sql/pglite/contrib/unaccent';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { readFile } from 'node:fs/promises';
import { uid } from '@/data/demo';
let db: PGlite;
const owner = uid(200),
  student = uid(900),
  moderator = uid(901),
  admin = uid(902);
async function asRole<T>(role: string, id: string | null, fn: (tx: Transaction) => Promise<T>) {
  return db.transaction(async (tx) => {
    await tx.exec('set local role ' + role);
    await tx.query("select set_config('request.jwt.claims',$1,true)", [JSON.stringify({ sub: id, role })]);
    return fn(tx);
  });
}
beforeAll(async () => {
  db = await PGlite.create({ extensions: { unaccent, pgcrypto } });
  await db.exec(`
 create schema auth; create schema storage; create schema extensions; create extension unaccent with schema extensions;
 create role anon nologin nobypassrls;create role authenticated nologin nobypassrls;create role service_role nologin bypassrls;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb->>'sub','')::uuid$$;
 grant usage on schema auth,extensions to anon,authenticated,service_role;
 grant execute on all functions in schema auth to anon,authenticated,service_role;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets,name text,owner_id text,unique(bucket_id,name));
 create function storage.foldername(text) returns text[] language sql immutable as $$select (string_to_array($1,'/'))[1:array_length(string_to_array($1,'/'),1)-1]$$;
 alter table storage.objects enable row level security;
 grant usage on schema storage to anon,authenticated,service_role;
 grant select,insert,update,delete on storage.objects to anon,authenticated,service_role;
 -- Model Supabase's pre-existing default grants, so narrowing ACLs is tested.
 alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
 alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;
 `);
  await db.exec(await readFile('supabase/migrations/202609190001_initial.sql', 'utf8'));
  await db.exec(await readFile('supabase/seed.sql', 'utf8'));
  await db.query(
    "insert into auth.users(id,email) values($1,'student@example.invalid'),($2,'mod@example.invalid'),($3,'admin@example.invalid')",
    [student, moderator, admin],
  );
  await db.query("insert into public.user_roles(user_id,role) values($1,'moderator'),($2,'admin')", [
    moderator,
    admin,
  ]);
}, 60000);
afterAll(async () => {
  await db?.close();
});
describe('ranked public search RPC', () => {
  const search = (role: string, id: string | null, filters: Record<string, string>, page = 1) =>
    asRole(role, id, (tx) =>
      tx.query<{
        result: {
          items: Array<{
            id: string;
            status: string;
            document_files: Array<{ extension: string }>;
            profiles: { display_name: string };
          }>;
          total: number;
        };
      }>('select public.search_documents_page($1::jsonb,$2,2) as result', [JSON.stringify(filters), page]),
    );
  it('preserves accents, nested metadata, filtering and totals on empty pages', async () => {
    const a = (await search('anon', null, { q: 'tam ly hoc' })).rows[0].result;
    const b = (await search('anon', null, { q: 'tâm lý học' })).rows[0].result;
    expect(a).toEqual(b);
    expect(a.items.length).toBeGreaterThan(0);
    expect(a.items[0].document_files[0].extension).toBeTruthy();
    expect(a.items[0].profiles.display_name).toBeTruthy();
    const first = (await search('anon', null, { q: 'hoc', file: 'pdf' })).rows[0].result;
    const later = (await search('anon', null, { q: 'hoc', file: 'pdf' }, 999)).rows[0].result;
    expect(first.items.every((d) => d.document_files[0].extension === 'pdf')).toBe(true);
    expect(later.items).toEqual([]);
    expect(later.total).toBe(first.total);
  });
  it('returns only public documents for anonymous, owners and moderators', async () => {
    const anon = (await search('anon', null, { q: 'tai lieu' })).rows[0].result;
    for (const id of [owner, moderator]) {
      const result = (await search('authenticated', id, { q: 'tai lieu' })).rows[0].result;
      expect(result).toEqual(anon);
    }
    expect(anon.items.every((d) => d.status === 'approved')).toBe(true);
  });
  it('ranks a title match above a newer description-only match under anon RLS', async () => {
    const rollback = new Error('rollback search fixtures');
    await db
      .transaction(async (tx) => {
        await tx.query(
          "update public.documents set title='Relevancetest học liệu',description='Nội dung tham khảo cho sinh viên',created_at='2020-01-01' where id=$1",
          [uid(1000)],
        );
        await tx.query(
          "update public.documents set title='Học liệu khác',description='Relevancetest nội dung tham khảo dành cho sinh viên',created_at=now() where id=$1",
          [uid(1001)],
        );
        await tx.exec('set local role anon');
        const r = await tx.query<{ result: { items: { id: string }[] } }>(
          'select public.search_documents_page($1::jsonb) as result',
          [JSON.stringify({ q: 'relevancetest' })],
        );
        expect(r.rows[0].result.items.map((d) => d.id)).toEqual([uid(1000), uid(1001)]);
        throw rollback;
      })
      .catch((error) => {
        if (error !== rollback) throw error;
      });
    const fn = await db.query<{ prosecdef: boolean }>(
      "select prosecdef from pg_proc where proname='search_documents_page'",
    );
    expect(fn.rows[0].prosecdef).toBe(false);
  });
});
describe('PostgreSQL/RLS integration (Supabase auth/storage stubs)', () => {
  it('runs migration + seed and exposes approved public records only', async () => {
    const r = await asRole('anon', null, (tx) =>
      tx.query<{ status: string }>('select status from public.documents'),
    );
    expect(r.rows).toHaveLength(24);
    expect(r.rows.every((x) => x.status === 'approved')).toBe(true);
  });
  it('searches Vietnamese text without accents', async () => {
    const r = await asRole('anon', null, (tx) =>
      tx.query(
        "select title from public.documents where search_vector @@ websearch_to_tsquery('simple','tam ly hoc')",
      ),
    );
    expect(r.rows).toContainEqual({ title: 'Tài liệu Tâm lý học đại cương' });
  });
  it('owner can see pending while other student cannot', async () => {
    const own = await asRole('authenticated', owner, (tx) =>
      tx.query('select id from public.documents where id=$1', [uid(1024)]),
    );
    const other = await asRole('authenticated', student, (tx) =>
      tx.query('select id from public.documents where id=$1', [uid(1024)]),
    );
    expect(own.rows).toHaveLength(1);
    expect(other.rows).toHaveLength(0);
  });
  it('owner can edit pending title but cannot self-approve or rewrite counters', async () => {
    await asRole('authenticated', owner, (tx) =>
      tx.query("update public.documents set title='Tài liệu thử chỉnh sửa hợp lệ' where id=$1", [uid(1024)]),
    );
    await expect(
      asRole('authenticated', owner, (tx) =>
        tx.query("update public.documents set status='approved' where id=$1", [uid(1024)]),
      ),
    ).rejects.toThrow();
    await expect(
      asRole('authenticated', owner, (tx) =>
        tx.query('update public.documents set download_count=9999 where id=$1', [uid(1024)]),
      ),
    ).rejects.toThrow();
  });
  it('student cannot mutate roles or invoke service-only event routines', async () => {
    await expect(
      asRole('authenticated', student, (tx) =>
        tx.query("insert into public.user_roles values($1,'admin')", [student]),
      ),
    ).rejects.toThrow();
    await expect(
      asRole('anon', null, (tx) =>
        tx.query("select public.record_document_event($1,$2,'view')", [uid(1000), 'a'.repeat(64)]),
      ),
    ).rejects.toThrow();
  });
  it('moderator can approve transactionally and writes an audit record', async () => {
    await asRole('authenticated', moderator, (tx) =>
      tx.query("select public.moderate_document($1,'approved','Reviewed in SQL test')", [uid(1024)]),
    );
    const result = await db.query('select action from public.audit_logs where target_id=$1', [uid(1024)]);
    expect(result.rows).toContainEqual({ action: 'document.approved' });
  });
  it('moderator cannot manage categories, admin can', async () => {
    await expect(
      asRole('authenticated', moderator, (tx) =>
        tx.query(
          "insert into public.faculties(university_id,name,slug) values($1,'Khoa thử nghiệm','test-mod')",
          [uid(1)],
        ),
      ),
    ).rejects.toThrow();
    await asRole('authenticated', admin, (tx) =>
      tx.query(
        "insert into public.faculties(university_id,name,slug) values($1,'Khoa thử nghiệm','test-admin')",
        [uid(1)],
      ),
    );
  });
  it('enforces tenant consistency with composite FKs', async () => {
    await db.query(
      "insert into public.universities(id,name,slug) values($1,'Trường thử nghiệm','test-university')",
      [uid(3)],
    );
    await expect(
      db.query(
        "insert into public.courses(university_id,faculty_id,name,slug,code) values($1,$2,'Môn sai trường','bad-course','BAD')",
        [uid(3), uid(10)],
      ),
    ).rejects.toThrow();
  });
  it('favorites belong to their owner', async () => {
    await asRole('authenticated', student, (tx) =>
      tx.query('insert into public.favorites(user_id,document_id) values($1,$2)', [student, uid(1000)]),
    );
    const r = await asRole('authenticated', owner, (tx) => tx.query('select * from public.favorites'));
    expect(r.rows).toHaveLength(0);
  });
  it('rating updates cannot transfer ownership or document identity', async () => {
    await asRole('authenticated', student, (tx) =>
      tx.query('select public.rate_document($1,4)', [uid(1000)]),
    );
    await asRole('authenticated', student, (tx) =>
      tx.query('select public.rate_document($1,5)', [uid(1000)]),
    );
    const r = await db.query<{ average_rating: string }>(
      'select average_rating from public.documents where id=$1',
      [uid(1000)],
    );
    expect(Number(r.rows[0].average_rating)).toBe(5);
    await expect(
      asRole('authenticated', student, (tx) =>
        tx.query('update public.ratings set document_id=$1 where user_id=$2', [uid(1001), student]),
      ),
    ).rejects.toThrow();
  });
  it('blocks forged storage paths and approved replacements', async () => {
    await expect(
      asRole('authenticated', owner, (tx) =>
        tx.query("insert into storage.objects(bucket_id,name) values('documents',$1)", [
          student + '/' + uid(1025) + '/evil.pdf',
        ]),
      ),
    ).rejects.toThrow();
    await expect(
      asRole('authenticated', owner, (tx) =>
        tx.query("insert into storage.objects(bucket_id,name) values('documents',$1)", [
          owner + '/' + uid(1000) + '/replacement.pdf',
        ]),
      ),
    ).rejects.toThrow();
    await asRole('authenticated', uid(201), (tx) =>
      tx.query("insert into storage.objects(bucket_id,name) values('documents',$1)", [
        uid(201) + '/' + uid(1025) + '/pending.pdf',
      ]),
    );
  });
  it('deduplicates daily event counters', async () => {
    const before = await db.query<{ view_count: number }>(
      'select view_count from public.documents where id=$1',
      [uid(1000)],
    );
    for (let i = 0; i < 2; i++)
      await asRole('service_role', null, (tx) =>
        tx.query("select public.record_document_event($1,$2,'view')", [uid(1000), 'b'.repeat(64)]),
      );
    const after = await db.query<{ view_count: number }>(
      'select view_count from public.documents where id=$1',
      [uid(1000)],
    );
    expect(Number(after.rows[0].view_count)).toBe(Number(before.rows[0].view_count) + 1);
  });
});
