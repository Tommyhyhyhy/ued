
-- UEDocs: tenant-consistent schema, private assets, database-enforced authorization.
create extension if not exists pgcrypto;
create extension if not exists unaccent;
create schema if not exists private;
revoke all on schema private from public,anon,authenticated;
grant usage on schema private to authenticated, anon, service_role;

create table public.universities (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 180),
 short_name text not null default '', slug text not null unique check(slug ~ '^[a-z0-9-]+$'),
 logo text not null default '/branding/ued-logo-placeholder.svg', cover_image text not null default '',
 brand_color text not null default '#1769ff' check(brand_color ~ '^#[0-9a-fA-F]{6}$'),
 email_domain text, is_active boolean not null default true, created_at timestamptz not null default now()
);
create table public.faculties (
 id uuid primary key default gen_random_uuid(), university_id uuid not null references public.universities,
 name text not null check(length(name) between 2 and 180), slug text not null unique,
 icon text not null default 'BookOpen', color text not null default 'blue', description text not null default '',
 unique(university_id,id)
);
create table public.majors (
 id uuid primary key default gen_random_uuid(), university_id uuid not null references public.universities,
 faculty_id uuid not null, name text not null, slug text not null unique,
 foreign key(university_id,faculty_id) references public.faculties(university_id,id),
 unique(university_id,faculty_id,id)
);
create table public.courses (
 id uuid primary key default gen_random_uuid(), university_id uuid not null references public.universities,
 faculty_id uuid not null, major_id uuid, name text not null, slug text not null unique, code text not null,
 foreign key(university_id,faculty_id) references public.faculties(university_id,id),
 foreign key(university_id,faculty_id,major_id) references public.majors(university_id,faculty_id,id),
 unique(university_id,faculty_id,id), unique(university_id,code)
);
create table public.academic_terms (
 id uuid primary key default gen_random_uuid(), university_id uuid not null references public.universities,
 academic_year text not null, semester text not null check(semester in ('1','2','3')),
 starts_at date, ends_at date, unique(university_id,academic_year,semester),
 check(ends_at is null or starts_at is null or ends_at>=starts_at)
);
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(length(display_name) between 2 and 70), bio text not null default '' check(length(bio)<=500),
 university_id uuid references public.universities, created_at timestamptz not null default now()
);
create table public.user_roles (
 user_id uuid not null references public.profiles(id) on delete cascade,
 role text not null check(role in ('student','contributor','moderator','admin')), primary key(user_id,role)
);
create or replace function private.has_role(wanted text[]) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role=any(wanted));
$$;
revoke all on function private.has_role(text[]) from public,anon,authenticated;
grant execute on function private.has_role(text[]) to anon,authenticated,service_role;

