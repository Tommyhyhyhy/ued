import { AuthForm } from '@/components/auth/auth-form';
import { isDemo, demoAdminEnabled } from '@/lib/config';
export const metadata = { title: 'Đăng ký', robots: { index: false, follow: false } };
export default function Page() {
  return (
    <AuthForm
      mode="register"
      demo={isDemo()}
      demoAdmin={demoAdminEnabled()}
      google={process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === 'true' && !isDemo()}
    />
  );
}
