'use client';

import { useParams } from 'next/navigation';
import { Clock, CreditCard, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StarRating } from '@/components/ui/StarRating';
import { ErrorState, LoadingRegion, Skeleton } from '@/components/ui/States';
import { MapPlaceholder } from '@/components/shared/MapPlaceholder';
import { StatusTimeline } from '@/components/shared/StatusTimeline';
import { useSolicitud } from '@/hooks/useSolicitudes';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { EstadoSolicitud } from '@/lib/types';
import { CATEGORIA_LABELS, ESTADO_CONFIG, formatCurrency } from '@/lib/utils';

// ============================================================
// Servicio en Progreso (Cliente)
// ============================================================
// Mobile: mapa arriba + card de estado debajo.
// Desktop: mapa grande sticky a la izquierda; a la derecha panel con estado,
//          técnico y acciones (chatear, llamar, pagar).

const PASOS = ['Aceptado', 'En camino', 'Trabajando', 'Finalizado'];
const PASO_POR_ESTADO: Record<EstadoSolicitud, number> = {
  pendiente: 0,
  aceptada: 1,
  en_progreso: 2,
  completada: 3,
  cancelada: 0,
};

export default function ServicioEnProgresoClientePage() {
  usePageTitle('Servicio en Progreso');
  const { id } = useParams<{ id: string }>();
  const { data: s, isLoading, error, refetch } = useSolicitud(id);

  if (isLoading) {
    return (
      <LoadingRegion className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-8">
        <Skeleton className="h-64 rounded-card lg:h-[calc(100dvh-8rem)]" />
        <div className="space-y-4">
          <Skeleton className="h-28 rounded-card" />
          <Skeleton className="h-44 rounded-card" />
          <Skeleton className="h-12 rounded-pill" />
        </div>
      </LoadingRegion>
    );
  }
  if (error || !s) return <ErrorState message={error?.message} onRetry={refetch} />;

  const t = s.tecnico;
  const paso = PASO_POR_ESTADO[s.estado];
  const eta = s.estado === 'aceptada' ? 'Llega en ~15 min' : s.estado === 'en_progreso' ? 'Trabajando en tu domicilio' : null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-8">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <MapPlaceholder
          route={s.estado === 'aceptada'}
          pins={[
            { id: 'tecnico', label: t?.nombre ?? 'Técnico', x: 22, y: 30, tone: 'success' },
            { id: 'casa', label: 'Tu domicilio', x: 70, y: 70, tone: 'primary', active: true },
          ]}
          className="h-64 md:h-80 lg:h-[calc(100dvh-8rem)]"
          label="Ubicación del técnico"
        />
      </div>

      <div className="space-y-4">
        <Card>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-subtle">{CATEGORIA_LABELS[s.categoria]}</p>
              <h2 className="text-lg font-semibold text-ink">Estado del servicio</h2>
            </div>
            <Badge variant={ESTADO_CONFIG[s.estado].variant}>{ESTADO_CONFIG[s.estado].label}</Badge>
          </div>
          <StatusTimeline steps={PASOS} current={paso} />
          {eta && (
            <p className="mt-5 flex items-center gap-2 rounded-input bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700">
              <Clock className="size-4" aria-hidden />
              {eta}
            </p>
          )}
        </Card>

        {t ? (
          <Card>
            <div className="flex items-center gap-3">
              <Avatar nombre={t.nombre} apellido={t.apellido} size="lg" online={t.disponible} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-ink">
                    {t.nombre} {t.apellido}
                  </h3>
                  {t.esMaestro && <Badge variant="maestro">Maestro</Badge>}
                </div>
                <p className="text-sm text-subtle">{t.especialidad}</p>
                <StarRating value={t.calificacion} showValue totalValoraciones={t.totalValoraciones} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button href={`/cliente/chat/${s.id}`} width="full" leftIcon={<MessageCircle className="size-4" />}>
                Chatear
              </Button>
              <Button href={`tel:${t.telefono ?? ''}`} variant="outline" width="full" leftIcon={<Phone className="size-4" />}>
                Llamar
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="text-sm text-subtle">Aún no hay un técnico asignado a esta solicitud.</Card>
        )}

        <Card>
          <h3 className="mb-3 font-semibold text-ink">Detalle</h3>
          <p className="text-sm text-ink">{s.descripcion}</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-start gap-2 text-subtle">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              <dt className="sr-only">Dirección</dt>
              <dd>{s.direccion}</dd>
            </div>
            {s.presupuestoEstimado && (
              <div className="flex justify-between border-t border-border pt-3">
                <dt className="text-subtle">Presupuesto estimado</dt>
                <dd className="font-semibold text-ink">{formatCurrency(s.presupuestoEstimado)}</dd>
              </div>
            )}
          </dl>
        </Card>

        {t && (
          <Button href={`/cliente/pago/${s.id}`} variant="success" width="full" size="lg" leftIcon={<CreditCard className="size-5" />}>
            {s.estado === 'completada' ? 'Pagar servicio' : 'Finalizar y pagar'}
          </Button>
        )}
      </div>
    </div>
  );
}