create table public.document_types(id uuid primary key default gen_random_uuid(),name text not null unique check(length(name) between 2 and 80),slug text not null unique);
create table public.documents (
 id uuid primary key default gen_random_uuid(), university_id uuid not null references public.universities,
 faculty_id uuid not null, major_id uuid, course_id uuid not null,
 uploader_id uuid not null constraint documents_uploader_id_fkey references public.profiles,
 title text not null check(length(title) between 8 and 180), slug text not null unique check(slug ~ '^[a-z0-9-]+$'),
 description text not null check(length(description) between 20 and 5000),
 document_type text not null references public.document_types(name) on update cascade,
 language text not null default 'vi' check(language in ('vi','en')), lecturer_name text,
 academic_year text not null, semester text not null check(semester in ('1','2','3')),
 status text not null default 'pending' check(status in ('draft','pending','approved','rejected','hidden','removed')),
 visibility text not null default 'public' check(visibility in ('public','private')),
 rights_confirmation boolean not null default false,
 rejection_reason text, average_rating numeric(3,2) not null default 0 check(average_rating between 0 and 5),
 rating_count integer not null default 0 check(rating_count>=0), view_count bigint not null default 0 check(view_count>=0),
 download_count bigint not null default 0 check(download_count>=0),
 approved_by uuid references public.profiles, approved_at timestamptz,
 tags text[] not null default '{}', search_vector tsvector,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(university_id,faculty_id) references public.faculties(university_id,id),
 foreign key(university_id,faculty_id,major_id) references public.majors(university_id,faculty_id,id),
 foreign key(university_id,faculty_id,course_id) references public.courses(university_id,faculty_id,id),
 check(status in ('draft','rejected','removed') or rights_confirmation),
 check(status<>'approved' or (approved_by is not null and approved_at is not null)),
 check(array_length(tags,1) is null or array_length(tags,1)<=10)
);
create table public.document_files (
 id uuid primary key default gen_random_uuid(), document_id uuid not null unique references public.documents on delete cascade,
 storage_path text not null unique, original_name text not null, safe_name text not null,
 mime_type text not null, extension text not null check(extension in ('pdf','docx','pptx','xlsx','zip')),
 size_bytes bigint not null check(size_bytes>0 and size_bytes<=3145728), page_count integer check(page_count>0),
 checksum text, scan_status text not null default 'not_configured' check(scan_status in ('not_configured','pending','clean','infected')),
 created_at timestamptz not null default now()
);
create table public.tags (id uuid primary key default gen_random_uuid(),name text not null unique);
create table public.document_tags (document_id uuid references public.documents on delete cascade,tag_id uuid references public.tags on delete cascade,primary key(document_id,tag_id));
create table public.favorites (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles on delete cascade,
 document_id uuid not null references public.documents on delete cascade,created_at timestamptz not null default now(),unique(user_id,document_id)
);
create table public.ratings (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles on delete cascade,
 document_id uuid not null references public.documents on delete cascade,value smallint not null check(value between 1 and 5),
 created_at timestamptz not null default now(),unique(user_id,document_id)
);
create table public.comments (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles on delete cascade,
 document_id uuid not null references public.documents on delete cascade,body text not null check(length(body) between 3 and 2000),
 hidden boolean not null default false,created_at timestamptz not null default now()
);
create table public.reports (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles on delete cascade,
 document_id uuid references public.documents on delete set null,reason text not null,
 details text not null check(length(details) between 10 and 3000),status text not null default 'open' check(status in ('open','resolved','dismissed')),
 resolution text,created_at timestamptz not null default now(),resolved_by uuid references public.profiles,resolved_at timestamptz
);
create table public.download_events (
 id uuid primary key default gen_random_uuid(),document_id uuid not null references public.documents on delete cascade,
 visitor_hash text not null,day date not null default current_date,created_at timestamptz not null default now(),
 unique(document_id,visitor_hash,day)
);
create table public.view_events (like public.download_events including defaults including constraints including indexes);
alter table public.view_events add foreign key(document_id) references public.documents on delete cascade;
create table public.moderation_actions (
 id uuid primary key default gen_random_uuid(),document_id uuid not null references public.documents on delete cascade,
 actor_id uuid not null references public.profiles,status text not null,reason text not null default '',created_at timestamptz not null default now()
);
create table public.contact_messages (
 id uuid primary key default gen_random_uuid(),name text not null check(length(name) between 2 and 70),email text not null check(length(email)<=254),
 message text not null check(length(message) between 10 and 5200),created_at timestamptz not null default now()
);
create table public.audit_logs (
 id uuid primary key default gen_random_uuid(),actor_id uuid references public.profiles,
 action text not null,target_id uuid not null,details text not null default '',created_at timestamptz not null default now()
);
create table private.rate_limits (key text primary key,n integer not null,expires_at timestamptz not null);

create index documents_university on public.documents(university_id);
create index documents_faculty on public.documents(faculty_id);
create index documents_course on public.documents(course_id);
create index documents_uploader on public.documents(uploader_id);
create index documents_status_created on public.documents(status,visibility,created_at desc);
create index documents_downloads on public.documents(download_count desc) where status='approved';
create index documents_search on public.documents using gin(search_vector);
create index comments_document on public.comments(document_id,created_at desc);
create index reports_status on public.reports(status,created_at desc);
create index audit_created on public.audit_logs(created_at desc);
create index document_files_extension on public.document_files(extension);
create index favorites_document on public.favorites(document_id);
create index ratings_document on public.ratings(document_id);

-- Resolve an existing unaccent installation without assuming its namespace.
create or replace function private.normalize_text(input text) returns text language plpgsql stable set search_path='' as $$
declare ns text; result text;
begin
 select n.nspname into ns from pg_catalog.pg_extension e join pg_catalog.pg_namespace n on n.oid=e.extnamespace where e.extname='unaccent';
 execute pg_catalog.format('select %I.unaccent($1)',ns) into result using input;
 return result;
