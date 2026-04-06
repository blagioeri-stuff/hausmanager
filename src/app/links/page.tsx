import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/layout/PageHeader';
import { LinksClient } from './LinksClient';

export const dynamic = 'force-dynamic';

export default async function LinksPage() {
  const links = await prisma.link.findMany({ orderBy: { createdAt: 'desc' } });
  return (
    <div className="space-y-6">
      <PageHeader title="Links" subtitle="Nützliche Links rund ums Haus" />
      <LinksClient links={links} />
    </div>
  );
}
