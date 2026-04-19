import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth';
import { writeLog } from '@/lib/log';

export const runtime = 'nodejs';

function getBaseUrl(req: NextRequest): URL {
  const forwardedHost = req.headers.get('x-forwarded-host');
  if (forwardedHost) {
    const forwardedProto = req.headers.get('x-forwarded-proto') ?? 'https';
    return new URL(`${forwardedProto}://${forwardedHost}`);
  }
  return new URL(req.url);
}

export async function POST(req: NextRequest) {
  const url = getBaseUrl(req);
  await writeLog('info', 'system', 'Logout');
  const res = NextResponse.redirect(new URL('/login', url));
  res.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
