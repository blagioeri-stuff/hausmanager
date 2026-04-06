'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ComponentForm } from '@/components/forms/ComponentForm';
import { Card } from '@/components/ui/Card';

const CURRENT_YEAR = new Date().getFullYear();

const PRESETS = [
  { name: 'Dach', typeKey: 'roof', buildYear: CURRENT_YEAR - 20, replacementCostChf: 60000 },
  { name: 'Heizung', typeKey: 'heating', buildYear: CURRENT_YEAR - 10, replacementCostChf: 25000 },
  { name: 'Fenster', typeKey: 'windows', buildYear: CURRENT_YEAR - 15, replacementCostChf: 30000 },
  { name: 'Fassade', typeKey: 'facade', buildYear: CURRENT_YEAR - 25, replacementCostChf: 50000 },
  { name: 'Küche', typeKey: 'kitchen', buildYear: CURRENT_YEAR - 10, replacementCostChf: 35000 },
  { name: 'Bad/WC', typeKey: 'bathroom', buildYear: CURRENT_YEAR - 15, replacementCostChf: 20000 },
  { name: 'Elektroanlage', typeKey: 'electrical', buildYear: CURRENT_YEAR - 20, replacementCostChf: 15000 },
  { name: 'Wasserinstallation', typeKey: 'plumbing', buildYear: CURRENT_YEAR - 20, replacementCostChf: 12000 },
  { name: 'Garagentor', typeKey: 'garage_door', buildYear: CURRENT_YEAR - 10, replacementCostChf: 4000 },
  { name: 'Aussenanlage', typeKey: 'outdoor', buildYear: CURRENT_YEAR - 10, replacementCostChf: 15000 },
];

interface PresetValues {
  name?: string;
  typeKey?: string;
  buildYear?: number;
  replacementCostChf?: number;
}

export default function NeueKomponentePage() {
  const [prefill, setPrefill] = useState<PresetValues | undefined>(undefined);

  function applyPreset(p: typeof PRESETS[0]) {
    setPrefill({ ...p });
  }

  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader
        title="Neue Komponente"
        subtitle="Hauskomponente erfassen und Rücklage berechnen"
      />

      {/* Schnellerfassung */}
      <Card>
        <p className="text-xs font-medium text-gray-500 mb-3">Schnellerfassung — häufige Komponenten</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.typeKey}
              onClick={() => applyPreset(p)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-full text-gray-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <ComponentForm key={JSON.stringify(prefill)} prefill={prefill} />
      </Card>
    </div>
  );
}
