export const SESSION_COOKIE_NAME = 'hm_session';

const enc = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function stringToBase64Url(str: string): string {
  return bytesToBase64Url(enc.encode(str));
}

function base64UrlToString(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  return atob(padded);
}

function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function hmacSha256(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return bytesToBase64Url(new Uint8Array(sig));
}

export interface SessionPayload {
  exp: number;
}

export async function signSession(secret: string, maxAgeSec: number): Promise<string> {
  const payload: SessionPayload = { exp: Date.now() + maxAgeSec * 1000 };
  const payloadB64 = stringToBase64Url(JSON.stringify(payload));
  const sig = await hmacSha256(secret, payloadB64);
  return `${payloadB64}.${sig}`;
}

export async function verifySession(cookie: string | undefined, secret: string): Promise<boolean> {
  if (!cookie) return false;
  const parts = cookie.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, sig] = parts;
  const expected = await hmacSha256(secret, payloadB64);
  if (!timingSafeStringEqual(sig, expected)) return false;
  try {
    const payload = JSON.parse(base64UrlToString(payloadB64)) as SessionPayload;
    return typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function getSessionMaxAge(): number {
  const raw = process.env.SESSION_MAX_AGE;
  if (!raw) return 60 * 60 * 24 * 30;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 60 * 60 * 24 * 30;
}
