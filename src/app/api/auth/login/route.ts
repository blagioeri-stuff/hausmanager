import { NextRequest, NextResponse } from 'next/server';
import { signSession, SESSION_COOKIE_NAME, getSessionMaxAge } from '@/lib/auth';
import { verifyPassword } from '@/lib/auth-password';
import { writeLog } from '@/lib/log';

export const runtime = 'nodejs';

const attempts = new Map<string, { count: number; firstAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now - rec.firstAt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAt: now });
    return true;
  }
  rec.count++;
  return rec.count <= MAX_ATTEMPTS;
}

function getIp(req: NextRequest): string {
  const cf = req.headers.get('cf-connecting-ip');
  if (cf) return cf;
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

function sanitizeNext(next: string): string {
  if (!next.startsWith('/') || next.startsWith('//')) return '/';
  return next;
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const secret = process.env.SESSION_SECRET;
  const hash = process.env.APP_PASSWORD_HASH;

  const formData = await req.formData();
  const password = String(formData.get('password') ?? '');
  const next = sanitizeNext(String(formData.get('next') ?? '/'));

  if (!secret || !hash) {
    return NextResponse.redirect(new URL(`/login?error=config&next=${encodeURIComponent(next)}`, url));
  }

  const ip = getIp(req);
  if (!checkRateLimit(ip)) {
    await writeLog('warn', 'system', 'Login rate-limited', `ip=${ip}`);
    return NextResponse.redirect(new URL(`/login?error=rate&next=${encodeURIComponent(next)}`, url));
  }

  const ok = password.length > 0 && (await verifyPassword(password, hash));
  if (!ok) {
    await writeLog('warn', 'system', 'Login fehlgeschlagen', `ip=${ip}`);
    return NextResponse.redirect(new URL(`/login?error=1&next=${encodeURIComponent(next)}`, url));
  }

  const maxAge = getSessionMaxAge();
  const cookieValue = await signSession(secret, maxAge);
  await writeLog('info', 'system', 'Login erfolgreich', `ip=${ip}`);

  const res = NextResponse.redirect(new URL(next, url));
  res.cookies.set(SESSION_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
  return res;
}
