import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';
import { PLANT_TYPES, MONTHS_DE } from '@/lib/garden-types';
import { writeLog } from '@/lib/log';

export async function GET() {
  try {
    // Load settings
    const settingsList = await prisma.setting.findMany();
    const settings = Object.fromEntries(settingsList.map((s) => [s.key, s.value]));

    const apiKey = process.env.CLAUDE_API_KEY || settings.claudeApiKey;
    if (!apiKey) {
      return NextResponse.json({ error: 'Kein Claude API-Key konfiguriert. Bitte in den Einstellungen eintragen.' }, { status: 400 });
    }

    const model = settings.claudeModel || 'claude-haiku-4-5-20251001';
    const gartenStandort = settings.gartenStandort || '';

    // Load plants
    const plants = await prisma.gardenPlant.findMany({
      select: { id: true, name: true, typeKey: true, status: true },
    });

    // Current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const monthName = MONTHS_DE[currentMonth - 1];

    // Try weather if location is set
    let weatherInfo = '';
    if (gartenStandort) {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(gartenStandort)}&format=json&limit=1`,
          { headers: { 'User-Agent': 'Hausmanager/1.1' } }
        );
        const geoData = await geoRes.json();
        if (Array.isArray(geoData) && geoData.length > 0) {
          const { lat, lon } = geoData[0];
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code`
          );
          const weatherData = await weatherRes.json();
          const temp = weatherData?.current?.temperature_2m;
          const precip = weatherData?.current?.precipitation ?? 0;
          if (temp !== undefined) {
            weatherInfo = `\nAktuelles Wetter: ${temp}°C, Niederschlag: ${precip}mm.`;
          }
        }
      } catch {
        // ignore weather errors silently
      }
    }

    // Build plant list for prompt
    const plantList = plants.length > 0
      ? plants.map((p) => {
          const icon = PLANT_TYPES[p.typeKey]?.icon ?? '🌿';
          const typeDe = PLANT_TYPES[p.typeKey]?.labelDe ?? p.typeKey;
          return `- ${icon} ${p.name} (${typeDe}, Status: ${p.status})`;
        }).join('\n')
      : '(Noch keine Pflanzen erfasst)';

    const prompt = `Du bist ein Gartenexperte für den deutschsprachigen Raum. Heute ist ${monthName} ${currentYear}.
Gartenstandort: ${gartenStandort || 'Mitteleuropa/Schweiz'}.${weatherInfo}

Pflanzeninventar:
${plantList}

Erstelle 5–8 saisonale Gartenaufgaben passend zu diesem Monat, dem Wetter und dem Pflanzenbestand.
Berücksichtige: Düngung, Bewässerung, Schnitt, Schutz, Ernte und allgemeine Gartenpflege.

Antworte NUR als JSON-Array (kein Markdown, keine Erklärungen):
[{"title":"...","category":"pflege","priority":"normal","dueMonth":${currentMonth}}]

Erlaubte Kategorien: pflege, düngen, bewässerung, schutz, ernte, einwintern, sonstiges
Erlaubte Prioritäten: niedrig, normal, hoch
dueMonth muss eine Zahl von 1–12 sein.`;

    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ todos: [] });
    }

    const todos = JSON.parse(jsonMatch[0]) as { title: string; category: string; priority: string; dueMonth: number }[];
    await writeLog('info', 'ki', `KI-Gartenaufgaben generiert: ${todos.length} Vorschläge für ${monthName}`);
    return NextResponse.json({ todos });
  } catch (e) {
    await writeLog('error', 'ki', 'Fehler beim Generieren der KI-Gartenaufgaben', e instanceof Error ? e.message : String(e));
    console.error('KI Aufgaben Fehler:', e);
    return NextResponse.json({ error: 'Fehler beim Generieren der KI-Vorschläge.' }, { status: 500 });
  }
}
