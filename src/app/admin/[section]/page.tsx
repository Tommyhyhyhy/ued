import { notFound, redirect } from 'next/navigation';
import { adminData, getCatalog, getContactInbox } from '@/lib/repositories';
import { currentUser } from '@/lib/auth';
import { AdminTable } from '@/components/admin/admin-table';
export async function generateMetadata({ params }: { params: Promise<{ section: string }> }) {
  return {
    title:
      (
        {
          'tai-lieu': 'Kiểm duyệt tài liệu',
          'bao-cao': 'Xử lý báo cáo',
          'nguoi-dung': 'Quản lý người dùng',
          'danh-muc': 'Quản lý danh mục',
          'nhat-ky': 'Audit log',
          'lien-he': 'Hộp thư liên hệ',
        } as Record<string, string>
      )[(await params).section] ?? 'Quản trị',
  };
}
export default async function AdminSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!['tai-lieu', 'bao-cao', 'nguoi-dung', 'danh-muc', 'nhat-ky', 'lien-he'].includes(section)) notFound();
  const user = await currentUser();
  if (!user) redirect('/dang-nhap');
  if (
    !['admin', 'moderator'].includes(user.role) ||
    (['nguoi-dung', 'danh-muc', 'nhat-ky', 'lien-he'].includes(section) && user.role !== 'admin')
  )
    redirect('/khong-co-quyen');
  if (section === 'lien-he') {
    const inbox = await getContactInbox();
    return (
      <>
        <header className="page-heading">
          <div>
            <h1>Hộp thư liên hệ</h1>
            <p>Yêu cầu được gửi từ biểu mẫu liên hệ và bản quyền.</p>
          </div>
        </header>
        <div className="report-list">
          {inbox.length ? (
            inbox.map((c) => (
              <article className="panel" key={c.id}>
                <h2>{c.name}</h2>
                <p>
                  {c.email} · {new Date(c.created_at).toLocaleString('vi-VN')}
                </p>
                <p style={{ whiteSpace: 'pre-wrap' }}>{c.message}</p>
              </article>
            ))
          ) : (
            <p className="panel">Chưa có lời nhắn mới.</p>
          )}
        </div>
      </>
    );
  }
  const [data, catalog] = await Promise.all([adminData(), getCatalog()]);
  return <AdminTable section={section} data={data} catalog={catalog} />;
}
