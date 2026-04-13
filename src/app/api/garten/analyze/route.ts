import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';

const SYSTEM_PROMPT = `Du bist ein erfahrener Gärtner und Pflanzenexperte für den Schweizer Garten.
Analysiere das folgende Gartenfoto und identifiziere alle sichtbaren Pflanzen und Gartenelemente.

Gib zurück:
1. "plants": Liste erkannter Pflanzen, jede mit:
   - name: Pflanzname auf Deutsch (z.B. "Apfelbaum", "Rosenstrauch")
   - latinName: Lateinischer Name falls erkennbar, sonst null
   - typeKey: einer dieser Werte: baum | strauch | staude | gemüse | obst | kräuter | kletterpflanze | rasen | sonstiges
   - status: "gut" | "pflege_nötig" | "krank" | "dormant"
   - notes: Beobachtungen zu Gesundheit, Besonderheiten

2. "elements": Erkannte Gartenelemente wie:
   - name: Name des Elements (z.B. "Gartenteich", "Hochbeet")
   - typeKey: teich | terrasse | hochbeet | gewächshaus | rasenfläche | weg | sitzplatz | kompost | sonstiges
   - notes: Beobachtungen

3. "suggestions": 2–4 Vorschläge für Ergänzungspflanzen (Companion Planting), die gut zum sichtbaren Garten passen würden:
   - name: Pflanzenname
   - typeKey: wie oben
   - reason: kurze Begründung (Kompatibilität, Ästhetik, Schädlingsabwehr etc.)

4. "todos": 3–5 saisonale Aufgabenvorschläge basierend auf dem Zustand des Gartens:
   - title: Aufgabe
   - category: pflege | düngen | bewässerung | schutz | ernte | einwintern | pflanzung | sonstiges
   - priority: niedrig | normal | hoch

Antworte NUR mit einem JSON-Objekt in diesem Format, ohne zusätzlichen Text:
{
  "plants": [...],
  "elements": [...],
  "suggestions": [...],
  "todos": [...]
}`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const instruction = (formData.get('instruction') as string) || '';

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Kein Foto angegeben' }, { status: 400 });
    }

    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validImageTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Nur Bilder (JPEG, PNG, WebP) werden unterstützt' }, { status: 400 });
    }

    const dbKey = (await prisma.setting.findUnique({ where: { key: 'claudeApiKey' } }))?.value?.trim();
    const apiKey = process.env.CLAUDE_API_KEY?.trim() || dbKey;
    if (!apiKey) {
      return NextResponse.json({ error: 'Kein Claude API-Key konfiguriert. Bitte in den Einstellungen speichern.' }, { status: 400 });
    }

    const model =
      (await prisma.setting.findUnique({ where: { key: 'claudeModel' } }))?.value?.trim() ??
      'claude-sonnet-4-6';

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const imageMime = file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

    const client = new Anthropic({ apiKey });

    const userText = instruction
      ? `Anweisung: ${instruction}\n\nAnalysiere diesen Garten und gib das Ergebnis als JSON zurück.`
      : 'Analysiere diesen Garten und gib das Ergebnis als JSON zurück.';

    const response = await client.messages.create({
      model,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: imageMime, data: fileBuffer.toString('base64') },
            },
            { type: 'text', text: userText },
          ],
        },
      ],
    });

    const rawText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'KI hat kein gültiges JSON zurückgegeben', raw: rawText }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
