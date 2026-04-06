'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CostChart } from '@/components/charts/CostChart';
import { COST_CATEGORIES } from '@/components/forms/CostForm';

interface Cost {
  id: string;
  type: string;
  category: string;
  description: string;
  amountChf: number;
  date: string | Date;
  recurrence: string | null;
  notes: string | null;
  component: { id: string; name: string } | null;
}

const TYPE_LABELS: Record<string, string> = {
  einmalig: 'Einmalig',
  wiederkehrend: 'Wiederkehrend',
};

const RECURRENCE_LABELS: Record<string, string> = {
  monatlich: 'monatlich',
  'vierteljährlich': 'vierteljährlich',
  jährlich: 'jährlich',
};

function getCategoryLabel(key: string) {
  return COST_CATEGORIES.find((c) => c.value === key)?.label ?? key;
}

export function KostenClient({ costs }: { costs: Cost[] }) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = costs.filter((c) => {
    if (typeFilter && c.type !== typeFilter) return false;
    if (categoryFilter && c.category !== categoryFilter) return false;
    return true;
  });

  const recurring = costs.filter((c) => c.type === 'wiederkehrend');

  async function handleDelete(id: string) {
    if (!confirm('Kosteneintrag löschen?')) return;
    setDeleting(id);
    try {
      await fetch(`/api/costs/${id}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Chart */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Monatliche Kosten (letzte 12 Monate)</h2>
        <CostChart costs={costs.map((c) => ({ ...c, date: new Date(c.date).toISOString() }))} />
      </Card>

      {/* Recurring costs */}
      {recurring.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Wiederkehrende Kosten</h2>
          <div className="divide-y divide-gray-100">
            {recurring.map((c) => {
              const factor = c.recurrence === 'monatlich' ? 12 : c.recurrence === 'vierteljährlich' ? 4 : 1;
              return (
                <div key={c.id} className="py-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.description}</p>
                    <p className="text-xs text-gray-500">
                      {getCategoryLabel(c.category)}
                      {c.recurrence ? ` · ${RECURRENCE_LABELS[c.recurrence] ?? c.recurrence}` : ''}
                      {c.component ? ` · ${c.component.name}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      CHF {c.amountChf.toLocaleString('de-CH', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-400">
                      CHF {(c.amountChf * factor).toLocaleString('de-CH', { minimumFractionDigits: 2 })} /Jahr
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Filters + table */}
      <Card>
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Alle Typen</option>
            <option value="einmalig">Einmalig</option>
            <option value="wiederkehrend">Wiederkehrend</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Alle Kategorien</option>
            {COST_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          {(typeFilter || categoryFilter) && (
            <button
              onClick={() => { setTypeFilter(''); setCategoryFilter(''); }}
              className="text-xs text-blue-600 hover:underline"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Keine Einträge gefunden</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((c) => (
              <div key={c.id} className="py-3 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.description}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.type === 'einmalig' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {TYPE_LABELS[c.type] ?? c.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {getCategoryLabel(c.category)}
                    {c.recurrence ? ` · ${RECURRENCE_LABELS[c.recurrence] ?? c.recurrence}` : ''}
                    {' · '}
                    {new Date(c.date).toLocaleDateString('de-CH')}
                    {c.component ? ` · ${c.component.name}` : ''}
                  </p>
                  {c.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{c.notes}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className="text-sm font-semibold text-gray-900">
                    CHF {c.amountChf.toLocaleString('de-CH', { minimumFractionDigits: 2 })}
                  </p>
                  <Link href={`/kosten/${c.id}/bearbeiten`}>
                    <button className="text-xs text-blue-600 hover:underline">Bearbeiten</button>
                  </Link>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deleting === c.id}
                    className="text-xs text-red-500 hover:underline disabled:opacity-50"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
