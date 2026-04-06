'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
  buildYear: z
    .number()
    .int('Ganzzahl erforderlich')
    .min(1900, 'Min. 1900')
    .max(new Date().getFullYear(), `Max. ${new Date().getFullYear()}`),
  customCostChf: z.number().positive('Muss positiv sein').nullable().optional(),
  customLifetimeYrs: z.number().int().positive('Muss positiv sein').nullable().optional(),
  plannedRenovationYear: z.number().int('Ganzzahl').min(1900, 'Min. 1900').nullable().optional(),
  plannedRenovationCostChf: z.number().positive('Muss positiv sein').nullable().optional(),
  notes: z.string().nullable().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  component?: EnrichedComponent;
}

export function ComponentForm({ component }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState(component?.typeKey ?? '');

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: component?.name ?? '',
      typeKey: component?.typeKey ?? '',
      buildYear: component?.buildYear ?? new Date().getFullYear(),
      customCostChf: component?.customCostChf ?? null,
      customLifetimeYrs: component?.customLifetimeYrs ?? null,
      plannedRenovationYear: component?.plannedRenovationYear ?? null,
      plannedRenovationCostChf: component?.plannedRenovationCostChf ?? null,
      notes: component?.notes ?? '',
    },
  });

  const watchedType = watch('typeKey');
  useEffect(() => {
    setSelectedType(watchedType);
  }, [watchedType]);

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
        label="Baujahr / Renovationsjahr"
        type="number"
        placeholder={String(new Date().getFullYear())}
        error={errors.buildYear?.message}
        {...register('buildYear', { valueAsNumber: true })}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Kosten (CHF) — optional"
          type="number"
          placeholder={typeDef ? String(typeDef.defaultCostChf) : ''}
          hint="Leer = Standardwert verwenden"
          error={errors.customCostChf?.message}
          {...register('customCostChf', { valueAsNumber: true, setValueAs: (v) => (v === '' || isNaN(Number(v)) ? null : Number(v)) })}
        />
        <Input
          label="Lebensdauer (Jahre) — optional"
          type="number"
          placeholder={typeDef ? String(typeDef.defaultLifetimeYrs) : ''}
          hint="Leer = Standardwert verwenden"
          error={errors.customLifetimeYrs?.message}
          {...register('customLifetimeYrs', { valueAsNumber: true, setValueAs: (v) => (v === '' || isNaN(Number(v)) ? null : Number(v)) })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="plannedRenovationYear"
          control={control}
          render={({ field }) => (
            <Input
              label="Geplantes Renovationsjahr — optional"
              type="number"
              placeholder="z.B. 2031"
              hint="Überschreibt das berechnete Erneuerungsjahr"
              error={errors.plannedRenovationYear?.message}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}
              onBlur={field.onBlur}
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
              hint="Überschreibt Standardkosten und individuelle Kosten"
              error={errors.plannedRenovationCostChf?.message}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
              onBlur={field.onBlur}
            />
          )}
        />
      </div>

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
