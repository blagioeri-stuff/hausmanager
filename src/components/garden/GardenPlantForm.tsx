'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { PLANT_TYPE_LIST, MONTHS_DE } from '@/lib/garden-types';
import type { RawGardenPlant } from '@/types';

interface Props {
  plant?: RawGardenPlant;
}

const STATUS_OPTIONS = [
  { value: 'gut', label: 'Gut' },
  { value: 'pflege_nötig', label: 'Pflege nötig' },
  { value: 'krank', label: 'Krank' },
  { value: 'dormant', label: 'Winterruhe / dormant' },
];

const TYPE_OPTIONS = PLANT_TYPE_LIST.map((t) => ({ value: t.key, label: `${t.icon} ${t.labelDe}` }));

const MONTH_OPTIONS = MONTHS_DE.map((m, i) => ({ value: String(i + 1), label: m }));

export function GardenPlantForm({ plant }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(plant?.name ?? '');
  const [latinName, setLatinName] = useState(plant?.latinName ?? '');
  const [typeKey, setTypeKey] = useState(plant?.typeKey ?? '');
  const [locationHint, setLocationHint] = useState(plant?.locationHint ?? '');
  const [plantedYear, setPlantedYear] = useState(plant?.plantedYear ? String(plant.plantedYear) : '');
  const [status, setStatus] = useState(plant?.status ?? 'gut');
  const [winterProtection, setWinterProtection] = useState(plant?.winterProtection ?? false);
  const [wateringIntervalDays, setWateringIntervalDays] = useState(
    plant?.wateringIntervalDays ? String(plant.wateringIntervalDays) : ''
  );
  const [fertilizingWeeks, setFertilizingWeeks] = useState(
    plant?.fertilizingWeeks ? String(plant.fertilizingWeeks) : ''
  );
  const [selectedPruningMonths, setSelectedPruningMonths] = useState<string[]>(
    plant?.pruningMonths ? plant.pruningMonths.split(',') : []
  );
  const [notes, setNotes] = useState(plant?.notes ?? '');

  function togglePruningMonth(m: string) {
    setSelectedPruningMonths((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m].sort((a, b) => parseInt(a) - parseInt(b))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = plant ? `/api/garten/pflanzen/${plant.id}` : '/api/garten/pflanzen';
      const method = plant ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          latinName: latinName || null,
          typeKey,
          locationHint: locationHint || null,
          plantedYear: plantedYear ? parseInt(plantedYear) : null,
          status,
          winterProtection,
          wateringIntervalDays: wateringIntervalDays ? parseInt(wateringIntervalDays) : null,
          fertilizingWeeks: fertilizingWeeks ? parseInt(fertilizingWeeks) : null,
          pruningMonths: selectedPruningMonths.length > 0 ? selectedPruningMonths.join(',') : null,
          notes: notes || null,
        }),
      });
      if (!res.ok) throw new Error('Fehler beim Speichern');
      const saved = await res.json();
      router.push(`/garten/pflanzen/${saved.id}`);
    } catch (e) {
      alert('Fehler: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Select
        label="Typ"
        placeholder="Pflanztyp wählen…"
        options={TYPE_OPTIONS}
        value={typeKey}
        onChange={(e) => setTypeKey(e.target.value)}
        required
      />

      <Input
        label="Name"
        placeholder="z.B. Apfelbaum Boskoop"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <Input
        label="Lateinischer Name — optional"
        placeholder="z.B. Malus domestica"
        value={latinName}
        onChange={(e) => setLatinName(e.target.value)}
      />

      <Input
        label="Standort — optional"
        placeholder="z.B. Nordwest-Ecke, neben dem Teich"
        value={locationHint}
        onChange={(e) => setLocationHint(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Gepflanzt (Jahr) — optional"
          type="number"
          placeholder={String(new Date().getFullYear())}
          value={plantedYear}
          onChange={(e) => setPlantedYear(e.target.value)}
        />
        <Select
          label="Zustand"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Bewässerungsintervall (Tage) — optional"
          type="number"
          placeholder="z.B. 3"
          hint="Leer = kein Intervall"
          value={wateringIntervalDays}
          onChange={(e) => setWateringIntervalDays(e.target.value)}
        />
        <Input
          label="Düngungsintervall (Wochen) — optional"
          type="number"
          placeholder="z.B. 4"
          hint="Leer = kein Intervall"
          value={fertilizingWeeks}
          onChange={(e) => setFertilizingWeeks(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Rückschnitt-Monate — optional</label>
        <div className="flex flex-wrap gap-1.5">
          {MONTHS_DE.map((m, i) => {
            const val = String(i + 1);
            const active = selectedPruningMonths.includes(val);
            return (
              <button
                key={val}
                type="button"
                onClick={() => togglePruningMonth(val)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-green-400'
                }`}
              >
                {m.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="winterProtection"
          checked={winterProtection}
          onChange={(e) => setWinterProtection(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
        />
        <label htmlFor="winterProtection" className="text-sm text-gray-700">
          Winterschutz erforderlich
        </label>
      </div>

      <Textarea
        label="Notizen — optional"
        placeholder="Besonderheiten, Pflegehinweise, Beobachtungen…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading}>
          {plant ? 'Speichern' : 'Erstellen'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
