import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { PLANT_TYPES, MONTHS_DE, TODO_CATEGORIES } from '@/lib/garden-types';
import { GardenPlantDetailClient } from '@/components/garden/GardenPlantDetailClient';

export const dynamic = 'force-dynamic';

export default async function PflanzeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plant = await prisma.gardenPlant.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { uploadedAt: 'desc' } },
      todos: { orderBy: [{ done: 'asc' }, { createdAt: 'desc' }] },
    },
  });
  if (!plant) notFound();

  const typeDef = PLANT_TYPES[plant.typeKey];
  const pruningMonths = plant.pruningMonths
    ? plant.pruningMonths.split(',').map((m) => MONTHS_DE[parseInt(m) - 1]).join(', ')
    : null;

  const serialized = {
    ...plant,
    createdAt: plant.createdAt.toISOString(),
    updatedAt: plant.updatedAt.toISOString(),
    photos: plant.photos.map((ph) => ({ ...ph, uploadedAt: ph.uploadedAt.toISOString() })),
    todos: plant.todos.map((t) => ({
      ...t,
      doneAt: t.doneAt?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
  };

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={plant.name}
        subtitle={`${typeDef?.icon ?? '🌿'} ${typeDef?.labelDe ?? plant.typeKey}${plant.latinName ? ` · ${plant.latinName}` : ''}`}
        action={
          <Link
            href={`/garten/pflanzen/${id}/bearbeiten`}
            className="text-sm text-gray-500 hover:text-green-700 border border-gray-200 px-3 py-1.5 rounded-lg"
          >
            Bearbeiten
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-gray-400 mb-1">Gepflanzt</p>
          <p className="text-lg font-semibold text-gray-900">{plant.plantedYear ?? '—'}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-400 mb-1">Standort</p>
          <p className="text-sm font-medium text-gray-900">{plant.locationHint ?? '—'}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-400 mb-1">Rückschnitt</p>
          <p className="text-sm font-medium text-gray-900">{pruningMonths ?? '—'}</p>
        </Card>
      </div>

      {plant.notes && (
        <Card>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Notizen</p>
          <p className="text-sm text-gray-700 whitespace-pre-line">{plant.notes}</p>
        </Card>
      )}

      <GardenPlantDetailClient plant={serialized} />
    </div>
  );
}
