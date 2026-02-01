import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromCode } from '@/lib/googleCalendar';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/has_navbar/upload?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/has_navbar/upload?error=missing_code', request.url)
    );
  }

  try {
    const tokens = await getTokenFromCode(code);
    const redirectUrl = new URL('/has_navbar/upload', request.url);
    redirectUrl.searchParams.set('auth_success', 'true');
    redirectUrl.searchParams.set('access_token', tokens.access_token || '');
    if (tokens.refresh_token) {
      redirectUrl.searchParams.set('refresh_token', tokens.refresh_token);
    }
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    return NextResponse.redirect(
      new URL('/has_navbar/upload?error=token_exchange_failed', request.url)
    );
  }
}
