import clsx, { type ClassValue } from 'clsx';
export function safeNextPath(value: string | null) {
  if (!value?.startsWith('/')) return '/ho-so';
  try {
    const url = new URL(value, 'https://uedocs.invalid');
    return url.origin === 'https://uedocs.invalid' ? url.pathname + url.search + url.hash : '/ho-so';
  } catch {
    return '/ho-so';
  }
}
export const cn = (...inputs: ClassValue[]) => clsx(inputs);
export const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
export const slugify = (s: string) =>
  normalize(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
export const number = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
export const date = (s: string) =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(s));
export const fileSize = (bytes: number) =>
  bytes < 1048576 ? Math.ceil(bytes / 1024) + ' KB' : (bytes / 1048576).toFixed(1) + ' MB';
export const disclaimer =
  'UEDocs là dự án cộng đồng độc lập dành cho sinh viên, không phải cổng thông tin chính thức của Trường Đại học Sư phạm – Đại học Đà Nẵng.';
export const documentTypes = [
  'Bài giảng',
  'Đề thi',
  'Giáo trình',
  'Bài tập',
  'Tài liệu ôn tập',
  'Tài liệu tham khảo',
];
export const statusLabels: Record<string, string> = {
  draft: 'Bản nháp',
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  hidden: 'Đã ẩn',
  removed: 'Đã gỡ',
};
export function publicDocument(d: { status: string; visibility: string }) {
  return d.status === 'approved' && d.visibility === 'public';
}
