import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';
import { getUploadPath } from '@/lib/uploads';

// Dynamically import pdf-parse to avoid issues with Next.js bundler
async function extractPdfText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse');
  const result = await pdfParse(buffer);
  return result.text;
}

export async function POST(req: NextRequest) {
  try {
    const { storedName, mimeType, description } = await req.json();

    if (!storedName) {
      return NextResponse.json({ error: 'storedName fehlt' }, { status: 400 });
    }

    // Get API key from settings
    const setting = await prisma.setting.findUnique({ where: { key: 'claudeApiKey' } });
    if (!setting?.value) {
      return NextResponse.json({ error: 'Kein Claude API-Key konfiguriert. Bitte in den Einstellungen hinterlegen.' }, { status: 400 });
    }
    const model = (await prisma.setting.findUnique({ where: { key: 'claudeModel' } }))?.value ?? 'claude-haiku-4-5-20251001';

    const filePath = getUploadPath(storedName);
    const buffer = await fs.readFile(filePath);

    const client = new Anthropic({ apiKey: setting.value });

    const systemPrompt = `Du bist ein Assistent für Schweizer Hauseigentümer. Analysiere das folgende Dokument (Rechnung, Offerte, Quittung oder Bericht) und extrahiere strukturierte Informationen.

Antworte NUR mit einem JSON-Objekt (kein Markdown, keine Erklärung), mit diesen Feldern:
{
  "description": "Kurze Beschreibung der ausgeführten Arbeit (1-2 Sätze)",
  "date": "Datum im Format YYYY-MM-DD (oder null wenn nicht erkennbar)",
  "costChf": Betrag in CHF als Zahl ohne Anführungszeichen (oder null wenn nicht erkennbar),
  "serviceProvider": "Name der Firma/des Handwerkers (oder null wenn nicht erkennbar)",
  "suggestedTypeKey": "einer von: kueche|badezimmer|wc|heizung|dach|fenster|fassade|bodenbelaege|elektro|sanitaer|maler_innen|maler_aussen|garten|garage|kuechen_geraete (oder null)"
}`;

    let userContent: Anthropic.MessageParam['content'];

    if (mimeType === 'application/pdf') {
      const text = await extractPdfText(buffer);
      const truncated = text.slice(0, 8000);
      userContent = `${description ? `Kontext: ${description}\n\n` : ''}Dokument-Inhalt:\n${truncated}`;
    } else {
      // Image: send as base64
      const base64 = buffer.toString('base64');
      const imgType = mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
      userContent = [
        ...(description ? [{ type: 'text' as const, text: `Kontext: ${description}` }] : []),
        {
          type: 'image' as const,
          source: { type: 'base64' as const, media_type: imgType, data: base64 },
        },
        { type: 'text' as const, text: 'Bitte analysiere dieses Dokument.' },
      ];
    }

    const response = await client.messages.create({
      model,
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const extracted = JSON.parse(cleaned);

    return NextResponse.json(extracted);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
