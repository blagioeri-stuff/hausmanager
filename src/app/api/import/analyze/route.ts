import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';
import { COMPONENT_TYPES } from '@/lib/component-types';

const SYSTEM_PROMPT = `Du bist ein Experte für Schweizer Immobilien und Gebäudeunterhalt.
Analysiere das folgende Dokument und extrahiere alle Gebäudekomponenten (Küche, Heizung, Dach, Fenster, Badezimmer, etc.).

Für jede Komponente, die du findest, gib zurück:
- name: Bezeichnung (z.B. "Badezimmer OG", "Heizung", "Dach")
- typeKey: einer dieser Werte: kueche, badezimmer, wc, heizung, dach, fenster, fassade, bodenbelaege, elektro, sanitaer, maler_innen, maler_aussen, garten, garage, kuechen_geraete, sonstiges
- buildYear: Baujahr oder letztes Renovationsjahr (als Zahl, z.B. 2005) — null wenn unbekannt
- estimatedCostChf: geschätzte Ersatzkosten in CHF (als Zahl) — null wenn unbekannt
- notes: kurze Notiz mit relevanten Details aus dem Dokument

Antworte NUR mit einem JSON-Objekt in folgendem Format, ohne zusätzlichen Text:
{
  "components": [
    { "name": "...", "typeKey": "...", "buildYear": 2005, "estimatedCostChf": 25000, "notes": "..." }
  ]
}

Wenn keine Komponenten gefunden werden, gib {"components": []} zurück.`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const instruction = (formData.get('instruction') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 });
    }

    // Get API key
    const apiKey =
      process.env.CLAUDE_API_KEY ||
      (await prisma.setting.findUnique({ where: { key: 'claudeApiKey' } }))?.value;
    if (!apiKey) {
      return NextResponse.json({ error: 'Kein Claude API-Key konfiguriert' }, { status: 400 });
    }

    const model =
      (await prisma.setting.findUnique({ where: { key: 'claudeModel' } }))?.value ??
      'claude-sonnet-4-6';

    const client = new Anthropic({ apiKey });
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let messageContent: Anthropic.MessageParam['content'];

    if (file.type === 'application/pdf') {
      // Use PDF document block (Claude native PDF support)
      const base64 = buffer.toString('base64');
      messageContent = [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64,
          },
        } as Anthropic.DocumentBlockParam,
        {
          type: 'text',
          text: instruction
            ? `Dokument analysiert. Zusätzliche Anweisung: ${instruction}\n\nExtrahiere alle Gebäudekomponenten als JSON.`
            : 'Extrahiere alle Gebäudekomponenten als JSON.',
        },
      ];
    } else if (file.type.startsWith('image/')) {
      const base64 = buffer.toString('base64');
      messageContent = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: base64,
          },
        },
        {
          type: 'text',
          text: instruction
            ? `Bild analysiert. Zusätzliche Anweisung: ${instruction}\n\nExtrahiere alle Gebäudekomponenten als JSON.`
            : 'Extrahiere alle Gebäudekomponenten als JSON.',
        },
      ];
    } else {
      // Plain text fallback
      const text = buffer.toString('utf-8');
      messageContent = instruction
        ? `${instruction}\n\nDokumentinhalt:\n${text}`
        : `Dokumentinhalt:\n${text}`;
    }

    const response = await client.messages.create({
      model,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: messageContent }],
    });

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse JSON from response (strip markdown fences if present)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'KI-Antwort konnte nicht verarbeitet werden', raw: rawText }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const components = (parsed.components ?? []).map((c: Record<string, unknown>) => ({
      name: String(c.name ?? ''),
      typeKey: (c.typeKey && String(c.typeKey) in COMPONENT_TYPES) ? String(c.typeKey) : 'sonstiges',
      buildYear: typeof c.buildYear === 'number' ? c.buildYear : null,
      estimatedCostChf: typeof c.estimatedCostChf === 'number' ? c.estimatedCostChf : null,
      notes: c.notes ? String(c.notes) : null,
    }));

    return NextResponse.json({ components });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
