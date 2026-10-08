'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import type { StudyDocument } from '@/types';
import { statusLabels } from '@/lib/utils';
export function EditDocument({ document: d }: { document: StudyDocument }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const editable = ['draft', 'pending'].includes(d.status);
  return (
    <form
      className="panel"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const f = new FormData(e.currentTarget);
        const r = await fetch('/api/documents/' + d.id, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(f)),
        });
        const result = await r.json();
        setBusy(false);
        if (r.ok) {
          toast.success('Đã cập nhật tài liệu');
          router.refresh();
        } else toast.error(result.error);
      }}
    >
      <h2>Thông tin tài liệu</h2>
      <div className="notice">
        Trạng thái: {statusLabels[d.status]}.{' '}
        {editable
          ? 'Bạn có thể chỉnh sửa trước khi tài liệu được duyệt.'
          : 'Tài liệu đã xử lý; liên hệ ban kiểm duyệt nếu cần cập nhật.'}
      </div>
      {d.rejection_reason && <div className="notice warning">{d.rejection_reason}</div>}
      <div className="field">
        <label htmlFor="edit-title">Tiêu đề</label>
        <input
          id="edit-title"
          name="title"
          defaultValue={d.title}
          minLength={8}
          maxLength={180}
          disabled={!editable}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="edit-description">Mô tả</label>
        <textarea
          id="edit-description"
          name="description"
          defaultValue={d.description}
          minLength={20}
          maxLength={5000}
          disabled={!editable}
          required
        />
      </div>
      {editable && (
        <button className="button primary" disabled={busy}>
          Lưu chỉnh sửa
        </button>
      )}
    </form>
  );
}
