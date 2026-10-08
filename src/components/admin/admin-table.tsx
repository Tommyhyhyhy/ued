'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { Check, X, Eye, Search, Plus, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { StudyDocument, Profile, Report, Audit, Catalog, Comment } from '@/types';
import { date, statusLabels } from '@/lib/utils';
import { Badge, EmptyState } from '@/components/common/ui';
import { PdfPreview } from '@/components/documents/pdf-preview';
type Data = {
  documents: StudyDocument[];
  profiles: Profile[];
  reports: Report[];
  audit: Audit[];
  comments: Comment[];
};
export function AdminTable({ section, data, catalog }: { section: string; data: Data; catalog: Catalog }) {
  const router = useRouter();
  const [filter, setFilter] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<StudyDocument | null>(null);
  const [reject, setReject] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState('faculties');
  const [edit, setEdit] = useState<Record<string, unknown> | null>(null);
  const names: Record<string, string> = {
    'tai-lieu': 'Kiểm duyệt tài liệu',
    'bao-cao': 'Báo cáo vi phạm',
    'nguoi-dung': 'Thành viên cộng đồng',
    'danh-muc': 'Quản lý danh mục',
    'nhat-ky': 'Nhật ký hoạt động',
  };
  async function mutate(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const r = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast.success('Đã cập nhật');
      setSelected([]);
      setReject([]);
      setEdit(null);
      router.refresh();
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  const docs = data.documents.filter(
    (d) => (!filter || d.status === filter) && d.title.toLowerCase().includes(query.toLowerCase()),
  );
  const categories = catalog[category as keyof Catalog] ?? [];
  return (
    <>
      <header className="page-heading">
        <div>
          <div className="eyebrow">QUẢN TRỊ UEDOCS</div>
          <h1>{names[section]}</h1>
          <p>Mọi thay đổi quan trọng đều được lưu vào nhật ký hệ thống.</p>
        </div>
      </header>
      {section === 'tai-lieu' && (
        <>
          <div className="admin-toolbar">
            <div className="search-form">
              <Search size={17} />
              <input
                aria-label="Tìm tài liệu kiểm duyệt"
                placeholder="Tìm tài liệu…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              className="select"
              aria-label="Trạng thái kiểm duyệt"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(statusLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          {selected.length > 0 && (
            <div className="bulk-actions">
              <span>Đã chọn {selected.length}</span>
              <button
                className="button primary small"
                disabled={busy}
                onClick={() => mutate({ action: 'moderate', ids: selected, status: 'approved' })}
              >
                Duyệt đã chọn
              </button>
              <button className="button danger small" onClick={() => setReject(selected)}>
                Từ chối đã chọn
              </button>
            </div>
          )}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Chọn tất cả tài liệu đang hiển thị"
                      checked={!!docs.length && docs.every((d) => selected.includes(d.id))}
                      onChange={(e) => setSelected(e.target.checked ? docs.map((d) => d.id) : [])}
                    />
                  </th>
                  <th>Tài liệu</th>
                  <th>Trạng thái</th>
                  <th>Ngày gửi</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={'Chọn ' + d.title}
                        checked={selected.includes(d.id)}
                        onChange={(e) =>
                          setSelected((v) => (e.target.checked ? [...v, d.id] : v.filter((x) => x !== d.id)))
                        }
                      />
                    </td>
                    <td>
                      <strong>{d.title}</strong>
                      <small>
                        {d.contributor_name} · {d.file.extension.toUpperCase()}
                      </small>
                    </td>
                    <td>
                      <Badge
                        tone={d.status === 'approved' ? 'green' : d.status === 'pending' ? 'gold' : 'rose'}
                      >
                        {statusLabels[d.status]}
                      </Badge>
                    </td>
                    <td>{date(d.created_at)}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="icon-button"
                          aria-label={'Xem trước ' + d.title}
                          onClick={() => setPreview(d)}
                        >
                          <Eye size={17} />
                        </button>
                        {d.status !== 'approved' && (
                          <button
                            className="icon-button approve"
                            aria-label={'Duyệt ' + d.title}
                            disabled={busy}
                            onClick={() => mutate({ action: 'moderate', ids: [d.id], status: 'approved' })}
                          >
                            <Check size={17} />
                          </button>
                        )}
                        <button
                          className="icon-button reject"
                          aria-label={'Từ chối ' + d.title}
                          onClick={() => {
                            setReject([d.id]);
                            setReason('');
                          }}
                        >
                          <X size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!docs.length && <EmptyState title="Không có tài liệu phù hợp" />}
        </>
      )}
      {section === 'bao-cao' && (
        <>
          <div className="report-list">
            {data.reports.length ? (
              data.reports.map((r) => (
                <article className="panel" key={r.id}>
                  <div className="inline-badges">
                    <Badge tone={r.status === 'open' ? 'gold' : 'green'}>
                      {r.status === 'open' ? 'Chờ xử lý' : 'Đã xử lý'}
                    </Badge>
                    <span className="muted">{date(r.created_at)}</span>
                  </div>
                  <h2>{r.reason}</h2>
                  <strong>
                    {data.documents.find((d) => d.id === r.document_id)?.title ?? 'Tài liệu đã gỡ'}
                  </strong>
                  <p>{r.details}</p>
                  <small className="muted">
                    Người báo cáo: {data.profiles.find((p) => p.id === r.user_id)?.display_name ?? r.user_id}
                  </small>
                  {r.resolution && <div className="notice">{r.resolution}</div>}
                  {r.status === 'open' && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const f = new FormData(e.currentTarget);
                        void mutate({
                          action: 'resolve-report',
                          id: r.id,
                          resolution: f.get('resolution'),
                          document_status: f.get('document_status'),
                        });
                      }}
                    >
                      <div className="field">
                        <label htmlFor={'resolve-' + r.id}>Ghi chú cho người đóng góp</label>
                        <textarea id={'resolve-' + r.id} name="resolution" required minLength={5} />
                      </div>
                      <div className="form-actions">
                        <select className="select" name="document_status" aria-label="Xử lý tài liệu">
                          <option value="keep">Giữ tài liệu</option>
                          <option value="hidden">Tạm ẩn tài liệu</option>
                          <option value="removed">Gỡ tài liệu</option>
                        </select>
                        <button className="button primary" disabled={busy}>
                          Hoàn tất xử lý
                        </button>
                      </div>
                    </form>
                  )}
                </article>
              ))
            ) : (
              <EmptyState
                title="Chưa có báo cáo vi phạm"
                description="Các báo cáo mới sẽ xuất hiện tại đây để được xem xét."
              />
            )}
          </div>
          <section className="panel" style={{ marginTop: 24 }}>
            <h2>Kiểm duyệt bình luận</h2>
            {data.comments.length ? (
              data.comments.map((c) => (
                <div className="moderation-comment" key={c.id}>
                  <p>{c.body}</p>
                  <button
                    className="button secondary small"
                    onClick={() => mutate({ action: 'hide-comment', id: c.id, hidden: !c.hidden })}
                  >
                    {c.hidden ? 'Hiện lại' : 'Ẩn bình luận'}
                  </button>
                </div>
              ))
            ) : (
              <p className="muted">Chưa có bình luận cần xử lý.</p>
            )}
          </section>
        </>
      )}
      {section === 'nguoi-dung' && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Thành viên</th>
                <th>Tham gia</th>
                <th>Vai trò</th>
              </tr>
            </thead>
            <tbody>
              {data.profiles.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.display_name}</strong>
                    <small>{p.id.slice(0, 8)}…</small>
                  </td>
                  <td>{date(p.created_at)}</td>
                  <td>
                    <select
                      className="select"
                      aria-label={'Vai trò ' + p.display_name}
                      value={p.role}
                      disabled={busy}
                      onChange={(e) => mutate({ action: 'role', id: p.id, role: e.target.value })}
                    >
                      {['student', 'contributor', 'moderator', 'admin'].map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {section === 'danh-muc' && (
        <>
          <div className="admin-toolbar">
            <select
              className="select"
              aria-label="Loại danh mục"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {[
                ['universities', 'Trường đại học'],
                ['faculties', 'Khoa'],
                ['majors', 'Ngành'],
                ['courses', 'Môn học'],
                ['document_types', 'Loại tài liệu'],
              ].map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            {true && (
              <button
                className="button primary small"
                onClick={() =>
                  setEdit({
                    name: '',
                    slug: '',
                    university_id: catalog.universities[0]?.id,
                    faculty_id: catalog.faculties[0]?.id,
                  })
                }
              >
                <Plus size={17} />
                Thêm danh mục
              </button>
            )}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Slug / Mã</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((x) => (
                  <tr key={x.id}>
                    <td>
                      <strong>{x.name}</strong>
                    </td>
                    <td>{'code' in x ? String(x.code) : x.slug}</td>
                    <td>
                      {true && (
                        <button className="button secondary small" onClick={() => setEdit({ ...x })}>
                          Chỉnh sửa
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {section === 'nhat-ky' && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Thao tác</th>
                <th>Người thực hiện</th>
                <th>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {data.audit.map((a) => (
                <tr key={a.id}>
                  <td>{new Date(a.created_at).toLocaleString('vi-VN')}</td>
                  <td>
                    <code>{a.action}</code>
                  </td>
                  <td>
                    {data.profiles.find((p) => p.id === a.actor_id)?.display_name ?? a.actor_id.slice(0, 8)}
                  </td>
                  <td>{typeof a.details === 'string' ? a.details : JSON.stringify(a.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.audit.length && (
            <EmptyState
              title="Nhật ký đang trống"
              description="Hoạt động quản trị sẽ được ghi lại sau mỗi thay đổi."
            />
          )}
        </div>
      )}
      <Dialog.Root
        open={!!preview}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="modal preview-modal">
            <Dialog.Title>{preview?.title}</Dialog.Title>
            <Dialog.Description>
              {preview?.contributor_name} ·{' '}
              {preview?.file.scan_status === 'clean'
                ? 'Dịch vụ quét xác nhận sạch'
                : 'Chưa có kết quả quét virus. Cần kiểm duyệt thủ công.'}
            </Dialog.Description>
            <Dialog.Close className="dialog-close icon-button" aria-label="Đóng xem trước">
              <X />
            </Dialog.Close>
            {preview?.file.extension === 'pdf' ? (
              <PdfPreview url={'/api/documents/' + preview.id + '/file'} />
            ) : (
              <p>Định dạng {preview?.file.extension.toUpperCase()} chưa hỗ trợ xem trước.</p>
            )}
            {preview?.rejection_reason && <div className="notice">{preview.rejection_reason}</div>}
            <h3>Lịch sử kiểm duyệt</h3>
            {data.audit
              .filter((a) => a.target_id === preview?.id)
              .map((a) => (
                <p key={a.id}>
                  {date(a.created_at)} · {a.action} · {a.details}
                </p>
              ))}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root
        open={!!reject.length}
        onOpenChange={(open) => {
          if (!open) setReject([]);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="modal">
            <Dialog.Title>Từ chối tài liệu</Dialog.Title>
            <Dialog.Description>Cho người đóng góp biết cần cải thiện điều gì.</Dialog.Description>
            <Dialog.Close className="dialog-close icon-button" aria-label="Đóng từ chối">
              <X />
            </Dialog.Close>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void mutate({ action: 'moderate', ids: reject, status: 'rejected', reason });
              }}
            >
              <div className="field">
                <label htmlFor="reject-reason">Lý do từ chối</label>
                <textarea
                  id="reject-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  minLength={5}
                  maxLength={2000}
                />
              </div>
              <button className="button danger full" disabled={busy}>
                Xác nhận từ chối
              </button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root
        open={!!edit}
        onOpenChange={(open) => {
          if (!open) setEdit(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="modal">
            <Dialog.Title>{edit?.id ? 'Chỉnh sửa' : 'Thêm'} danh mục</Dialog.Title>
            <Dialog.Description>Cập nhật thông tin trong cấu trúc nhiều trường.</Dialog.Description>
            <Dialog.Close className="dialog-close icon-button" aria-label="Đóng chỉnh sửa">
              <X />
            </Dialog.Close>
            {edit && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fields = Object.fromEntries(new FormData(e.currentTarget));
                  void mutate({ action: 'category', table: category, id: edit.id, fields });
                }}
              >
                <div className="field">
                  <label htmlFor="category-name">Tên danh mục</label>
                  <input
                    id="category-name"
                    name="name"
                    defaultValue={String(edit.name ?? '')}
                    required
                    minLength={2}
                    maxLength={180}
                  />
                </div>
                <div className="field">
                  <label htmlFor="category-slug">Slug (có thể để trống để tạo tự động)</label>
                  <input id="category-slug" name="slug" defaultValue={String(edit.slug ?? '')} />
                </div>
                {!['universities', 'document_types'].includes(category) && (
                  <div className="field">
                    <label htmlFor="category-university">Trường</label>
                    <select
                      id="category-university"
                      name="university_id"
                      defaultValue={String(edit.university_id ?? '')}
                    >
                      {catalog.universities.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.short_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {['courses', 'majors'].includes(category) && (
                  <div className="field">
                    <label htmlFor="category-faculty">Khoa</label>
                    <select
                      id="category-faculty"
                      name="faculty_id"
                      defaultValue={String(edit.faculty_id ?? '')}
                    >
                      {catalog.faculties.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {category === 'courses' && (
                  <div className="field">
                    <label htmlFor="category-code">Mã học phần</label>
                    <input id="category-code" name="code" defaultValue={String(edit.code ?? '')} required />
                  </div>
                )}
                {category === 'universities' && (
                  <>
                    <div className="field">
                      <label htmlFor="category-short">Tên viết tắt</label>
                      <input
                        id="category-short"
                        name="short_name"
                        defaultValue={String(edit.short_name ?? '')}
                        required
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="category-brand">Màu thương hiệu</label>
                      <input
                        id="category-brand"
                        name="brand_color"
                        type="color"
                        defaultValue={String(edit.brand_color ?? '#1769ff')}
                      />
                    </div>
                  </>
                )}
                <button className="button primary full" disabled={busy}>
                  <ShieldCheck size={17} />
                  Lưu danh mục
                </button>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
