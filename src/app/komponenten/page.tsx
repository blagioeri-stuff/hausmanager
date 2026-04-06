import Link from 'next/link';
import { prisma } from '@/lib/db';
import { enrichComponent } from '@/lib/calculations';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { KomponentenTable } from '@/components/KomponentenTable';

export const dynamic = 'force-dynamic';

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
          <div className="flex gap-2">
            <Link href="/importieren">
              <Button variant="secondary">KI-Import</Button>
            </Link>
            <Link href="/komponenten/neu">
              <Button>+ Neue Komponente</Button>
            </Link>
          </div>
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
        <KomponentenTable components={components} />
      )}
    </div>
  );
}
