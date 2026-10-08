import { AuthError } from '@/lib/auth';
import { ZodError } from 'zod';
import { isDemo, allowedOrigin } from '@/lib/config';
import { adminSupabase } from '@/lib/supabase/server';
import { createHash } from 'node:crypto';
const globalRates = globalThis as typeof globalThis & {
  uedocsRates?: Map<string, { n: number; until: number }>;
};
export async function guard(request: Request, bucket = 'write', limit = 30) {
  const origin = request.headers.get('origin');
  if (origin && !allowedOrigin(origin)) throw new AuthError('Nguồn yêu cầu không hợp lệ.', 403);
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const key = createHash('sha256')
    .update(bucket + ':' + ip)
    .digest('hex');
  if (!isDemo()) {
    const { data, error } = await adminSupabase().rpc('consume_rate_limit', { p_key: key, p_limit: limit });
    if (error) throw new AuthError('Tạm thời không thể xác thực giới hạn yêu cầu.', 503);
    if (!data) throw new AuthError('Bạn thao tác quá nhanh. Vui lòng thử lại sau một phút.', 429);
    return;
  }
  const map = (globalRates.uedocsRates ??= new Map());
  const now = Date.now();
  const old = map.get(key);
  if (!old || old.until < now) map.set(key, { n: 1, until: now + 60000 });
  else {
    old.n++;
    if (old.n > limit) throw new AuthError('Bạn thao tác quá nhanh. Vui lòng thử lại sau một phút.', 429);
  }
  if (map.size > 1000) for (const [k, v] of map) if (v.until < now) map.delete(k);
}
export function failure(e: unknown) {
  if (e instanceof ZodError)
    return Response.json({ error: e.issues[0]?.message ?? 'Dữ liệu không hợp lệ.' }, { status: 400 });
  if (e instanceof AuthError) return Response.json({ error: e.message }, { status: e.status });
  console.error(e);
  return Response.json(
    {
      error:
        e instanceof Error && !e.message.includes('key') ? e.message : 'Có lỗi xảy ra. Vui lòng thử lại.',
    },
    { status: 400 },
  );
}
export const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