end $$;
create or replace function private.prepare_document() returns trigger language plpgsql set search_path='' as $$
declare course_text text;
begin
 if current_user='authenticated' and not private.has_role(array['admin','moderator']) then
  if tg_op='INSERT' then
   if new.status not in ('draft','pending') or new.uploader_id<>auth.uid() or new.approved_by is not null or new.approved_at is not null or new.average_rating<>0 or new.rating_count<>0 or new.view_count<>0 or new.download_count<>0 or new.rejection_reason is not null then raise exception 'Protected document fields'; end if;
  else
   if row(new.uploader_id,new.approved_by,new.approved_at,new.average_rating,new.rating_count,new.view_count,new.download_count,new.rejection_reason,new.created_at)
     is distinct from row(old.uploader_id,old.approved_by,old.approved_at,old.average_rating,old.rating_count,old.view_count,old.download_count,old.rejection_reason,old.created_at)
     then raise exception 'Protected document fields'; end if;
  end if;
 end if;
 select c.name||' '||c.code into course_text from public.courses c where c.id=new.course_id;
 new.search_vector:=to_tsvector('simple',private.normalize_text(coalesce(new.title,'')||' '||coalesce(new.description,'')||' '||coalesce(course_text,'')||' '||array_to_string(new.tags,' ')));
 new.updated_at:=now();return new;
end $$;
create trigger document_prepare before insert or update on public.documents for each row execute function private.prepare_document();

create or replace function private.protect_comment() returns trigger language plpgsql set search_path='' as $$
begin
 if current_user='authenticated' and not private.has_role(array['admin','moderator']) then
  if new.hidden or (tg_op='UPDATE' and row(new.user_id,new.document_id,new.created_at) is distinct from row(old.user_id,old.document_id,old.created_at)) then raise exception 'Protected comment fields';end if;
 end if;return new;
end $$;
create trigger comment_protect before insert or update on public.comments for each row execute function private.protect_comment();

create or replace function private.rating_aggregate() returns trigger language plpgsql security definer set search_path='' as $$
declare did uuid:=coalesce(new.document_id,old.document_id);
begin
 update public.documents set average_rating=(select coalesce(avg(value),0) from public.ratings where document_id=did),
 rating_count=(select count(*) from public.ratings where document_id=did) where id=did;
 return null;
end $$;
create trigger rating_aggregate after insert or update or delete on public.ratings for each row execute function private.rating_aggregate();

create or replace function private.create_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,display_name,university_id)
 values(new.id,left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''),'Thành viên'),70),(select id from public.universities where slug='ued' limit 1));
 insert into public.user_roles(user_id,role) values(new.id,'student');
 return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.create_profile();

create or replace function private.log_category() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.audit_logs(actor_id,action,target_id,details) values(auth.uid(),'category.'||lower(tg_op),new.id,tg_table_name||': '||new.name);return new;
end $$;

-- All public tables get RLS, including lookup tables and append-only activity logs.
alter table public.document_types enable row level security;
alter table public.universities enable row level security;
alter table public.faculties enable row level security;
alter table public.majors enable row level security;
alter table public.courses enable row level security;
alter table public.academic_terms enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.documents enable row level security;
alter table public.document_files enable row level security;
alter table public.tags enable row level security;
alter table public.document_tags enable row level security;
alter table public.favorites enable row level security;
alter table public.ratings enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;
alter table public.download_events enable row level security;
alter table public.view_events enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.contact_messages enable row level security;
alter table public.audit_logs enable row level security;
create policy document_types_read on public.document_types for select to anon,authenticated using(true);
create policy document_types_admin on public.document_types for all to authenticated using(private.has_role(array['admin'])) with check(private.has_role(array['admin']));
create trigger category_audit after insert or update on public.document_types for each row execute function private.log_category();
create policy "universities_read" on public.universities for select to anon,authenticated using(true);
create policy "universities_admin" on public.universities for all to authenticated using(private.has_role(array['admin'])) with check(private.has_role(array['admin']));
create policy "faculties_read" on public.faculties for select to anon,authenticated using(true);
create policy "faculties_admin" on public.faculties for all to authenticated using(private.has_role(array['admin'])) with check(private.has_role(array['admin']));
create policy "majors_read" on public.majors for select to anon,authenticated using(true);
create policy "majors_admin" on public.majors for all to authenticated using(private.has_role(array['admin'])) with check(private.has_role(array['admin']));
create policy "courses_read" on public.courses for select to anon,authenticated using(true);
create policy "courses_admin" on public.courses for all to authenticated using(private.has_role(array['admin'])) with check(private.has_role(array['admin']));
create policy "academic_terms_read" on public.academic_terms for select to anon,authenticated using(true);
create policy "academic_terms_admin" on public.academic_terms for all to authenticated using(private.has_role(array['admin'])) with check(private.has_role(array['admin']));
create policy "tags_read" on public.tags for select to anon,authenticated using(true);
create policy "tags_admin" on public.tags for all to authenticated using(private.has_role(array['admin'])) with check(private.has_role(array['admin']));
create trigger category_audit after insert or update on public.universities for each row execute function private.log_category();
create trigger category_audit after insert or update on public.faculties for each row execute function private.log_category();
create trigger category_audit after insert or update on public.majors for each row execute function private.log_category();
create trigger category_audit after insert or update on public.courses for each row execute function private.log_category();

