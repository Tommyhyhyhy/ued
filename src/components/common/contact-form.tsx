'use client';
import { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
export function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  return done ? (
    <div className="panel empty-state">
      <CheckCircle2 size={45} />
      <h2>Đã nhận lời nhắn của bạn</h2>
      <p>Thông tin được lưu trong hộp thư quản trị UEDocs. Cảm ơn bạn đã góp ý.</p>
      <button className="button secondary" onClick={() => setDone(false)}>
        Gửi lời nhắn khác
      </button>
    </div>
  ) : (
    <form
      className="panel"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const input = Object.fromEntries(new FormData(e.currentTarget));
          const r = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
          });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error);
          setDone(true);
        } catch (e) {
          toast.error((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="field-row">
        <div className="field">
          <label htmlFor="contact-name">Tên của bạn</label>
          <input id="contact-name" name="name" minLength={2} maxLength={70} required autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="contact-email">Email nhận phản hồi</label>
          <input id="contact-email" name="email" type="email" required autoComplete="email" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="contact-subject">Chủ đề</label>
        <select id="contact-subject" name="subject">
          <option>Góp ý cho UEDocs</option>
          <option>Yêu cầu gỡ tài liệu</option>
          <option>Hỗ trợ tài khoản</option>
          <option>Hợp tác cộng đồng</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="contact-message">Lời nhắn</label>
        <textarea
          id="contact-message"
          name="message"
          minLength={10}
          maxLength={5000}
          required
          placeholder="Mình có một ý kiến…"
        />
      </div>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <p className="muted" style={{ fontSize: 12, marginBottom: 15 }}>
        Chỉ cung cấp thông tin cần thiết. Không gửi mật khẩu hoặc dữ liệu nhạy cảm.
      </p>
      <button className="button primary" disabled={busy}>
        <Send size={17} />
        {busy ? 'Đang gửi…' : 'Gửi lời nhắn'}
      </button>
    </form>
  );
}
