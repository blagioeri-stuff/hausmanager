import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { enrichComponent } from '@/lib/calculations';
import { formatChf } from '@/lib/formatters';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MaintenanceList } from '@/components/MaintenanceList';
import { DocumentList } from '@/components/DocumentList';
import { RenovationButton } from '@/components/RenovationButton';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  green: 'Gut',
  yellow: 'Mittel',
  red: 'Kritisch',
};

export default async function KomponentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const raw = await prisma.homeComponent.findUnique({
    where: { id },
    include: {
      maintenance: { orderBy: { date: 'desc' } },
      documents: { orderBy: { uploadedAt: 'desc' } },
      houseDocuments: { orderBy: { uploadedAt: 'desc' } },
    },
  });

  if (!raw) notFound();

  const component = enrichComponent({
    ...raw,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
  });

  const maintenanceEntries = raw.maintenance.map((m) => ({
    ...m,
    date: m.date.toISOString(),
    createdAt: m.createdAt.toISOString(),
  }));

  const documents = raw.documents.map((d) => ({
    ...d,
    uploadedAt: d.uploadedAt.toISOString(),
  }));

  const agePercent = Math.round(component.ageRatio * 100);

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title={component.name}
        subtitle={component.typeDef.labelDe}
        action={
          <Link href={`/komponenten/${id}/bearbeiten`}>
            <Button variant="secondary">Bearbeiten</Button>
          </Link>
        }
      />

      {/* Status + Key figures */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-xs text-gray-500 mb-1">Status</p>
          <Badge color={component.statusColor}>{STATUS_LABEL[component.statusColor]}</Badge>
          <p className="text-xs text-gray-400 mt-1">{agePercent}% der Lebensdauer</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-gray-500 mb-1">Baujahr</p>
          <p className="text-lg font-bold text-gray-900">{component.buildYear}</p>
          <p className="text-xs text-gray-400">{component.ageYears} Jahre alt</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-gray-500 mb-1">Erneuerung</p>
          <p className="text-lg font-bold text-gray-900">{component.replacementYear}</p>
          <p className="text-xs text-gray-400">
            {component.yearsRemaining <= 0
              ? 'Fällig!'
              : `in ${component.yearsRemaining} Jahren`}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-gray-500 mb-1">Jährl. Rücklage</p>
          <p className="text-lg font-bold text-blue-600">{formatChf(component.annualSavingsChf)}</p>
          <p className="text-xs text-gray-400">{formatChf(component.annualSavingsChf / 12)} / Monat</p>
        </Card>
      </div>

      {/* Progress bar */}
      <Card>
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>{component.buildYear}</span>
          <span className="font-medium">{agePercent}% der Lebensdauer verstrichen</span>
          <span>{component.replacementYear}</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              component.statusColor === 'green'
                ? 'bg-green-500'
                : component.statusColor === 'yellow'
                ? 'bg-yellow-400'
                : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(agePercent, 100)}%` }}
          />
        </div>
      </Card>

      {/* Financial details */}
      <Card>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Finanzübersicht</h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="text-gray-500">Ersatzkosten</dt>
            <dd className="font-medium text-gray-900">{formatChf(component.effectiveCostChf)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Lebensdauer</dt>
            <dd className="font-medium text-gray-900">{component.effectiveLifetimeYrs} Jahre</dd>
          </div>
          <div>
            <dt className="text-gray-500">Jährliche Rücklage</dt>
            <dd className="font-semibold text-blue-600">
              {formatChf(component.annualSavingsChf)}
              <span className="block text-xs font-normal text-gray-400">{formatChf(component.annualSavingsChf / 12)} / Monat</span>
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Noch benötigte Reserve</dt>
            <dd className="font-medium text-gray-900">{formatChf(component.totalReserveNeededChf)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">SOLL-Reserve heute</dt>
            <dd className="font-medium text-amber-600">{formatChf(component.sollReserveChf)}</dd>
          </div>
          {component.plannedRenovationYear !== null && (
            <div>
              <dt className="text-gray-500">Geplantes Renovationsjahr</dt>
              <dd className="font-medium text-gray-900">{component.plannedRenovationYear}</dd>
            </div>
          )}
          {component.plannedRenovationCostChf !== null && (
            <div>
              <dt className="text-gray-500">Geplante Kosten</dt>
              <dd className="font-medium text-gray-900">{formatChf(component.plannedRenovationCostChf)}</dd>
            </div>
          )}
        </dl>
        {component.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Notizen</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{component.notes}</p>
          </div>
        )}
      </Card>

      {/* Renovation abgeschlossen */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-0.5">Renovation abschliessen</h2>
            <p className="text-xs text-gray-400">Setzt das Baujahr auf das aktuelle Jahr und erstellt einen Wartungseintrag.</p>
          </div>
          <RenovationButton componentId={id} componentName={component.name} />
        </div>
      </Card>

      {/* Maintenance history */}
      <Card>
        <MaintenanceList componentId={id} initialEntries={maintenanceEntries} />
      </Card>

      {/* Component-specific documents */}
      <Card>
        <DocumentList componentId={id} initialDocuments={documents} />
      </Card>

      {/* House documents linked to this component */}
      {raw.houseDocuments.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Verknüpfte Hausdokumente</h2>
            <a href={`/dokumentation?componentId=${id}`} className="text-xs text-blue-600 hover:underline">Alle ansehen →</a>
          </div>
          <div className="space-y-2">
            {raw.houseDocuments.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{d.title}</p>
                  {d.description && <p className="text-xs text-gray-400 mt-0.5">{d.description}</p>}
                </div>
                {(d.storedName || d.externalUrl) && (
                  <a
                    href={d.storedName ? `/api/upload/${d.storedName}` : d.externalUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline shrink-0"
                  >
                    Öffnen
                  </a>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
