import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { userDocuments, favoriteDocuments } from '@/lib/repositories';
import { PageHeading, Badge } from '@/components/common/ui';
import { ProfileForm } from '@/components/profile/profile-form';
import { isStaff } from '@/lib/permissions';
export default async function Profile() {
  const user = await currentUser();
  if (!user) redirect('/dang-nhap');
  const [docs, favorites] = await Promise.all([userDocuments(user.id), favoriteDocuments(user.id)]);
  return (
    <div className="container page-space">
      <PageHeading eyebrow="GÓC HỌC TẬP CỦA BẠN" title={'Xin chào, ' + user.display_name + '.'}>
        Mỗi ngày, thêm một điều mới để học và sẻ chia.
      </PageHeading>
      <div className="profile-layout">
        <aside className="panel profile-summary">
          <div className="profile-avatar">{user.display_name.slice(0, 1)}</div>
          <h2>{user.display_name}</h2>
          <Badge>
            {
              {
                student: 'Sinh viên',
                contributor: 'Người đóng góp',
                moderator: 'Kiểm duyệt viên',
                admin: 'Quản trị viên',
              }[user.role]
            }
          </Badge>
          <div className="profile-counts">
            <span>
              <strong>{docs.length}</strong>Đóng góp
            </span>
            <span>
              <strong>{favorites.length}</strong>Đã lưu
            </span>
          </div>
          <Link className="button secondary full" href="/ho-so/tai-lieu">
            Tài liệu của tôi
          </Link>
          <Link className="button secondary full" href="/yeu-thich">
            Thư viện đã lưu
          </Link>
          {isStaff(user.role) && (
            <Link className="button primary full" href="/admin">
              Mở trang quản trị
            </Link>
          )}
        </aside>
        <ProfileForm user={user} />
      </div>
    </div>
  );
}
