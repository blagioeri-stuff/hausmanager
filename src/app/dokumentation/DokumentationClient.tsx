'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const DOC_CATEGORIES = [
  { value: 'grundbuch', label: 'Grundbuch & Eigentum', hint: 'Grundbuchauszug, Kaufvertrag' },
  { value: 'versicherung', label: 'Versicherungen', hint: 'Gebäudeversicherung, Hausrat' },
  { value: 'bauplan', label: 'Baupläne & Grundrisse', hint: 'Grundriss, Schnittplan' },
  { value: 'hypothek', label: 'Hypothek & Finanzierung', hint: 'Hypothekarvertrag' },
  { value: 'energie', label: 'Energie & Umwelt', hint: 'GEAK / Energieausweis' },
  { value: 'behoerden', label: 'Behörden & Bewilligungen', hint: 'Baubewilligung, Abnahmeprotokoll' },
  { value: 'wartung', label: 'Wartungsverträge', hint: 'Heizungsservice-Vertrag' },
  { value: 'sonstiges', label: 'Sonstiges', hint: '' },
];

interface HouseDocument {
  id: string;
  category: string;
  title: string;
  description: string | null;
  filename: string | null;
  storedName: string | null;
  externalUrl: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedAt: string | Date;
  component: { id: string; name: string } | null;
}

interface Component {
  id: string;
  name: string;
}

