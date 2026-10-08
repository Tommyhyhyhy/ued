export const isDemo = () =>
  process.env.DEMO_MODE === 'true' ||
  !(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const demoAdminEnabled = () =>
  isDemo() && process.env.DEMO_ADMIN_ENABLED === 'true' && process.env.NODE_ENV !== 'production';
export const maxUploadBytes = () =>
  Math.min(3, Math.max(0.1, Number(process.env.MAX_UPLOAD_SIZE_MB) || 3)) * 1024 * 1024;
export const siteUrl = () => {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.RENDER_EXTERNAL_HOSTNAME ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` : '') ||
    'http://127.0.0.1:3000';
  const withProtocol = /^https?:\/\//i.test(configured) ? configured : `https://${configured}`;
  return withProtocol.replace(/\/$/, '');
};

// Match the public origin, since NextURL normalizes loopback hostnames internally.
export function allowedOrigin(origin: string, configuredUrl = siteUrl()) {
  try {
    return new URL(origin).origin === new URL(configuredUrl).origin && new URL(origin).protocol !== 'null';
  } catch {
    return false;
  }
}
