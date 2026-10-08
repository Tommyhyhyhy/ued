import { redirect } from 'next/navigation';
import { PageHeading } from '@/components/common/ui';
import { UploadForm } from '@/components/upload/upload-form';
import { currentUser } from '@/lib/auth';
import { isDemo, maxUploadBytes } from '@/lib/config';
import { getCatalog } from '@/lib/repositories';

export const metadata = { title: 'Đăng tài liệu trực tiếp', robots: { index: false, follow: false } };

export default async function PublishDocument() {
  const user = await currentUser();
  if (!user) redirect('/dang-nhap?next=/admin/dang-tai-lieu');
  if (user.role !== 'admin') redirect('/khong-co-quyen');
  const catalog = await getCatalog();
  return (
    <div className="page-space">
      <PageHeading eyebrow="DÀNH CHO QUẢN TRỊ VIÊN" title="Đăng tài liệu trực tiếp">
        Chọn file, điền thông tin và đăng công khai ngay. Tài liệu không đi qua hàng chờ duyệt.
      </PageHeading>
      <UploadForm
        catalog={catalog}
        user={user}
        maxBytes={maxUploadBytes()}
        demo={isDemo()}
        publishImmediately
      />
    </div>
  );
}
