'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Profile } from '@/types';
import { toast } from 'sonner';
export function ProfileForm({ user }: { user: Profile }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const r = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: form.get('display_name'), bio: form.get('bio') }),
    });
    const d = await r.json();
    setBusy(false);
    if (r.ok) toast.success('Đã cập nhật hồ sơ');
    else toast.error(d.error);
  }
  return (
    <div className="panel">
      <h2>Thông tin của bạn</h2>
      <form onSubmit={save}>
        <div className="field">
          <label htmlFor="profile-name">Tên hiển thị</label>
          <input
            id="profile-name"
            name="display_name"
            defaultValue={user.display_name}
            required
            minLength={2}
            maxLength={70}
          />
        </div>
        <div className="field">
          <label htmlFor="profile-bio">Giới thiệu</label>
          <textarea id="profile-bio" name="bio" defaultValue={user.bio} maxLength={500} />
        </div>
        <div className="form-actions">
          <button disabled={busy} className="button primary">
            Lưu thay đổi
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={async () => {
              await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'logout' }),
              });
              router.push('/');
              router.refresh();
            }}
          >
            Đăng xuất
          </button>
        </div>
      </form>
      {user.role === 'student' && (
        <div className="notice">
          <p>Bạn muốn đóng góp học liệu? Kích hoạt quyền đóng góp để gửi tài liệu chờ duyệt.</p>
          <button
            className="text-link"
            onClick={async () => {
              const r = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ become_contributor: true }),
              });
              if (r.ok) location.reload();
              else toast.error('Không thể cập nhật quyền đóng góp.');
            }}
          >
            Trở thành người đóng góp
          </button>
        </div>
      )}
    </div>
  );
}
