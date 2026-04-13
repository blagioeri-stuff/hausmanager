'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { MONTHS_DE, TODO_CATEGORIES } from '@/lib/garden-types';
import type { RawGardenPhoto, RawGardenTodo } from '@/types';

interface PlantWithRelations {
  id: string;
  name: string;
  photos: RawGardenPhoto[];
  todos: (RawGardenTodo & { plant?: { id: string; name: string } | null; element?: { id: string; name: string } | null })[];
}

interface Props {
  plant: PlantWithRelations;
}

const PRIORITY_COLOR: Record<string, string> = {
  hoch: 'text-red-600',
  normal: 'text-yellow-600',
  niedrig: 'text-gray-400',
};

export function GardenPlantDetailClient({ plant }: Props) {
  const router = useRouter();
  const [todos, setTodos] = useState(plant.todos);
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoMonth, setNewTodoMonth] = useState('');
  const [newTodoCategory, setNewTodoCategory] = useState('pflege');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photos, setPhotos] = useState(plant.photos);

  async function toggleTodo(id: string, done: boolean) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done, doneAt: done ? new Date().toISOString() : null } : t)));
    await fetch(`/api/garten/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done }),
    });
  }

  async function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/garten/todos/${id}`, { method: 'DELETE' });
  }

  async function addTodo() {
    if (!newTodoTitle.trim()) return;
    const res = await fetch('/api/garten/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTodoTitle,
        dueMonth: newTodoMonth ? parseInt(newTodoMonth) : null,
        category: newTodoCategory,
        plantId: plant.id,
      }),
    });
    if (res.ok) {
      const todo = await res.json();
      setTodos((prev) => [todo, ...prev]);
      setNewTodoTitle('');
      setNewTodoMonth('');
      setShowAddTodo(false);
    }
  }

  async function uploadPhoto(file: File) {
    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`/api/garten/pflanzen/${plant.id}/photos`, { method: 'POST', body: formData });
    if (res.ok) {
      const photo = await res.json();
      setPhotos((prev) => [photo, ...prev]);
    }
    setUploadingPhoto(false);
  }

  async function deletePhoto(photoId: string) {
    if (!confirm('Foto löschen?')) return;
    await fetch(`/api/garten/pflanzen/${plant.id}/photos?photoId=${photoId}`, { method: 'DELETE' });
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }

  async function deletePlant() {
    if (!confirm(`"${plant.name}" wirklich löschen?`)) return;
    await fetch(`/api/garten/pflanzen/${plant.id}`, { method: 'DELETE' });
    router.push('/garten/pflanzen');
  }

  const openTodos = todos.filter((t) => !t.done);
  const doneTodos = todos.filter((t) => t.done);

  return (
    <div className="space-y-6">
      {/* Photos */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Fotos</h2>
          <label className="cursor-pointer text-sm text-green-600 hover:text-green-700 font-medium">
            {uploadingPhoto ? 'Lädt…' : '+ Foto hochladen'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingPhoto}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadPhoto(file);
              }}
            />
          </label>
        </div>
        {photos.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Noch keine Fotos.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((ph) => (
              <div key={ph.id} className="relative group rounded-lg overflow-hidden aspect-square bg-gray-100">
                <img
                  src={`/api/upload/${ph.storedName}`}
                  alt={ph.filename}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => deletePhoto(ph.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Todos */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Aufgaben</h2>
          <button
            onClick={() => setShowAddTodo(!showAddTodo)}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            + Aufgabe
          </button>
        </div>

        {showAddTodo && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg space-y-2">
            <input
              type="text"
              placeholder="Aufgabe eingeben…"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500"
              onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            />
            <div className="flex gap-2">
              <select
                value={newTodoMonth}
                onChange={(e) => setNewTodoMonth(e.target.value)}
                className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 flex-1"
              >
                <option value="">Kein Monat</option>
                {MONTHS_DE.map((m, i) => (
                  <option key={i} value={String(i + 1)}>{m}</option>
                ))}
              </select>
              <select
                value={newTodoCategory}
                onChange={(e) => setNewTodoCategory(e.target.value)}
                className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 flex-1"
              >
                {TODO_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <Button size="sm" onClick={addTodo}>Speichern</Button>
            </div>
          </div>
        )}

        <div className="space-y-1">
          {openTodos.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-2 border-b border-gray-50">
              <input
                type="checkbox"
                checked={false}
                onChange={() => toggleTodo(t.id, true)}
                className="h-4 w-4 rounded border-gray-300 text-green-600"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">{t.title}</p>
                <p className="text-xs text-gray-400">
                  {t.dueMonth ? MONTHS_DE[t.dueMonth - 1] : 'Kein Datum'} · {t.category}
                </p>
              </div>
              <button onClick={() => deleteTodo(t.id)} className="text-gray-300 hover:text-red-500 text-lg leading-none">×</button>
            </div>
          ))}
          {openTodos.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Keine offenen Aufgaben.</p>}
        </div>

        {doneTodos.length > 0 && (
          <details className="mt-3">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
              {doneTodos.length} erledigte Aufgabe{doneTodos.length !== 1 ? 'n' : ''} anzeigen
            </summary>
            <div className="mt-2 space-y-1">
              {doneTodos.map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-1.5 opacity-50">
                  <input
                    type="checkbox"
                    checked={true}
                    onChange={() => toggleTodo(t.id, false)}
                    className="h-4 w-4 rounded border-gray-300 text-green-600"
                  />
                  <p className="text-sm text-gray-500 line-through">{t.title}</p>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* Delete */}
      <div className="flex justify-end">
        <Button variant="danger" onClick={deletePlant}>Pflanze löschen</Button>
      </div>
    </div>
  );
}
