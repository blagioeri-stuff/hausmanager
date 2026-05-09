'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { COMPONENT_TYPE_LIST, COMPONENT_TYPES } from '@/lib/component-types';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { formatChf } from '@/lib/formatters';
import type { EnrichedComponent } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Name erforderlich'),
  typeKey: z.string().min(1, 'Typ erforderlich'),
  buildYear: z.preprocess(
    (val) => (typeof val === 'string' ? Number(val) : val),
    z.number().int('Ganzzahl erforderlich').min(1900, 'Min. 1900').max(new Date().getFullYear(), `Max. ${new Date().getFullYear()}`)
  ),
  customCostChf: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.nullable(z.number().positive('Muss positiv sein')).optional()
  ),
  customLifetimeYrs: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.nullable(z.number().int().positive('Muss positiv sein')).optional()
  ),
  plannedRenovationYear: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.nullable(z.number().int('Ganzzahl').min(1900, 'Min. 1900')).optional()
  ),
  plannedRenovationCostChf: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.nullable(z.number().positive('Muss positiv sein')).optional()
  ),
  notes: z.string().nullable().optional(),
  renovationPlanned: z.boolean().optional(),
  maintenanceIntervalMonths: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.nullable(z.number().int().positive('Muss positiv sein')).optional()
  ),
});

type FormData = z.infer<typeof schema>;

interface Prefill {
  name?: string;
  typeKey?: string;
  buildYear?: number;
  replacementCostChf?: number;
}

interface Props {
  component?: EnrichedComponent;
  prefill?: Prefill;
}

