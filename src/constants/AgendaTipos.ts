import type { CitaConfirmadaData } from '../components/VistaAgendarCliente';

/* =====================================================================
 * AgendaTipos.ts · Modelo de datos compartido
 * ===================================================================== */

/* ---------- Equipo de barberos (ids estables) ---------- */

export interface BarberoEquipo {
  id: string;
  nombre: string;
  nombreCompleto: string;
}

export const EQUIPO_BARBEROS: BarberoEquipo[] = [
  { id: 'b1', nombre: 'Carlos R.', nombreCompleto: 'Carlos Mendoza' },
  { id: 'b2', nombre: 'Diego M.', nombreCompleto: 'Diego Ramírez' },
  { id: 'b3', nombre: 'Andrés M.', nombreCompleto: 'Andrés Morales' },
  { id: 'b4', nombre: 'Mateo S.', nombreCompleto: 'Mateo Silva' },
];

/* ---------- Citas ---------- */

export type EstadoCita =
  | 'PROGRAMADA'
  | 'CONFIRMADA'
  | 'LLEGO'
  | 'EN_SERVICIO'
  | 'POR_COBRAR'
  | 'TERMINADA'
  | 'CANCELADA';

export const ETIQUETA_ESTADO: Record<EstadoCita, string> = {
  PROGRAMADA: 'Programada',
  CONFIRMADA: 'Confirmada',
  LLEGO: 'Llegó',
  EN_SERVICIO: 'En corte',
  POR_COBRAR: 'Listo p/ cobrar',
  TERMINADA: 'Terminada',
  CANCELADA: 'Cancelada',
};

/** Estados en los que el cliente todavía no se ha atendido. */
export const ESTADOS_POR_ATENDER: EstadoCita[] = ['PROGRAMADA', 'CONFIRMADA', 'LLEGO'];

export type OrigenCita = 'CLIENTE' | 'RECEPCION' | 'WALK_IN';

export interface CitaEquipo {
  id: string;
  folio: string;
  fechaISO: string;
  hora24: number;
  minuto: number;
  horaTexto: string;
  duracionMin: number;
  clienteId: string;
  clienteNombre: string;
  telefono: string;
  servicio: string;
  precio: number;
  barberoId: string;
  barberoNombre: string;
  sucursal: string;
  estado: EstadoCita;
  origen: OrigenCita;
  notasCliente: string;
  fotoUri?: string;
  notasTecnicas: string;
  terminadaEn?: string;
}

/* ---------- Ficha del cliente ---------- */

export interface HistorialCorte {
  fechaISO: string;
  servicio: string;
  barberoNombre: string;
  total: number;
  notas: string;
}

export interface FichaCliente {
  clienteId: string;
  nombre: string;
  telefono: string;
  visitas: number;
  ultimaVisitaISO?: string;
  sellos: number;
  notasUltimoCorte: string;
  maquinaPreferida?: string;
  productosFrecuentes: string[];
  alertas: string[];
  historial: HistorialCorte[];
}

/* ---------- Órdenes de servicio (barbero -> caja) ---------- */

export type TipoLineaOrden = 'SERVICIO' | 'EXTRA' | 'PRODUCTO';

export interface LineaOrdenServicio {
  id: string;
  tipo: TipoLineaOrden;
  nombre: string;
  precio: number;
  cantidad: number;
}

export type EstadoOrden = 'ENVIADA_A_CAJA' | 'COBRADA' | 'CANCELADA';

export interface OrdenServicio {
  folio: string;
  citaId: string;
  clienteId: string;
  clienteNombre: string;
  barberoId: string;
  barberoNombre: string;
  sucursal: string;
  creadaEnISO: string;
  lineas: LineaOrdenServicio[];
  subtotal: number;
  notasCorte: string;
  estado: EstadoOrden;
  propina?: number;
  metodoPago?: string;
  cobradaEnISO?: string;
}

/* ---------- Utilidades de fecha y texto ---------- */

const pad = (n: number) => String(n).padStart(2, '0');

export const claveDia = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const hoyISO = (ahora: Date = new Date()): string => claveDia(ahora);

export function fechaDesdeClave(clave: string): Date {
  const [y, m, d] = clave.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function inicioDeSemanaISO(clave: string): string {
  const d = fechaDesdeClave(clave);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return claveDia(d);
}

export const normalizarSucursal = (s: string): string => s.replace(/^sucursal\s+/i, '').trim();

export function horaTextoDe(hora24: number, minuto = 0): string {
  const h12 = hora24 % 12 === 0 ? 12 : hora24 % 12;
  return `${pad(h12)}:${pad(minuto)} ${hora24 < 12 ? 'AM' : 'PM'}`;
}

export const minutosDelDia = (c: Pick<CitaEquipo, 'hora24' | 'minuto'>): number => c.hora24 * 60 + c.minuto;

/* ---------- Conversión: cita del cliente -> cita del equipo ---------- */

export function citaDeCliente(data: CitaConfirmadaData, clienteId: string, telefono = ''): CitaEquipo {
  const duracion = parseInt(data.servicio.duracion, 10);
  return {
    id: `cita-${data.folio}`,
    folio: data.folio,
    fechaISO: data.fechaISO,
    hora24: data.hora24,
    minuto: 0,
    horaTexto: data.horaTexto,
    duracionMin: Number.isFinite(duracion) ? duracion : 45,
    clienteId,
    clienteNombre: data.clienteNombre,
    telefono,
    servicio: data.servicio.titulo,
    precio: data.servicio.precio,
    barberoId: data.barbero.id,
    barberoNombre: data.barbero.nombre,
    sucursal: normalizarSucursal(data.sucursal),
    estado: 'CONFIRMADA',
    origen: 'CLIENTE',
    notasCliente: data.notas ?? '',
    fotoUri: data.fotoUri,
    notasTecnicas: '',
  };
}

/* ---------- Métricas del barbero (para el Inicio) ---------- */

export interface ResumenBarbero {
  citasHoy: number;
  atendidosHoy: number;
  atendidosSemana: number;
  atendidosTotal: number;
  enSilla: number;
  porAtender: number;
  actual: CitaEquipo | null;
  siguiente: CitaEquipo | null;
}

export function resumenBarbero(citas: CitaEquipo[], barberoId: string, hoy: string = hoyISO()): ResumenBarbero {
  const mias = citas.filter((c) => c.barberoId === barberoId && c.estado !== 'CANCELADA');
  const deHoy = mias.filter((c) => c.fechaISO === hoy).sort((a, b) => minutosDelDia(a) - minutosDelDia(b));
  const lunes = inicioDeSemanaISO(hoy);
  const completadas = mias.filter((c) => c.estado === 'TERMINADA' || c.estado === 'POR_COBRAR');

  const porAtender = deHoy.filter((c) => ESTADOS_POR_ATENDER.includes(c.estado));

  return {
    citasHoy: deHoy.length,
    atendidosHoy: deHoy.filter((c) => c.estado === 'TERMINADA' || c.estado === 'POR_COBRAR').length,
    atendidosSemana: completadas.filter((c) => c.fechaISO >= lunes && c.fechaISO <= hoy).length,
    atendidosTotal: completadas.length,
    enSilla: deHoy.filter((c) => c.estado === 'EN_SERVICIO').length,
    porAtender: porAtender.length,
    actual: deHoy.find((c) => c.estado === 'EN_SERVICIO') ?? null,
    siguiente: porAtender[0] ?? null,
  };
}