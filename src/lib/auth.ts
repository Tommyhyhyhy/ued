import 'server-only';
import { cookies } from 'next/headers';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { isDemo, demoAdminEnabled } from '@/lib/config';
import { supabase } from '@/lib/supabase/server';
import { readDemo, mutateDemo } from '@/lib/repositories/demo-store';
import type { Profile, Role } from '@/types';
import { uid } from '@/data/demo';
export const sessionHash = (token: string) => createHash('sha256').update(token).digest('hex');
export async function currentUser(): Promise<Profile | null> {
  if (isDemo()) {
    const token = (await cookies()).get('uedocs_session')?.value;
    if (!token) return null;
    const s = await readDemo();
    const session = s.sessions[sessionHash(token)];
    if (!session || session.expires < Date.now()) return null;
    const user = s.profiles.find((p) => p.id === session.user_id) ?? null;
    if (user && ['admin', 'moderator'].includes(user.role) && !demoAdminEnabled()) return null;
    return user;
  }
  const db = await supabase();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  const [{ data: p }, { data: roles }] = await Promise.all([
    db.from('profiles').select('*').eq('id', user.id).single(),
    db.from('user_roles').select('role').eq('user_id', user.id),
  ]);
  if (!p) return null;
  const ordered: Role[] = ['admin', 'moderator', 'contributor', 'student'];
  return {
    ...p,
    email: user.email,
    role: ordered.find((r) => roles?.some((x) => x.role === r)) ?? 'student',
  } as Profile;
}
export async function requireUser(roles?: Role[]) {
  const u = await currentUser();
  if (!u) throw new AuthError('Bạn cần đăng nhập.', 401);
  if (roles && !roles.includes(u.role))
    throw new AuthError('Bạn không có quyền thực hiện thao tác này.', 403);
  return u;
}
export class AuthError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return salt + ':' + scryptSync(password, salt, 64).toString('hex');
}
export function checkPassword(password: string, hash: string) {
  const [salt, key] = hash.split(':');
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(key, 'hex'));
}
export async function createDemoSession(id: string) {
  const token = randomBytes(32).toString('hex');
  await mutateDemo((s) => {
    s.sessions[sessionHash(token)] = { user_id: id, expires: Date.now() + 604800000 };
  });
  (await cookies()).set('uedocs_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 604800,
  });
}
export async function loginDemoRole(role: string) {
  const id =
    role === 'admin' ? uid(204) : role === 'moderator' ? uid(206) : role === 'student' ? uid(205) : uid(200);
  if (['admin', 'moderator'].includes(role) && !demoAdminEnabled())
    throw new AuthError('Demo quản trị chỉ được bật trong môi trường phát triển.', 403);
  await createDemoSession(id);
}
