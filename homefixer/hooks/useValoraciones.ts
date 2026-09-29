'use client';

import api, { USE_MOCKS } from '@/lib/api';
import type { Valoracion } from '@/lib/types';
import { delay } from '@/lib/utils';

// ============================================================
// Valoraciones — microservicio de valoraciones
// ============================================================
//   POST /valoraciones { solicitudId, calificacion, comentario } → Valoracion

export interface ValoracionInput {
  solicitudId: string;
  calificacion: number;
  comentario?: string;
}

export async function enviarValoracion(input: ValoracionInput): Promise<Valoracion> {
  if (!USE_MOCKS) return (await api.post<Valoracion>('/valoraciones', input)).data;
  await delay(700);
  return {
    ...input,
    id: `val-${Date.now()}`,
    clienteId: 'cliente-001',
    tecnicoId: 'tecnico-001',
    creadoEn: new Date().toISOString(),
  };
}
