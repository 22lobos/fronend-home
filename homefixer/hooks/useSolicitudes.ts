'use client';

import api, { USE_MOCKS } from '@/lib/api';
import { findSolicitud, findTecnico, mockDb, updateSolicitud } from '@/lib/mock-db';
import type { NuevaSolicitudInput, Solicitud } from '@/lib/types';
import { delay } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from './useQuery';

// ============================================================
// useSolicitudes — microservicio de solicitudes
// ============================================================
//   GET   /solicitudes/mias              → Solicitud[] (cliente)
//   GET   /solicitudes/disponibles       → Solicitud[] (técnico)
//   GET   /solicitudes/:id               → Solicitud
//   POST  /solicitudes                   → Solicitud
//   POST  /solicitudes/:id/asignar       { tecnicoId }
//   POST  /solicitudes/:id/aceptar | /rechazar | /iniciar | /finalizar

/** Solicitudes del cliente autenticado */
export function useMisSolicitudes() {
  const clienteId = useAuthStore((s) => s.user?.id ?? 'cliente-001');
  return useQuery<Solicitud[]>(`mis-solicitudes:${clienteId}`, async () => {
    if (USE_MOCKS) {
      await delay(600);
      return mockDb.solicitudes
        .filter((s) => s.clienteId === clienteId)
        .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
    }
    return (await api.get<Solicitud[]>('/solicitudes/mias')).data;
  });
}

/** Solicitudes pendientes que un técnico puede aceptar */
export function useSolicitudesDisponibles() {
  return useQuery<Solicitud[]>('solicitudes-disponibles', async () => {
    if (USE_MOCKS) {
      await delay(700);
      return mockDb.solicitudes.filter(
        (s) => s.estado === 'pendiente' && s.clienteId !== 'cliente-001' && !mockDb.rechazadas.has(s.id)
      );
    }
    return (await api.get<Solicitud[]>('/solicitudes/disponibles')).data;
  });
}

/** Trabajos asignados al técnico autenticado */
export function useMisTrabajos() {
  const tecnicoId = useAuthStore((s) => s.user?.id ?? 'tecnico-001');
  return useQuery<Solicitud[]>(`mis-trabajos:${tecnicoId}`, async () => {
    if (USE_MOCKS) {
      await delay(600);
      return mockDb.solicitudes.filter((s) => s.tecnicoId === tecnicoId);
    }
    return (await api.get<Solicitud[]>('/solicitudes/asignadas')).data;
  });
}

export function useSolicitud(id: string | undefined) {
  return useQuery<Solicitud>(id ? `solicitud:${id}` : null, async () => {
    if (USE_MOCKS) {
      await delay(500);
      const s = findSolicitud(id!);
      if (!s) throw new Error('No encontramos esta solicitud.');
      return s;
    }
    return (await api.get<Solicitud>(`/solicitudes/${id}`)).data;
  });
}

// ---------- Mutaciones ----------

export async function crearSolicitud(input: NuevaSolicitudInput, clienteId: string, clienteNombre: string) {
  if (!USE_MOCKS) return (await api.post<Solicitud>('/solicitudes', input)).data;
  await delay(800);
  const ahora = new Date().toISOString();
  const nueva: Solicitud = {
    ...input,
    id: `sol-${Date.now()}`,
    clienteId,
    clienteNombre,
    estado: 'pendiente',
    creadoEn: ahora,
    actualizadoEn: ahora,
  };
  mockDb.solicitudes = [nueva, ...mockDb.solicitudes];
  return nueva;
}

/** El cliente elige un técnico para su solicitud */
export async function asignarTecnico(solicitudId: string, tecnicoId: string) {
  if (!USE_MOCKS) return (await api.post<Solicitud>(`/solicitudes/${solicitudId}/asignar`, { tecnicoId })).data;
  await delay(600);
  const tecnico = findTecnico(tecnicoId);
  return updateSolicitud(solicitudId, {
    tecnicoId,
    tecnico,
    estado: 'aceptada',
    presupuestoEstimado: findSolicitud(solicitudId)?.presupuestoEstimado ?? tecnico?.precioBase,
  });
}

export async function aceptarSolicitud(id: string, tecnicoId: string) {
  if (!USE_MOCKS) return (await api.post<Solicitud>(`/solicitudes/${id}/aceptar`)).data;
  await delay(500);
  return updateSolicitud(id, { estado: 'aceptada', tecnicoId, tecnico: findTecnico(tecnicoId) });
}

export async function rechazarSolicitud(id: string) {
  if (!USE_MOCKS) {
    await api.post(`/solicitudes/${id}/rechazar`);
    return;
  }
  await delay(300);
  mockDb.rechazadas.add(id);
}

export async function iniciarTrabajo(id: string) {
  if (!USE_MOCKS) return (await api.post<Solicitud>(`/solicitudes/${id}/iniciar`)).data;
  await delay(400);
  return updateSolicitud(id, { estado: 'en_progreso' });
}

export async function finalizarTrabajo(id: string, notas: string) {
  if (!USE_MOCKS) return (await api.post<Solicitud>(`/solicitudes/${id}/finalizar`, { notas })).data;
  await delay(800);
  return updateSolicitud(id, { estado: 'completada' });
}
