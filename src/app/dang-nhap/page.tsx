import { AuthForm } from '@/components/auth/auth-form';
import { isDemo, demoAdminEnabled } from '@/lib/config';
export const metadata = { title: 'Đăng nhập', robots: { index: false, follow: false } };
export default function Page() {
  return (
    <AuthForm
      mode="login"
      demo={isDemo()}
      demoAdmin={demoAdminEnabled()}
      google={process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === 'true' && !isDemo()}
    />
  );
}
