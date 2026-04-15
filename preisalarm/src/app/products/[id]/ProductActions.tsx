'use client';

import { useRouter } from 'next/navigation';

export function ProductActions({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`"${productName}" und alle Shop-URLs löschen?`)) return;
    await fetch(`/api/products/${productId}`, { method: 'DELETE' });
    router.push('/products');
  };

  const handleCheckAll = async () => {
    await fetch(`/api/products/${productId}/check`, { method: 'POST' });
    router.refresh();
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleCheckAll}
        className="text-sm text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50"
      >
        🔄 Alle prüfen
      </button>
      <button
        onClick={handleDelete}
        className="text-sm text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50"
      >
        Löschen
      </button>
    </div>
  );
}
