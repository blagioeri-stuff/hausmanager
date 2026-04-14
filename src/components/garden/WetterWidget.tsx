'use client';

import { useState, useEffect } from 'react';

interface WeatherResult {
  available: boolean;
  location?: string;
  temperature?: number;
  precipitation?: number;
  description?: string;
  emoji?: string;
  isFrost?: boolean;
}

interface Props {
  winterProtectionCount: number;
}

export function WetterWidget({ winterProtectionCount }: Props) {
  const [weather, setWeather] = useState<WeatherResult | null>(null);

  useEffect(() => {
    fetch('/api/garten/wetter')
      .then((r) => r.json())
      .then(setWeather)
      .catch(() => setWeather({ available: false }));
  }, []);

  if (!weather || !weather.available) return null;

  const showFrostWarning = weather.isFrost && winterProtectionCount > 0;

  return (
    <div className="space-y-2">
      {/* Frost warning */}
      {showFrostWarning && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-xl shrink-0">🧊</span>
          <div>
            <p className="text-sm font-semibold text-blue-900">Frostwarnung — {weather.temperature}°C</p>
            <p className="text-xs text-blue-600 mt-0.5">
              {winterProtectionCount} Pflanze{winterProtectionCount !== 1 ? 'n' : ''} mit Winterschutz-Bedarf. Bitte schützen!
            </p>
          </div>
        </div>
      )}

      {/* Weather card */}
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-4 shadow-sm">
        <span className="text-3xl">{weather.emoji}</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            {weather.temperature}°C · {weather.description}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {weather.location}
            {weather.precipitation ? ` · ${weather.precipitation} mm Niederschlag` : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
