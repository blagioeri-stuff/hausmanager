import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';
import { PLANT_TYPES } from '@/lib/garden-types';
import { writeLog } from '@/lib/log';

export async function POST(request: Request) {
  try {
    const { plantId } = await request.json() as { plantId: string };
    if (!plantId) {
      return NextResponse.json({ error: 'plantId erforderlich' }, { status: 400 });
    }

    // Load target plant + all other plants
    const [targetPlant, allPlants, settingsList] = await Promise.all([
      prisma.gardenPlant.findUnique({ where: { id: plantId } }),
      prisma.gardenPlant.findMany({ where: { id: { not: plantId } }, select: { name: true, typeKey: true } }),
      prisma.setting.findMany(),
    ]);

    if (!targetPlant) {
      return NextResponse.json({ error: 'Pflanze nicht gefunden' }, { status: 404 });
    }

    const settings = Object.fromEntries(settingsList.map((s) => [s.key, s.value]));
    const apiKey = process.env.CLAUDE_API_KEY || settings.claudeApiKey;
    if (!apiKey) {
      return NextResponse.json({ error: 'Kein Claude API-Key konfiguriert.' }, { status: 400 });
    }

    const targetTypeDef = PLANT_TYPES[targetPlant.typeKey];
    const existingList = allPlants.length > 0
      ? allPlants.map((p) => `- ${PLANT_TYPES[p.typeKey]?.icon ?? '🌿'} ${p.name} (${PLANT_TYPES[p.typeKey]?.labelDe ?? p.typeKey})`).join('\n')
      : '(Noch keine weiteren Pflanzen)';

    const prompt = `Du bist ein Gartenexperte. Im Garten steht:

Hauptpflanze: ${targetTypeDef?.icon ?? '🌿'} ${targetPlant.name} (${targetTypeDef?.labelDe ?? targetPlant.typeKey})

Bereits vorhandene Pflanzen:
${existingList}

Schlage 3–5 passende Begleitpflanzen (Companion Plants) für "${targetPlant.name}" vor, die noch nicht im Garten sind.
Berücksichtige: gegenseitiger Nutzen, Schädlingsabwehr, Bodenkonditionierung, Blütezeiten und Platzanforderungen.

Antworte NUR als JSON-Array (kein Markdown):
[{"name":"...","type":"baum|strauch|staude|gemüse|obst|kräuter|kletterpflanze|rasen|sonstiges","reason":"..."}]

"reason" ist eine kurze Erklärung auf Deutsch (max. 2 Sätze), warum diese Pflanze gut passt.`;

    const model = settings.claudeModel || 'claude-haiku-4-5-20251001';
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model,
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = JSON.parse(jsonMatch[0]) as { name: string; type: string; reason: string }[];
    await writeLog('info', 'ki', `Companion Planting für "${targetPlant.name}": ${suggestions.length} Vorschläge`);
    return NextResponse.json({ suggestions });
  } catch (e) {
    await writeLog('error', 'ki', 'Fehler beim Companion Planting', e instanceof Error ? e.message : String(e));
    console.error('Companion planting error:', e);
    return NextResponse.json({ error: 'Fehler beim Generieren der Vorschläge.' }, { status: 500 });
  }
}
