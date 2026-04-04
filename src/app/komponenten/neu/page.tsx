import { PageHeader } from '@/components/layout/PageHeader';
import { ComponentForm } from '@/components/forms/ComponentForm';
import { Card } from '@/components/ui/Card';

export default function NeueKomponentePage() {
  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Neue Komponente"
        subtitle="Hauskomponente erfassen und Rücklage berechnen"
      />
      <Card>
        <ComponentForm />
      </Card>
    </div>
  );
}
