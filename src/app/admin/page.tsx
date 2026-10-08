import { adminData, getCatalog, getDownloadTrend } from '@/lib/repositories';
import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Dashboard } from '@/components/admin/dashboard';
export default async function Admin() {
  const user = await currentUser();
  if (!user) redirect('/dang-nhap?next=/admin');
  if (!['admin', 'moderator'].includes(user.role)) redirect('/khong-co-quyen');
  const [data, catalog, downloads] = await Promise.all([adminData(), getCatalog(), getDownloadTrend()]);
  return (
    <Dashboard
      downloads={downloads}
      documents={data.documents}
      profiles={data.profiles}
      reports={data.reports}
      catalog={catalog}
    />
  );
}
