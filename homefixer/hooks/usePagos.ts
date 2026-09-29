'use client';

import api, { USE_MOCKS } from '@/lib/api';
import { mockPago } from '@/lib/mock-data';
import { findSolicitud, mockDb } from '@/lib/mock-db';
import type { MetodoPago, Pago } from '@/lib/types';
import { delay } from '@/lib/utils';
import { useQuery } from './useQuery';

// ============================================================
// usePagos — microservicio de pagos
// ============================================================
//   GET  /pagos/solicitud/:solicitudId → Pago (pendiente de cobro)
//   POST /pagos/:id/procesar { metodoPago } → Pago
//   GET  /pagos/mios → Pago[]

/** Comisión de la plataforma aplicada sobre el costo del servicio */
export const COMISION_SERVICIO = 0.05;

export function usePagoDeSolicitud(solicitudId: string | undefined) {
  return useQuery<Pago>(solicitudId ? `pago:${solicitudId}` : null, async () => {
    if (USE_MOCKS) {
      await delay(500);
      const sol = findSolicitud(solicitudId!);
      if (!sol) throw new Error('No encontramos el servicio a pagar.');
      return {
        ...mockPago,
        id: `pago-${sol.id}`,
        solicitudId: sol.id,
        tecnicoId: sol.tecnicoId ?? mockPago.tecnicoId,
        monto: sol.presupuestoEstimado ?? mockPago.monto,
      };
    }
    return (await api.get<Pago>(`/pagos/solicitud/${solicitudId}`)).data;
  });
}

export function useHistorialPagos() {
  return useQuery<Pago[]>('pagos-historial', async () => {
    if (USE_MOCKS) {
      await delay(600);
      return mockDb.solicitudes
        .filter((s) => s.clienteId === 'cliente-001' && s.estado === 'completada')
        .map((s) => ({
          ...mockPago,
          id: `pago-${s.id}`,
          solicitudId: s.id,
          monto: s.presupuestoEstimado ?? 0,
          estado: 'completado' as const,
          descripcion: s.descripcion,
          creadoEn: s.actualizadoEn,
        }));
    }
    return (await api.get<Pago[]>('/pagos/mios')).data;
  });
}

export async function procesarPago(pagoId: string, metodoPago: MetodoPago): Promise<Pago> {
  if (!USE_MOCKS) return (await api.post<Pago>(`/pagos/${pagoId}/procesar`, { metodoPago })).data;
  await delay(1500);
  return { ...mockPago, id: pagoId, metodoPago, estado: 'completado' };
}
