import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  try {
    const { apiKey, model } = await req.json();
    // Allow env var as override for testing too
    const effectiveKey = process.env.CLAUDE_API_KEY || apiKey;
    if (!effectiveKey) return NextResponse.json({ error: 'Kein API-Key angegeben' }, { status: 400 });

    const client = new Anthropic({ apiKey: effectiveKey });
    await client.messages.create({
      model: model ?? 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }],
    });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
