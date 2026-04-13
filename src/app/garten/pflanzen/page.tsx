import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/layout/PageHeader';
import Link from 'next/link';
import { PLANT_TYPES, PLANT_TYPE_LIST } from '@/lib/garden-types';

export const dynamic = 'force-dynamic';

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

export default async function PflanzenPage() {
  const plants = await prisma.gardenPlant.findMany({
    orderBy: { name: 'asc' },
    include: { todos: { where: { done: false } } },
  });

  const byType = PLANT_TYPE_LIST.map((t) => ({
    type: t,
    plants: plants.filter((p) => p.typeKey === t.key),
  })).filter((g) => g.plants.length > 0);

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Pflanzeninventar"
        subtitle={`${plants.length} Pflanzen erfasst`}
        action={
          <Link
            href="/garten/pflanzen/neu"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            + Neue Pflanze
          </Link>
        }
      />

      {plants.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🌱</p>
          <p>Noch keine Pflanzen erfasst.</p>
          <Link href="/garten/pflanzen/neu" className="text-green-600 hover:underline text-sm mt-2 inline-block">
            Erste Pflanze hinzufügen →
          </Link>
        </div>
      ) : (
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
                        <Link
                          href={`/garten/pflanzen/${p.id}/bearbeiten`}
                          className="text-xs text-gray-400 hover:text-green-700 mr-3"
                        >
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
      )}
    </div>
  );
}
