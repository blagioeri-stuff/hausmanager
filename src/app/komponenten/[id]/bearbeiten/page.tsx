import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { enrichComponent } from '@/lib/calculations';
import { PageHeader } from '@/components/layout/PageHeader';
import { ComponentForm } from '@/components/forms/ComponentForm';
import { Card } from '@/components/ui/Card';

export default async function BearbeitenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raw = await prisma.homeComponent.findUnique({ where: { id } });
  if (!raw) notFound();

  const component = enrichComponent({
    ...raw,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
  });

  return (
    <div className="max-w-2xl">
      <PageHeader title={`${component.name} bearbeiten`} />
      <Card>
        <ComponentForm component={component} />
      </Card>
    </div>
  );
}
