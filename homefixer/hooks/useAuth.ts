'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api, { USE_MOCKS } from '@/lib/api';
import { mockCliente, mockTecnico } from '@/lib/mock-data';
import { HOME_PATH, LOGIN_PATH, clearSession, setSession } from '@/lib/session';
import type { Credenciales, DatosRegistro, User, UserRole } from '@/lib/types';
import { delay } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

// ============================================================
// useAuth — login, registro, OAuth y logout
// ============================================================
// Endpoints esperados del microservicio de auth:
//   POST /auth/login      { email, password, rol }        → { user, token }
//   POST /auth/register   { nombre, apellido, email, … }  → { user, token }
//   POST /auth/oauth/:provider { rol }                    → { user, token }

interface AuthResponse {
  user: User;
  token: string;
}

export type OAuthProvider = 'google' | 'facebook';

async function mockAuth(rol: UserRole, email?: string, nombre?: string): Promise<AuthResponse> {
  await delay(700);
  const base = rol === 'cliente' ? mockCliente : mockTecnico;
  return {
    user: { ...base, email: email ?? base.email, nombre: nombre ?? base.nombre },
    token: `mock-token-${rol}-${Date.now()}`,
  };
}

export function useAuth() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const storeLogin = useAuthStore((s) => s.login);
  const storeLogout = useAuthStore((s) => s.logout);

  /** Guarda la sesión y navega al home del rol (o a ?next= si viene del proxy) */
  const finalizar = useCallback(
    ({ user, token }: AuthResponse, next?: string | null) => {
      storeLogin(user, token);
      setSession(user.rol, token);
      const destino = next?.startsWith(`/${user.rol}/`) ? next : HOME_PATH[user.rol];
      router.replace(destino);
    },
    [router, storeLogin]
  );

  const login = useCallback(
    async (creds: Credenciales, rol: UserRole, next?: string | null) => {
      const res = USE_MOCKS
        ? await mockAuth(rol, creds.email)
        : (await api.post<AuthResponse>('/auth/login', { ...creds, rol })).data;
      finalizar(res, next);
    },
    [finalizar]
  );

  const register = useCallback(
    async (datos: DatosRegistro, rol: UserRole) => {
      const res = USE_MOCKS
        ? await mockAuth(rol, datos.email, datos.nombre)
        : (await api.post<AuthResponse>('/auth/register', { ...datos, rol })).data;
      finalizar(res);
    },
    [finalizar]
  );

  const loginWithProvider = useCallback(
    async (provider: OAuthProvider, rol: UserRole) => {
      const res = USE_MOCKS
        ? await mockAuth(rol)
        : (await api.post<AuthResponse>(`/auth/oauth/${provider}`, { rol })).data;
      finalizar(res);
    },
    [finalizar]
  );

  const logout = useCallback(() => {
    const rol = user?.rol ?? 'cliente';
    storeLogout();
    clearSession();
    router.replace(LOGIN_PATH[rol]);
  }, [router, storeLogout, user?.rol]);

  return { user, isAuthenticated, login, register, loginWithProvider, logout };
}
