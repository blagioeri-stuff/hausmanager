'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import Link from 'next/link';
import { PLANT_TYPES, GARDEN_ELEMENT_TYPES } from '@/lib/garden-types';

interface MapItem {
  id: string;
  name: string;
  typeKey: string;
  posX: number | null;
  posY: number | null;
  status?: string;
  kind: 'plant' | 'element';
}

const STATUS_BG: Record<string, string> = {
  gut: 'bg-green-100 border-green-400',
  pflege_nötig: 'bg-yellow-100 border-yellow-400',
  krank: 'bg-red-100 border-red-400',
  dormant: 'bg-gray-100 border-gray-400',
};

export default function GartenKartePage() {
  const [items, setItems] = useState<MapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<MapItem | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    Promise.all([
      fetch('/api/garten/pflanzen').then((r) => r.json()),
      fetch('/api/garten/elemente').then((r) => r.json()),
    ]).then(([plants, elements]) => {
      const plantItems: MapItem[] = plants.map((p: { id: string; name: string; typeKey: string; posX: number | null; posY: number | null; status: string }) => ({
        id: p.id, name: p.name, typeKey: p.typeKey,
        posX: p.posX, posY: p.posY, status: p.status, kind: 'plant' as const,
      }));
      const elementItems: MapItem[] = elements.map((e: { id: string; name: string; typeKey: string; posX: number | null; posY: number | null }) => ({
        id: e.id, name: e.name, typeKey: e.typeKey,
        posX: e.posX, posY: e.posY, kind: 'element' as const,
      }));
      setItems([...plantItems, ...elementItems]);
    }).finally(() => setLoading(false));
  }, []);

  const unpositioned = items.filter((i) => i.posX === null || i.posY === null);
  const positioned = items.filter((i) => i.posX !== null && i.posY !== null);

  const savePosition = useCallback(async (id: string, kind: 'plant' | 'element', posX: number, posY: number) => {
    const url = kind === 'plant' ? `/api/garten/pflanzen/${id}` : `/api/garten/elemente/${id}`;
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ posX, posY }),
    });
  }, []);

  function handleMouseDown(e: React.MouseEvent, item: MapItem) {
    e.preventDefault();
    setDragging(item.id);
    setTooltip(null);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left - rect.width / 2, y: e.clientY - rect.top - rect.height / 2 };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging || !mapRef.current) return;
    const mapRect = mapRef.current.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - mapRect.left - dragOffset.current.x) / mapRect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - mapRect.top - dragOffset.current.y) / mapRect.height) * 100));
    setItems((prev) => prev.map((i) => i.id === dragging ? { ...i, posX: x, posY: y } : i));
  }

  function handleMouseUp() {
    if (!dragging) return;
    const item = items.find((i) => i.id === dragging);
    if (item && item.posX !== null && item.posY !== null) {
      savePosition(item.id, item.kind, item.posX, item.posY);
    }
    setDragging(null);
  }

  return (
    <div className="max-w-4xl space-y-4">
      <PageHeader
        title="Gartenplan"
        subtitle="Drag & Drop: Pflanzen und Elemente auf der Karte positionieren"
      />

      {loading ? (
        <p className="text-sm text-gray-400">Lädt…</p>
      ) : (
        <>
          {/* Map */}
          <div
            ref={mapRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="relative bg-green-50 border-2 border-green-200 rounded-2xl overflow-hidden select-none"
            style={{ height: '520px', cursor: dragging ? 'grabbing' : 'default' }}
          >
            {/* Grid lines */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
              style={{ backgroundImage: 'linear-gradient(#86efac 1px, transparent 1px), linear-gradient(90deg, #86efac 1px, transparent 1px)', backgroundSize: '10% 10%' }} />

            {/* Legend */}
            <div className="absolute top-2 left-2 bg-white/80 rounded-lg px-2 py-1 text-xs text-gray-500 pointer-events-none">
              N ↑ · ca. 20m × 30m
            </div>

            {/* Positioned items */}
            {positioned.map((item) => {
              const typeDef = item.kind === 'plant' ? PLANT_TYPES[item.typeKey] : GARDEN_ELEMENT_TYPES[item.typeKey];
              const statusClass = item.status ? STATUS_BG[item.status] ?? 'bg-white border-gray-300' : 'bg-blue-50 border-blue-300';
              return (
                <div
                  key={item.id}
                  onMouseDown={(e) => handleMouseDown(e, item)}
                  onMouseEnter={() => !dragging && setTooltip(item)}
                  onMouseLeave={() => setTooltip(null)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing flex flex-col items-center`}
                  style={{ left: `${item.posX}%`, top: `${item.posY}%` }}
                >
                  <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-lg shadow-sm ${statusClass}`}>
                    {typeDef?.icon ?? '🌿'}
                  </div>
                  <span className="mt-0.5 text-[10px] text-gray-700 bg-white/70 px-1 rounded max-w-[80px] truncate text-center leading-tight">
                    {item.name}
                  </span>
                </div>
              );
            })}

            {/* Tooltip */}
            {tooltip && (
              <div className="absolute bottom-3 left-3 bg-white rounded-lg shadow-lg p-3 text-xs pointer-events-none z-10 min-w-[140px]">
                <p className="font-semibold text-gray-900">{tooltip.name}</p>
                <p className="text-gray-500">
                  {tooltip.kind === 'plant'
                    ? PLANT_TYPES[tooltip.typeKey]?.labelDe
                    : GARDEN_ELEMENT_TYPES[tooltip.typeKey]?.labelDe}
                </p>
                {tooltip.kind === 'plant' && tooltip.status && (
                  <p className="text-gray-400 mt-0.5">Status: {tooltip.status.replace('_', ' ')}</p>
                )}
                <Link
                  href={tooltip.kind === 'plant' ? `/garten/pflanzen/${tooltip.id}` : `/garten/elemente`}
                  className="text-green-600 hover:underline mt-1 block pointer-events-auto"
                >
                  Details →
                </Link>
              </div>
            )}

            {items.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                Noch keine Pflanzen oder Elemente erfasst.
              </div>
            )}

            {positioned.length === 0 && items.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                Ziehe Pflanzen aus der Liste unten auf die Karte.
              </div>
            )}
          </div>

          {/* Unpositioned items sidebar */}
          {unpositioned.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                Noch nicht positioniert ({unpositioned.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {unpositioned.map((item) => {
                  const typeDef = item.kind === 'plant' ? PLANT_TYPES[item.typeKey] : GARDEN_ELEMENT_TYPES[item.typeKey];
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        // Place in center when clicked
                        const posX = 40 + Math.random() * 20;
                        const posY = 40 + Math.random() * 20;
                        setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, posX, posY } : i));
                        savePosition(item.id, item.kind, posX, posY);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-green-50 hover:border-green-300 transition-colors"
                    >
                      <span>{typeDef?.icon ?? '🌿'}</span>
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-2">Klicken um auf der Karte zu platzieren, dann per Drag & Drop verschieben.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
