'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/lib/types';

const registroSchema = z
  .object({
    nombre: z.string().trim().min(2, 'Ingresa tu nombre'),
    apellido: z.string().trim().min(2, 'Ingresa tu apellido'),
    email: z.string().trim().min(1, 'Ingresa tu correo').email('Correo no válido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmar: z.string(),
  })
  .refine((d) => d.password === d.confirmar, { path: ['confirmar'], message: 'Las contraseñas no coinciden' });

type RegistroValues = z.infer<typeof registroSchema>;

/** Registro rápido: bottom sheet en mobile, modal centrado en desktop */
export function RegisterModal({ rol, open, onClose }: { rol: UserRole; open: boolean; onClose: () => void }) {
  const { register: registrar } = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegistroValues>({ resolver: zodResolver(registroSchema) });

  const onSubmit = async ({ nombre, apellido, email, password }: RegistroValues) => {
    try {
      await registrar({ nombre, apellido, email, password }, rol);
    } catch {
      setError('root', { message: 'No pudimos crear tu cuenta. Intenta de nuevo.' });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Crear Cuenta"
      description={rol === 'cliente' ? 'Solicita técnicos en minutos.' : 'Recibe solicitudes de clientes cerca de ti.'}
    >
      <form id="form-registro" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 pt-2">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Nombre" autoComplete="given-name" error={errors.nombre?.message} {...register('nombre')} />
          <Input label="Apellido" autoComplete="family-name" error={errors.apellido?.message} {...register('apellido')} />
        </div>
        <Input label="Correo electrónico" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input label="Contraseña" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
        <Input label="Confirmar contraseña" type="password" autoComplete="new-password" error={errors.confirmar?.message} {...register('confirmar')} />
        {errors.root && (
          <p role="alert" className="text-sm font-medium text-danger">
            {errors.root.message}
          </p>
        )}
        <Button type="submit" width="full" size="lg" loading={isSubmitting}>
          Crear Cuenta
        </Button>
      </form>
    </Modal>
  );
}
