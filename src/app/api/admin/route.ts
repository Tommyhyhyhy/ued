import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { requireUser, AuthError } from '@/lib/auth';
import { isDemo } from '@/lib/config';
import { guard, failure, json } from '@/lib/http';
import { mutateDemo } from '@/lib/repositories/demo-store';
import { supabase } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';
export async function POST(request: Request) {
  try {
    await guard(request, 'admin', 60);
    const u = await requireUser(['admin', 'moderator']);
    const b = await request.json();
    const action = z.enum(['moderate', 'resolve-report', 'hide-comment', 'category', 'role']).parse(b.action);
    const now = new Date().toISOString();
    if (['category', 'role'].includes(action) && u.role !== 'admin')
      throw new AuthError('Chỉ quản trị viên được quản lý danh mục và vai trò.', 403);
    if (action === 'moderate') {
      const ids = z.array(z.uuid()).min(1).max(100).parse(b.ids);
      const status = z.enum(['approved', 'rejected', 'hidden', 'removed']).parse(b.status);
      const reason = z
        .string()
        .trim()
        .max(2000)
        .parse(b.reason ?? '');
      if (status === 'rejected' && reason.length < 5)
        throw new AuthError('Cần nêu lý do từ chối ít nhất 5 ký tự.');
      if (isDemo())
        await mutateDemo((s) => {
          for (const id of ids) {
            const d = s.documents.find((d) => d.id === id);
            if (!d) throw new AuthError('Không tìm thấy tài liệu.', 404);
            d.status = status;
            d.updated_at = now;
            d.rejection_reason = reason || null;
            d.approved_by = status === 'approved' ? u.id : null;
            d.approved_at = status === 'approved' ? now : null;
            s.audit.unshift({
              id: randomUUID(),
              actor_id: u.id,
              action: 'document.' + status,
              target_id: id,
              details: reason || 'Kiểm duyệt thủ công',
              created_at: now,
            });
          }
        });
      else
        for (const id of ids) {
          const { error } = await (
            await supabase()
          ).rpc('moderate_document', { p_id: id, p_status: status, p_reason: reason });
          if (error) throw error;
        }
      return json({ ok: true });
    }
    if (action === 'resolve-report') {
      const id = z.uuid().parse(b.id);
      const resolution = z.string().trim().min(5).max(2000).parse(b.resolution);
      const status = z.enum(['keep', 'hidden', 'removed']).parse(b.document_status);
      if (isDemo())
        await mutateDemo((s) => {
          const r = s.reports.find((r) => r.id === id);
          if (!r) throw new AuthError('Không tìm thấy báo cáo.', 404);
          r.status = 'resolved';
          r.resolution = resolution;
          const d = s.documents.find((d) => d.id === r.document_id);
          if (d && status !== 'keep') {
            d.status = status;
            d.rejection_reason = resolution;
          }
          s.audit.unshift({
            id: randomUUID(),
            actor_id: u.id,
            action: 'report.resolved',
            target_id: id,
            details: resolution,
            created_at: now,
          });
        });
      else {
        const { error } = await (
          await supabase()
        ).rpc('resolve_report', { p_id: id, p_resolution: resolution, p_document_status: status });
        if (error) throw error;
      }
      return json({ ok: true });
    }
    if (action === 'hide-comment') {
      const id = z.uuid().parse(b.id);
      const hidden = z.boolean().parse(b.hidden);
      if (isDemo())
        await mutateDemo((s) => {
          const c = s.comments.find((c) => c.id === id);
          if (!c) throw new AuthError('Không có bình luận.', 404);
          c.hidden = hidden;
          s.audit.unshift({
            id: randomUUID(),
            actor_id: u.id,
            action: 'comment.moderated',
            target_id: id,
            details: String(hidden),
            created_at: now,
          });
        });
      else {
        const { error } = await (await supabase()).rpc('moderate_comment', { p_id: id, p_hidden: hidden });
        if (error) throw error;
      }
      return json({ ok: true });
    }
    if (action === 'role') {
      const id = z.uuid().parse(b.id);
      const role = z.enum(['student', 'contributor', 'moderator', 'admin']).parse(b.role);
      if (id === u.id && role !== 'admin') throw new AuthError('Không thể tự hạ quyền quản trị.');
      if (isDemo())
        await mutateDemo((s) => {
          const p = s.profiles.find((p) => p.id === id);
          if (!p) throw new AuthError('Không có người dùng.', 404);
          p.role = role;
          s.audit.unshift({
            id: randomUUID(),
            actor_id: u.id,
            action: 'user.role',
            target_id: id,
            details: role,
            created_at: now,
          });
        });
      else {
        const { error } = await (await supabase()).rpc('set_user_role', { p_user: id, p_role: role });
        if (error) throw error;
      }
      return json({ ok: true });
    }
    const table = z.enum(['universities', 'faculties', 'majors', 'courses', 'document_types']).parse(b.table);
    const input = z
      .object({
        name: z.string().trim().min(2).max(180),
        slug: z.string().max(200).optional(),
        university_id: z.uuid().optional(),
        faculty_id: z.uuid().optional(),
        code: z.string().max(30).optional(),
        short_name: z.string().max(30).optional(),
        brand_color: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/)
          .optional(),
      })
      .parse(b.fields);
    const id = b.id ? z.uuid().parse(b.id) : randomUUID();
    const fields = { ...input, slug: slugify(input.slug || input.name) };
    if (!fields.slug) throw new AuthError('Slug không hợp lệ.');
    if (!['universities', 'document_types'].includes(table) && !fields.university_id)
      throw new AuthError('Cần chọn trường.');
    if (['majors', 'courses'].includes(table) && !fields.faculty_id) throw new AuthError('Cần chọn khoa.');
    if (table === 'courses' && !fields.code) throw new AuthError('Cần mã học phần.');
    if (isDemo())
      await mutateDemo((s) => {
        if (
          fields.faculty_id &&
          !s.catalog.faculties.find(
            (f) => f.id === fields.faculty_id && f.university_id === fields.university_id,
          )
        )
          throw new AuthError('Khoa không thuộc trường.');
        const rows = s.catalog[table] as unknown as Record<string, unknown>[];
        if (rows.some((x) => x.slug === fields.slug && x.id !== id)) throw new AuthError('Slug đã tồn tại.');
        const old = rows.find((x) => x.id === id);
        if (old) Object.assign(old, fields);
        else
          rows.push({
            id,
            ...(table === 'universities'
              ? {
                  logo: '/branding/ued-logo-placeholder.svg',
                  cover_image: '',
                  email_domain: null,
                  is_active: true,
                  brand_color: '#1769ff',
                }
              : table === 'faculties'
                ? { icon: 'BookOpen', color: 'blue', description: '' }
                : table === 'courses'
                  ? { major_id: null }
                  : {}),
            ...fields,
          });
        s.audit.unshift({
          id: randomUUID(),
          actor_id: u.id,
          action: 'category.saved',
          target_id: id,
          details: table + ': ' + fields.name,
          created_at: now,
        });
      });
    else {
      const { error } = await (await supabase()).from(table).upsert({ id, ...fields });
      if (error) throw error;
    }
    return json({ ok: true, id });
  } catch (e) {
    return failure(e);
  }
}
