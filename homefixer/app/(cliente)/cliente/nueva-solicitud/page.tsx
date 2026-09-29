'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { crearSolicitud } from '@/hooks/useSolicitudes';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { CategoriaServicio, NivelUrgencia } from '@/lib/types';
import { CATEGORIA_LABELS, URGENCIA_CONFIG, cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

// ============================================================
// Nueva Solicitud
// ============================================================
// Mobile: formulario apilado a ancho completo.
// Desktop: tarjeta centrada max-w-2xl; categoría y urgencia lado a lado,
//          descripción a ancho completo.

const CATEGORIAS = Object.keys(CATEGORIA_LABELS) as [CategoriaServicio, ...CategoriaServicio[]];
const URGENCIAS = Object.keys(URGENCIA_CONFIG) as [NivelUrgencia, ...NivelUrgencia[]];

const schema = z.object({
  categoria: z.enum(CATEGORIAS, { error: 'Selecciona una categoría' }),
  urgencia: z.enum(URGENCIAS),
  direccion: z.string().trim().min(8, 'Ingresa una dirección completa'),
  descripcion: z.string().trim().min(15, 'Describe el problema (mínimo 15 caracteres)').max(600, 'Máximo 600 caracteres'),
});

type Values = z.infer<typeof schema>;

export default function NuevaSolicitudPage() {
  usePageTitle('Nueva Solicitud');
  return (
    <Suspense>
      <NuevaSolicitudForm />
    </Suspense>
  );
}

function NuevaSolicitudForm() {
  const router = useRouter();
  const params = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const param = params.get('categoria');
  const categoriaInicial = CATEGORIAS.includes(param as CategoriaServicio) ? (param as CategoriaServicio) : undefined;

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      categoria: categoriaInicial,
      urgencia: 'normal',
      direccion: '',
      descripcion: '',
    },
  });

  const descripcion = useWatch({ control, name: 'descripcion' });

  const onSubmit = async (values: Values) => {
    try {
      const nueva = await crearSolicitud(values, user?.id ?? 'cliente-001', user ? `${user.nombre} ${user.apellido}` : 'Cliente');
      router.push(`/cliente/tecnicos-disponibles?solicitud=${nueva.id}&categoria=${nueva.categoria}`);
    } catch {
      setError('root', { message: 'No pudimos crear la solicitud. Intenta de nuevo.' });
    }
  };

  return (
    <Card padding="lg" className="mx-auto w-full max-w-2xl">
      <header className="mb-6">
        <h2 className="text-xl font-bold text-ink md:text-2xl">Cuéntanos qué necesitas</h2>
        <p className="mt-1 text-sm text-subtle">Te mostraremos los técnicos disponibles cerca de ti.</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Select
            label="Categoría"
            placeholder="Selecciona…"
            defaultValue={categoriaInicial ?? ''}
            options={CATEGORIAS.map((c) => ({ value: c, label: CATEGORIA_LABELS[c] }))}
            error={errors.categoria?.message}
            {...register('categoria')}
          />

          <Controller
            control={control}
            name="urgencia"
            render={({ field }) => (
              <fieldset>
                <legend className="sr-only">Urgencia</legend>
                <div className="grid h-14 grid-cols-3 gap-1 rounded-input border border-border bg-surface-muted p-1" role="radiogroup" aria-label="Urgencia">
                  {URGENCIAS.map((u) => {
                    const on = field.value === u;
                    return (
                      <button
                        key={u}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => field.onChange(u)}
                        className={cn(
                          'rounded-[0.375rem] text-xs font-semibold transition-colors sm:text-sm',
                          on && u === 'normal' && 'bg-surface text-primary-700 shadow-card',
                          on && u === 'urgente' && 'bg-warning text-white shadow-card',
                          on && u === 'emergencia' && 'bg-danger text-white shadow-card',
                          !on && 'text-subtle hover:text-ink'
                        )}
                      >
                        {URGENCIA_CONFIG[u].label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-xs text-subtle">Urgencia del servicio</p>
              </fieldset>
            )}
          />
        </div>

        <Input label="Dirección del servicio" autoComplete="street-address" leftIcon={<MapPin />} error={errors.direccion?.message} {...register('direccion')} />

        <TextArea
          label="Describe el problema"
          rows={5}
          error={errors.descripcion?.message}
          hint={`${descripcion?.length ?? 0}/600 · Incluye detalles como marca, ubicación y desde cuándo ocurre.`}
          {...register('descripcion')}
        />

        {errors.root && (
          <p role="alert" className="rounded-input bg-danger-light px-4 py-3 text-sm font-medium text-danger-dark">
            {errors.root.message}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 pt-2 md:flex-row md:justify-end">
          <Button variant="ghost" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" size="lg" loading={isSubmitting} rightIcon={<Send className="size-4" />}>
            Buscar técnicos
          </Button>
        </div>
      </form>
    </Card>
  );
}
