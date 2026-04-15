import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const rows = await prisma.setting.findMany();
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  // Merge env var overrides
  const envOverrides: Record<string, string> = {};
  if (process.env.CLAUDE_API_KEY) envOverrides.claudeApiKey = '(set via env)';
  if (process.env.SMTP_HOST) envOverrides.smtpHost = process.env.SMTP_HOST;
  if (process.env.SMTP_PORT) envOverrides.smtpPort = process.env.SMTP_PORT;
  if (process.env.SMTP_USER) envOverrides.smtpUser = process.env.SMTP_USER;
  if (process.env.SMTP_FROM) envOverrides.smtpFrom = process.env.SMTP_FROM;
  if (process.env.NOTIFY_EMAIL) envOverrides.notifyEmail = process.env.NOTIFY_EMAIL;
  if (process.env.TELEGRAM_TOKEN) envOverrides.telegramToken = '(set via env)';
  if (process.env.TELEGRAM_CHAT_ID) envOverrides.telegramChatId = process.env.TELEGRAM_CHAT_ID;
  return NextResponse.json({ ...settings, ...envOverrides });
}

export async function POST(request: Request) {
  const body = await request.json() as Record<string, string>;
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  const ops = Object.entries(body).map(([key, value]) =>
    prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
  );
  await Promise.all(ops);
  return NextResponse.json({ ok: true });
}