create policy profiles_read on public.profiles for select to anon,authenticated using(true);
-- Profiles contain only public display fields, never email addresses or password hashes.
create policy profiles_self on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy roles_read on public.user_roles for select to authenticated using(user_id=auth.uid() or private.has_role(array['admin','moderator']));
-- Role mutation is possible only through set_user_role/become_contributor.
create policy docs_public on public.documents for select to anon,authenticated using(status='approved' and visibility='public');
create policy docs_owner on public.documents for select to authenticated using(uploader_id=auth.uid());
create policy docs_staff on public.documents for select to authenticated using(private.has_role(array['admin','moderator']));
create policy docs_insert on public.documents for insert to authenticated with check(uploader_id=auth.uid() and status in ('draft','pending') and rights_confirmation and private.has_role(array['contributor','moderator','admin']));
create policy docs_edit on public.documents for update to authenticated using(uploader_id=auth.uid() and status in ('draft','pending')) with check(uploader_id=auth.uid() and status in ('draft','pending'));
-- Staff transitions use transactional RPC. No broad staff UPDATE policy.
create policy files_read on public.document_files for select to anon,authenticated using(exists(select 1 from public.documents d where d.id=document_id));
create policy doc_tags_read on public.document_tags for select to anon,authenticated using(exists(select 1 from public.documents d where d.id=document_id));
create policy favorites_owner on public.favorites for select to authenticated using(user_id=auth.uid());
create policy favorites_add on public.favorites for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.documents d where d.id=document_id and d.status='approved' and d.visibility='public'));
create policy favorites_delete on public.favorites for delete to authenticated using(user_id=auth.uid());
create policy ratings_read on public.ratings for select to authenticated using(user_id=auth.uid() or private.has_role(array['admin','moderator']));
create policy ratings_add on public.ratings for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.documents d where d.id=document_id and d.status='approved' and d.visibility='public'));
create policy ratings_update on public.ratings for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid() and exists(select 1 from public.documents d where d.id=document_id and d.status='approved' and d.visibility='public'));
create policy comments_read on public.comments for select to anon,authenticated using((not hidden and exists(select 1 from public.documents d where d.id=document_id and d.status='approved' and d.visibility='public')) or private.has_role(array['admin','moderator']));
create policy comments_add on public.comments for insert to authenticated with check(user_id=auth.uid() and not hidden and exists(select 1 from public.documents d where d.id=document_id and d.status='approved' and d.visibility='public'));
create policy comments_edit on public.comments for update to authenticated using(user_id=auth.uid() and not hidden) with check(user_id=auth.uid() and not hidden);
create policy reports_add on public.reports for insert to authenticated with check(user_id=auth.uid() and status='open' and resolution is null and resolved_by is null and resolved_at is null and exists(select 1 from public.documents d where d.id=document_id and d.status='approved' and d.visibility='public'));
create policy reports_read on public.reports for select to authenticated using(user_id=auth.uid() or private.has_role(array['admin','moderator']));
create policy moderation_read on public.moderation_actions for select to authenticated using(private.has_role(array['admin','moderator']) or exists(select 1 from public.documents d where d.id=document_id and d.uploader_id=auth.uid()));
create policy audit_staff_read on public.audit_logs for select to authenticated using(private.has_role(array['admin','moderator']));
create policy contacts_admin_read on public.contact_messages for select to authenticated using(private.has_role(array['admin']));
create policy views_staff_read on public.view_events for select to authenticated using(private.has_role(array['admin','moderator']));
create policy downloads_staff_read on public.download_events for select to authenticated using(private.has_role(array['admin','moderator']));