function DocIcon({ mimeType, externalUrl, small }: { mimeType: string | null; externalUrl: string | null; small?: boolean }) {
  const sz = small ? 'h-5 w-5' : 'h-8 w-8';
  if (externalUrl) {
    return <svg className={`${sz} text-blue-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>;
  }
  if (mimeType?.startsWith('image/')) {
    return <svg className={`${sz} text-green-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>;
  }
  if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) {
    return <svg className={`${sz} text-green-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125V5.625m0 12.75c0 .621.504 1.125 1.125 1.125m0 0h17.25m0 0c.621 0 1.125-.504 1.125-1.125V5.625a1.125 1.125 0 00-1.125-1.125H4.5A1.125 1.125 0 003.375 5.625v12.75m17.25 0h1.5M12 9.75v6m3-3H9" /></svg>;
  }
  if (mimeType?.includes('word') || mimeType?.includes('document')) {
    return <svg className={`${sz} text-blue-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
  }
  // PDF or generic
  return <svg className={`${sz} ${mimeType === 'application/pdf' ? 'text-red-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
}

type ModalMode = 'upload' | 'link' | null;

export function DokumentationClient({ docs, components, initialComponentId = '' }: { docs: HouseDocument[]; components: Component[]; initialComponentId?: string }) {
  const router = useRouter();

  const [categoryFilter, setCategoryFilter] = useState('');
  const [componentFilter, setComponentFilter] = useState(initialComponentId);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const fileRef = useRef<HTMLInputElement>(null);
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formCategory, setFormCategory] = useState('grundbuch');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formComponentId, setFormComponentId] = useState('');
  const [formUrl, setFormUrl] = useState('');

  const filtered = docs.filter((d) => {
    if (categoryFilter && d.category !== categoryFilter) return false;
    if (componentFilter && d.component?.id !== componentFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.title.toLowerCase().includes(q) || (d.description ?? '').toLowerCase().includes(q);
    }
    return true;
  });

  const grouped = DOC_CATEGORIES.map((cat) => ({
    ...cat,
    docs: filtered.filter((d) => d.category === cat.value),
  })).filter((g) => g.docs.length > 0);

  function resetForm() {
    setFormFile(null);
    setFormCategory('grundbuch');
    setFormTitle('');
    setFormDescription('');
    setFormComponentId('');
    setFormUrl('');
    setSaveError(null);
  }

  async function handleSaveFile(e: React.FormEvent) {
    e.preventDefault();
    if (!formFile || !formTitle || !formCategory) return;
    setSaving(true);
    setSaveError(null);
    try {
      const fd = new FormData();
      fd.append('file', formFile);
      fd.append('category', formCategory);
      fd.append('title', formTitle);
      fd.append('description', formDescription);
      fd.append('componentId', formComponentId);
      const res = await fetch('/api/house-documents', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fehler beim Hochladen');
      setModalMode(null);
      resetForm();
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveLink(e: React.FormEvent) {
    e.preventDefault();
    if (!formUrl || !formTitle || !formCategory) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/house-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: formCategory,
          title: formTitle,
          description: formDescription || null,
          externalUrl: formUrl,
          componentId: formComponentId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fehler beim Speichern');
      setModalMode(null);
      resetForm();
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Dokument löschen?')) return;
    setDeleting(id);
    try {
      await fetch(`/api/house-documents/${id}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  const componentOptions = [
    { value: '', label: '— Keine Komponente —' },
    ...components.map((c) => ({ value: c.id, label: c.name })),
  ];
  const filterComponentOptions = [
    { value: '', label: 'Alle Komponenten' },
    ...components.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Kategorie</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Alle Kategorien</option>
              {DOC_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Komponente</label>
            <select
              value={componentFilter}
              onChange={(e) => setComponentFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {filterComponentOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Suche</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Titel oder Beschreibung..."
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
          </div>
          {/* View toggle */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              title="Listenansicht"
              className={`px-2.5 py-1.5 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Kachelansicht"
              className={`px-2.5 py-1.5 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => { resetForm(); setModalMode('upload'); }}>
            Datei hochladen
          </Button>
          <Button variant="secondary" size="sm" onClick={() => { resetForm(); setModalMode('link'); }}>
            Link hinzufügen
          </Button>
        </div>
      </div>

      {/* Empty state with category cards */}
      {docs.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DOC_CATEGORIES.map((cat) => (
            <div key={cat.value} className="cursor-pointer hover:border-blue-300 transition-colors"
              onClick={() => { resetForm(); setFormCategory(cat.value); setModalMode('upload'); }}>
            <Card>
              <p className="text-sm font-semibold text-gray-800">{cat.label}</p>
              {cat.hint && <p className="text-xs text-gray-400 mt-1">{cat.hint}</p>}
              <p className="text-xs text-blue-600 mt-2">+ Dokument hinzufügen</p>
            </Card>
            </div>
          ))}
        </div>
      )}

      {/* Grouped docs */}
      {filtered.length === 0 && docs.length > 0 && (
        <Card>
          <p className="text-sm text-gray-400 text-center py-8">Keine Dokumente gefunden</p>
        </Card>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && filtered.length > 0 && (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                <th className="text-left pb-2 font-medium">Titel</th>
                <th className="text-left pb-2 font-medium hidden sm:table-cell">Kategorie</th>
                <th className="text-left pb-2 font-medium hidden md:table-cell">Komponente</th>
                <th className="text-left pb-2 font-medium hidden md:table-cell">Datum</th>
                <th className="text-right pb-2 font-medium">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((doc) => {
                const catLabel = DOC_CATEGORIES.find((c) => c.value === doc.category)?.label ?? doc.category;
                const href = doc.externalUrl ?? (doc.storedName ? `/api/upload/${doc.storedName}` : null);
                return (
                  <tr key={doc.id} className="hover:bg-gray-50/50">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <DocIcon mimeType={doc.mimeType} externalUrl={doc.externalUrl} small />
                        <div>
                          <p className="font-medium text-gray-900 leading-tight">{doc.title}</p>
                          {doc.description && <p className="text-xs text-gray-400 truncate max-w-xs">{doc.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 hidden sm:table-cell text-gray-500 text-xs whitespace-nowrap">{catLabel}</td>
                    <td className="py-2.5 pr-4 hidden md:table-cell">
                      {doc.component && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">{doc.component.name}</span>}
                    </td>
                    <td className="py-2.5 pr-4 hidden md:table-cell text-gray-400 text-xs whitespace-nowrap">
                      {new Date(doc.uploadedAt).toLocaleDateString('de-CH')}
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {href && (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Öffnen</a>
                        )}
                        <button onClick={() => handleDelete(doc.id)} disabled={deleting === doc.id} className="text-xs text-red-500 hover:underline disabled:opacity-50">Löschen</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' && filtered.length > 0 && (
        <>
          {grouped.map((group) => (
            <div key={group.value}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{group.label}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.docs.map((doc) => {
                  const href = doc.externalUrl ?? (doc.storedName ? `/api/upload/${doc.storedName}` : null);
                  return (
                    <Card key={doc.id}>
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                          <DocIcon mimeType={doc.mimeType} externalUrl={doc.externalUrl} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                          {doc.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{doc.description}</p>}
                          <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
                            <span className="text-xs text-gray-400">{new Date(doc.uploadedAt).toLocaleDateString('de-CH')}</span>
                            {doc.component && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">{doc.component.name}</span>
                            )}
                            {doc.sizeBytes && <span className="text-xs text-gray-300">{(doc.sizeBytes / 1024).toFixed(0)} KB</span>}
                          </div>
                          <div className="flex gap-3 mt-2">
                            {href && (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Öffnen</a>
                            )}
                            <button onClick={() => handleDelete(doc.id)} disabled={deleting === doc.id} className="text-xs text-red-500 hover:underline disabled:opacity-50">Löschen</button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
          {/* Uncategorized docs in grid view */}
          {filtered.filter((d) => !d.category).length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Ohne Kategorie</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.filter((d) => !d.category).map((doc) => {
                  const href = doc.externalUrl ?? (doc.storedName ? `/api/upload/${doc.storedName}` : null);
                  return (
                    <Card key={doc.id}>
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                          <DocIcon mimeType={doc.mimeType} externalUrl={doc.externalUrl} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                          {doc.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{doc.description}</p>}
                          <div className="flex gap-3 mt-2">
                            {href && (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Öffnen</a>
                            )}
                            <button onClick={() => handleDelete(doc.id)} disabled={deleting === doc.id} className="text-xs text-red-500 hover:underline disabled:opacity-50">Löschen</button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Upload modal */}
      {modalMode === 'upload' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold">Datei hochladen</h2>
              <button onClick={() => setModalMode(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSaveFile} className="p-6 space-y-4">
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  formFile ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="*/*"
                  className="hidden"
                  onChange={(e) => setFormFile(e.target.files?.[0] ?? null)}
                />
                {formFile ? (
                  <p className="text-sm font-medium text-blue-700">{formFile.name}</p>
                ) : (
                  <p className="text-sm text-gray-500">Datei auswählen (PDF, Bild, Word, Excel, …)</p>
                )}
              </div>
              <Select
                label="Kategorie"
                options={DOC_CATEGORIES}
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
              />
              <Input
                label="Titel"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
              <Input
                label="Beschreibung (optional)"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
              <Select
                label="Verknüpfte Komponente (optional)"
                options={componentOptions}
                value={formComponentId}
                onChange={(e) => setFormComponentId(e.target.value)}
              />
              {saveError && <p className="text-sm text-red-500">{saveError}</p>}
              <div className="flex gap-3">
                <Button type="submit" loading={saving} disabled={!formFile || !formTitle}>
                  Hochladen
                </Button>
                <Button variant="secondary" type="button" onClick={() => setModalMode(null)}>
                  Abbrechen
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link modal */}
      {modalMode === 'link' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold">Externen Link hinzufügen</h2>
              <button onClick={() => setModalMode(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSaveLink} className="p-6 space-y-4">
              <Select
                label="Kategorie"
                options={DOC_CATEGORIES}
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
              />
              <Input
                label="Titel"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
              <Input
                label="URL"
                type="url"
                required
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://..."
              />
              <Input
                label="Beschreibung (optional)"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
              <Select
                label="Verknüpfte Komponente (optional)"
                options={componentOptions}
                value={formComponentId}
                onChange={(e) => setFormComponentId(e.target.value)}
              />
              {saveError && <p className="text-sm text-red-500">{saveError}</p>}
              <div className="flex gap-3">
                <Button type="submit" loading={saving} disabled={!formUrl || !formTitle}>
                  Speichern
                </Button>
                <Button variant="secondary" type="button" onClick={() => setModalMode(null)}>
                  Abbrechen
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
