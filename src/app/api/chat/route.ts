import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';
import { enrichComponent, computeReserveSummary } from '@/lib/calculations';
import { formatChf } from '@/lib/formatters';

async function getSystemPrompt(): Promise<string> {
  const components = await prisma.homeComponent.findMany({
    include: { maintenance: { orderBy: { date: 'desc' }, take: 5 } },
    orderBy: { createdAt: 'asc' },
  });
  const settings = await prisma.setting.findMany();
  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  const enriched = components.map((c) =>
    enrichComponent({ ...c, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() })
  );
  const summary = computeReserveSummary(enriched);

  const houseInfo = settingsMap.houseName
    ? `Haus: ${settingsMap.houseName}${settingsMap.houseAddress ? `, ${settingsMap.houseAddress}` : ''}`
    : 'Einfamilienhaus in der Schweiz';

  const componentSummary = enriched.map((c) => {
    const lastMaintenance = components.find((r) => r.id === c.id)?.maintenance[0];
    return `- ${c.name} (${c.typeDef.labelDe}): Baujahr ${c.buildYear}, Erneuerung ${c.replacementYear} (${c.yearsRemaining <= 0 ? 'FÄLLIG' : `in ${c.yearsRemaining} J.`}), Status: ${c.statusColor}, CHF ${Math.round(c.annualSavingsChf)}/Jahr${lastMaintenance ? `, letzte Wartung: ${lastMaintenance.date.toISOString().slice(0, 10)}` : ''}`;
  }).join('\n');

  return `Du bist ein hilfreicher Hausmanager-Assistent für Schweizer Hauseigentümer. Du kennst alle Daten des Hauses.

${houseInfo}

AKTUELLE HAUSINFORMATIONEN:
Jährliche Gesamtrücklage: ${formatChf(summary.totalAnnualSavingsChf)} (${formatChf(summary.totalAnnualSavingsChf / 12)}/Monat)
SOLL-Reserve heute: ${formatChf(summary.totalSollReserveChf)}
Anzahl Komponenten: ${summary.componentCount}
Nächste Erneuerung: ${summary.nextReplacementComponent ? `${summary.nextReplacementComponent.name} (${summary.nextReplacementYear})` : 'keine fällig'}

KOMPONENTEN:
${componentSummary || 'Noch keine Komponenten erfasst.'}

Beantworte Fragen auf Deutsch. Beziehe dich auf die obigen Daten wenn relevant. Du kannst auch allgemeine Fragen zu Renovationen, Handwerkerpreisen in der Schweiz und Unterhaltsplanung beantworten.`;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, apiKey, model } = await req.json();

    // Use provided API key or fall back to settings
    let effectiveKey = apiKey;
    if (!effectiveKey) {
      const setting = await prisma.setting.findUnique({ where: { key: 'claudeApiKey' } });
      effectiveKey = setting?.value;
    }
    if (!effectiveKey) {
      return NextResponse.json({ error: 'Kein Claude API-Key konfiguriert. Bitte in den Einstellungen hinterlegen.' }, { status: 400 });
    }

    const effectiveModel = model ?? (await prisma.setting.findUnique({ where: { key: 'claudeModel' } }))?.value ?? 'claude-haiku-4-5-20251001';
    const systemPrompt = await getSystemPrompt();

    const client = new Anthropic({ apiKey: effectiveKey });
    const response = await client.messages.create({
      model: effectiveModel,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const content = response.content[0];
    const text = content.type === 'text' ? content.text : '';
    return NextResponse.json({ text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