-- Supabase can have broad pre-existing default privileges; narrow those explicitly.
revoke all on public.document_types,public.universities,public.faculties,public.majors,public.courses,public.academic_terms,public.profiles,public.user_roles,public.documents,public.document_files,public.tags,public.document_tags,public.favorites,public.ratings,public.comments,public.reports,public.download_events,public.view_events,public.moderation_actions,public.contact_messages,public.audit_logs from anon,authenticated;
grant select on all tables in schema public to anon,authenticated;
grant insert on public.documents,public.favorites,public.ratings,public.comments,public.reports to authenticated;
grant update(title,description,faculty_id,major_id,course_id,document_type,language,lecturer_name,academic_year,semester,visibility,tags,status) on public.documents to authenticated;
grant update(display_name,bio,university_id) on public.profiles to authenticated;
grant update(value) on public.ratings to authenticated;
grant update(body) on public.comments to authenticated;
grant delete on public.favorites to authenticated;
grant insert,update on public.document_types,public.universities,public.faculties,public.majors,public.courses to authenticated;
grant all on all tables in schema public to service_role;

create or replace function public.become_contributor() returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 insert into public.user_roles(user_id,role) values(auth.uid(),'contributor') on conflict do nothing;
 insert into public.audit_logs(actor_id,action,target_id,details) values(auth.uid(),'user.contributor',auth.uid(),'Accepted contributor responsibilities');
end $$;
create or replace function public.moderate_document(p_id uuid,p_status text,p_reason text default '') returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.has_role(array['admin','moderator']) then raise exception 'Forbidden';end if;
 if p_status not in ('approved','rejected','hidden','removed') then raise exception 'Invalid status';end if;
 if p_status='rejected' and length(trim(p_reason))<5 then raise exception 'Rejection reason required';end if;
 if p_status='approved' and not exists(select 1 from public.document_files where document_id=p_id and scan_status in ('clean','not_configured')) then raise exception 'No reviewed file available';end if;
 update public.documents set status=p_status,rejection_reason=nullif(p_reason,''),approved_by=case when p_status='approved' then auth.uid() else null end,approved_at=case when p_status='approved' then now() else null end where id=p_id;
 if not found then raise exception 'Document not found';end if;
 insert into public.moderation_actions(document_id,actor_id,status,reason) values(p_id,auth.uid(),p_status,p_reason);
 insert into public.audit_logs(actor_id,action,target_id,details) values(auth.uid(),'document.'||p_status,p_id,p_reason);
end $$;
create or replace function public.resolve_report(p_id uuid,p_resolution text,p_document_status text default 'keep') returns void language plpgsql security definer set search_path='' as $$
declare did uuid;
begin
 if not private.has_role(array['admin','moderator']) then raise exception 'Forbidden';end if;
 if length(trim(p_resolution))<5 or p_document_status not in ('keep','hidden','removed') then raise exception 'Invalid resolution';end if;
 update public.reports set status='resolved',resolution=p_resolution,resolved_by=auth.uid(),resolved_at=now() where id=p_id returning document_id into did;
 if not found then raise exception 'Report not found';end if;
 if p_document_status<>'keep' and did is not null then perform public.moderate_document(did,p_document_status,p_resolution);end if;
 insert into public.audit_logs(actor_id,action,target_id,details) values(auth.uid(),'report.resolved',p_id,p_resolution);
