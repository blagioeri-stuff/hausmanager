'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatChf, formatDate } from '@/lib/formatters';
import type { RawMaintenanceEntry } from '@/types';

const schema = z.object({
  date: z.string().min(1, 'Datum erforderlich'),
  description: z.string().min(1, 'Beschreibung erforderlich'),
  costChf: z.number().nonnegative('Muss 0 oder positiv sein').nullable().optional(),
  serviceProvider: z.string().nullable().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  componentId: string;
  initialEntries: RawMaintenanceEntry[];
}

function EntryForm({
  componentId,
  entry,
  onSuccess,
  onCancel,
}: {
  componentId: string;
  entry?: RawMaintenanceEntry;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: entry ? entry.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      description: entry?.description ?? '',
      costChf: entry?.costChf ?? null,
      serviceProvider: entry?.serviceProvider ?? '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const url = entry
        ? `/api/components/${componentId}/maintenance/${entry.id}`
        : `/api/components/${componentId}/maintenance`;
      const method = entry ? 'PUT' : 'POST';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          costChf: data.costChf || null,
          serviceProvider: data.serviceProvider || null,
        }),
      });
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Datum" type="date" error={errors.date?.message} {...register('date')} />
      <Input label="Beschreibung" placeholder="Was wurde gemacht?" error={errors.description?.message} {...register('description')} />
      <Input label="Dienstleister / Firma — optional" placeholder="z.B. Heizung AG Bern" {...register('serviceProvider')} />
      <Input
        label="Kosten (CHF) — optional"
        type="number"
        step="0.01"
        placeholder="0"
        error={errors.costChf?.message}
        {...register('costChf', { valueAsNumber: true, setValueAs: (v) => (v === '' || isNaN(Number(v)) ? null : Number(v)) })}
      />
      <div className="flex gap-3 pt-1">
        <Button type="submit" loading={loading} size="sm">{entry ? 'Speichern' : 'Hinzufügen'}</Button>
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>Abbrechen</Button>
      </div>
    </form>
  );
}

export function MaintenanceList({ componentId, initialEntries }: Props) {
  const router = useRouter();
  const [entries, setEntries] = useState(initialEntries);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<RawMaintenanceEntry | null>(null);

  const refresh = async () => {
    const res = await fetch(`/api/components/${componentId}/maintenance`);
    setEntries(await res.json());
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Wartungseintrag wirklich löschen?')) return;
    await fetch(`/api/components/${componentId}/maintenance/${id}`, { method: 'DELETE' });
    await refresh();
  };

  const totalCost = entries.reduce((sum, e) => sum + (e.costChf ?? 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Wartungshistorie</h2>
          {entries.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {entries.length} Einträge · Total: {formatChf(totalCost)}
            </p>
          )}
        </div>
        <Button size="sm" variant="secondary" onClick={() => setShowAdd(true)}>+ Eintrag</Button>
      </div>

      {entries.length === 0 && !showAdd ? (
        <p className="text-sm text-gray-400 py-4">Noch keine Wartungseinträge.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <div key={e.id} className="flex items-start justify-between bg-gray-50 rounded-lg px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-900">{formatDate(e.date)}</span>
                  {e.costChf != null && (
                    <span className="text-gray-500">· {formatChf(e.costChf)}</span>
                  )}
                  {e.serviceProvider && (
                    <span className="text-gray-400 text-xs">· {e.serviceProvider}</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-0.5 truncate">{e.description}</p>
              </div>
              <div className="flex gap-1 ml-2 shrink-0">
                <button
                  onClick={() => setEditing(e)}
                  className="text-xs text-gray-400 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50"
                >
                  Bearbeiten
                </button>
                <button
                  onClick={() => handleDelete(e.id)}
                  className="text-xs text-gray-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                >
                  Löschen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="mt-3 bg-white border border-gray-200 rounded-lg p-4">
          <EntryForm
            componentId={componentId}
            onSuccess={async () => { setShowAdd(false); await refresh(); }}
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Wartungseintrag bearbeiten">
        {editing && (
          <EntryForm
            componentId={componentId}
            entry={editing}
            onSuccess={async () => { setEditing(null); await refresh(); }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}
