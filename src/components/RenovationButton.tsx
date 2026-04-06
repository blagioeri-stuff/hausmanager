'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface Props {
  componentId: string;
  componentName: string;
}

export function RenovationButton({ componentId, componentName }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!confirm(`Renovation für "${componentName}" als abgeschlossen markieren?\n\nDies setzt das Baujahr auf ${new Date().getFullYear()} und erstellt einen Wartungseintrag.`)) return;

    setLoading(true);
    setError(null);
    const currentYear = new Date().getFullYear();

    try {
      // 1. Update buildYear to current year and clear plannedRenovationYear
      const updateRes = await fetch(`/api/components/${componentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildYear: currentYear,
          plannedRenovationYear: null,
          plannedRenovationCostChf: null,
        }),
      });
      if (!updateRes.ok) {
        const d = await updateRes.json().catch(() => ({}));
        throw new Error(d.error ?? `Fehler ${updateRes.status}`);
      }

      // 2. Create maintenance entry
      const maintRes = await fetch(`/api/components/${componentId}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().slice(0, 10),
          description: 'Renovation abgeschlossen',
        }),
      });
      if (!maintRes.ok) {
        const d = await maintRes.json().catch(() => ({}));
        throw new Error(d.error ?? `Wartungseintrag Fehler ${maintRes.status}`);
      }

      setDone(true);
      // Reload page to show updated data
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
        <svg className="h-4 w-4 text-green-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <p className="text-sm text-green-700">Renovation gespeichert — Seite wird aktualisiert…</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button variant="secondary" size="sm" onClick={handleClick} loading={loading}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Renovation abgeschlossen
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
