import type { Role, StudyDocument } from '@/types';
export const isStaff = (role?: Role) => role === 'admin' || role === 'moderator';
export const canUpload = (role?: Role) => role === 'contributor' || isStaff(role);
export function canRead(
  d: Pick<StudyDocument, 'status' | 'visibility' | 'uploader_id'>,
  user?: { id: string; role: Role } | null,
) {
  return (
    (d.status === 'approved' && d.visibility === 'public') ||
    d.uploader_id === user?.id ||
    isStaff(user?.role)
  );
}
export function canEdit(
  d: Pick<StudyDocument, 'status' | 'uploader_id'>,
  user?: { id: string; role: Role } | null,
) {
  return d.uploader_id === user?.id && ['draft', 'pending'].includes(d.status);
}
