import { z } from 'zod';
import { slugify } from '@/lib/utils';
import { unzipSync } from 'fflate';
export const authSchema = z.object({
  email: z.email('Email không hợp lệ').max(254),
  password: z.string().min(8, 'Mật khẩu cần ít nhất 8 ký tự').max(128),
  display_name: z.string().trim().min(2).max(70).optional(),
});
export const uploadSchema = z.object({
  title: z.string().trim().min(8, 'Tiêu đề cần ít nhất 8 ký tự').max(180),
  description: z.string().trim().min(20, 'Mô tả cần ít nhất 20 ký tự').max(5000),
  university_id: z.uuid(),
  faculty_id: z.uuid(),
  major_id: z.union([z.uuid(), z.literal('')]).optional(),
  course_id: z.uuid(),
  lecturer_name: z.string().trim().max(100).optional(),
  semester: z.enum(['1', '2', '3']),
  academic_year: z.string().regex(/^20\d{2}[–-]20\d{2}$/, 'Năm học cần có dạng 2025–2026'),
  document_type: z.string().trim().min(2).max(80),
  language: z.enum(['vi', 'en']),
  tags: z.string().max(240).optional(),
  rights_confirmation: z.literal(true, { error: 'Bạn cần xác nhận quyền chia sẻ' }),
  privacy_confirmation: z.literal(true, { error: 'Bạn cần xác nhận nội dung an toàn' }),
});
export const reportReasons = [
  'Vi phạm bản quyền',
  'Thông tin sai',
  'Nội dung không phù hợp',
  'File độc hại hoặc đáng ngờ',
  'Dữ liệu cá nhân',
  'Trùng lặp',
  'Lý do khác',
];
export const mimeTypes: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  zip: 'application/zip',
};
export function safeFilename(name: string) {
  const parts = name.replace(/\\/g, '/').split('/').pop()!.split('.');
  const ext = parts.pop()?.toLowerCase() ?? '';
  return (slugify(parts.join('.')).slice(0, 100) || 'tai-lieu') + '.' + ext;
}
export function validateFile(name: string, mime: string, bytes: Uint8Array, max: number) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (!(ext in mimeTypes)) throw new Error('Chỉ hỗ trợ PDF, DOCX, PPTX, XLSX và ZIP.');
  if (bytes.byteLength === 0 || bytes.byteLength > max)
    throw new Error('File trống hoặc vượt giới hạn dung lượng.');
  if (mime !== mimeTypes[ext] && !(ext === 'zip' && mime === 'application/x-zip-compressed'))
    throw new Error('MIME type không khớp phần mở rộng.');
  if (ext === 'pdf') {
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-')
      throw new Error('Nội dung file không phải PDF hợp lệ.');
  } else {
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error('Cấu trúc file không hợp lệ.');
    let total = 0;
    const names: string[] = [];
    try {
      unzipSync(bytes, {
        filter: (entry) => {
          total += entry.originalSize;
          names.push(entry.name);
          if (total > 50 * 1024 * 1024 || names.length > 2000) throw new Error('Archive too large');
          return false;
        },
      });
    } catch {
      throw new Error('File nén không hợp lệ hoặc quá lớn sau giải nén.');
    }
    if (
      names.some(
        (n) => n.includes('../') || n.startsWith('/') || /\.(exe|dll|bat|cmd|ps1|vbs|js|scr)$/i.test(n),
      )
    )
      throw new Error('File nén chứa đường dẫn hoặc nội dung không được phép.');
    const required: Record<string, string> = {
      docx: 'word/document.xml',
      pptx: 'ppt/presentation.xml',
      xlsx: 'xl/workbook.xml',
    };
    if (ext !== 'zip' && (!names.includes('[Content_Types].xml') || !names.includes(required[ext])))
      throw new Error('Cấu trúc Office không khớp phần mở rộng.');
  }
  return {
    extension: ext as keyof typeof mimeTypes,
    safe_name: safeFilename(name),
    mime_type: mimeTypes[ext],
    size_bytes: bytes.byteLength,
  };
}
