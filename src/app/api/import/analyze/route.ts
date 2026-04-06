import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';
import { COMPONENT_TYPES } from '@/lib/component-types';

const SYSTEM_PROMPT = `Du bist ein Experte für Schweizer Immobilien und Gebäudeunterhalt.
Analysiere den folgenden Inhalt und extrahiere alle Gebäudekomponenten (Küche, Heizung, Dach, Fenster, Badezimmer, etc.).

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

const TEXT_MIME_TYPES = [
  'text/plain', 'text/csv', 'text/markdown', 'text/html', 'text/xml',
  'application/json', 'application/xml',
];

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') ?? '';
    let fileBuffer: Buffer | null = null;
    let mimeType = '';
    let fileName = '';
    let instruction = '';
    let textContent: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      instruction = (formData.get('instruction') as string) || '';
      textContent = (formData.get('textContent') as string) || null;

      if (file && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
        mimeType = file.type;
        fileName = file.name;
      }
    } else {
      // JSON body with text content
      const body = await req.json();
      instruction = body.instruction || '';
      textContent = body.textContent || null;
    }

    // Need either a file or text content
    if (!fileBuffer && !textContent) {
      return NextResponse.json({ error: 'Keine Datei oder Text angegeben' }, { status: 400 });
    }

    // Get API key with trim check
    const dbKey = (await prisma.setting.findUnique({ where: { key: 'claudeApiKey' } }))?.value?.trim();
    const apiKey = process.env.CLAUDE_API_KEY?.trim() || dbKey;
    if (!apiKey) {
      return NextResponse.json({ error: 'Kein Claude API-Key konfiguriert. Bitte in den Einstellungen speichern.' }, { status: 400 });
    }

    const model =
      (await prisma.setting.findUnique({ where: { key: 'claudeModel' } }))?.value?.trim() ??
      'claude-sonnet-4-6';

    const client = new Anthropic({ apiKey });

    let messageContent: Anthropic.MessageParam['content'];
    const userText = instruction
      ? `Anweisung: ${instruction}\n\nExtrahiere alle Gebäudekomponenten als JSON.`
      : 'Extrahiere alle Gebäudekomponenten als JSON.';

    if (textContent) {
      // Direct text input
      messageContent = `${userText}\n\nInhalt:\n${textContent}`;
    } else if (fileBuffer) {
      if (mimeType === 'application/pdf') {
        // Native PDF support via document block
        messageContent = [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: fileBuffer.toString('base64'),
            },
          } as Anthropic.DocumentBlockParam,
          { type: 'text', text: userText },
        ];
      } else if (mimeType.startsWith('image/')) {
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const imageMime = validImageTypes.includes(mimeType) ? mimeType : 'image/jpeg';
        messageContent = [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: imageMime as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: fileBuffer.toString('base64'),
            },
          },
          { type: 'text', text: userText },
        ];
      } else if (TEXT_MIME_TYPES.includes(mimeType) || fileName.match(/\.(txt|csv|md|json|xml|html)$/i)) {
        // Text-based file
        const text = fileBuffer.toString('utf-8');
        messageContent = `${userText}\n\nDateiinhalt (${fileName}):\n${text.slice(0, 50000)}`;
      } else {
        // Unsupported format — try as text anyway, with warning
        try {
          const text = fileBuffer.toString('utf-8');
          // Simple heuristic: if mostly printable chars, treat as text
          const printable = text.split('').filter((c) => c.charCodeAt(0) >= 32 || c === '\n' || c === '\r' || c === '\t').length;
          if (printable / text.length > 0.8) {
            messageContent = `${userText}\n\nDateiinhalt (${fileName}):\n${text.slice(0, 50000)}`;
          } else {
            return NextResponse.json({
              error: `Dateityp "${mimeType || fileName}" wird nicht direkt unterstützt. Bitte als PDF exportieren oder den Text direkt einfügen.`,
            }, { status: 400 });
          }
        } catch {
          return NextResponse.json({
            error: `Dateityp "${mimeType || fileName}" kann nicht gelesen werden. Bitte als PDF exportieren oder den Text direkt einfügen.`,
          }, { status: 400 });
        }
      }
    } else {
      return NextResponse.json({ error: 'Kein Inhalt zum Analysieren' }, { status: 400 });
    }

    const response = await client.messages.create({
      model,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: messageContent }],
    });

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({
        error: 'KI-Antwort konnte nicht verarbeitet werden',
        raw: rawText.slice(0, 500),
      }, { status: 500 });
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
