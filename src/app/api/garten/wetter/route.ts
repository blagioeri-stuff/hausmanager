import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface WeatherCache {
  data: WeatherResult;
  fetchedAt: number;
}

interface WeatherResult {
  available: boolean;
  location?: string;
  temperature?: number;
  precipitation?: number;
  weatherCode?: number;
  description?: string;
  emoji?: string;
  isFrost?: boolean;
}

// Module-level cache — valid for self-hosted Node.js process
let cache: WeatherCache | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function weatherDescription(code: number): string {
  if (code === 0) return 'Sonnig';
  if (code <= 3) return 'Leicht bewölkt';
  if (code <= 9) return 'Bewölkt';
  if (code <= 29) return 'Niederschlag';
  if (code <= 39) return 'Nebel';
  if (code <= 49) return 'Gefrierender Nebel';
  if (code <= 59) return 'Nieselregen';
  if (code <= 69) return 'Regen';
  if (code <= 79) return 'Schneefall';
  if (code <= 84) return 'Schneeregen';
  if (code <= 94) return 'Gewitter';
  return 'Schweres Gewitter';
}

function weatherEmoji(code: number, temp: number): string {
  if (temp <= 0) return '❄️';
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 9) return '☁️';
  if (code <= 49) return '🌫️';
  if (code <= 69) return '🌧️';
  if (code <= 79) return '🌨️';
  if (code <= 94) return '⛈️';
  return '🌩️';
}

export async function GET() {
  // Serve from cache if fresh
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(cache.data);
  }

  try {
    const settingsList = await prisma.setting.findMany();
    const settings = Object.fromEntries(settingsList.map((s) => [s.key, s.value]));
    const gartenStandort = settings.gartenStandort || '';

    if (!gartenStandort) {
      const result: WeatherResult = { available: false };
      cache = { data: result, fetchedAt: Date.now() };
      return NextResponse.json(result);
    }

    // Geocode
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(gartenStandort)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'Hausmanager/1.1' } }
    );
    const geoData = await geoRes.json();
    if (!Array.isArray(geoData) || geoData.length === 0) {
      const result: WeatherResult = { available: false };
      cache = { data: result, fetchedAt: Date.now() };
      return NextResponse.json(result);
    }

    const { lat, lon, display_name } = geoData[0];

    // Get weather
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code`
    );
    const weatherData = await weatherRes.json();
    const temp: number = weatherData?.current?.temperature_2m ?? 0;
    const precip: number = weatherData?.current?.precipitation ?? 0;
    const code: number = weatherData?.current?.weather_code ?? 0;

    // Extract city name from display_name (first part before comma)
    const cityName = String(display_name).split(',')[0].trim();

    const result: WeatherResult = {
      available: true,
      location: cityName,
      temperature: Math.round(temp * 10) / 10,
      precipitation: precip,
      weatherCode: code,
      description: weatherDescription(code),
      emoji: weatherEmoji(code, temp),
      isFrost: temp < 2,
    };

    cache = { data: result, fetchedAt: Date.now() };
    return NextResponse.json(result);
  } catch {
    const result: WeatherResult = { available: false };
    cache = { data: result, fetchedAt: Date.now() };
    return NextResponse.json(result);
  }
}
