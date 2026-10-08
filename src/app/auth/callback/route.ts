import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { isDemo, siteUrl } from '@/lib/config';
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const raw = url.searchParams.get('next');
  const next = raw === '/dat-lai-mat-khau' ? raw : '/ho-so';
  if (code && !isDemo()) {
    const { error } = await (await supabase()).auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, siteUrl()));
  }
  return NextResponse.redirect(new URL('/dang-nhap?error=callback', siteUrl()));
}
