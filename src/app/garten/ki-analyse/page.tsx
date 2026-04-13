'use client';

import { useState, useRef } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { PLANT_TYPES, GARDEN_ELEMENT_TYPES } from '@/lib/garden-types';

interface AnalysisResult {
  plants: { name: string; latinName?: string; typeKey: string; status: string; notes?: string }[];
  elements: { name: string; typeKey: string; notes?: string }[];
  suggestions: { name: string; typeKey: string; reason: string }[];
  todos: { title: string; category: string; priority: string }[];
}

export default function GartenKIAnalysePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [instruction, setInstruction] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState<Record<string, boolean>>({});
  const [imported, setImported] = useState<Record<string, boolean>>({});

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  }

  async function analyze() {
    if (!file) return;
    setAnalyzing(true);
    setError('');
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (instruction) formData.append('instruction', instruction);
      const res = await fetch('/api/garten/analyze', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fehler bei der Analyse');
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAnalyzing(false);
    }
  }

  async function importPlant(plant: AnalysisResult['plants'][0], idx: number) {
    const key = `plant-${idx}`;
    setImporting((p) => ({ ...p, [key]: true }));
    const res = await fetch('/api/garten/pflanzen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: plant.name,
        latinName: plant.latinName ?? null,
        typeKey: plant.typeKey,
        status: plant.status,
        notes: plant.notes ?? null,
      }),
    });
    if (res.ok) setImported((p) => ({ ...p, [key]: true }));
    setImporting((p) => ({ ...p, [key]: false }));
  }

  async function importTodo(todo: AnalysisResult['todos'][0], idx: number) {
    const key = `todo-${idx}`;
    setImporting((p) => ({ ...p, [key]: true }));
    const res = await fetch('/api/garten/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: todo.title, category: todo.category, priority: todo.priority }),
    });
    if (res.ok) setImported((p) => ({ ...p, [key]: true }));
    setImporting((p) => ({ ...p, [key]: false }));
  }

  async function importAll() {
    if (!result) return;
    const plantImports = result.plants.map((p, i) => !imported[`plant-${i}`] ? importPlant(p, i) : Promise.resolve());
    const todoImports = result.todos.map((t, i) => !imported[`todo-${i}`] ? importTodo(t, i) : Promise.resolve());
    await Promise.all([...plantImports, ...todoImports]);
    router.push('/garten/pflanzen');
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="KI-Gartenanalyse"
        subtitle="Foto hochladen → Pflanzen erkennen, Zustand beurteilen, Aufgaben vorschlagen"
      />

      {/* Upload */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-green-300 hover:bg-green-50 transition-colors"
        >
          {preview ? (
            <img src={preview} alt="Vorschau" className="max-h-64 mx-auto rounded-lg object-contain" />
          ) : (
            <>
              <p className="text-4xl mb-2">📸</p>
              <p className="text-sm font-medium text-gray-700">Gartenfoto hier ablegen oder klicken</p>
              <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP — max. 20 MB</p>
            </>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {file && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Anweisung — optional</label>
              <input
                type="text"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="z.B. 'Fokus auf Schädlinge' oder 'Nur Kräuter erfassen'"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <Button onClick={analyze} loading={analyzing} className="w-full">
              {analyzing ? 'KI analysiert…' : 'Garten analysieren'}
            </Button>
          </>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Analyse-Ergebnis</h2>
            <Button onClick={importAll} size="sm">Alles importieren</Button>
          </div>

          {/* Plants */}
          {result.plants.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">🌿 Erkannte Pflanzen ({result.plants.length})</h3>
              <div className="space-y-3">
                {result.plants.map((p, i) => {
                  const key = `plant-${i}`;
                  const typeDef = PLANT_TYPES[p.typeKey];
                  return (
                    <div key={i} className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <span>{typeDef?.icon ?? '🌿'}</span>
                          <p className="text-sm font-medium text-gray-900">{p.name}</p>
                          {p.latinName && <span className="text-xs text-gray-400 italic">{p.latinName}</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{typeDef?.labelDe ?? p.typeKey} · {p.status}</p>
                        {p.notes && <p className="text-xs text-gray-400 mt-0.5">{p.notes}</p>}
                      </div>
                      <Button
                        size="sm"
                        variant={imported[key] ? 'secondary' : 'primary'}
                        loading={importing[key]}
                        onClick={() => importPlant(p, i)}
                        disabled={imported[key]}
                      >
                        {imported[key] ? 'Importiert ✓' : 'Importieren'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Elements */}
          {result.elements.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">🏡 Erkannte Elemente ({result.elements.length})</h3>
              <div className="space-y-2">
                {result.elements.map((e, i) => {
                  const typeDef = GARDEN_ELEMENT_TYPES[e.typeKey];
                  return (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-700 py-1.5 border-b border-gray-50 last:border-0">
                      <span>{typeDef?.icon ?? '📦'}</span>
                      <span className="font-medium">{e.name}</span>
                      <span className="text-gray-400 text-xs">({typeDef?.labelDe ?? e.typeKey})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
              <h3 className="text-sm font-semibold text-blue-800 mb-3">💡 Vorgeschlagene Ergänzungspflanzen</h3>
              <div className="space-y-2">
                {result.suggestions.map((s, i) => {
                  const typeDef = PLANT_TYPES[s.typeKey];
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <span>{typeDef?.icon ?? '🌱'}</span>
                      <div>
                        <p className="text-sm font-medium text-blue-900">{s.name}</p>
                        <p className="text-xs text-blue-600">{s.reason}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Todos */}
          {result.todos.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">✅ Vorgeschlagene Aufgaben ({result.todos.length})</h3>
              <div className="space-y-2">
                {result.todos.map((t, i) => {
                  const key = `todo-${i}`;
                  return (
                    <div key={i} className="flex items-center justify-between gap-4 py-1.5 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm text-gray-800">{t.title}</p>
                        <p className="text-xs text-gray-400">{t.category} · Priorität: {t.priority}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={imported[key] ? 'secondary' : 'primary'}
                        loading={importing[key]}
                        onClick={() => importTodo(t, i)}
                        disabled={imported[key]}
                      >
                        {imported[key] ? '✓' : 'Übernehmen'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
