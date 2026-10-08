import { randomUUID, createHash } from 'node:crypto';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { currentUser, requireUser, AuthError } from '@/lib/auth';
import { guard, failure, json } from '@/lib/http';
import { isDemo } from '@/lib/config';
import { readDemo, mutateDemo } from '@/lib/repositories/demo-store';
import { getDocument } from '@/lib/repositories';
import { supabase, adminSupabase } from '@/lib/supabase/server';
import { reportReasons } from '@/lib/validation';
export async function GET(request: Request) {
  try {
    const id = z.uuid().parse(new URL(request.url).searchParams.get('document_id'));
    if (!(await getDocument(id))) throw new AuthError('Không tìm thấy tài liệu.', 404);
    const user = await currentUser();
    if (isDemo()) {
      const s = await readDemo();
      return json({
        saved: s.favorites.some((f) => f.user_id === user?.id && f.document_id === id),
        rating: s.ratings.find((r) => r.user_id === user?.id && r.document_id === id)?.value ?? 0,
        comments: s.comments.filter((c) => c.document_id === id && !c.hidden),
      });
    }
    const db = await supabase();
    const { data: comments, error } = await db
      .from('comments')
      .select('*,profiles(display_name)')
      .eq('document_id', id)
      .eq('hidden', false)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    let saved = false,
      rating = 0;
    if (user) {
      const [a, b] = await Promise.all([
        db.from('favorites').select('id').eq('user_id', user.id).eq('document_id', id).maybeSingle(),
        db.from('ratings').select('value').eq('user_id', user.id).eq('document_id', id).maybeSingle(),
      ]);
      saved = !!a.data;
      rating = b.data?.value ?? 0;
    }
    return json({
      saved,
      rating,
      comments: comments.map((c) => ({ ...c, display_name: c.profiles?.display_name ?? 'Thành viên' })),
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    await guard(request, 'interactions', 90);
    const b = await request.json();
    const id = z.uuid().parse(b.document_id);
    const action = z.enum(['view', 'favorite', 'rate', 'comment', 'report']).parse(b.action);
    if (!(await getDocument(id))) throw new AuthError('Không tìm thấy tài liệu.', 404);
    if (action === 'view') {
      const jar = await cookies();
      let visitor = jar.get('uedocs_visitor')?.value;
      if (!visitor) {
        visitor = randomUUID();
        jar.set('uedocs_visitor', visitor, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 31536000,
          path: '/',
        });
      }
      const hash = createHash('sha256').update(visitor).digest('hex');
      if (isDemo()) {
        await mutateDemo((s) => {
          const key = id + ':' + hash + ':' + new Date().toISOString().slice(0, 10);
          if (!s.views.includes(key)) {
            s.views.push(key);
            const d = s.documents.find((d) => d.id === id);
            if (d) d.view_count++;
          }
        });
      } else {
        const { error } = await adminSupabase().rpc('record_document_event', {
          p_document: id,
          p_visitor: hash,
          p_kind: 'view',
        });
        if (error) throw error;
      }
      return json({ ok: true });
    }
    const u = await requireUser();
    if (action === 'favorite') {
      if (isDemo()) {
        const saved = await mutateDemo((s) => {
          const found = s.favorites.findIndex((f) => f.user_id === u.id && f.document_id === id);
          if (found >= 0) {
            s.favorites.splice(found, 1);
            return false;
          }
          s.favorites.push({ user_id: u.id, document_id: id });
          return true;
        });
        return json({ saved });
      }
      const db = await supabase();
      const { data } = await db
        .from('favorites')
        .select('id')
        .eq('user_id', u.id)
        .eq('document_id', id)
        .maybeSingle();
      const { error } = data
        ? await db.from('favorites').delete().eq('id', data.id)
        : await db.from('favorites').insert({ user_id: u.id, document_id: id });
      if (error) throw error;
      return json({ saved: !data });
    }
    if (action === 'rate') {
      const value = z.number().int().min(1).max(5).parse(b.value);
      if (isDemo())
        await mutateDemo((s) => {
          s.ratings = s.ratings.filter((r) => r.user_id !== u.id || r.document_id !== id);
          s.ratings.push({ user_id: u.id, document_id: id, value });
          const ratings = s.ratings.filter((r) => r.document_id === id);
          const d = s.documents.find((d) => d.id === id)!;
          d.average_rating = ratings.reduce((n, r) => n + r.value, 0) / ratings.length;
          d.rating_count = ratings.length;
        });
      else {
        const { error } = await (await supabase()).rpc('rate_document', { p_id: id, p_value: value });
        if (error) throw error;
      }
      return json({ ok: true });
    }
    if (action === 'comment') {
      const body = z.string().trim().min(3).max(2000).parse(b.body);
      const comment = {
        id: randomUUID(),
        document_id: id,
        user_id: u.id,
        display_name: u.display_name,
        body,
        created_at: new Date().toISOString(),
        hidden: false,
      };
      if (isDemo()) await mutateDemo((s) => s.comments.unshift(comment));
      else {
        const { display_name: _, ...row } = comment;
        void _;
        const { error } = await (await supabase()).from('comments').insert(row);
        if (error) throw error;
      }
      return json({ comment });
    }
    const reason = z.enum(reportReasons as [string, ...string[]]).parse(b.reason);
    const details = z.string().trim().min(10).max(3000).parse(b.details);
    const report = {
      id: randomUUID(),
      document_id: id,
      user_id: u.id,
      reason,
      details,
      status: 'open',
      created_at: new Date().toISOString(),
    };
    if (isDemo()) await mutateDemo((s) => s.reports.unshift(report));
    else {
      const { error } = await (await supabase()).from('reports').insert(report);
      if (error) throw error;
    }
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
