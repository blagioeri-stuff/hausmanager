import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return new NextResponse(
      'SESSION_SECRET ist nicht gesetzt. Siehe README → Erstmaliges Setup.',
      { status: 500 }
    );
  }

  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const ok = await verifySession(cookie, secret);
  if (ok) return NextResponse.next();

  const url = req.nextUrl.clone();
  const next = url.pathname + (url.search || '');
  url.pathname = '/login';
  url.search = `?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico|robots.txt|manifest.json|.*\\.(?:png|jpg|jpeg|svg|ico|webp|gif|woff2?)$).*)',
  ],
};
