import { z } from 'zod';
import { requireUser, AuthError } from '@/lib/auth';
import { getDocument } from '@/lib/repositories';
import { canEdit } from '@/lib/permissions';
import { isDemo } from '@/lib/config';
import { guard, failure, json } from '@/lib/http';
import { mutateDemo } from '@/lib/repositories/demo-store';
import { supabase } from '@/lib/supabase/server';
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await guard(request, 'edit');
    const u = await requireUser();
    const { id } = await params;
    const d = await getDocument(id, true);
    if (!d || !canEdit(d, u)) throw new AuthError('Bạn không thể chỉnh sửa tài liệu này.', 403);
    const input = z
      .object({ title: z.string().trim().min(8).max(180), description: z.string().trim().min(20).max(5000) })
      .strict()
      .parse(await request.json());
    if (isDemo())
      await mutateDemo((s) =>
        Object.assign(
          s.documents.find((d) => d.id === id)!,
          input,
          { updated_at: new Date().toISOString() },
        ),
      );
    else {
      const { data, error } = await (
        await supabase()
      )
        .from('documents')
        .update(input)
        .eq('id', id)
        .select('id')
        .single();
      if (error || !data) throw new AuthError('Không thể cập nhật tài liệu.', 403);
    }
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
