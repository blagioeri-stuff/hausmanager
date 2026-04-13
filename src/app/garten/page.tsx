import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { PLANT_TYPES, GARDEN_ELEMENT_TYPES, SEASONAL_TODOS, MONTHS_DE, PLANT_STATUS_OPTIONS } from '@/lib/garden-types';

export const dynamic = 'force-dynamic';

const STATUS_COLOR: Record<string, string> = {
  gut: 'bg-green-100 text-green-700',
  pflege_nötig: 'bg-yellow-100 text-yellow-700',
  krank: 'bg-red-100 text-red-700',
  dormant: 'bg-gray-100 text-gray-600',
};

export default async function GartenPage() {
  const currentMonth = new Date().getMonth() + 1;

  const [plants, elements, openTodos] = await Promise.all([
    prisma.gardenPlant.findMany({ orderBy: { name: 'asc' } }),
    prisma.gardenElement.findMany({ orderBy: { name: 'asc' } }),
    prisma.gardenTodo.findMany({
      where: { done: false },
      orderBy: [{ priority: 'desc' }, { dueMonth: 'asc' }],
      include: { plant: { select: { id: true, name: true } } },
      take: 8,
    }),
  ]);

  const statusCounts = { gut: 0, pflege_nötig: 0, krank: 0, dormant: 0 } as Record<string, number>;
  for (const p of plants) statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;

  const winterProtectionPlants = plants.filter((p) => p.winterProtection);
  const seasonalSuggestions = SEASONAL_TODOS[currentMonth] ?? [];

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Gartenmanager"
        subtitle={`${plants.length} Pflanzen · ${elements.length} Elemente · Monat: ${MONTHS_DE[currentMonth - 1]}`}
        action={
          <Link
            href="/garten/pflanzen/neu"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            + Pflanze erfassen
          </Link>
        }
      />

      {/* Quick Nav */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/garten/pflanzen', label: 'Pflanzen', icon: '🌱', count: plants.length },
          { href: '/garten/elemente', label: 'Elemente', icon: '🏡', count: elements.length },
          { href: '/garten/aufgaben', label: 'Aufgaben', icon: '✅', count: openTodos.length },
          { href: '/garten/karte', label: 'Gartenplan', icon: '🗺️', count: null },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col items-center gap-1 hover:border-green-200 hover:shadow-sm transition-all"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
            {item.count !== null && (
              <span className="text-xs text-gray-400">{item.count}</span>
            )}
          </Link>
        ))}
      </div>

      {/* Status Overview */}
      {plants.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Pflanzenzustand</p>
            <div className="space-y-2">
              {PLANT_STATUS_OPTIONS.map((s) => (
                <div key={s.value} className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[s.value]}`}>
                    {s.label}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{statusCounts[s.value] ?? 0}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Schnellübersicht</p>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Offene Aufgaben</span>
                <span className="font-semibold text-gray-900">{openTodos.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Winterschutz nötig</span>
                <span className="font-semibold text-gray-900">{winterProtectionPlants.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Gartenelemente</span>
                <span className="font-semibold text-gray-900">{elements.length}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Seasonal Suggestions */}
      {seasonalSuggestions.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">
              Saisonale Aufgaben — {MONTHS_DE[currentMonth - 1]}
            </h2>
            <Link href="/garten/aufgaben" className="text-xs text-green-600 hover:underline">Alle Aufgaben →</Link>
          </div>
          <div className="space-y-2">
            {seasonalSuggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-lg mt-0.5">
                  {s.category === 'einwintern' || s.category === 'schutz' ? '🛡️' :
                   s.category === 'düngen' ? '🌿' :
                   s.category === 'bewässerung' ? '💧' :
                   s.category === 'ernte' ? '🍎' :
                   s.category === 'pflanzung' ? '🌱' : '✂️'}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.title}</p>
                  {s.plantTypes && s.plantTypes.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {s.plantTypes.map((t) => PLANT_TYPES[t]?.labelDe ?? t).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Open Todos */}
      {openTodos.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Offene Aufgaben</h2>
            <Link href="/garten/aufgaben" className="text-xs text-green-600 hover:underline">Alle →</Link>
          </div>
          <div className="space-y-1">
            {openTodos.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${t.priority === 'hoch' ? 'bg-red-500' : t.priority === 'normal' ? 'bg-yellow-400' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{t.title}</p>
                  {t.plant && (
                    <p className="text-xs text-gray-400">{t.plant.name}</p>
                  )}
                </div>
                {t.dueMonth && (
                  <span className="text-xs text-gray-400 shrink-0">{MONTHS_DE[t.dueMonth - 1]}</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {plants.length === 0 && elements.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <p className="text-4xl mb-4">🌱</p>
            <p className="text-gray-500 mb-2">Noch keine Gartendaten erfasst.</p>
            <div className="flex gap-3 justify-center mt-4">
              <Link href="/garten/pflanzen/neu" className="text-sm text-white bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700">
                Erste Pflanze erfassen
              </Link>
              <Link href="/garten/ki-analyse" className="text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-lg hover:bg-green-100">
                KI-Foto-Analyse
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
