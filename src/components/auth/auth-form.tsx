'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, LockKeyhole, ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';
import { safeNextPath } from '@/lib/utils';
import { authSchema } from '@/lib/validation';
import { toast } from 'sonner';
import type { z } from 'zod';
type Mode = 'login' | 'register' | 'forgot' | 'reset';
export function AuthForm({
  mode,
  demo,
  demoAdmin,
  google,
}: {
  mode: Mode;
  demo: boolean;
  demoAdmin: boolean;
  google: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof authSchema>>({ resolver: zodResolver(authSchema) });
  const titles = {
    login: 'Chào mừng bạn trở lại.',
    register: 'Cùng nhau mở rộng tri thức.',
    forgot: 'Tìm lại tài khoản của bạn.',
    reset: 'Đặt mật khẩu mới.',
  };
  async function submit(input: Record<string, unknown>) {
    setBusy(true);
    try {
      const r = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      if (data.url) {
        location.assign(data.url);
        return;
      }
      if (data.verify || input.action === 'forgot') {
        setMessage(data.message);
        return;
      }
      if (input.action === 'reset') {
        router.push('/ho-so');
        router.refresh();
        return;
      }
      toast.success('Chào mừng đến với UEDocs!');
      const next = new URLSearchParams(location.search).get('next');
      location.assign(safeNextPath(next));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout container">
      <aside className="auth-story">
        <span className="eyebrow">THƯ VIỆN CỦA CHÚNG MÌNH</span>
        <h2>
          Tri thức không có giới hạn.
          <br />
          <span>Chia sẻ cũng vậy.</span>
        </h2>
        <p>Lưu học liệu yêu thích, trao đổi cùng bạn học và đóng góp những điều hữu ích cho cộng đồng.</p>
        <div className="auth-benefit">
          <BookOpen />
          Học liệu được sắp xếp theo môn học
        </div>
        <div className="auth-benefit">
          <ShieldCheck />
          Cộng đồng tôn trọng bản quyền
        </div>
        <div className="auth-quote">
          “Một tài liệu nhỏ hôm nay,
          <br />
          một khởi đầu tốt hơn ngày mai.”
        </div>
      </aside>
      <section className="auth-card">
        <h1>{titles[mode]}</h1>
        <p>
          {mode === 'login'
            ? 'Đăng nhập để tiếp tục hành trình học tập.'
            : mode === 'register'
              ? 'Tạo tài khoản UEDocs miễn phí.'
              : 'Một vài bước để tiếp tục việc học.'}
        </p>
        {message ? (
          <div className="notice" role="status">
            {message}
            <p>
              <Link href="/dang-nhap" className="text-link">
                Quay lại đăng nhập
              </Link>
            </p>
          </div>
        ) : mode === 'login' || mode === 'register' ? (
          <form onSubmit={handleSubmit((data) => submit({ ...data, action: mode }))}>
            {mode === 'register' && (
              <div className="field">
                <label htmlFor="auth-name">Tên hiển thị</label>
                <input
                  id="auth-name"
                  autoComplete="nickname"
                  {...register('display_name')}
                  required
                  minLength={2}
                />
                {errors.display_name && <span className="field-error">{errors.display_name.message}</span>}
              </div>
            )}
            <div className="field">
              <label htmlFor="auth-email">
                <Mail size={14} /> Email
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="ban@example.com"
                {...register('email')}
              />
              {errors.email && <span className="field-error">{errors.email.message}</span>}
            </div>
            <div className="field">
              <label htmlFor="auth-password">
                <LockKeyhole size={14} /> Mật khẩu
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                placeholder="Ít nhất 8 ký tự"
                {...register('password')}
              />
              {errors.password && <span className="field-error">{errors.password.message}</span>}
            </div>
            {mode === 'login' && (
              <Link className="forgot-link" href="/quen-mat-khau">
                Quên mật khẩu?
              </Link>
            )}
            {mode === 'register' && (
              <p className="auth-policy">
                Khi tạo tài khoản, bạn đồng ý với <Link href="/quy-dinh">quy định cộng đồng</Link> và{' '}
                <Link href="/quyen-rieng-tu">chính sách quyền riêng tư</Link>.
              </p>
            )}
            <button disabled={busy} className="button primary full">
              {busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
              <ArrowRight size={17} />
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              void submit({ action: mode, email: data.get('email'), password: data.get('password') });
            }}
          >
            <div className="field">
              <label htmlFor="recovery-input">{mode === 'forgot' ? 'Email của bạn' : 'Mật khẩu mới'}</label>
              <input
                id="recovery-input"
                name={mode === 'forgot' ? 'email' : 'password'}
                type={mode === 'forgot' ? 'email' : 'password'}
                autoComplete={mode === 'forgot' ? 'email' : 'new-password'}
                required
                minLength={mode === 'reset' ? 8 : undefined}
              />
            </div>
            <button disabled={busy} className="button primary full">
              {mode === 'forgot' ? 'Gửi liên kết khôi phục' : 'Lưu mật khẩu mới'}
            </button>
          </form>
        )}
        {(mode === 'login' || mode === 'register') && (
          <>
            <div className="auth-separator">
              <span>hoặc</span>
            </div>
            <button
              className="button secondary full"
              disabled={!google || busy}
              title={!google ? 'Google OAuth chưa được cấu hình' : undefined}
              onClick={() => submit({ action: 'google' })}
            >
              <span className="google-g">G</span>Tiếp tục với Google{!google && <small>Chưa bật</small>}
            </button>
            <p className="auth-switch">
              {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
              <Link href={mode === 'login' ? '/dang-ky' : '/dang-nhap'}>
                {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
              </Link>
            </p>
          </>
        )}
        {demo && (
          <div className="demo-auth">
            <p>Khám phá trước khi tạo tài khoản</p>
            <button
              className="button secondary full"
              disabled={busy}
              onClick={() => submit({ action: 'demo', role: 'contributor' })}
            >
              Trải nghiệm demo
            </button>
            {demoAdmin && (
              <div className="demo-role-buttons">
                <button disabled={busy} onClick={() => submit({ action: 'demo', role: 'student' })}>
                  Sinh viên
                </button>
                <button disabled={busy} onClick={() => submit({ action: 'demo', role: 'moderator' })}>
                  Kiểm duyệt viên
                </button>
                <button disabled={busy} onClick={() => submit({ action: 'demo', role: 'admin' })}>
                  Quản trị viên
                </button>
              </div>
            )}
            <small>Dữ liệu minh họa. Không cần dùng thông tin thật.</small>
          </div>
        )}
      </section>
    </div>
  );
}
