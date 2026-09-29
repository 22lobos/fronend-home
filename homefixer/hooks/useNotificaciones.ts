'use client';

import api, { USE_MOCKS } from '@/lib/api';
import { mockNotificaciones } from '@/lib/mock-data';
import type { Notificacion } from '@/lib/types';
import { delay } from '@/lib/utils';
import { useQuery } from './useQuery';

//   GET /notificaciones → Notificacion[]
export function useNotificaciones(enabled: boolean) {
  return useQuery<Notificacion[]>(enabled ? 'notificaciones' : null, async () => {
    if (USE_MOCKS) {
      await delay(400);
      return mockNotificaciones;
    }
    return (await api.get<Notificacion[]>('/notificaciones')).data;
  });
}
