'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CircleCheck, Hammer, MapPin, Navigation, Phone, StickyNote } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextArea } from '@/components/ui/Input';
import { ErrorState, LoadingRegion, Skeleton } from '@/components/ui/States';
import { PhotoUploader } from '@/components/shared/PhotoUploader';
import { StatusTimeline } from '@/components/shared/StatusTimeline';
import { finalizarTrabajo, iniciarTrabajo, useSolicitud } from '@/hooks/useSolicitudes';
import { usePageTitle } from '@/hooks/usePageTitle';
import { CATEGORIA_LABELS, URGENCIA_CONFIG, formatCurrency } from '@/lib/utils';
import { FOTOS_VACIAS, useServicioStore } from '@/store/servicioStore';

// ============================================================
// Servicio en Progreso (Técnico)
// ============================================================
// Mobile: todo apilado (cliente → estado → notas → fotos → finalizar).
// Desktop: dos columnas — datos del cliente, estado y notas a la izquierda;
//          fotos antes/después y "Finalizar Trabajo" a la derecha.

type Etapa = 'en_camino' | 'llegue' | 'trabajando';
const PASOS = ['En camino', 'Llegué', 'Trabajando', 'Finalizado'];
const INDICE: Record<Etapa, number> = { en_camino: 0, llegue: 1, trabajando: 2 };

export default function ServicioEnProgresoTecnicoPage() {
  usePageTitle('Servicio en Progreso');
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: s, isLoading, error, refetch } = useSolicitud(id);
  const [etapa, setEtapa] = useState<Etapa | null>(null);
  const [actualizando, setActualizando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [errorFinal, setErrorFinal] = useState<string | null>(null);

  const fotos = useServicioStore((st) => st.fotos[id] ?? FOTOS_VACIAS);
  const notas = useServicioStore((st) => st.notas[id] ?? '');
  const { addFoto, removeFoto, setNotas } = useServicioStore();

  if (isLoading) {
    return (
      <LoadingRegion className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8">
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-card" />
          <Skeleton className="h-32 rounded-card" />
          <Skeleton className="h-40 rounded-card" />
        </div>
        <Skeleton className="h-96 rounded-card" />
      </LoadingRegion>
    );
  }
  if (error || !s) return <ErrorState message={error?.message} onRetry={refetch} />;

  const etapaActual: Etapa = etapa ?? (s.estado === 'en_progreso' ? 'trabajando' : 'en_camino');
  const [nombre, apellido] = (s.clienteNombre ?? 'Cliente').split(' ');

  const avanzar = async () => {
    if (etapaActual === 'en_camino') return setEtapa('llegue');
    setActualizando(true);
    try {
      await iniciarTrabajo(s.id);
      setEtapa('trabajando');
    } finally {
      setActualizando(false);
    }
  };

  const finalizar = async () => {
    setErrorFinal(null);
    setFinalizando(true);
    try {
      await finalizarTrabajo(s.id, notas);
      router.push(`/tecnico/servicio-completado/${s.id}`);
    } catch {
      setErrorFinal('No se pudo finalizar el trabajo. Intenta de nuevo.');
      setFinalizando(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start lg:gap-8">
      {/* Columna izquierda: cliente + estado + notas */}
      <div className="space-y-4">
        <Card>
          <div className="flex items-start gap-3">
            <Avatar nombre={nombre} apellido={apellido} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-ink">{s.clienteNombre}</h2>
                {s.urgencia !== 'normal' && <Badge variant="urgente">{URGENCIA_CONFIG[s.urgencia].label}</Badge>}
              </div>
              <p className="text-sm text-subtle">{CATEGORIA_LABELS[s.categoria]}</p>
              <p className="mt-2 flex items-start gap-1.5 text-sm text-ink">
                <MapPin className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden />
                {s.direccion}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button href="tel:" variant="outline" width="full" leftIcon={<Phone className="size-4" />}>
              Llamar
            </Button>
            <Button
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.direccion)}`}
              variant="outline"
              width="full"
              leftIcon={<Navigation className="size-4" />}
            >
              Cómo llegar
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold text-ink">Estado del trabajo</h3>
          <StatusTimeline steps={PASOS} current={INDICE[etapaActual]} />
          {etapaActual !== 'trabajando' && (
            <Button width="full" className="mt-5" loading={actualizando} onClick={avanzar} leftIcon={etapaActual === 'en_camino' ? <MapPin className="size-4" /> : <Hammer className="size-4" />}>
              {etapaActual === 'en_camino' ? 'Marcar "Llegué"' : 'Iniciar trabajo'}
            </Button>
          )}
        </Card>

        <Card>
          <h3 className="mb-2 font-semibold text-ink">Problema reportado</h3>
          <p className="text-sm text-ink">{s.descripcion}</p>
          {s.presupuestoEstimado && (
            <p className="mt-3 text-sm text-subtle">
              Presupuesto estimado: <strong className="text-ink">{formatCurrency(s.presupuestoEstimado)}</strong>
            </p>
          )}
          <div className="mt-5">
            <TextArea
              label="Notas del trabajo"
              rows={4}
              value={notas}
              onChange={(e) => setNotas(id, e.target.value)}
              hint="Materiales usados, observaciones para el cliente…"
            />
          </div>
          <p className="mt-2 flex items-center gap-1 text-xs text-subtle">
            <StickyNote className="size-3.5" aria-hidden /> Las notas se incluyen en el resumen del servicio.
          </p>
        </Card>
      </div>

      {/* Columna derecha: fotos + finalizar */}
      <Card className="space-y-6 lg:sticky lg:top-24">
        <h3 className="font-semibold text-ink">Evidencia fotográfica</h3>
        <PhotoUploader label="Antes" fotos={fotos.antes} onAdd={(u) => addFoto(id, 'antes', u)} onRemove={(u) => removeFoto(id, 'antes', u)} />
        <PhotoUploader label="Después" fotos={fotos.despues} onAdd={(u) => addFoto(id, 'despues', u)} onRemove={(u) => removeFoto(id, 'despues', u)} />

        {errorFinal && (
          <p role="alert" className="rounded-input bg-danger-light px-4 py-3 text-sm font-medium text-danger-dark">
            {errorFinal}
          </p>
        )}

        <Button
          variant="success"
          width="full"
          size="lg"
          onClick={finalizar}
          loading={finalizando}
          disabled={etapaActual !== 'trabajando'}
          leftIcon={<CircleCheck className="size-5" />}
        >
          Finalizar Trabajo
        </Button>
        {etapaActual !== 'trabajando' && <p className="text-center text-xs text-subtle">Inicia el trabajo para poder finalizarlo.</p>}
      </Card>
    </div>
  );
}