end $$;
create or replace function public.moderate_comment(p_id uuid,p_hidden boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.has_role(array['admin','moderator']) then raise exception 'Forbidden';end if;
 update public.comments set hidden=p_hidden where id=p_id;
 if not found then raise exception 'Comment not found';end if;
 insert into public.audit_logs(actor_id,action,target_id,details) values(auth.uid(),'comment.moderated',p_id,p_hidden::text);
end $$;
create or replace function public.set_user_role(p_user uuid,p_role text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.has_role(array['admin']) then raise exception 'Forbidden';end if;
 if p_role not in ('student','contributor','moderator','admin') then raise exception 'Invalid role';end if;
 if p_user=auth.uid() and p_role<>'admin' then raise exception 'Cannot remove own admin role';end if;
 delete from public.user_roles where user_id=p_user;
 insert into public.user_roles(user_id,role) values(p_user,p_role);
 insert into public.audit_logs(actor_id,action,target_id,details) values(auth.uid(),'user.role',p_user,p_role);
end $$;
create or replace function public.record_document_event(p_document uuid,p_visitor text,p_kind text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.documents where id=p_document and status='approved' and visibility='public') then return;end if;
 if p_visitor !~ '^[0-9a-f]{64}$' then raise exception 'Invalid visitor';end if;
 if p_kind='view' then
  insert into public.view_events(document_id,visitor_hash) values(p_document,p_visitor) on conflict(document_id,visitor_hash,day) do nothing;
  if found then update public.documents set view_count=view_count+1 where id=p_document;end if;
 elsif p_kind='download' then
  insert into public.download_events(document_id,visitor_hash) values(p_document,p_visitor) on conflict(document_id,visitor_hash,day) do nothing;
  if found then update public.documents set download_count=download_count+1 where id=p_document;end if;
 else raise exception 'Invalid event';end if;
end $$;
create or replace function public.consume_rate_limit(p_key text,p_limit integer) returns boolean language plpgsql security definer set search_path='' as $$
declare count_value integer;
begin
 delete from private.rate_limits where expires_at<now()-interval '1 hour';
 insert into private.rate_limits(key,n,expires_at) values(p_key,1,now()+interval '1 minute')
 on conflict(key) do update set n=case when private.rate_limits.expires_at<now() then 1 else private.rate_limits.n+1 end,
 expires_at=case when private.rate_limits.expires_at<now() then now()+interval '1 minute' else private.rate_limits.expires_at end returning n into count_value;
 return count_value<=p_limit;
end $$;
create or replace function public.library_stats() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('documents',count(*),'downloads',coalesce(sum(download_count),0),'contributors',count(distinct uploader_id),
 'faculties',(select coalesce(jsonb_object_agg(f.faculty_id,f.n),'{}') from (select faculty_id,count(*) n from public.documents where status='approved' and visibility='public' group by faculty_id) f))
 from public.documents where status='approved' and visibility='public';
$$;
revoke all on function public.become_contributor() from public,anon,authenticated;
revoke all on function public.moderate_document(uuid,text,text) from public,anon,authenticated;
revoke all on function public.resolve_report(uuid,text,text) from public,anon,authenticated;
revoke all on function public.moderate_comment(uuid,boolean) from public,anon,authenticated;
revoke all on function public.set_user_role(uuid,text) from public,anon,authenticated;
revoke all on function public.record_document_event(uuid,text,text) from public,anon,authenticated;
revoke all on function public.consume_rate_limit(text,integer) from public,anon,authenticated;
revoke all on function public.library_stats() from public,anon,authenticated;
grant execute on function public.become_contributor(),public.moderate_document(uuid,text,text),public.resolve_report(uuid,text,text),public.moderate_comment(uuid,boolean),public.set_user_role(uuid,text) to authenticated;
grant execute on function public.record_document_event(uuid,text,text),public.consume_rate_limit(text,integer) to service_role;
grant execute on function public.library_stats() to anon,authenticated;

-- Private bucket. Files are NEVER served through public URLs.
create or replace function public.rate_document(p_id uuid,p_value integer) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or p_value not between 1 and 5 then raise exception 'Invalid rating';end if;
 if not exists(select 1 from public.documents where id=p_id and status='approved' and visibility='public') then raise exception 'Document unavailable';end if;
 insert into public.ratings(user_id,document_id,value) values(auth.uid(),p_id,p_value)
 on conflict(user_id,document_id) do update set value=excluded.value;
end $$;
revoke all on function public.rate_document(uuid,integer) from public,anon,authenticated;
grant execute on function public.rate_document(uuid,integer) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('documents','documents',false,3145728,array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/zip'])
 on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy documents_storage_insert on storage.objects for insert to authenticated with check(
 bucket_id='documents' and (storage.foldername(name))[1]=auth.uid()::text
 and exists(select 1 from public.documents d where d.id::text=(storage.foldername(name))[2] and d.uploader_id=auth.uid() and d.status in ('draft','pending'))
 and private.has_role(array['contributor','moderator','admin']));
create policy documents_storage_owner_read on storage.objects for select to authenticated using(
 bucket_id='documents' and (private.has_role(array['admin','moderator']) or exists(select 1 from public.documents d where d.id::text=(storage.foldername(name))[2] and d.uploader_id=auth.uid())));
-- No public SELECT, owner UPDATE or DELETE policy: an approved file cannot be replaced.


-- Staff RLS applies to the event aggregation; no service key is used here.
create or replace function public.download_trend() returns table(day text,count bigint)
language sql stable security invoker set search_path='' as $$
 select to_char(d.day,'YYYY-MM-DD'),count(e.id)
 from generate_series(current_date-6,current_date,interval '1 day') as d(day)
 left join public.download_events e on e.day=d.day::date
 group by d.day order by d.day;
$$;
revoke all on function public.download_trend() from public,anon,authenticated;
grant execute on function public.download_trend() to authenticated;
-- Ranked Vietnamese search, preserving caller RLS and server-side pagination.
create or replace function public.search_documents_page(
 p_filters jsonb default '{}'::jsonb,p_page integer default 1,p_page_size integer default 9
) returns jsonb language sql stable security invoker set search_path='' as $$
 with settings as (
 select greatest(1,least(coalesce(p_page,1),10000)) as page,
 greatest(1,least(coalesce(p_page_size,9),50)) as page_size,
 websearch_to_tsquery('simple'::regconfig,private.normalize_text(coalesce(p_filters->>'q',''))) as query
 ), matched as materialized (
 select d.*,jsonb_build_array(to_jsonb(f)) as document_files,
 case when p.id is null then null else jsonb_build_object('display_name',p.display_name) end as profiles,
 ts_rank(d.search_vector,s.query)+2*ts_rank(to_tsvector('simple'::regconfig,private.normalize_text(d.title)),s.query) as _rank
 from public.documents d join public.document_files f on f.document_id=d.id
 left join public.profiles p on p.id=d.uploader_id cross join settings s
 where d.status='approved' and d.visibility='public' and d.search_vector @@ s.query
 and (nullif(p_filters->>'university','') is null or d.university_id=nullif(p_filters->>'university','')::uuid)
 and (nullif(p_filters->>'uploader','') is null or d.uploader_id=nullif(p_filters->>'uploader','')::uuid)
 and (nullif(p_filters->>'faculty','') is null or d.faculty_id=nullif(p_filters->>'faculty','')::uuid)
 and (nullif(p_filters->>'major','') is null or d.major_id=nullif(p_filters->>'major','')::uuid)
 and (nullif(p_filters->>'course','') is null or d.course_id=nullif(p_filters->>'course','')::uuid)
 and (nullif(p_filters->>'type','') is null or d.document_type=p_filters->>'type')
 and (nullif(p_filters->>'file','') is null or f.extension=p_filters->>'file')
 and (nullif(p_filters->>'semester','') is null or d.semester=p_filters->>'semester')
 and (nullif(p_filters->>'year','') is null or d.academic_year=p_filters->>'year')
 and (nullif(p_filters->>'language','') is null or d.language=p_filters->>'language')
 and (nullif(p_filters->>'rating','') is null or d.average_rating>=nullif(p_filters->>'rating','')::numeric)
 and (nullif(p_filters->>'since','') is null or d.created_at>=nullif(p_filters->>'since','')::timestamptz)
 ), page_rows as (
 select * from matched order by _rank desc,created_at desc,id
 limit (select page_size from settings) offset (select (page-1)*page_size from settings)
 )
 select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(r)-'_rank'-'search_vector' order by r._rank desc,r.created_at desc,r.id) from page_rows r),'[]'::jsonb),
 'total',(select count(*) from matched),'page',(select page from settings),'pageSize',(select page_size from settings));
$$;
revoke all on function public.search_documents_page(jsonb,integer,integer) from public,anon,authenticated;
grant execute on function public.search_documents_page(jsonb,integer,integer) to anon,authenticated;
