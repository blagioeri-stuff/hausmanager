import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { GardenPlantForm } from '@/components/garden/GardenPlantForm';

export const dynamic = 'force-dynamic';

export default async function PflanzeBearbeitenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plant = await prisma.gardenPlant.findUnique({ where: { id } });
  if (!plant) notFound();

  const serialized = {
    ...plant,
    createdAt: plant.createdAt.toISOString(),
    updatedAt: plant.updatedAt.toISOString(),
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title={`${plant.name} bearbeiten`} subtitle="Pflanzendaten aktualisieren" />
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mt-6">
        <GardenPlantForm plant={serialized} />
      </div>
    </div>
  );
}
