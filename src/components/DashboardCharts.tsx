'use client';

import { useState } from 'react';
import { ReserveChart } from '@/components/charts/ReserveChart';
import { StatusGrid } from '@/components/charts/StatusGrid';
import { Card, CardTitle } from '@/components/ui/Card';
import { enrichComponentAtYear } from '@/lib/calculations';
import type { RawComponent, EnrichedComponent, ReserveProjectionRow } from '@/types';

interface Props {
  rawComponents: RawComponent[];
  projection: ReserveProjectionRow[];
  enriched: EnrichedComponent[];
}

export function DashboardCharts({ rawComponents, projection, enriched }: Props) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  function handleYearSelect(year: number) {
    setSelectedYear((prev) => (prev === year ? null : year));
  }

  const displayComponents = selectedYear
    ? rawComponents.map((c) => enrichComponentAtYear(c, selectedYear))
    : enriched;

  return (
    <>
      {enriched.length > 0 && (
        <Card>
          <div className="mb-4">
            <CardTitle>Reserve-Projektion (15 Jahre)</CardTitle>
            <p className="text-xs text-gray-400 mt-1">
              Grün = IST-Rücklage · Amber = SOLL · Rot = Ausgaben · Klick auf Jahr für Details
            </p>
          </div>
          <ReserveChart
            data={projection}
            rawComponents={rawComponents}
            selectedYear={selectedYear}
            onYearSelect={handleYearSelect}
          />
        </Card>
      )}

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <CardTitle>
              Komponentenstatus{selectedYear ? ` — ${selectedYear}` : ''}
            </CardTitle>
            <p className="text-xs text-gray-400 mt-1">
              {selectedYear
                ? `Zustand aller Komponenten im Jahr ${selectedYear}`
                : 'Lebensdauerfortschritt aller Komponenten — Klick auf Name für Details'}
            </p>
          </div>
          {selectedYear && (
            <button
              onClick={() => setSelectedYear(null)}
              className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded px-2 py-1 transition-colors"
            >
              × Aktuell
            </button>
          )}
        </div>
        <StatusGrid components={displayComponents} />
      </Card>
    </>
  );
}
