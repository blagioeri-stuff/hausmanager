import Link from 'next/link';
import { prisma } from '@/lib/db';
import { enrichComponent } from '@/lib/calculations';
import { formatChf } from '@/lib/formatters';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DeleteComponentButton } from '@/components/DeleteComponentButton';
import { COMPONENT_TYPES } from '@/lib/component-types';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  green: 'Gut',
  yellow: 'Mittel',
  red: 'Kritisch',
};

export default async function KomponentenPage() {
  const raw = await prisma.homeComponent.findMany({ orderBy: { createdAt: 'desc' } });
  const components = raw.map((c) =>
    enrichComponent({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })
  );

  return (
    <div>
      <PageHeader
        title="Komponenten"
        subtitle="Alle Hauskomponenten und ihre Rücklageplanung"
        action={
          <Link href="/komponenten/neu">
            <Button>+ Neue Komponente</Button>
          </Link>
        }
      />

      {components.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">Noch keine Komponenten erfasst.</p>
          <Link href="/komponenten/neu" className="mt-4 inline-block">
            <Button>Erste Komponente hinzufügen</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Bezeichnung</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Typ</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Baujahr</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Erneuerung</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Verbleibend</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Jährl. Rücklage</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {components.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/komponenten/${c.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {COMPONENT_TYPES[c.typeKey]?.labelDe ?? c.typeKey}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{c.buildYear}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{c.replacementYear}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={c.yearsRemaining <= 0 ? 'text-red-600 font-medium' : c.yearsRemaining <= 5 ? 'text-yellow-600 font-medium' : 'text-gray-700'}>
                      {c.yearsRemaining <= 0 ? 'Fällig!' : `${c.yearsRemaining} J.`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatChf(c.annualSavingsChf)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge color={c.statusColor}>{STATUS_LABEL[c.statusColor]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1.5 justify-end">
                      <Link href={`/komponenten/${c.id}/bearbeiten`}>
                        <Button variant="ghost" size="sm">Bearbeiten</Button>
                      </Link>
                      <DeleteComponentButton id={c.id} name={c.name} />
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
