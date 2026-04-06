'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

export const COST_CATEGORIES = [
  { value: 'reparatur', label: 'Reparatur' },
  { value: 'versicherung', label: 'Versicherung' },
  { value: 'heizung_service', label: 'Heizungsservice' },
  { value: 'garten', label: 'Garten & Aussenbereich' },
  { value: 'reinigung', label: 'Reinigung & Pflege' },
  { value: 'verwaltung', label: 'Verwaltung & Gebühren' },
  { value: 'sonstiges', label: 'Sonstiges' },
];

const RECURRENCE_OPTIONS = [
  { value: 'monatlich', label: 'Monatlich' },
  { value: 'vierteljährlich', label: 'Vierteljährlich' },
  { value: 'jährlich', label: 'Jährlich' },
];

interface Component {
  id: string;
  name: string;
}

export interface CostFormValues {
  type: 'einmalig' | 'wiederkehrend';
  category: string;
  description: string;
  amountChf: number;
  date: string;
  recurrence?: string | null;
  componentId?: string | null;
  notes?: string | null;
}

interface CostFormProps {
  initialValues?: Partial<CostFormValues>;
  onSubmit: (values: CostFormValues) => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
  error?: string | null;
}

const today = new Date().toISOString().split('T')[0];

export function CostForm({ initialValues, onSubmit, submitLabel = 'Speichern', loading, error }: CostFormProps) {
  const [type, setType] = useState<'einmalig' | 'wiederkehrend'>(initialValues?.type ?? 'einmalig');
  const [category, setCategory] = useState(initialValues?.category ?? 'reparatur');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [amountChf, setAmountChf] = useState(initialValues?.amountChf?.toString() ?? '');
  const [date, setDate] = useState(initialValues?.date ?? today);
  const [recurrence, setRecurrence] = useState(initialValues?.recurrence ?? 'jährlich');
  const [componentId, setComponentId] = useState(initialValues?.componentId ?? '');
  const [notes, setNotes] = useState(initialValues?.notes ?? '');
  const [components, setComponents] = useState<Component[]>([]);

  useEffect(() => {
    fetch('/api/components')
      .then((r) => r.json())
      .then((data: Component[]) => setComponents(data))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      type,
      category,
      description,
      amountChf: parseFloat(amountChf),
      date,
      recurrence: type === 'wiederkehrend' ? recurrence : null,
      componentId: componentId || null,
      notes: notes || null,
    });
  }

  const componentOptions = [
    { value: '', label: '— Keine Komponente —' },
    ...components.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Art</label>
        <div className="flex gap-2">
          {(['einmalig', 'wiederkehrend'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${
                type === t
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              {t === 'einmalig' ? 'Einmalig' : 'Wiederkehrend'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Kategorie"
          options={COST_CATEGORIES}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <Input
          label="Betrag (CHF)"
          type="number"
          min="0"
          step="0.01"
          required
          value={amountChf}
          onChange={(e) => setAmountChf(e.target.value)}
        />
      </div>

      <Input
        label="Beschreibung"
        required
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="z.B. Heizungsservice Vaillant"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={type === 'einmalig' ? 'Datum' : 'Abrechnungsdatum'}
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        {type === 'wiederkehrend' && (
          <Select
            label="Rhythmus"
            options={RECURRENCE_OPTIONS}
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value)}
          />
        )}
      </div>

      <Select
        label="Verknüpfte Komponente (optional)"
        options={componentOptions}
        value={componentId}
        onChange={(e) => setComponentId(e.target.value)}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notiz (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" loading={loading}>
        {submitLabel}
      </Button>
    </form>
  );
}
