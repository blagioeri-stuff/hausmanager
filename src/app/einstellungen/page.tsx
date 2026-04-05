import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/layout/PageHeader';
import { EinstellungenForm } from '@/components/EinstellungenForm';

export const dynamic = 'force-dynamic';

export default async function EinstellungenPage() {
  const rows = await prisma.setting.findMany();
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Einstellungen"
        subtitle="Allgemeine Konfiguration und Daten-Export"
      />
      <EinstellungenForm initialSettings={settings} />
    </div>
  );
}
