import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const GET = async (request: Request) => {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;

  // 홈으로 리다이렉트
  return NextResponse.redirect(new URL('/', siteUrl));
};
