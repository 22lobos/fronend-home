'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import api, { USE_MOCKS } from '@/lib/api';
import { mockDb } from '@/lib/mock-db';
import type { Mensaje } from '@/lib/types';
import { delay } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from './useQuery';

// ============================================================
// useChat — microservicio de chat
// ============================================================
//   GET  /chat/:solicitudId/mensajes → Mensaje[]
//   POST /chat/:solicitudId/mensajes { texto } → Mensaje
// Para tiempo real, suscribirse aquí al WebSocket/SSE del servicio y
// agregar los mensajes entrantes con setNuevos.

const RESPUESTAS_MOCK = [
  'Entendido, lo reviso en cuanto llegue.',
  'Perfecto, gracias por avisar.',
  'Sí, llevo el material necesario.',
];

export function useChat(solicitudId: string | undefined) {
  const user = useAuthStore((s) => s.user);
  const [nuevos, setNuevos] = useState<Mensaje[]>([]);
  const [escribiendo, setEscribiendo] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const query = useQuery<Mensaje[]>(solicitudId ? `chat:${solicitudId}` : null, async () => {
    if (USE_MOCKS) {
      await delay(500);
      return mockDb.mensajes.filter((m) => m.solicitudId === solicitudId);
    }
    return (await api.get<Mensaje[]>(`/chat/${solicitudId}/mensajes`)).data;
  });

  useEffect(() => {
    const pendientes = timers.current;
    return () => pendientes.forEach(clearTimeout);
  }, []);

  const enviar = useCallback(
    async (texto: string) => {
      if (!solicitudId || !texto.trim()) return;
      const esCliente = user?.rol !== 'tecnico';
      const mensaje: Mensaje = {
        id: `msg-${Date.now()}`,
        solicitudId,
        remitenteId: user?.id ?? 'cliente-001',
        remitenteNombre: user ? `${user.nombre} ${user.apellido}` : 'Tú',
        esCliente,
        texto: texto.trim(),
        creadoEn: new Date().toISOString(),
      };
      setNuevos((prev) => [...prev, mensaje]);

      if (!USE_MOCKS) {
        await api.post(`/chat/${solicitudId}/mensajes`, { texto: mensaje.texto });
        return;
      }

      mockDb.mensajes.push(mensaje);
      // Respuesta simulada de la otra parte
      setEscribiendo(true);
      timers.current.push(
        setTimeout(() => {
          const respuesta: Mensaje = {
            id: `msg-${Date.now()}`,
            solicitudId,
            remitenteId: esCliente ? 'tecnico-001' : 'cliente-001',
            remitenteNombre: esCliente ? 'Carlos Ramírez' : 'María González',
            esCliente: !esCliente,
            texto: RESPUESTAS_MOCK[Math.floor(Math.random() * RESPUESTAS_MOCK.length)],
            creadoEn: new Date().toISOString(),
          };
          mockDb.mensajes.push(respuesta);
          setNuevos((prev) => [...prev, respuesta]);
          setEscribiendo(false);
        }, 1600)
      );
    },
    [solicitudId, user]
  );

  const iniciales = query.data ?? [];
  const idsIniciales = new Set(iniciales.map((m) => m.id));

  return {
    mensajes: [...iniciales, ...nuevos.filter((m) => !idsIniciales.has(m.id))],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    escribiendo,
    enviar,
  };
}
