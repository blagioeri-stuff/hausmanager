import { describe, it, expect } from 'vitest';
import { signSession, verifySession, getSessionMaxAge } from '../auth';
import { hashPassword, verifyPassword } from '../auth-password';

const SECRET = 'test-secret-bytes-of-decent-length-32+';

describe('signSession / verifySession', () => {
  it('round-trips a valid session', async () => {
    const cookie = await signSession(SECRET, 60);
    expect(await verifySession(cookie, SECRET)).toBe(true);
  });

  it('rejects undefined cookie', async () => {
    expect(await verifySession(undefined, SECRET)).toBe(false);
  });

  it('rejects malformed cookie (no dot)', async () => {
    expect(await verifySession('garbage', SECRET)).toBe(false);
  });

  it('rejects cookie signed with different secret', async () => {
    const cookie = await signSession(SECRET, 60);
    expect(await verifySession(cookie, 'wrong-secret')).toBe(false);
  });

  it('rejects tampered payload', async () => {
    const cookie = await signSession(SECRET, 60);
    const [, sig] = cookie.split('.');
    const fakePayload = Buffer.from(JSON.stringify({ exp: Date.now() + 999999 }))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    expect(await verifySession(`${fakePayload}.${sig}`, SECRET)).toBe(false);
  });

  it('rejects tampered signature', async () => {
    const cookie = await signSession(SECRET, 60);
    const [payload] = cookie.split('.');
    expect(await verifySession(`${payload}.AAAAAAAA`, SECRET)).toBe(false);
  });

  it('rejects expired session', async () => {
    const cookie = await signSession(SECRET, -10);
    expect(await verifySession(cookie, SECRET)).toBe(false);
  });
});

describe('getSessionMaxAge', () => {
  it('defaults to 30 days when env not set', () => {
    delete process.env.SESSION_MAX_AGE;
    expect(getSessionMaxAge()).toBe(60 * 60 * 24 * 30);
  });

  it('parses positive integer from env', () => {
    process.env.SESSION_MAX_AGE = '3600';
    expect(getSessionMaxAge()).toBe(3600);
    delete process.env.SESSION_MAX_AGE;
  });

  it('falls back to default for invalid env', () => {
    process.env.SESSION_MAX_AGE = 'not-a-number';
    expect(getSessionMaxAge()).toBe(60 * 60 * 24 * 30);
    delete process.env.SESSION_MAX_AGE;
  });
});

describe('hashPassword / verifyPassword', () => {
  it('verifies a correct password', async () => {
    const hash = await hashPassword('hunter2');
    expect(await verifyPassword('hunter2', hash)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('hunter2');
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('produces different hashes for the same password (salt)', async () => {
    const a = await hashPassword('same');
    const b = await hashPassword('same');
    expect(a).not.toBe(b);
  });

  it('rejects malformed hash strings', async () => {
    expect(await verifyPassword('any', 'garbage')).toBe(false);
    expect(await verifyPassword('any', 'scrypt$abc')).toBe(false);
    expect(await verifyPassword('any', 'bcrypt$x$y')).toBe(false);
  });
});
