'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CircleCheck, Mail, Phone } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { StarRating } from '@/components/ui/StarRating';
import type { Tecnico } from '@/lib/types';
import { delay, rolTecnicoLabel } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const schema = z.object({
  nombre: z.string().trim().min(2, 'Ingresa tu nombre'),
  apellido: z.string().trim().min(2, 'Ingresa tu apellido'),
  email: z.string().trim().email('Correo no válido'),
  telefono: z.string().trim().regex(/^[+\d\s()-]{8,}$/, 'Teléfono no válido'),
});
type Values = z.infer<typeof schema>;

/** Mi Perfil (cliente y técnico). Desktop: tarjeta de identidad + formulario en 2 columnas. */
export function PerfilView() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [guardado, setGuardado] = useState(false);
  const tecnico = user?.rol === 'tecnico' ? (user as Tecnico) : null;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: user?.nombre ?? '',
      apellido: user?.apellido ?? '',
      email: user?.email ?? '',
      telefono: user?.telefono ?? '',
    },
  });

  const onSubmit = async (v: Values) => {
    await delay(600); // PATCH /usuarios/me
    updateUser(v);
    reset(v);
    setGuardado(true);
  };

  if (!user) return null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8">
      <Card className="flex flex-col items-center text-center lg:self-start">
        <Avatar nombre={user.nombre} apellido={user.apellido} src={user.avatarUrl} size="xl" />
        <h2 className="mt-3 text-lg font-semibold text-ink">
          {user.nombre} {user.apellido}
        </h2>
        <p className="text-sm text-subtle">{tecnico ? rolTecnicoLabel(tecnico.especialidad) : 'Cliente'}</p>
        {tecnico?.esMaestro && (
          <Badge variant="maestro" className="mt-2">
            Técnico Maestro
          </Badge>
        )}
        {tecnico && <StarRating value={tecnico.calificacion} showValue totalValoraciones={tecnico.totalValoraciones} className="mt-3" />}
        <div className="mt-4 w-full space-y-2 border-t border-border pt-4 text-left text-sm text-subtle">
          <p className="flex items-center gap-2">
            <Mail className="size-4" aria-hidden /> {user.email}
          </p>
          {user.telefono && (
            <p className="flex items-center gap-2">
              <Phone className="size-4" aria-hidden /> {user.telefono}
            </p>
          )}
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="mb-5 text-lg font-semibold text-ink">Datos personales</h2>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4" onChange={() => setGuardado(false)}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Nombre" error={errors.nombre?.message} {...register('nombre')} />
            <Input label="Apellido" error={errors.apellido?.message} {...register('apellido')} />
            <Input label="Correo electrónico" type="email" error={errors.email?.message} {...register('email')} />
            <Input label="Teléfono" type="tel" error={errors.telefono?.message} {...register('telefono')} />
          </div>
          <div className="flex flex-col items-center gap-3 pt-2 md:flex-row md:justify-end">
            {guardado && (
              <p role="status" className="flex items-center gap-1 text-sm font-medium text-success">
                <CircleCheck className="size-4" aria-hidden /> Cambios guardados
              </p>
            )}
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
