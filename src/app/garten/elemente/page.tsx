'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { GARDEN_ELEMENT_TYPE_LIST, GARDEN_ELEMENT_TYPES } from '@/lib/garden-types';

interface GardenElement {
  id: string;
  name: string;
  typeKey: string;
  sizeM2: number | null;
  notes: string | null;
  createdAt: string;
}

const TYPE_OPTIONS = GARDEN_ELEMENT_TYPE_LIST.map((t) => ({ value: t.key, label: `${t.icon} ${t.labelDe}` }));

export default function GartenElementePage() {
  const [elements, setElements] = useState<GardenElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GardenElement | null>(null);
  const [name, setName] = useState('');
  const [typeKey, setTypeKey] = useState('');
  const [sizeM2, setSizeM2] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/garten/elemente')
      .then((r) => r.json())
      .then(setElements)
      .finally(() => setLoading(false));
  }, []);

  function openNew() {
    setEditing(null);
    setName(''); setTypeKey(''); setSizeM2(''); setNotes('');
    setShowForm(true);
  }

  function openEdit(el: GardenElement) {
    setEditing(el);
    setName(el.name);
    setTypeKey(el.typeKey);
    setSizeM2(el.sizeM2 ? String(el.sizeM2) : '');
    setNotes(el.notes ?? '');
    setShowForm(true);
  }

  async function save() {
    if (!name || !typeKey) return;
    setSaving(true);
    const url = editing ? `/api/garten/elemente/${editing.id}` : '/api/garten/elemente';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, typeKey, sizeM2: sizeM2 ? parseFloat(sizeM2) : null, notes: notes || null }),
    });
    if (res.ok) {
      const saved = await res.json();
      setElements((prev) =>
        editing ? prev.map((e) => (e.id === editing.id ? saved : e)) : [saved, ...prev]
      );
      setShowForm(false);
    }
    setSaving(false);
  }

  async function deleteElement(id: string, name: string) {
    if (!confirm(`"${name}" wirklich löschen?`)) return;
    await fetch(`/api/garten/elemente/${id}`, { method: 'DELETE' });
    setElements((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Gartenelemente"
        subtitle="Teich, Terrasse, Hochbeet und andere Strukturen"
        action={
          <Button onClick={openNew}>+ Neues Element</Button>
        }
      />

      {showForm && (
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            {editing ? 'Element bearbeiten' : 'Neues Element'}
          </h2>
          <div className="space-y-4">
            <Select
              label="Typ"
              placeholder="Typ wählen…"
              options={TYPE_OPTIONS}
              value={typeKey}
              onChange={(e) => setTypeKey(e.target.value)}
            />
            <Input label="Name" placeholder="z.B. Gartenteich" value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              label="Fläche (m²) — optional"
              type="number"
              placeholder="z.B. 6.5"
              value={sizeM2}
              onChange={(e) => setSizeM2(e.target.value)}
            />
            <Textarea
              label="Notizen — optional"
              placeholder="Besonderheiten, Pflegeanforderungen…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex gap-3">
              <Button onClick={save} loading={saving}>{editing ? 'Speichern' : 'Erstellen'}</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Abbrechen</Button>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Lädt…</p>
      ) : elements.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🏡</p>
          <p>Noch keine Elemente erfasst.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {elements.map((el) => {
            const typeDef = GARDEN_ELEMENT_TYPES[el.typeKey];
            return (
              <Card key={el.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{typeDef?.icon ?? '📦'}</span>
                    <div>
                      <p className="font-medium text-gray-900">{el.name}</p>
                      <p className="text-xs text-gray-400">{typeDef?.labelDe ?? el.typeKey}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEdit(el)} className="text-xs text-gray-400 hover:text-gray-700">Bearb.</button>
                    <button onClick={() => deleteElement(el.id, el.name)} className="text-xs text-red-400 hover:text-red-600">Löschen</button>
                  </div>
                </div>
                {el.sizeM2 && (
                  <p className="text-sm text-gray-600 mt-2">Fläche: <span className="font-medium">{el.sizeM2} m²</span></p>
                )}
                {el.notes && (
                  <p className="text-sm text-gray-500 mt-1 text-xs">{el.notes}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
