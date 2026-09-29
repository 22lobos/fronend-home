import { MapPin, Wrench } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StarRating } from '@/components/ui/StarRating';
import type { Tecnico } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';

interface TecnicoCardProps {
  tecnico: Tecnico;
  onSolicitar?: () => void;
  loading?: boolean;
  disabled?: boolean;
  active?: boolean;
  onHover?: (hovering: boolean) => void;
}

export function TecnicoCard({ tecnico: t, onSolicitar, loading, disabled, active, onHover }: TecnicoCardProps) {
  return (
    <Card
      as="article"
      interactive
      aria-label={`${t.nombre} ${t.apellido}, ${t.especialidad}`}
      className={cn('flex flex-col gap-4', active && 'ring-2 ring-primary-300')}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      <div className="flex items-start gap-3">
        <Avatar nombre={t.nombre} apellido={t.apellido} src={t.avatarUrl} online={t.disponible} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-ink">
              {t.nombre} {t.apellido}
            </h3>
            {t.esMaestro && <Badge variant="maestro">Maestro</Badge>}
          </div>
          <p className="flex items-center gap-1 text-sm text-subtle">
            <Wrench className="size-3.5" aria-hidden />
            {t.especialidad}
          </p>
          <StarRating value={t.calificacion} showValue totalValoraciones={t.totalValoraciones} className="mt-1" />
        </div>
      </div>

      {t.descripcion && <p className="line-clamp-2 text-sm text-subtle">{t.descripcion}</p>}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3 text-sm">
        <span className="flex items-center gap-1 text-subtle">
          <MapPin className="size-4" aria-hidden />
          {t.distanciaKm?.toFixed(1)} km
        </span>
        <span className="text-subtle">
          Desde <strong className="text-base text-ink">{formatCurrency(t.precioBase)}</strong>
        </span>
      </div>

      {onSolicitar && (
        <Button
          width="full"
          onClick={onSolicitar}
          loading={loading}
          disabled={disabled || !t.disponible}
          variant={t.disponible ? 'primary' : 'outline'}
        >
          {t.disponible ? 'Solicitar' : 'No disponible'}
        </Button>
      )}
    </Card>
  );
}
