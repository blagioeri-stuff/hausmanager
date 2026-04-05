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
    <Button variant="ghost" size="sm" onClick={handleDelete} loading={loading} title="Löschen" className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50">
      {!loading && (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      )}
    </Button>
  );
}
