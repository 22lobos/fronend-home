'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserSearch } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingRegion, Skeleton } from '@/components/ui/States';
import { MapPlaceholder, type MapPin } from '@/components/shared/MapPlaceholder';
import { TecnicoCard } from '@/components/shared/TecnicoCard';
import { asignarTecnico } from '@/hooks/useSolicitudes';
import { useTecnicosDisponibles } from '@/hooks/useTecnicos';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { CategoriaServicio } from '@/lib/types';
import { CATEGORIA_LABELS, cn } from '@/lib/utils';

// ============================================================
// Técnicos Disponibles
// ============================================================
// Mobile: mapa arriba + lista vertical de cards.
// Desktop: dos columnas — mapa sticky a la izquierda y lista de técnicos a
//          la derecha (grid de 2 columnas en pantallas muy anchas).

const FILTROS: (CategoriaServicio | null)[] = [null, 'plomeria', 'electricidad', 'carpinteria', 'pintura', 'refrigeracion'];

// Posiciones simuladas en el mapa (se reemplazan por lat/lng reales)
const POSICIONES = [
  { x: 40, y: 30 },
  { x: 72, y: 58 },
  { x: 18, y: 70 },
  { x: 58, y: 24 },
  { x: 84, y: 82 },
];

export default function TecnicosDisponiblesPage() {
  usePageTitle('Técnicos Disponibles');
  return (
    <Suspense>
      <TecnicosDisponibles />
    </Suspense>
  );
}

function TecnicosDisponibles() {
  const router = useRouter();
  const params = useSearchParams();
  const solicitudId = params.get('solicitud');
  const categoriaParam = params.get('categoria') as CategoriaServicio | null;
  const [categoria, setCategoria] = useState<CategoriaServicio | null>(
    categoriaParam && categoriaParam in CATEGORIA_LABELS ? categoriaParam : null
  );
  const [hover, setHover] = useState<string | null>(null);
  const [asignando, setAsignando] = useState<string | null>(null);
  const [errorAsignar, setErrorAsignar] = useState<string | null>(null);
  const { data, isLoading, error, refetch } = useTecnicosDisponibles(categoria);

  const pins: MapPin[] = [
    { id: 'yo', label: 'Tú', x: 50, y: 50, tone: 'primary' },
    ...(data ?? []).map((t, i) => ({
      id: t.id,
      label: t.nombre,
      ...POSICIONES[i % POSICIONES.length],
      tone: t.disponible ? ('success' as const) : ('muted' as const),
      active: hover === t.id,
    })),
  ];

  const solicitar = async (tecnicoId: string) => {
    setErrorAsignar(null);
    // Sin solicitud previa (entrada directa), primero se crea una.
    if (!solicitudId) {
      router.push(`/cliente/nueva-solicitud${categoria ? `?categoria=${categoria}` : ''}`);
      return;
    }
    setAsignando(tecnicoId);
    try {
      await asignarTecnico(solicitudId, tecnicoId);
      router.push(`/cliente/servicio-en-progreso/${solicitudId}`);
    } catch {
      setErrorAsignar('No pudimos asignar al técnico. Intenta de nuevo.');
      setAsignando(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-8">
      {/* Columna mapa */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <MapPlaceholder pins={pins} className="h-56 md:h-72 lg:h-[calc(100dvh-8rem)]" label="Técnicos cerca de ti" />
      </div>

      {/* Columna lista */}
      <section aria-labelledby="titulo-lista" className="min-w-0">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 id="titulo-lista" className="text-lg font-semibold text-ink md:text-xl">
            {data ? `${data.filter((t) => t.disponible).length} técnicos disponibles` : 'Buscando técnicos…'}
          </h2>
          <span className="text-sm text-subtle">Ordenados por distancia</span>
        </div>

        <div className="scrollbar-thin -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Filtrar por especialidad">
          {FILTROS.map((f) => {
            const on = categoria === f;
            return (
              <button
                key={f ?? 'todos'}
                type="button"
                aria-pressed={on}
                onClick={() => setCategoria(f)}
                className={cn(
                  'h-9 shrink-0 rounded-pill border px-4 text-sm font-medium transition-colors',
                  on ? 'border-primary-500 bg-primary-500 text-white' : 'border-border bg-surface text-subtle hover:border-primary-300 hover:text-ink'
                )}
              >
                {f ? CATEGORIA_LABELS[f] : 'Todos'}
              </button>
            );
          })}
        </div>

        {errorAsignar && (
          <p role="alert" className="mb-4 rounded-input bg-danger-light px-4 py-3 text-sm font-medium text-danger-dark">
            {errorAsignar}
          </p>
        )}

        {isLoading ? (
          <LoadingRegion label="Buscando técnicos" className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-60 rounded-card" />
            ))}
          </LoadingRegion>
        ) : error ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : !data?.length ? (
          <EmptyState
            icon={<UserSearch />}
            title="No hay técnicos disponibles"
            description="Prueba con otra especialidad o vuelve a intentarlo en unos minutos."
            action={
              <Button variant="outline" size="sm" width="auto" onClick={() => setCategoria(null)}>
                Ver todos
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
            {data.map((t) => (
              <li key={t.id}>
                <TecnicoCard
                  tecnico={t}
                  active={hover === t.id}
                  onHover={(h) => setHover(h ? t.id : null)}
                  onSolicitar={() => solicitar(t.id)}
                  loading={asignando === t.id}
                  disabled={asignando !== null}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
