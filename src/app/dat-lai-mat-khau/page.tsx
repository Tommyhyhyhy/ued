import { AuthForm } from '@/components/auth/auth-form';
import { isDemo, demoAdminEnabled } from '@/lib/config';
export const metadata = { title: 'Đặt lại mật khẩu', robots: { index: false, follow: false } };
export default function Page() {
  return (
    <AuthForm
      mode="reset"
      demo={isDemo()}
      demoAdmin={demoAdminEnabled()}
      google={process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === 'true' && !isDemo()}
    />
  );
}
