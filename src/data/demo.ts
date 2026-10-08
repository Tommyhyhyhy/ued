import type { Catalog, Profile, StudyDocument } from '@/types';
import { slugify, documentTypes } from '@/lib/utils';
export const uid = (n: number) => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
export const university = {
  id: uid(1),
  name: 'Trường Đại học Sư phạm – Đại học Đà Nẵng',
  short_name: 'UED',
  slug: 'ued',
  logo: '/branding/ued-logo-placeholder.svg',
  cover_image: '/illustrations/hero.png',
  brand_color: '#1769ff',
  email_domain: null,
  is_active: true,
};
const facultyNames = [
  'Toán – Tin',
  'Lý – Hóa',
  'Sinh – Nông nghiệp – Môi trường',
  'Ngữ Văn – Truyền thông',
  'Sử – Địa – Chính trị',
  'Tâm lý – Giáo dục – Công tác xã hội',
  'Giáo dục Tiểu học – Mầm non',
  'Giáo dục Nghệ thuật – Thể chất',
];
const icons = ['Binary', 'Atom', 'Sprout', 'MessagesSquare', 'Globe', 'Brain', 'Blocks', 'Palette'];
const colors = ['blue', 'violet', 'green', 'orange', 'cyan', 'rose', 'gold', 'purple'];
export const faculties = facultyNames.map((name, i) => ({
  id: uid(10 + i),
  university_id: uid(1),
  name: 'Khoa ' + name,
  slug: slugify(name),
  icon: icons[i],
  color: colors[i],
  description: 'Khám phá học liệu, bài giảng và tài liệu ôn tập được cộng đồng chia sẻ.',
}));
const courseNames = [
  ['Nhập môn lập trình', 0],
  ['Đại số tuyến tính', 0],
  ['Xác suất thống kê', 0],
  ['Cơ sở dữ liệu', 0],
  ['Phương pháp giảng dạy Toán', 0],
  ['Vật lý đại cương', 1],
  ['Hóa học đại cương', 1],
  ['Sinh học tế bào', 2],
  ['Khoa học môi trường', 2],
  ['Truyền thông đa phương tiện', 3],
  ['Văn học Việt Nam', 3],
  ['Lịch sử Việt Nam', 4],
  ['Địa lý tự nhiên', 4],
  ['Tâm lý học đại cương', 5],
  ['Phương pháp nghiên cứu khoa học', 5],
  ['Công tác xã hội', 5],
  ['Giáo dục học mầm non', 6],
  ['Phương pháp dạy Tiếng Việt', 6],
  ['Mỹ thuật cơ bản', 7],
  ['Giáo dục thể chất', 7],
] as const;
export const majors = faculties.map((f, i) => ({
  id: uid(40 + i),
  university_id: uid(1),
  faculty_id: f.id,
  name: [
    'Sư phạm Toán học',
    'Sư phạm Vật lý',
    'Sư phạm Sinh học',
    'Báo chí và Truyền thông',
    'Sư phạm Lịch sử',
    'Tâm lý học',
    'Giáo dục Tiểu học',
    'Sư phạm Âm nhạc',
  ][i],
  slug: [
    'su-pham-toan',
    'su-pham-vat-ly',
    'su-pham-sinh',
    'bao-chi',
    'su-pham-lich-su',
    'tam-ly-hoc',
    'giao-duc-tieu-hoc',
    'su-pham-am-nhac',
  ][i],
}));
export const courses = courseNames.map(([name, f], i) => ({
  id: uid(100 + i),
  university_id: uid(1),
  faculty_id: faculties[f].id,
  major_id: majors[f].id,
  name,
  slug: slugify(name),
  code: 'UED' + String(101 + i),
}));
export const contributors: Profile[] = ['Bạn Mây', 'Bạn Nắng', 'Bạn Sóng', 'Bạn Lá'].map((name, i) => ({
  id: uid(200 + i),
  display_name: name,
  email: 'demo' + i + '@example.test',
  bio: 'Tài khoản minh họa • Cùng chia sẻ học liệu hữu ích.',
  university_id: uid(1),
  role: 'contributor',
  created_at: '2026-01-01T00:00:00.000Z',
}));
const titles = [
  'Bài giảng Nhập môn lập trình',
  'Bộ câu hỏi ôn tập Đại số tuyến tính',
  'Bài tập Xác suất thống kê có hướng dẫn',
  'Giáo trình Cơ sở dữ liệu',
  'Phương pháp giảng dạy Toán',
  'Đề cương Vật lý đại cương',
  'Bài tập Hóa học đại cương',
  'Bài giảng Sinh học tế bào',
  'Đề cương Khoa học môi trường',
  'Slide Truyền thông đa phương tiện',
  'Tài liệu ôn tập Văn học Việt Nam',
  'Tài liệu ôn tập Lịch sử Việt Nam',
  'Bản đồ tư duy Địa lý tự nhiên',
  'Tài liệu Tâm lý học đại cương',
  'Đề cương Phương pháp nghiên cứu khoa học',
  'Bài giảng Nhập môn Công tác xã hội',
  'Giáo trình Giáo dục học mầm non',
  'Phương pháp dạy Tiếng Việt ở tiểu học',
  'Bài tập thực hành Mỹ thuật cơ bản',
  'Hướng dẫn Giáo dục thể chất',
  'Đề thi thử Nhập môn lập trình',
  'Bài tập Đại số tuyến tính',
  'Đề thi thử Xác suất thống kê',
  'Slide Thiết kế cơ sở dữ liệu',
  'Tổng hợp phương pháp giảng dạy Toán',
  'Bài tập Vật lý học kỳ 1',
  'Đề cương ôn tập Hóa học',
  'Tài liệu thực hành Sinh học',
];
const types = ['Bài giảng', 'Tài liệu ôn tập', 'Bài tập', 'Giáo trình', 'Tài liệu tham khảo', 'Đề thi'];
export const demoDocuments: StudyDocument[] = titles.map((title, i) => {
  const c = courses[i % 20];
  const ext = (
    i % 9 === 6 ? 'docx' : i % 9 === 7 ? 'pptx' : i % 9 === 8 ? 'xlsx' : i === 19 ? 'zip' : 'pdf'
  ) as StudyDocument['file']['extension'];
  const status = i < 24 ? 'approved' : i < 26 ? 'pending' : i === 26 ? 'rejected' : 'hidden';
  const created = new Date(Date.UTC(2026, 8, 18 - i)).toISOString();
  return {
    id: uid(1000 + i),
    university_id: uid(1),
    faculty_id: c.faculty_id,
    major_id: c.major_id,
    course_id: c.id,
    uploader_id: contributors[i % 4].id,
    title,
    slug: slugify(title),
    description:
      'Học liệu minh họa cho môn ' +
      c.name +
      '. Nội dung gợi ý các khái niệm trọng tâm, câu hỏi tự luyện và cách tổ chức việc học. Đây là dữ liệu mẫu do UEDocs tạo, không phải giáo trình hay đề thi chính thức của nhà trường.',
    document_type: types[i % 6],
    language: 'vi',
    lecturer_name: null,
    academic_year: '2025–2026',
    semester: String((i % 2) + 1),
    status,
    visibility: 'public',
    rights_confirmation: true,
    rejection_reason: status === 'rejected' ? 'Vui lòng bổ sung nguồn và xác nhận quyền chia sẻ.' : null,
    average_rating: 4.5 + (i % 5) / 10,
    rating_count: 12 + i * 3,
    view_count: 156 + i * 59,
    download_count: 54 + i * 23,
    approved_by: status === 'approved' ? uid(204) : null,
    approved_at: status === 'approved' ? created : null,
    created_at: created,
    updated_at: created,
    tags: [c.name, 'Minh họa', 'UED'],
    contributor_name: contributors[i % 4].display_name,
    file: {
      id: uid(2000 + i),
      document_id: uid(1000 + i),
      storage_path: '/samples/sample.' + ext,
      original_name: slugify(title) + '.' + ext,
      safe_name: 'sample.' + ext,
      mime_type:
        ext === 'pdf'
          ? 'application/pdf'
          : ext === 'zip'
            ? 'application/zip'
            : 'application/vnd.openxmlformats-officedocument.' +
              (ext === 'docx'
                ? 'wordprocessingml.document'
                : ext === 'pptx'
                  ? 'presentationml.presentation'
                  : 'spreadsheetml.sheet'),
      extension: ext,
      size_bytes: 131072 + i * 1234,
      page_count: ext === 'pdf' ? 3 : null,
      checksum: null,
      scan_status: 'not_configured',
      created_at: created,
    },
  };
});
export const catalog: Catalog = {
  document_types: documentTypes.map((name, i) => ({ id: uid(60 + i), name, slug: slugify(name) })),
  universities: [university],
  faculties,
  majors,
  courses,
};
