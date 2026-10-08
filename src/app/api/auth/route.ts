import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import {
  currentUser,
  loginDemoRole,
  hashPassword,
  checkPassword,
  createDemoSession,
  sessionHash,
  AuthError,
} from '@/lib/auth';
import { isDemo, demoAdminEnabled, siteUrl } from '@/lib/config';
import { authSchema } from '@/lib/validation';
import { mutateDemo, readDemo } from '@/lib/repositories/demo-store';
import { supabase } from '@/lib/supabase/server';
import { guard, failure, json } from '@/lib/http';
import { uid } from '@/data/demo';
export async function GET() {
  return json({
    user: await currentUser(),
    demo: isDemo(),
    demoAdmin: demoAdminEnabled(),
    google: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === 'true',
  });
}
export async function POST(request: Request) {
  try {
    await guard(request, 'auth', 15);
    const body = await request.json();
    const action = z
      .enum(['demo', 'login', 'register', 'logout', 'forgot', 'reset', 'google'])
      .parse(body.action);
    if (action === 'logout') {
      if (isDemo()) {
        const token = (await cookies()).get('uedocs_session')?.value;
        if (token)
          await mutateDemo((s) => {
            delete s.sessions[sessionHash(token)];
          });
        (await cookies()).delete('uedocs_session');
      } else await (await supabase()).auth.signOut();
      return json({ ok: true });
    }
    if (action === 'demo') {
      if (!isDemo()) throw new AuthError('Demo không hoạt động ở chế độ Supabase.', 403);
      await loginDemoRole(
        z.enum(['student', 'contributor', 'admin', 'moderator']).parse(body.role ?? 'contributor'),
      );
      return json({ ok: true });
    }
    if (action === 'forgot') {
      const email = z.email().parse(body.email);
      if (!isDemo()) {
        const { error } = await (
          await supabase()
        ).auth.resetPasswordForEmail(email, {
          redirectTo: siteUrl() + '/auth/callback?next=/dat-lai-mat-khau',
        });
        if (error) throw new AuthError('Không thể gửi email lúc này. Vui lòng thử lại.');
      }
      return json({
        message: isDemo()
          ? 'Demo không gửi email thật. Sử dụng nút trải nghiệm demo để tiếp tục.'
          : 'Nếu email có tài khoản, hướng dẫn khôi phục sẽ được gửi đến bạn.',
      });
    }
    if (action === 'google') {
      if (isDemo() || process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED !== 'true')
        throw new AuthError('Google OAuth chưa được cấu hình.');
      const { data, error } = await (
        await supabase()
      ).auth.signInWithOAuth({ provider: 'google', options: { redirectTo: siteUrl() + '/auth/callback' } });
      if (error) throw error;
      return json({ url: data.url });
    }
    if (action === 'reset') {
      const password = z.string().min(8).max(128).parse(body.password);
      if (isDemo()) throw new AuthError('Khôi phục mật khẩu cần email Supabase.');
      const db = await supabase();
      const {
        data: { user },
      } = await db.auth.getUser();
      if (!user) throw new AuthError('Liên kết khôi phục không hợp lệ hoặc đã hết hạn.', 401);
      const { error } = await db.auth.updateUser({ password });
      if (error) throw error;
      return json({ ok: true });
    }
    const input = authSchema.parse(body);
    if (isDemo()) {
      const email = input.email.toLowerCase();
      if (action === 'register') {
        const id = randomUUID();
        await mutateDemo((s) => {
          if (s.accounts.some((a) => a.email === email)) throw new AuthError('Email đã được sử dụng.');
          s.accounts.push({ email, id, hash: hashPassword(input.password) });
          s.profiles.push({
            id,
            display_name: input.display_name ?? 'Thành viên mới',
            email,
            bio: '',
            university_id: uid(1),
            role: 'contributor',
            created_at: new Date().toISOString(),
          });
        });
        await createDemoSession(id);
      } else {
        const account = (await readDemo()).accounts.find((a) => a.email === email);
        if (!account || !checkPassword(input.password, account.hash))
          throw new AuthError('Email hoặc mật khẩu không đúng.', 401);
        await createDemoSession(account.id);
      }
      return json({ ok: true, message: 'Đã đăng nhập bản demo.' });
    }
    const db = await supabase();
    if (action === 'register') {
      const { error } = await db.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: { display_name: input.display_name ?? 'Thành viên' },
          emailRedirectTo: siteUrl() + '/auth/callback',
        },
      });
      if (error) throw new AuthError('Không thể đăng ký. Kiểm tra email hoặc thử lại.');
      return json({ message: 'Kiểm tra email để xác nhận tài khoản trước khi đăng nhập.', verify: true });
    }
    const { error } = await db.auth.signInWithPassword({ email: input.email, password: input.password });
    if (error) throw new AuthError('Email, mật khẩu không đúng hoặc email chưa được xác nhận.', 401);
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
