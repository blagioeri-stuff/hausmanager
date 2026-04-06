'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { CostForm, CostFormValues } from '@/components/forms/CostForm';

const today = new Date().toISOString().split('T')[0];

const PRESETS: Partial<CostFormValues>[] = [
  { type: 'wiederkehrend', category: 'versicherung', description: 'Gebäudeversicherung', recurrence: 'jährlich', amountChf: 800 },
  { type: 'wiederkehrend', category: 'versicherung', description: 'Hausratsversicherung', recurrence: 'jährlich', amountChf: 300 },
  { type: 'wiederkehrend', category: 'heizung_service', description: 'Heizungsservice', recurrence: 'jährlich', amountChf: 350 },
  { type: 'wiederkehrend', category: 'garten', description: 'Gartenpflege', recurrence: 'jährlich', amountChf: 1200 },
  { type: 'wiederkehrend', category: 'verwaltung', description: 'Kehrichtgebühren', recurrence: 'jährlich', amountChf: 400 },
  { type: 'wiederkehrend', category: 'verwaltung', description: 'Wasser & Abwasser', recurrence: 'jährlich', amountChf: 600 },
  { type: 'einmalig', category: 'reparatur', description: 'Reparatur', date: today, amountChf: 500 },
];

export default function NeueKostenPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<Partial<CostFormValues> | undefined>(undefined);

  async function handleSubmit(values: CostFormValues) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fehler beim Speichern');
      router.push('/kosten');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader title="Neue Kosten erfassen" />

      <Card>
        <p className="text-xs font-medium text-gray-500 mb-3">Schnellerfassung — häufige Kostenarten</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => setPrefill({ ...p })}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-full text-gray-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-colors"
            >
              {p.description}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CostForm
          key={JSON.stringify(prefill)}
          initialValues={prefill}
          onSubmit={handleSubmit}
          submitLabel="Kosten speichern"
          loading={loading}
          error={error}
        />
      </Card>
    </div>
  );
}

