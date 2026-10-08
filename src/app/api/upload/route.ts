import { randomUUID, createHash } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { requireUser, AuthError } from '@/lib/auth';
import { guard, json, failure } from '@/lib/http';
import { isDemo, maxUploadBytes } from '@/lib/config';
import { getCatalog } from '@/lib/repositories';
import { demoDir, mutateDemo } from '@/lib/repositories/demo-store';
import { uploadSchema, validateFile } from '@/lib/validation';
import { scanFile } from '@/lib/malware';
import { slugify } from '@/lib/utils';
import { supabase, adminSupabase } from '@/lib/supabase/server';
import type { StudyDocument, DocumentFile } from '@/types';
export async function POST(request: Request) {
  try {
    await guard(request, 'upload', 10);
    const user = await requireUser(['contributor', 'moderator', 'admin']);
    const length = Number(request.headers.get('content-length'));
    if (length > maxUploadBytes() + 65536) throw new AuthError('File vượt giới hạn dung lượng.', 413);
    const form = await request.formData();
    const publishImmediately = form.get('publish_immediately') === 'true';
    if (publishImmediately && user.role !== 'admin')
      throw new AuthError('Chỉ quản trị viên được đăng tài liệu công khai ngay.', 403);
    const input = uploadSchema.parse(JSON.parse(String(form.get('metadata'))));
    const file = form.get('file');
    if (!(file instanceof File)) throw new AuthError('Chưa chọn tài liệu.');
    if (file.size > maxUploadBytes()) throw new AuthError('File vượt giới hạn dung lượng.', 413);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const info = validateFile(file.name, file.type, bytes, maxUploadBytes());
    const catalog = await getCatalog();
    if (!catalog.document_types.some((t) => t.name === input.document_type))
      throw new AuthError('Loại tài liệu không hợp lệ.');
    const course = catalog.courses.find(
      (c) =>
        c.id === input.course_id &&
        c.faculty_id === input.faculty_id &&
        c.university_id === input.university_id,
    );
    if (!course || !catalog.universities.find((u) => u.id === input.university_id && u.is_active))
      throw new AuthError('Môn học, khoa và trường không khớp.');
    if (
      input.major_id &&
      !catalog.majors.find(
        (m) =>
          m.id === input.major_id &&
          m.faculty_id === input.faculty_id &&
          m.university_id === input.university_id,
      )
    )
      throw new AuthError('Ngành không thuộc khoa đã chọn.');
    const scan = await scanFile(bytes);
    const id = randomUUID();
    const now = new Date().toISOString();
    const storagePath = user.id + '/' + id + '/' + randomUUID() + '-' + info.safe_name;
    const docFile: DocumentFile = {
      id: randomUUID(),
      document_id: id,
      storage_path: storagePath,
      original_name: info.safe_name,
      safe_name: info.safe_name,
      mime_type: info.mime_type,
      extension: info.extension as DocumentFile['extension'],
      size_bytes: info.size_bytes,
      page_count: null,
      checksum: createHash('sha256').update(bytes).digest('hex'),
      scan_status: scan,
      created_at: now,
    };
    const d: StudyDocument = {
      id,
      university_id: input.university_id,
      faculty_id: input.faculty_id,
      major_id: input.major_id || null,
      course_id: input.course_id,
      uploader_id: user.id,
      title: input.title,
      slug: slugify(input.title) + '-' + id.slice(0, 8),
      description: input.description,
      document_type: input.document_type,
      language: input.language,
      lecturer_name: input.lecturer_name || null,
      academic_year: input.academic_year,
      semester: input.semester,
      status: publishImmediately ? 'approved' : 'pending',
      visibility: 'public',
      rights_confirmation: true,
      rejection_reason: null,
      average_rating: 0,
      rating_count: 0,
      view_count: 0,
      download_count: 0,
      approved_by: publishImmediately ? user.id : null,
      approved_at: publishImmediately ? now : null,
      created_at: now,
      updated_at: now,
      tags:
        input.tags
          ?.split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 10) ?? [],
      file: docFile,
      contributor_name: user.display_name,
    };
    if (isDemo()) {
      await mkdir(path.join(demoDir(), 'files'), { recursive: true });
      const target = path.join(demoDir(), 'files', id + '.' + info.extension);
      await writeFile(target, bytes);
      try {
        await mutateDemo((s) => {
          s.documents.unshift(d);
          s.audit.unshift({
            id: randomUUID(),
            actor_id: user.id,
            action: publishImmediately ? 'document.published' : 'document.submitted',
            target_id: id,
            details: publishImmediately
              ? 'Quản trị viên đăng công khai trực tiếp.'
              : 'Tài liệu được gửi, chờ duyệt thủ công.',
            created_at: now,
          });
        });
      } catch (e) {
        await unlink(target);
        throw e;
      }
    } else {
      const db = await supabase();
      const admin = adminSupabase();
      const {
        file: _,
        contributor_name: __,
        ...row
      } = {
        ...d,
        status: 'pending' as const,
        approved_by: null,
        approved_at: null,
      };
      void _;
      void __;
      const { error } = await db.from('documents').insert(row);
      if (error) throw error;
      try {
        const upload = await admin.storage
          .from('documents')
          .upload(storagePath, bytes, { contentType: info.mime_type, upsert: false });
        if (upload.error) throw upload.error;
        const saved = await admin.from('document_files').insert(docFile);
        if (saved.error) throw saved.error;
        if (publishImmediately) {
          const published = await db.rpc('moderate_document', {
            p_id: id,
            p_status: 'approved',
            p_reason: '',
          });
          if (published.error) throw published.error;
        }
      } catch (e) {
        await admin.storage.from('documents').remove([storagePath]);
        await admin.from('documents').delete().eq('id', id);
        throw e;
      }
    }
    return json({ ok: true, id, slug: d.slug, status: d.status }, 201);
  } catch (e) {
    return failure(e);
  }
}
