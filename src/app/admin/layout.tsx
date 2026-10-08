import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { isStaff } from '@/lib/permissions';
import { isDemo } from '@/lib/config';
import { AdminShell } from '@/components/admin/admin-shell';
export const metadata = { title: 'Quản trị', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect('/dang-nhap?next=/admin');
  if (!isStaff(user.role)) redirect('/khong-co-quyen');
  return (
    <AdminShell role={user.role} demo={isDemo()}>
      {children}
    </AdminShell>
  );
}
