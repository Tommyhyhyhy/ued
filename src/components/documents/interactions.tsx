'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Bookmark, Share2, Copy, Flag, Star, X, MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { reportReasons } from '@/lib/validation';
import type { Comment } from '@/types';
import { date } from '@/lib/utils';
export function DocumentInteractions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState('');
  const [report, setReport] = useState(false);
  const [reason, setReason] = useState(reportReasons[0]);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch('/api/interactions?document_id=' + id)
      .then((r) => r.json())
      .then((d) => {
        setSaved(d.saved ?? false);
        setRating(d.rating ?? 0);
        setComments(d.comments ?? []);
      })
      .catch(() => toast.error('Chưa thể tải tương tác tài liệu.'))
      .finally(() => setLoading(false));
    void fetch('/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'view', document_id: id }),
    }).catch(() => {});
  }, [id]);
  async function action(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true);
    try {
      const r = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, document_id: id, ...extra }),
      });
      const d = await r.json();
      if (r.status === 401) {
        toast('Đăng nhập để tham gia cộng đồng', {
          action: { label: 'Đăng nhập', onClick: () => router.push('/dang-nhap') },
        });
        return null;
      }
      if (!r.ok) throw new Error(d.error);
      return d;
    } catch (e) {
      toast.error((e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  }
  async function favorite() {
    const d = await action('favorite');
    if (d) {
      setSaved(d.saved);
      toast.success(d.saved ? 'Đã lưu tài liệu' : 'Đã bỏ lưu');
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(location.href);
      toast.success('Đã sao chép liên kết');
    } catch {
      toast.error('Không thể sao chép. Bạn có thể sao chép địa chỉ trên trình duyệt.');
    }
  }
  return (
    <div className="interactions" aria-busy={loading}>
      <div className="document-actions">
        <button
          className={'button secondary ' + (saved ? 'is-saved' : '')}
          onClick={favorite}
          disabled={busy || loading}
        >
          <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
          {saved ? 'Đã lưu' : 'Lưu tài liệu'}
        </button>
        <button
          className="button secondary"
          onClick={async () => {
            if (navigator.share) {
              try {
                await navigator.share({ title: document.title, url: location.href });
              } catch {}
            } else await copy();
          }}
        >
          <Share2 size={18} />
          Chia sẻ
        </button>
        <button className="icon-button" aria-label="Sao chép liên kết" onClick={copy}>
          <Copy size={18} />
        </button>
        <button className="report-button" onClick={() => setReport(true)}>
          <Flag size={15} />
          Báo cáo vi phạm
        </button>
      </div>
      <section className="rating-panel">
        <div>
          <h3>Tài liệu này có hữu ích với bạn?</h3>
          <p>Đánh giá của bạn giúp cộng đồng chọn học liệu tốt hơn.</p>
        </div>
        <div className="stars" role="group" aria-label="Đánh giá tài liệu">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              aria-label={n + ' sao'}
              aria-pressed={rating === n}
              key={n}
              disabled={busy || loading}
              onClick={async () => {
                const d = await action('rate', { value: n });
                if (d) {
                  setRating(n);
                  toast.success('Cảm ơn đánh giá của bạn!');
                }
              }}
            >
              <Star size={26} fill={n <= rating ? 'currentColor' : 'none'} />
            </button>
          ))}
        </div>
      </section>
      <section className="comments">
        <h2>
          <MessageCircle size={22} />
          Trao đổi về tài liệu <span>{comments.length}</span>
        </h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const d = await action('comment', { body });
            if (d) {
              setComments((v) => [d.comment, ...v]);
              setBody('');
              toast.success('Đã gửi bình luận');
            }
          }}
        >
          <label htmlFor="comment-body">Chia sẻ điều bạn thấy hữu ích</label>
          <textarea
            id="comment-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            minLength={3}
            maxLength={2000}
            required
            placeholder="Một lời cảm ơn, một thắc mắc, hay một góc nhìn mới…"
          />
          <button className="button primary small" disabled={busy || loading}>
            <Send size={15} />
            Gửi bình luận
          </button>
        </form>
        {comments.length ? (
          comments.map((c) => (
            <article className="comment" key={c.id}>
              <span className="comment-avatar">{c.display_name.slice(0, 1)}</span>
              <div>
                <strong>{c.display_name}</strong>
                <time>{date(c.created_at)}</time>
                <p>{c.body}</p>
              </div>
            </article>
          ))
        ) : (
          <p className="muted comment-empty">Hãy là người đầu tiên bắt đầu cuộc trao đổi.</p>
        )}
      </section>
      <Dialog.Root open={report} onOpenChange={setReport}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="modal">
            <Dialog.Title>Báo cáo vi phạm</Dialog.Title>
            <Dialog.Description>
              Giúp chúng mình giữ thư viện an toàn và tôn trọng bản quyền.
            </Dialog.Description>
            <Dialog.Close className="dialog-close icon-button" aria-label="Đóng báo cáo">
              <X />
            </Dialog.Close>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const d = await action('report', { reason, details });
                if (d) {
                  setReport(false);
                  setDetails('');
                  toast.success('Đã gửi báo cáo. Ban kiểm duyệt sẽ xem xét.');
                }
              }}
            >
              <div className="field" style={{ marginTop: 20 }}>
                <label htmlFor="report-reason">Lý do</label>
                <select id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
                  {reportReasons.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="report-details">Mô tả và bằng chứng</label>
                <textarea
                  id="report-details"
                  required
                  minLength={10}
                  maxLength={3000}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </div>
              <button className="button primary full" disabled={busy || loading}>
                Gửi báo cáo
              </button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
