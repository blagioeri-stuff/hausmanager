import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/layout/PageHeader';
import { DokumentationClient } from './DokumentationClient';

export const dynamic = 'force-dynamic';

export default async function DokumentationPage({ searchParams }: { searchParams: { componentId?: string } }) {
  const [docs, components] = await Promise.all([
    prisma.houseDocument.findMany({
      include: { component: { select: { id: true, name: true } } },
      orderBy: { uploadedAt: 'desc' },
    }),
    prisma.homeComponent.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dokumentation"
        subtitle="Zentrale Verwaltung aller Hausdokumente"
      />
      <DokumentationClient docs={docs as Parameters<typeof DokumentationClient>[0]['docs']} components={components} initialComponentId={searchParams.componentId ?? ''} />
    </div>
  );
}
