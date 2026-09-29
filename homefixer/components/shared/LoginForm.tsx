'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/lib/types';
import { RegisterModal } from './RegisterModal';
import { SocialButtons } from './SocialButtons';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Ingresa tu correo').email('Correo no válido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm({ rol }: { rol: UserRole }) {
  const { login } = useAuth();
  const next = useSearchParams().get('next');
  const [registroOpen, setRegistroOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    try {
      await login(values, rol, next);
    } catch {
      setError('root', { message: 'Correo o contraseña incorrectos.' });
    }
  };

  const otroRol = rol === 'cliente' ? 'tecnico' : 'cliente';

  return (
    <>
      {/* method="post": si el JS aún no cargó, la contraseña nunca va en la URL */}
      <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          leftIcon={<Mail />}
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          leftIcon={<Lock />}
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex justify-end">
          <button type="button" className="text-sm font-medium text-primary-600 hover:underline">
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {errors.root && (
          <p role="alert" className="rounded-input bg-danger-light px-4 py-3 text-sm font-medium text-danger-dark">
            {errors.root.message}
          </p>
        )}

        <Button type="submit" width="full" size="lg" loading={isSubmitting}>
          Iniciar Sesión
        </Button>
        <Button variant="outline" width="full" size="lg" onClick={() => setRegistroOpen(true)}>
          Crear Cuenta
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-subtle">
        <span className="h-px flex-1 bg-border" />o continúa con<span className="h-px flex-1 bg-border" />
      </div>

      <SocialButtons rol={rol} />

      <p className="mt-6 text-center text-sm text-subtle">
        {rol === 'cliente' ? '¿Eres técnico?' : '¿Buscas un técnico?'}{' '}
        <Link href={`/login-${otroRol}`} className="font-semibold text-primary-600 hover:underline">
          {rol === 'cliente' ? 'Ingresa como técnico' : 'Ingresa como cliente'}
        </Link>
      </p>

      <RegisterModal rol={rol} open={registroOpen} onClose={() => setRegistroOpen(false)} />
    </>
  );
}
