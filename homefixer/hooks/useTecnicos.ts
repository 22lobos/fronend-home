'use client';

import api, { USE_MOCKS } from '@/lib/api';
import { mockEstadisticas, mockTecnicos } from '@/lib/mock-data';
import type { CategoriaServicio, EstadisticasTecnico, Tecnico } from '@/lib/types';
import { CATEGORIA_LABELS, delay } from '@/lib/utils';
import { useQuery } from './useQuery';

// ============================================================
// useTecnicos — microservicio de técnicos
// ============================================================
//   GET /tecnicos/disponibles?categoria=  → Tecnico[]
//   GET /tecnicos/me/estadisticas         → EstadisticasTecnico
//   PATCH /tecnicos/me/disponibilidad     { disponible }

export function useTecnicosDisponibles(categoria?: CategoriaServicio | null) {
  return useQuery<Tecnico[]>(`tecnicos:${categoria ?? 'todos'}`, async () => {
    if (USE_MOCKS) {
      await delay(700);
      const lista = categoria
        ? mockTecnicos.filter((t) => t.especialidad === CATEGORIA_LABELS[categoria])
        : mockTecnicos;
      return [...lista].sort((a, b) => (a.distanciaKm ?? 0) - (b.distanciaKm ?? 0));
    }
    return (await api.get<Tecnico[]>('/tecnicos/disponibles', { params: { categoria } })).data;
  });
}

export function useEstadisticasTecnico() {
  return useQuery<EstadisticasTecnico>('estadisticas-tecnico', async () => {
    if (USE_MOCKS) {
      await delay(600);
      return mockEstadisticas;
    }
    return (await api.get<EstadisticasTecnico>('/tecnicos/me/estadisticas')).data;
  });
}

export async function actualizarDisponibilidad(disponible: boolean) {
  if (USE_MOCKS) return delay(200);
  await api.patch('/tecnicos/me/disponibilidad', { disponible });
}
