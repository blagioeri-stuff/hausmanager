'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface Props {
  id: string;
  name: string;
}

export function DeleteComponentButton({ id, name }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`«${name}» wirklich löschen? Alle Wartungseinträge und Dokumente werden ebenfalls gelöscht.`)) return;
    setLoading(true);
    try {
      await fetch(`/api/components/${id}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} loading={loading} className="text-red-500 hover:text-red-700 hover:bg-red-50">
      Löschen
    </Button>
  );
}
