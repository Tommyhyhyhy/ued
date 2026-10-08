export type Role = 'student' | 'contributor' | 'moderator' | 'admin';
export type DocumentStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'hidden' | 'removed';
export type FileExtension = 'pdf' | 'docx' | 'pptx' | 'xlsx' | 'zip';
export interface University {
  id: string;
  name: string;
  short_name: string;
  slug: string;
  logo: string;
  cover_image: string;
  brand_color: string;
  email_domain: string | null;
  is_active: boolean;
}
export interface Faculty {
  id: string;
  university_id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
}
export interface Major {
  id: string;
  university_id: string;
  faculty_id: string;
  name: string;
  slug: string;
}
export interface Course {
  id: string;
  university_id: string;
  faculty_id: string;
  major_id: string | null;
  name: string;
  slug: string;
  code: string;
}
export interface Profile {
  id: string;
  display_name: string;
  email?: string;
  bio: string;
  university_id: string;
  role: Role;
  created_at: string;
}
export interface DocumentFile {
  id: string;
  document_id: string;
  storage_path: string;
  original_name: string;
  safe_name: string;
  mime_type: string;
  extension: FileExtension;
  size_bytes: number;
  page_count: number | null;
  checksum: string | null;
  scan_status: 'not_configured' | 'clean' | 'infected' | 'pending';
  created_at: string;
}
export interface StudyDocument {
  id: string;
  university_id: string;
  faculty_id: string;
  major_id: string | null;
  course_id: string;
  uploader_id: string;
  title: string;
  slug: string;
  description: string;
  document_type: string;
  language: string;
  lecturer_name: string | null;
  academic_year: string;
  semester: string;
  status: DocumentStatus;
  visibility: 'public' | 'private';
  rights_confirmation: boolean;
  rejection_reason: string | null;
  average_rating: number;
  rating_count: number;
  view_count: number;
  download_count: number;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  tags: string[];
  file: DocumentFile;
  contributor_name: string;
}
export interface Filters {
  uploader?: string;
  q?: string;
  university?: string;
  faculty?: string;
  major?: string;
  course?: string;
  type?: string;
  file?: string;
  semester?: string;
  year?: string;
  language?: string;
  rating?: string;
  verified?: string;
  since?: string;
  sort?: string;
  page?: string;
}
export interface DocumentPage {
  items: StudyDocument[];
  total: number;
  page: number;
  pageSize: number;
}
export interface Comment {
  id: string;
  document_id: string;
  user_id: string;
  display_name: string;
  body: string;
  created_at: string;
  hidden: boolean;
}
export interface Report {
  id: string;
  document_id: string | null;
  user_id: string;
  reason: string;
  details: string;
  status: string;
  created_at: string;
  resolution?: string;
}
export interface Audit {
  id: string;
  actor_id: string;
  action: string;
  target_id: string;
  details: string;
  created_at: string;
}
export interface DocumentType {
  id: string;
  name: string;
  slug: string;
}
export interface Catalog {
  document_types: DocumentType[];
  universities: University[];
  faculties: Faculty[];
  majors: Major[];
  courses: Course[];
}
