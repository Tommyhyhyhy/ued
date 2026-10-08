import { PageHeading } from '@/components/common/ui';
import { UploadForm } from '@/components/upload/upload-form';
import { getCatalog } from '@/lib/repositories';
import { currentUser } from '@/lib/auth';
import { isDemo, maxUploadBytes } from '@/lib/config';
export const metadata = { title: 'Đóng góp tài liệu', alternates: { canonical: '/dong-gop' } };
export default async function Upload() {
  const [catalog, user] = await Promise.all([getCatalog(), currentUser()]);
  return (
    <div className="container page-space">
      <PageHeading eyebrow="MỘT TÀI LIỆU, NHIỀU CƠ HỘI" title="Chia sẻ điều bạn đã học.">
        Cùng xây dựng thư viện học liệu hữu ích cho cộng đồng sinh viên.
      </PageHeading>
      <UploadForm catalog={catalog} user={user} maxBytes={maxUploadBytes()} demo={isDemo()} />
    </div>
  );
}
