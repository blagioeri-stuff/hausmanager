'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ComponentForm } from '@/components/forms/ComponentForm';
import { Card } from '@/components/ui/Card';

const CURRENT_YEAR = new Date().getFullYear();

const PRESETS = [
  { name: 'Dach', typeKey: 'dach', buildYear: CURRENT_YEAR - 20, replacementCostChf: 50000 },
  { name: 'Heizung', typeKey: 'heizung', buildYear: CURRENT_YEAR - 10, replacementCostChf: 25000 },
  { name: 'Fenster', typeKey: 'fenster', buildYear: CURRENT_YEAR - 15, replacementCostChf: 25000 },
  { name: 'Fassade', typeKey: 'fassade', buildYear: CURRENT_YEAR - 25, replacementCostChf: 40000 },
  { name: 'Küche', typeKey: 'kueche', buildYear: CURRENT_YEAR - 10, replacementCostChf: 30000 },
  { name: 'Badezimmer', typeKey: 'badezimmer', buildYear: CURRENT_YEAR - 15, replacementCostChf: 20000 },
  { name: 'Elektroinstallation', typeKey: 'elektro', buildYear: CURRENT_YEAR - 20, replacementCostChf: 20000 },
  { name: 'Sanitärinstallation', typeKey: 'sanitaer', buildYear: CURRENT_YEAR - 20, replacementCostChf: 15000 },
  { name: 'Garten & Aussenanlage', typeKey: 'garten', buildYear: CURRENT_YEAR - 10, replacementCostChf: 20000 },
  { name: 'Garage / Carport', typeKey: 'garage', buildYear: CURRENT_YEAR - 15, replacementCostChf: 30000 },
  { name: 'Bodenbeläge', typeKey: 'bodenbelaege', buildYear: CURRENT_YEAR - 10, replacementCostChf: 15000 },
  { name: 'Malerarbeiten Innen', typeKey: 'maler_innen', buildYear: CURRENT_YEAR - 8, replacementCostChf: 8000 },
];

interface Prefill {
  name?: string;
  typeKey?: string;
  buildYear?: number;
  replacementCostChf?: number;
}

export default function NeueKomponentePage() {
  const [prefill, setPrefill] = useState<Prefill | undefined>(undefined);
  const [formKey, setFormKey] = useState(0);

  function applyPreset(p: typeof PRESETS[0]) {
    setPrefill({ name: p.name, typeKey: p.typeKey, buildYear: p.buildYear, replacementCostChf: p.replacementCostChf });
    setFormKey((k) => k + 1);
  }

  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader
        title="Neue Komponente"
        subtitle="Hauskomponente erfassen und Rücklage berechnen"
      />

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
        {prefill && (
          <p className="mt-2 text-xs text-blue-600">
            Vorlage geladen: <strong>{prefill.name}</strong> — Formular unten anpassen und speichern.
          </p>
        )}
      </Card>

      <Card>
        <ComponentForm key={formKey} prefill={prefill} />
      </Card>
    </div>
  );
}
