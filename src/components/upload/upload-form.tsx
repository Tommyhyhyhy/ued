'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UploadCloud,
  FileText,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  X,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { uploadSchema, mimeTypes } from '@/lib/validation';
import { fileSize } from '@/lib/utils';
import type { Catalog, Profile } from '@/types';
export function UploadForm({
  catalog,
  user,
  maxBytes,
  demo,
  publishImmediately = false,
}: {
  catalog: Catalog;
  user: Profile | null;
  maxBytes: number;
  demo: boolean;
  publishImmediately?: boolean;
}) {
  const router = useRouter();
  const [activating, setActivating] = useState(false);
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState('');
  const xhr = useRef<XMLHttpRequest | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    trigger,
    control,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      university_id: catalog.universities[0]?.id,
      faculty_id: catalog.faculties[0]?.id,
      major_id: '',
      course_id: catalog.courses[0]?.id,
      semester: '1',
      academic_year: '2025–2026',
      document_type: 'Bài giảng',
      language: 'vi',
      rights_confirmation: false as unknown as true,
      privacy_confirmation: false as unknown as true,
    },
  });
  const values = useWatch({ control });
  useEffect(() => {
    const available = catalog.faculties.filter((f) => f.university_id === values.university_id);
    if (!available.some((f) => f.id === values.faculty_id)) setValue('faculty_id', available[0]?.id ?? '');
  }, [catalog.faculties, values.university_id, values.faculty_id, setValue]);
  useEffect(() => {
    const available = catalog.courses.filter((c) => c.faculty_id === values.faculty_id);
    if (!available.some((c) => c.id === values.course_id)) setValue('course_id', available[0]?.id ?? '');
    if (!catalog.majors.some((m) => m.id === values.major_id && m.faculty_id === values.faculty_id))
      setValue('major_id', '');
  }, [catalog.courses, catalog.majors, values.faculty_id, values.course_id, values.major_id, setValue]);
  function pick(f?: File) {
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    if (!(ext in mimeTypes) || f.size > maxBytes || f.size === 0) {
      toast.error('Chọn PDF, DOCX, PPTX, XLSX hoặc ZIP không vượt quá ' + fileSize(maxBytes) + '.');
      return;
    }
    setFile(f);
  }
  async function next() {
    if (step === 0 && !file) {
      toast.error('Bạn hãy chọn một tài liệu trước.');
      return;
    }
    if (
      step === 1 &&
      !(await trigger([
        'title',
        'description',
        'university_id',
        'faculty_id',
        'major_id',
        'course_id',
        'semester',
        'academic_year',
        'document_type',
        'language',
        'tags',
      ]))
    )
      return;
    if (step === 2 && !(await trigger(['rights_confirmation', 'privacy_confirmation']))) return;
    setStep((v) => v + 1);
  }
  function upload(data: z.infer<typeof uploadSchema>) {
    if (!file || !user) return;
    setBusy(true);
    setProgress(0);
    const form = new FormData();
    form.append('metadata', JSON.stringify(data));
    form.append('file', file);
    if (publishImmediately) form.append('publish_immediately', 'true');
    const req = new XMLHttpRequest();
    xhr.current = req;
    req.open('POST', '/api/upload');
    req.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.min(95, Math.round((e.loaded / e.total) * 95)));
    };
    req.onload = () => {
      setBusy(false);
      let body;
      try {
        body = JSON.parse(req.responseText);
      } catch {
        toast.error('Không thể xử lý phản hồi máy chủ.');
        return;
      }
      if (req.status >= 200 && req.status < 300) {
        setProgress(100);
        setPublishedSlug(body.slug);
        setSuccess(true);
        toast.success(publishImmediately ? 'Tài liệu đã được đăng công khai!' : 'Cảm ơn bạn đã đóng góp!');
      } else toast.error(body.error || 'Không thể tải tài liệu lên.');
    };
    req.onerror = () => {
      setBusy(false);
      toast.error('Kết nối gián đoạn. Vui lòng thử lại.');
    };
    req.onabort = () => {
      setBusy(false);
      setProgress(0);
      toast('Đã hủy tải lên');
    };
    req.send(form);
  }
  if (user?.role === 'student')
    return (
      <div className="panel upload-success">
        <ShieldCheck size={48} />
        <h2>Sẵn sàng đóng góp học liệu?</h2>
        <p>Kích hoạt quyền đóng góp để gửi tài liệu. Mỗi tài liệu đều được kiểm duyệt trước khi công khai.</p>
        <button
          className="button primary"
          disabled={activating}
          onClick={async () => {
            setActivating(true);
            try {
              const r = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ become_contributor: true }),
              });
              const body = await r.json();
              if (!r.ok) throw new Error(body.error);
              router.refresh();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : 'Không thể kích hoạt.');
            } finally {
              setActivating(false);
            }
          }}
        >
          {activating ? 'Đang kích hoạt…' : 'Trở thành người đóng góp'}
        </button>
      </div>
    );
  if (success)
    return (
      <div className="upload-success panel">
        <CheckCircle2 size={70} />
        <h2>{publishImmediately ? 'Tài liệu đã xuất hiện trong kho!' : 'Cảm ơn bạn đã sẻ chia!'}</h2>
        <p>
          {publishImmediately ? (
            'Tài liệu đã được đăng công khai. Bạn có thể mở trang tài liệu hoặc thêm file tiếp theo.'
          ) : (
            <>
              Tài liệu đã được gửi và đang <strong>chờ kiểm duyệt</strong>. Bạn có thể theo dõi kết quả trong
              hồ sơ của mình.
            </>
          )}
        </p>
        <div className="form-actions">
          <Link
            className="button primary"
            href={publishImmediately ? '/tai-lieu/' + publishedSlug : '/ho-so/tai-lieu'}
          >
            {publishImmediately ? 'Xem tài liệu công khai' : 'Xem tài liệu đã đăng'}
          </Link>
          <button
            className="button secondary"
            onClick={() => {
              setSuccess(false);
              setFile(null);
              setStep(0);
            }}
          >
            {publishImmediately ? 'Đăng thêm tài liệu' : 'Gửi thêm tài liệu'}
          </button>
        </div>
      </div>
    );
  return (
    <div className="upload-layout">
      <div className="upload-main">
        <nav className="upload-steps" aria-label="Tiến trình đóng góp">
          {['Chọn file', 'Thông tin', 'Quyền chia sẻ', 'Xem lại'].map((label, i) => (
            <div
              key={label}
              className={i === step ? 'current' : i < step ? 'done' : ''}
              aria-current={i === step ? 'step' : undefined}
            >
              <span>{i < step ? <Check size={16} /> : i + 1}</span>
              <small>{label}</small>
            </div>
          ))}
        </nav>
        {!user && (
          <div className="notice">
            <Link className="text-link" href="/dang-nhap?next=/dong-gop">
              Đăng nhập để gửi tài liệu
            </Link>
            . Bạn vẫn có thể chuẩn bị thông tin bên dưới.
          </div>
        )}
        <form className="panel upload-panel" onSubmit={(event) => void handleSubmit(upload)(event)}>
          {step === 0 && (
            <>
              <h2>Bắt đầu với một tài liệu hữu ích</h2>
              <p className="muted">Những ghi chép của bạn có thể tạo nên sự khác biệt.</p>
              <div
                className={'dropzone ' + (drag ? 'dragging' : '')}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  pick(e.dataTransfer.files[0]);
                }}
              >
                <UploadCloud size={44} />
                <h3>Kéo và thả tài liệu vào đây</h3>
                <p>hoặc chọn file từ thiết bị của bạn</p>
                <button className="button secondary" type="button" onClick={() => inputRef.current?.click()}>
                  Chọn tài liệu
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx,.pptx,.xlsx,.zip"
                  aria-label="Chọn file tài liệu"
                  onChange={(e) => pick(e.target.files?.[0])}
                  className="file-input"
                />
                <small>PDF, DOCX, PPTX, XLSX, ZIP · Tối đa {fileSize(maxBytes)}</small>
              </div>
              {file && (
                <div className="selected-file">
                  <FileText size={27} />
                  <div>
                    <strong>{file.name}</strong>
                    <small>{fileSize(file.size)}</small>
                  </div>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => setFile(null)}
                    aria-label="Bỏ file đã chọn"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </>
          )}
          {step === 1 && (
            <>
              <h2>Giúp mọi người tìm thấy tài liệu</h2>
              <div className="field">
                <label htmlFor="upload-title">Tiêu đề tài liệu *</label>
                <input
                  id="upload-title"
                  {...register('title')}
                  placeholder="Ví dụ: Bài giảng Nhập môn lập trình"
                />
                <span className="field-error">{errors.title?.message}</span>
              </div>
              <div className="field">
                <label htmlFor="upload-description">Mô tả *</label>
                <textarea
                  id="upload-description"
                  {...register('description')}
                  placeholder="Nội dung chính, cách sử dụng và nguồn của tài liệu…"
                />
                <span className="field-error">{errors.description?.message}</span>
              </div>
              <div className="field-row">
                {(
                  [
                    ['university_id', 'Trường', catalog.universities],
                    [
                      'faculty_id',
                      'Khoa',
                      catalog.faculties.filter((f) => f.university_id === values.university_id),
                    ],
                    ['major_id', 'Ngành', catalog.majors.filter((m) => m.faculty_id === values.faculty_id)],
                    [
                      'course_id',
                      'Môn học',
                      catalog.courses.filter((c) => c.faculty_id === values.faculty_id),
                    ],
                  ] as const
                ).map(([key, label, items]) => (
                  <div className="field" key={key}>
                    <label htmlFor={'upload-' + key}>{label}</label>
                    <select id={'upload-' + key} {...register(key)}>
                      {key === 'major_id' && <option value="">Không xác định</option>}
                      {items.map((x) => (
                        <option value={x.id} key={x.id}>
                          {x.name}
                        </option>
                      ))}
                    </select>
                    <span className="field-error">{errors[key]?.message}</span>
                  </div>
                ))}
                <div className="field">
                  <label htmlFor="upload-code">Mã học phần</label>
                  <input
                    id="upload-code"
                    value={catalog.courses.find((c) => c.id === values.course_id)?.code ?? ''}
                    readOnly
                  />
                </div>
                <div className="field">
                  <label htmlFor="upload-lecturer">Giảng viên (không bắt buộc)</label>
                  <input id="upload-lecturer" {...register('lecturer_name')} />
                </div>
                <div className="field">
                  <label htmlFor="upload-semester">Học kỳ</label>
                  <select id="upload-semester" {...register('semester')}>
                    <option value="1">Học kỳ 1</option>
                    <option value="2">Học kỳ 2</option>
                    <option value="3">Học kỳ hè</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="upload-year">Năm học</label>
                  <input id="upload-year" {...register('academic_year')} />
                  <span className="field-error">{errors.academic_year?.message}</span>
                </div>
                <div className="field">
                  <label htmlFor="upload-type">Loại tài liệu</label>
                  <select id="upload-type" {...register('document_type')}>
                    {catalog.document_types.map((t) => (
                      <option key={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="upload-language">Ngôn ngữ</label>
                  <select id="upload-language" {...register('language')}>
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">Tiếng Anh</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="upload-tags">Tags</label>
                <input
                  id="upload-tags"
                  {...register('tags')}
                  placeholder="Ôn tập, học kỳ 1, kiến thức cơ bản"
                />
                <small>Phân tách bằng dấu phẩy.</small>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <span className="rights-icon">
                <ShieldCheck size={35} />
              </span>
              <h2>Sẻ chia có trách nhiệm</h2>
              <p className="muted">
                Chúng mình trân trọng công sức của người tạo ra tài liệu. Chỉ chia sẻ nội dung bạn được phép
                chia sẻ.
              </p>
              <label className="checkbox-row">
                <input type="checkbox" {...register('rights_confirmation')} />
                Tôi xác nhận mình có quyền chia sẻ tài liệu này hoặc tài liệu được phép chia sẻ công khai.
              </label>
              <p className="field-error">{errors.rights_confirmation?.message}</p>
              <label className="checkbox-row">
                <input type="checkbox" {...register('privacy_confirmation')} />
                Tài liệu không chứa dữ liệu cá nhân, đáp án thi chưa được phép công bố hoặc nội dung vi phạm
                bản quyền.
              </label>
              <p className="field-error">{errors.privacy_confirmation?.message}</p>
              <div className="notice">
                {publishImmediately
                  ? 'Bạn đang đăng với quyền quản trị: tài liệu sẽ công khai ngay. Hãy tự kiểm tra file trước khi gửi. Nếu chưa cấu hình dịch vụ quét virus, file chưa được quét tự động. '
                  : 'Tài liệu sẽ được kiểm duyệt thủ công trước khi xuất hiện công khai. '}
                <Link href="/ban-quyen" className="text-link">
                  Đọc chính sách bản quyền
                </Link>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h2>Một lần xem lại, trước khi sẻ chia</h2>
              <div className="selected-file">
                <FileText size={28} />
                <div>
                  <strong>{file?.name}</strong>
                  <small>{fileSize(file?.size ?? 0)}</small>
                </div>
              </div>
              <dl className="review-list">
                {[
                  ['Tiêu đề', values.title],
                  ['Môn học', catalog.courses.find((c) => c.id === values.course_id)?.name],
                  ['Loại tài liệu', values.document_type],
                  ['Năm học', values.academic_year],
                  ['Trạng thái sau khi gửi', publishImmediately ? 'Công khai ngay' : 'Chờ kiểm duyệt'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="muted">{values.description}</p>
              {demo && (
                <div className="notice">
                  Đây là bản demo. File và thông tin được lưu trên máy chủ demo, không được gửi tới trường.
                </div>
              )}
            </>
          )}
          {busy && (
            <div
              className="upload-progress"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Tiến trình tải file"
            >
              <div>
                <span style={{ width: progress + '%' }} />
              </div>
              <p>
                {progress < 95 ? 'Đang tải lên' : 'Đang kiểm tra và lưu tài liệu'} · {progress}%
              </p>
              <button type="button" className="text-link" onClick={() => xhr.current?.abort()}>
                Hủy tải lên
              </button>
            </div>
          )}
          <div className="form-actions">
            <button
              className="button secondary"
              type="button"
              disabled={step === 0 || busy}
              onClick={() => setStep((n) => n - 1)}
            >
              <ArrowLeft size={16} />
              Quay lại
            </button>
            {step < 3 ? (
              <button key="next-step" className="button primary" type="button" onClick={next}>
                Tiếp tục
                <ArrowRight size={16} />
              </button>
            ) : (
              <button key="submit-upload" className="button primary" type="submit" disabled={busy || !user}>
                {busy ? 'Đang gửi…' : publishImmediately ? 'Đăng công khai ngay' : 'Gửi tài liệu'}
                <UploadCloud size={17} />
              </button>
            )}
          </div>
        </form>
      </div>
      <aside className="upload-guide">
        <span className="eyebrow">MỘT CHIA SẺ TỐT</span>
        <h3>
          Hữu ích. Rõ ràng.
          <br />
          Tôn trọng bản quyền.
        </h3>
        <ul>
          <li>Đặt tiêu đề cụ thể, dễ tìm kiếm.</li>
          <li>Chọn đúng khoa và môn học.</li>
          <li>Kiểm tra nội dung và chất lượng file.</li>
          <li>Ghi rõ nguồn và quyền sử dụng.</li>
        </ul>
        <p>
          {publishImmediately
            ? 'Quản trị viên chịu trách nhiệm kiểm tra quyền chia sẻ và nội dung trước khi đăng. Dịch vụ quét virus chỉ hoạt động khi được cấu hình.'
            : 'Mọi tài liệu đều được xem xét trước khi công khai. Không có chứng nhận đã quét virus khi dịch vụ quét chưa được cấu hình.'}
        </p>
        <Link href="/quy-dinh" className="text-link">
          Quy định cộng đồng <ArrowRight size={15} />
        </Link>
      </aside>
    </div>
  );
}