export function ComponentForm({ component, prefill }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState(component?.typeKey ?? prefill?.typeKey ?? '');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormData>({
    mode: 'onSubmit',
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      name: component?.name ?? prefill?.name ?? '',
      typeKey: component?.typeKey ?? prefill?.typeKey ?? '',
      buildYear: component?.buildYear ?? prefill?.buildYear ?? new Date().getFullYear(),
      customCostChf: component?.customCostChf ?? prefill?.replacementCostChf ?? null,
      customLifetimeYrs: component?.customLifetimeYrs ?? null,
      plannedRenovationYear: component?.plannedRenovationYear ?? null,
      plannedRenovationCostChf: component?.plannedRenovationCostChf ?? null,
      notes: component?.notes ?? '',
      renovationPlanned: component?.renovationPlanned ?? true,
      maintenanceIntervalMonths: component?.maintenanceIntervalMonths ?? null,
    },
  });

  const watchedType = watch('typeKey');
  const watchedRenovationPlanned = watch('renovationPlanned');
  const prevRenovationPlanned = useRef(watchedRenovationPlanned);

  useEffect(() => {
    setSelectedType(watchedType);
  }, [watchedType]);

  // When checkbox is checked → clear manual plannedRenovationYear
  useEffect(() => {
    if (watchedRenovationPlanned && !prevRenovationPlanned.current) {
      setValue('plannedRenovationYear', null);
      setValue('plannedRenovationCostChf', null);
    }
    prevRenovationPlanned.current = watchedRenovationPlanned;
  }, [watchedRenovationPlanned, setValue]);

  const typeDef = selectedType ? COMPONENT_TYPES[selectedType] : null;

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const url = component ? `/api/components/${component.id}` : '/api/components';
      const method = component ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          customCostChf: data.customCostChf || null,
          customLifetimeYrs: data.customLifetimeYrs || null,
          plannedRenovationYear: data.plannedRenovationYear || null,
          plannedRenovationCostChf: data.plannedRenovationCostChf || null,
          notes: data.notes || null,
          maintenanceIntervalMonths: data.maintenanceIntervalMonths || null,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        const fieldErrors = errData?.error?.fieldErrors as Record<string, string[]> | undefined;
        if (fieldErrors) {
          const first = Object.entries(fieldErrors)[0];
          throw new Error(`${first[0]}: ${first[1][0]}`);
        }
        throw new Error(typeof errData?.error === 'string' ? errData.error : 'Fehler beim Speichern');
      }
      const saved = await res.json().catch(() => null);
      const savedId = saved?.id ?? component?.id;
      window.location.href = savedId ? `/komponenten/${savedId}` : '/komponenten';
    } catch (e) {
      alert('Fehler: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = [
    ...COMPONENT_TYPE_LIST.map((t) => ({ value: t.key, label: t.labelDe })),
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Select
        label="Typ"
        placeholder="Typ wählen…"
        options={typeOptions}
        error={errors.typeKey?.message}
        {...register('typeKey')}
      />

      {typeDef && (
        <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm text-blue-700 space-y-1">
          <p>
            <span className="font-medium">Standard-Lebensdauer:</span> {typeDef.defaultLifetimeYrs} Jahre
          </p>
          <p>
            <span className="font-medium">Standard-Kosten:</span> {formatChf(typeDef.defaultCostChf)}
          </p>
        </div>
      )}

      <Input
        label="Bezeichnung"
        placeholder="z.B. Badezimmer OG"
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        label="Baujahr"
        type="number"
        placeholder={String(new Date().getFullYear())}
        hint="Originalbau oder letztes Renovationsjahr"
        error={errors.buildYear?.message}
        {...register('buildYear', {
          setValueAs: (v) =>
            v === '' || v === undefined || v === null
              ? new Date().getFullYear()
              : parseInt(String(v), 10),
        })}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Kosten (CHF) — optional"
          type="number"
          placeholder={typeDef ? String(typeDef.defaultCostChf) : ''}
          hint="Leer = Standardwert verwenden"
          error={errors.customCostChf?.message}
          {...register('customCostChf')}
        />
        <Input
          label="Lebensdauer (Jahre) — optional"
          type="number"
          placeholder={typeDef ? String(typeDef.defaultLifetimeYrs) : ''}
          hint="Leer = Standardwert verwenden"
          error={errors.customLifetimeYrs?.message}
          {...register('customLifetimeYrs')}
        />
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
        <input
          type="checkbox"
          id="renovationPlanned"
          {...register('renovationPlanned')}
          className="h-4 w-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <div>
          <label htmlFor="renovationPlanned" className="text-sm font-medium text-gray-700 cursor-pointer">
            Renovation zum errechneten Zeitpunkt geplant
          </label>
          <p className="text-xs text-gray-400 mt-0.5">
            {watchedRenovationPlanned
              ? 'Erneuerungsjahr wird automatisch aus Baujahr + Lebensdauer berechnet.'
              : 'Kein Erneuerungsdatum geplant — optional manuelles Jahr und Kosten eintragen.'}
          </p>
        </div>
      </div>

      <div className={`grid grid-cols-2 gap-4 transition-opacity ${watchedRenovationPlanned ? 'opacity-40 pointer-events-none' : ''}`}>
        <Controller
          name="plannedRenovationYear"
          control={control}
          render={({ field }) => (
            <Input
              label="Geplantes Renovationsjahr — optional"
              type="number"
              placeholder="z.B. 2031"
              hint={watchedRenovationPlanned ? 'Wird automatisch berechnet' : 'Überschreibt das berechnete Erneuerungsjahr'}
              error={errors.plannedRenovationYear?.message}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}
              onBlur={field.onBlur}
              disabled={watchedRenovationPlanned}
            />
          )}
        />
        <Controller
          name="plannedRenovationCostChf"
          control={control}
          render={({ field }) => (
            <Input
              label="Geplante Kosten (CHF) — optional"
              type="number"
              placeholder={typeDef ? String(typeDef.defaultCostChf) : ''}
              hint={watchedRenovationPlanned ? 'Wird automatisch berechnet' : 'Überschreibt Standardkosten und individuelle Kosten'}
              error={errors.plannedRenovationCostChf?.message}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
              onBlur={field.onBlur}
              disabled={watchedRenovationPlanned}
            />
          )}
        />
      </div>

      <Input
        label="Wartungsintervall (Monate) — optional"
        type="number"
        placeholder={typeDef && 'defaultMaintenanceIntervalMonths' in typeDef ? String((typeDef as { defaultMaintenanceIntervalMonths?: number }).defaultMaintenanceIntervalMonths) : '12'}
        hint="Leer = keine Erinnerung. z.B. 12 für jährlichen Heizungsservice."
        error={errors.maintenanceIntervalMonths?.message}
        {...register('maintenanceIntervalMonths')}
      />

      <Textarea
        label="Notizen — optional"
        placeholder="Marke, Modell, besondere Merkmale…"
        {...register('notes')}
      />

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading}>
          {component ? 'Speichern' : 'Erstellen'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
