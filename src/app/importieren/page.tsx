'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { COMPONENT_TYPE_LIST } from '@/lib/component-types';

interface SuggestedComponent {
  name: string;
  typeKey: string;
  buildYear: number | null;
  estimatedCostChf: number | null;
  notes: string | null;
  selected: boolean;
}

const currentYear = new Date().getFullYear();

export default function ImportierenPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [instruction, setInstruction] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedComponent[]>([]);
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState<'upload' | 'review'>('upload');

  const typeOptions = COMPONENT_TYPE_LIST.map((t) => ({ value: t.key, label: t.labelDe }));

  async function handleAnalyze() {
    if (!file) return;
    setAnalyzing(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('instruction', instruction);

      const res = await fetch('/api/import/analyze', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Analyse fehlgeschlagen');

      setSuggestions(
        (data.components as Omit<SuggestedComponent, 'selected'>[]).map((c) => ({
          ...c,
          selected: true,
        }))
      );
      setStep('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAnalyzing(false);
    }
  }

  function updateSuggestion(idx: number, field: keyof SuggestedComponent, value: unknown) {
    setSuggestions((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  }

  async function handleCreate() {
    const selected = suggestions.filter((s) => s.selected);
    if (selected.length === 0) return;
    setCreating(true);
    setError(null);
    try {
      await Promise.all(
        selected.map((s) =>
          fetch('/api/components', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: s.name,
              typeKey: s.typeKey,
              buildYear: s.buildYear ?? currentYear,
              customCostChf: s.estimatedCostChf ?? null,
              notes: s.notes ?? null,
            }),
          })
        )
      );
      router.push('/komponenten');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setCreating(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Komponenten importieren"
        subtitle="Lade ein Dokument hoch — die KI extrahiert Gebäudekomponenten automatisch"
      />

      {step === 'upload' && (
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Dokument hochladen</h2>

          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              file ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div>
                <p className="font-medium text-blue-700">{file.name}</p>
                <p className="text-xs text-blue-500 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
            ) : (
              <div>
                <svg className="h-10 w-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <p className="text-sm text-gray-500">PDF oder Bild auswählen</p>
                <p className="text-xs text-gray-400 mt-1">z.B. Verkaufsdossier, Baubeschrieb, Gebäudeausweis</p>
              </div>
            )}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anweisung (optional)
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="z.B. Extrahiere alle Gebäudekomponenten mit Baujahr. Fokus auf Haustechnik."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

          <div className="mt-4">
            <Button onClick={handleAnalyze} loading={analyzing} disabled={!file}>
              Mit KI analysieren
            </Button>
          </div>
        </Card>
      )}

      {step === 'review' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {suggestions.filter((s) => s.selected).length} von {suggestions.length} Komponenten ausgewählt
            </p>
            <Button variant="secondary" size="sm" onClick={() => { setStep('upload'); setSuggestions([]); }}>
              Neues Dokument
            </Button>
          </div>

          {suggestions.length === 0 ? (
            <Card>
              <p className="text-sm text-gray-500 text-center py-8">
                Die KI hat keine Komponenten in diesem Dokument gefunden.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {suggestions.map((s, idx) => (
                <Card key={idx} className={s.selected ? '' : 'opacity-50'}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={s.selected}
                      onChange={(e) => updateSuggestion(idx, 'selected', e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Bezeichnung"
                        value={s.name}
                        onChange={(e) => updateSuggestion(idx, 'name', e.target.value)}
                      />
                      <Select
                        label="Typ"
                        options={typeOptions}
                        value={s.typeKey}
                        onChange={(e) => updateSuggestion(idx, 'typeKey', e.target.value)}
                      />
                      <Input
                        label="Baujahr"
                        type="number"
                        value={s.buildYear ?? ''}
                        onChange={(e) => updateSuggestion(idx, 'buildYear', e.target.value ? parseInt(e.target.value) : null)}
                      />
                      <Input
                        label="Geschätzte Kosten (CHF)"
                        type="number"
                        value={s.estimatedCostChf ?? ''}
                        onChange={(e) => updateSuggestion(idx, 'estimatedCostChf', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                      {s.notes && (
                        <div className="sm:col-span-2">
                          <p className="text-xs text-gray-400 mb-1">Notiz der KI</p>
                          <Input
                            value={s.notes ?? ''}
                            onChange={(e) => updateSuggestion(idx, 'notes', e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3">
            <Button
              onClick={handleCreate}
              loading={creating}
              disabled={suggestions.filter((s) => s.selected).length === 0}
            >
              {suggestions.filter((s) => s.selected).length} Komponenten erstellen
            </Button>
            <Button variant="secondary" onClick={() => router.push('/komponenten')}>
              Abbrechen
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
