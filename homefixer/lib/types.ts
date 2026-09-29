// ============================================================
// TIPOS GLOBALES DE HOMEFIXER
// ============================================================

export type UserRole = 'cliente' | 'tecnico';

export interface User {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  avatarUrl?: string;
  rol: UserRole;
  creadoEn: string;
}

export interface Tecnico extends User {
  especialidad: string;
  calificacion: number;
  totalValoraciones: number;
  disponible: boolean;
  distanciaKm?: number;
  precioBase: number;
  descripcion?: string;
  trabajosCompletados: number;
  esMaestro?: boolean;
}

export type EstadoSolicitud =
  | 'pendiente'
  | 'aceptada'
  | 'en_progreso'
  | 'completada'
  | 'cancelada';

export type CategoriaServicio =
  | 'plomeria'
  | 'electricidad'
  | 'carpinteria'
  | 'pintura'
  | 'cerrajeria'
  | 'limpieza'
  | 'jardineria'
  | 'refrigeracion'
  | 'otros';

export type NivelUrgencia = 'normal' | 'urgente' | 'emergencia';

export interface Solicitud {
  id: string;
  clienteId: string;
  clienteNombre?: string;
  tecnicoId?: string;
  tecnico?: Tecnico;
  categoria: CategoriaServicio;
  urgencia: NivelUrgencia;
  descripcion: string;
  direccion: string;
  latitud?: number;
  longitud?: number;
  estado: EstadoSolicitud;
  presupuestoEstimado?: number;
  creadoEn: string;
  actualizadoEn: string;
  imagenes?: string[];
}

export interface Mensaje {
  id: string;
  solicitudId: string;
  remitenteId: string;
  remitenteNombre: string;
  esCliente: boolean;
  texto: string;
  creadoEn: string;
}

export type MetodoPago = 'tarjeta' | 'efectivo' | 'transferencia' | 'paypal';
export type EstadoPago = 'pendiente' | 'procesando' | 'completado' | 'fallido';

export interface Pago {
  id: string;
  solicitudId: string;
  clienteId: string;
  tecnicoId: string;
  monto: number;
  metodoPago: MetodoPago;
  estado: EstadoPago;
  descripcion: string;
  creadoEn: string;
}

export interface Valoracion {
  id: string;
  solicitudId: string;
  clienteId: string;
  tecnicoId: string;
  calificacion: number; // 1-5
  comentario?: string;
  creadoEn: string;
}

export interface ServicioPopular {
  id: string;
  nombre: string;
  categoria: CategoriaServicio;
  emoji: string;
  descripcion: string;
  precioDesde: number;
}

export interface EstadisticasTecnico {
  trabajosHoy: number;
  gananciasSemana: number;
  calificacion: number;
  trabajosCompletados: number;
  /** Ganancias por día de la semana (lun → dom) */
  gananciasPorDia: { dia: string; monto: number }[];
}

export interface Notificacion {
  id: string;
  titulo: string;
  detalle: string;
  creadoEn: string;
  leida: boolean;
}

/** Credenciales de acceso (payload de POST /auth/login) */
export interface Credenciales {
  email: string;
  password: string;
}

/** Datos de registro (payload de POST /auth/register) */
export interface DatosRegistro extends Credenciales {
  nombre: string;
  apellido: string;
}

/** Payload de POST /solicitudes */
export interface NuevaSolicitudInput {
  categoria: CategoriaServicio;
  urgencia: NivelUrgencia;
  direccion: string;
  descripcion: string;
}
