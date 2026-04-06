'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { CostForm, CostFormValues } from '@/components/forms/CostForm';

interface Props {
  cost: CostFormValues & { id: string };
}

export function KostenBearbeitenClient({ cost }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: CostFormValues) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/costs/${cost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fehler beim Speichern');
      router.push('/kosten');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Kosten bearbeiten" />
      <Card>
        <CostForm
          initialValues={cost}
          onSubmit={handleSubmit}
          submitLabel="Änderungen speichern"
          loading={loading}
          error={error}
        />
      </Card>
    </div>
  );
}
