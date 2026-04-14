'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import Link from 'next/link';
import { PLANT_TYPES, PLANT_TYPE_LIST } from '@/lib/garden-types';

interface Plant {
  id: string;
  name: string;
  latinName: string | null;
  typeKey: string;
  locationHint: string | null;
  status: string;
  todos: { id: string }[];
}

const STATUS_COLOR: Record<string, string> = {
  gut: 'bg-green-100 text-green-700',
  pflege_nötig: 'bg-yellow-100 text-yellow-700',
  krank: 'bg-red-100 text-red-700',
  dormant: 'bg-gray-100 text-gray-600',
};
const STATUS_LABEL: Record<string, string> = {
  gut: 'Gut',
  pflege_nötig: 'Pflege nötig',
  krank: 'Krank',
  dormant: 'Winterruhe',
};

export default function PflanzenPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    fetch('/api/garten/pflanzen')
      .then((r) => r.json())
      .then(setPlants)
      .finally(() => setLoading(false));
  }, []);

  const byType = PLANT_TYPE_LIST.map((t) => ({
    type: t,
    plants: plants.filter((p) => p.typeKey === t.key),
  })).filter((g) => g.plants.length > 0);

  const toggleButtons = (
    <div className="flex border border-gray-200 rounded-lg overflow-hidden">
      <button onClick={() => setViewMode('list')} title="Listenansicht"
        className={`px-2.5 py-1.5 ${viewMode === 'list' ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <button onClick={() => setViewMode('grid')} title="Kachelansicht"
        className={`px-2.5 py-1.5 ${viewMode === 'grid' ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Pflanzeninventar"
        subtitle={loading ? 'Lädt…' : `${plants.length} Pflanzen erfasst`}
        action={
          <div className="flex items-center gap-2">
            {toggleButtons}
            <Link
              href="/garten/pflanzen/neu"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
            >
              + Neue Pflanze
            </Link>
          </div>
        }
      />

      {loading ? (
        <p className="text-sm text-gray-400">Lädt…</p>
      ) : plants.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🌱</p>
          <p>Noch keine Pflanzen erfasst.</p>
          <Link href="/garten/pflanzen/neu" className="text-green-600 hover:underline text-sm mt-2 inline-block">
            Erste Pflanze hinzufügen →
          </Link>
        </div>
      ) : viewMode === 'list' ? (
        byType.map(({ type, plants: typePlants }) => (
          <div key={type.key}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>{type.icon}</span> {type.labelDe} ({typePlants.length})
            </h2>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">Standort</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">Aufgaben</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {typePlants.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/garten/pflanzen/${p.id}`} className="font-medium text-gray-900 hover:text-green-700">
                          {p.name}
                        </Link>
                        {p.latinName && (
                          <p className="text-xs text-gray-400 italic">{p.latinName}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell text-xs">
                        {p.locationHint ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[p.status]}`}>
                          {STATUS_LABEL[p.status] ?? p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.todos.length > 0 ? (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                            {p.todos.length}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/garten/pflanzen/${p.id}/bearbeiten`} className="text-xs text-gray-400 hover:text-green-700 mr-3">
                          Bearbeiten
                        </Link>
                        <Link href={`/garten/pflanzen/${p.id}`} className="text-xs text-green-600 hover:underline">
                          Details →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      ) : (
        // Grid / tile view
        byType.map(({ type, plants: typePlants }) => (
          <div key={type.key}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>{type.icon}</span> {type.labelDe} ({typePlants.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {typePlants.map((p) => {
                const typeDef = PLANT_TYPES[p.typeKey];
                return (
                  <Link key={p.id} href={`/garten/pflanzen/${p.id}`}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-green-300 hover:shadow-md transition-all block">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{typeDef?.icon ?? '🌿'}</span>
                        <div>
                          <p className="font-medium text-gray-900 text-sm leading-tight">{p.name}</p>
                          {p.latinName && <p className="text-xs text-gray-400 italic">{p.latinName}</p>}
                        </div>
                      </div>
                      {p.todos.length > 0 && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                          {p.todos.length} Todo{p.todos.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[p.status]}`}>
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                      {p.locationHint && (
                        <span className="text-xs text-gray-400 truncate ml-2 max-w-[100px]">{p.locationHint}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
