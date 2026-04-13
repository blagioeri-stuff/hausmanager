'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { MONTHS_DE, TODO_CATEGORIES, TODO_PRIORITIES } from '@/lib/garden-types';

interface GardenTodo {
  id: string;
  title: string;
  description: string | null;
  dueMonth: number | null;
  recurring: boolean;
  done: boolean;
  doneAt: string | null;
  priority: string;
  category: string;
  plantId: string | null;
  elementId: string | null;
  plant?: { id: string; name: string; typeKey: string } | null;
  element?: { id: string; name: string; typeKey: string } | null;
  createdAt: string;
}

const PRIORITY_DOT: Record<string, string> = {
  hoch: 'bg-red-500',
  normal: 'bg-yellow-400',
  niedrig: 'bg-gray-300',
};

const currentMonth = new Date().getMonth() + 1;

export default function GartenAufgabenPage() {
  const [todos, setTodos] = useState<GardenTodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterDone, setFilterDone] = useState<'open' | 'done' | 'all'>('open');
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMonth, setNewMonth] = useState('');
  const [newCategory, setNewCategory] = useState('pflege');
  const [newPriority, setNewPriority] = useState('normal');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterDone !== 'all') params.set('done', filterDone === 'done' ? 'true' : 'false');
    if (filterMonth) params.set('month', filterMonth);
    fetch(`/api/garten/todos?${params}`)
      .then((r) => r.json())
      .then(setTodos)
      .finally(() => setLoading(false));
  }, [filterMonth, filterDone]);

  async function toggleTodo(id: string, done: boolean) {
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, done } : t));
    await fetch(`/api/garten/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done }),
    });
    if (filterDone !== 'all') {
      setTodos((prev) => prev.filter((t) => t.id !== id));
    }
  }

  async function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/garten/todos/${id}`, { method: 'DELETE' });
  }

  async function addTodo() {
    if (!newTitle.trim()) return;
    setSaving(true);
    const res = await fetch('/api/garten/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle,
        dueMonth: newMonth ? parseInt(newMonth) : null,
        category: newCategory,
        priority: newPriority,
      }),
    });
    if (res.ok) {
      const todo = await res.json();
      setTodos((prev) => [todo, ...prev]);
      setNewTitle(''); setNewMonth(''); setShowAdd(false);
    }
    setSaving(false);
  }

  const chipBase = 'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer select-none';
  const chipActive = 'bg-green-50 border-green-300 text-green-700';
  const chipInactive = 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300';

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Gartenaufgaben"
        subtitle="Alle To-dos nach Monat, Kategorie und Pflanze"
        action={<Button onClick={() => setShowAdd(!showAdd)}>+ Aufgabe</Button>}
      />

      {/* Filter bar */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400 font-medium">Status:</span>
          {(['open', 'done', 'all'] as const).map((v) => (
            <button key={v} onClick={() => setFilterDone(v)}
              className={`${chipBase} ${filterDone === v ? chipActive : chipInactive}`}>
              {v === 'open' ? 'Offen' : v === 'done' ? 'Erledigt' : 'Alle'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400 font-medium">Monat:</span>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="text-xs border border-gray-200 rounded px-1.5 py-0.5 text-gray-600"
          >
            <option value="">Alle</option>
            {MONTHS_DE.map((m, i) => (
              <option key={i} value={String(i + 1)}>{m}</option>
            ))}
          </select>
          {!filterMonth && (
            <button onClick={() => setFilterMonth(String(currentMonth))}
              className={`${chipBase} ${chipInactive}`}>
              Aktueller Monat
            </button>
          )}
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
          <input
            type="text"
            placeholder="Aufgabe eingeben…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500"
            autoFocus
          />
          <div className="flex gap-2 flex-wrap">
            <select value={newMonth} onChange={(e) => setNewMonth(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-2 py-1.5">
              <option value="">Kein Monat</option>
              {MONTHS_DE.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
            </select>
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-2 py-1.5">
              {TODO_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-2 py-1.5">
              {TODO_PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <Button size="sm" onClick={addTodo} loading={saving}>Speichern</Button>
            <Button size="sm" variant="secondary" onClick={() => setShowAdd(false)}>Abbrechen</Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Lädt…</p>
      ) : todos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p>Keine Aufgaben gefunden.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Aufgabe</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">Pflanze</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 hidden md:table-cell">Monat</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Kategorie</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {todos.map((t) => (
                <tr key={t.id} className={`hover:bg-gray-50 transition-colors ${t.done ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[t.priority] ?? 'bg-gray-300'}`} />
                      <span className={t.done ? 'line-through text-gray-400' : 'text-gray-900'}>{t.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">
                    {t.plant?.name ?? t.element?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                    {t.dueMonth ? MONTHS_DE[t.dueMonth - 1] : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 capitalize">{t.category}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <input
                        type="checkbox"
                        checked={t.done}
                        onChange={() => toggleTodo(t.id, !t.done)}
                        className="h-4 w-4 rounded border-gray-300 text-green-600"
                      />
                      <button onClick={() => deleteTodo(t.id)} className="text-gray-300 hover:text-red-500 text-lg leading-none">×</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
