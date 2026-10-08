import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isDemo } from '@/lib/config';
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set('Cache-Control', 'private, no-store');
  const protectedRoute =
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/ho-so') ||
    request.nextUrl.pathname === '/yeu-thich';
  if (isDemo()) {
    if (protectedRoute && !request.cookies.has('uedocs_session'))
      return NextResponse.redirect(
        new URL('/dang-nhap?next=' + encodeURIComponent(request.nextUrl.pathname), request.url),
      );
    return response;
  }
  const db = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values) => {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          response.headers.set('Cache-Control', 'private, no-store');
        },
      },
    },
  );
  const {
    data: { user },
  } = await db.auth.getUser();
  if (protectedRoute && !user) return NextResponse.redirect(new URL('/dang-nhap', request.url));
  if (user && request.nextUrl.pathname.startsWith('/admin')) {
    const { data } = await db
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'moderator']);
    if (!data?.length) return NextResponse.redirect(new URL('/khong-co-quyen', request.url));
  }
  return response;
}
export const config = {
  matcher: ['/admin/:path*', '/ho-so/:path*', '/yeu-thich', '/dong-gop', '/dang-nhap', '/api/:path*'],
};
