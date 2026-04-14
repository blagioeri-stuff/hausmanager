'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { normalizeUrl } from '@/lib/utils';

const LINK_CATEGORIES = [
  'Behörden & Ämter',
  'Handwerker & Service',
  'Versicherungen',
  'Banken & Hypotheken',
  'Energie & Umwelt',
  'Einkauf & Material',
  'Sonstiges',
];

interface LinkItem {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: string | null;
  createdAt: string | Date;
}

interface FormState {
  title: string;
  url: string;
  description: string;
  category: string;
}

const EMPTY_FORM: FormState = { title: '', url: '', description: '', category: '' };

export function LinksClient({ links: initialLinks }: { links: LinkItem[] }) {
  const router = useRouter();
  const [links, setLinks] = useState(initialLinks);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = links.filter((l) => {
    if (catFilter && l.category !== catFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.title.toLowerCase().includes(q) || (l.description ?? '').toLowerCase().includes(q) || l.url.toLowerCase().includes(q);
    }
    return true;
  });

  const grouped = LINK_CATEGORIES.map((cat) => ({
    cat,
    items: filtered.filter((l) => l.category === cat),
  })).filter((g) => g.items.length > 0);
  const uncategorized = filtered.filter((l) => !l.category);

  function startAdd() {
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowForm(true);
    setError(null);
  }

  function startEdit(l: LinkItem) {
    setForm({ title: l.title, url: l.url, description: l.description ?? '', category: l.category ?? '' });
    setEditing(l.id);
    setShowForm(true);
    setError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.url) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { title: form.title, url: normalizeUrl(form.url), description: form.description || null, category: form.category || null };
      let res;
      if (editing) {
        res = await fetch(`/api/links/${editing}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        res = await fetch('/api/links', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fehler');
      setShowForm(false);
      router.refresh();
      // Optimistic update
      if (editing) {
        setLinks((prev) => prev.map((l) => l.id === editing ? { ...l, ...payload } : l));
      } else {
        setLinks((prev) => [data, ...prev]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Link löschen?')) return;
    setDeleting(id);
    try {
      await fetch(`/api/links/${id}`, { method: 'DELETE' });
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  const usedCategories = Array.from(new Set(links.map((l) => l.category).filter(Boolean))) as string[];

  function LinkRow({ l }: { l: LinkItem }) {
    return (
      <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-700 hover:underline truncate"
            >
              {l.title}
            </a>
          </div>
          {l.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{l.description}</p>}
          <p className="text-xs text-gray-300 truncate mt-0.5">{l.url}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => startEdit(l)} className="text-xs text-gray-400 hover:text-blue-600">Bearbeiten</button>
          <button onClick={() => handleDelete(l.id)} disabled={deleting === l.id} className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50">Löschen</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen…"
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
          />
          {usedCategories.length > 0 && (
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Alle Kategorien</option>
              {usedCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
        <Button size="sm" onClick={startAdd}>+ Link hinzufügen</Button>
      </div>

      {/* Add/Edit form (inline) */}
      {showForm && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-800 mb-4">{editing ? 'Link bearbeiten' : 'Neuer Link'}</h3>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Titel"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="z.B. Gemeinde Musterhausen"
              />
              <Input
                label="URL"
                type="text"
                required
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="z.B. gemeinde.ch oder https://..."
              />
            </div>
            <Input
              label="Beschreibung (optional)"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Kurze Beschreibung"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie (optional)</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full sm:w-64 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Keine Kategorie</option>
                {LINK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2 pt-1">
              <Button type="submit" loading={saving} size="sm">Speichern</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>Abbrechen</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Empty state */}
      {links.length === 0 && (
        <Card>
          <div className="text-center py-10 text-gray-400">
            <p className="text-sm">Noch keine Links gespeichert.</p>
            <button onClick={startAdd} className="mt-3 text-sm text-blue-600 hover:underline">+ Ersten Link hinzufügen</button>
          </div>
        </Card>
      )}

      {/* Grouped list */}
      {grouped.map(({ cat, items }) => (
        <Card key={cat}>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{cat}</h2>
          <div>
            {items.map((l) => <LinkRow key={l.id} l={l} />)}
          </div>
        </Card>
      ))}

      {/* Uncategorized */}
      {uncategorized.length > 0 && (
        <Card>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Ohne Kategorie</h2>
          <div>
            {uncategorized.map((l) => <LinkRow key={l.id} l={l} />)}
          </div>
        </Card>
      )}

      {filtered.length === 0 && links.length > 0 && (
        <Card><p className="text-sm text-gray-400 text-center py-6">Keine Links gefunden.</p></Card>
      )}
    </div>
  );
}
