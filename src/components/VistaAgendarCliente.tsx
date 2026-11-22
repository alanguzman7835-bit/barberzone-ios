import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { BzTypography, useBzTheme } from '../constants/BzTheme';
import ComprobantePedidoCard from './ComprobantePedidoCard';

/* =====================================================================
   Iconos de línea
   ===================================================================== */

type NombreIcono =
  | 'atras'
  | 'izq'
  | 'der'
  | 'calendario'
  | 'reloj'
  | 'check'
  | 'estrella'
  | 'ticket'
  | 'pin'
  | 'bolsa'
  | 'camara'
  | 'cerrar';

function Icono({ nombre, size = 20, color }: { nombre: NombreIcono; size?: number; color: string }) {
  const p = {
    stroke: color,
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {nombre === 'atras' && (
        <>
          <Line x1={19} y1={12} x2={5} y2={12} {...p} />
          <Path d="M11 6L5 12L11 18" {...p} />
        </>
      )}
      {nombre === 'izq' && <Path d="M15 6L9 12L15 18" {...p} />}
      {nombre === 'der' && <Path d="M9 6L15 12L9 18" {...p} />}
      {nombre === 'calendario' && (
        <>
          <Rect x={3} y={4} width={18} height={17} rx={2.5} {...p} />
          <Line x1={3} y1={9.5} x2={21} y2={9.5} {...p} />
          <Line x1={8} y1={2.5} x2={8} y2={5.5} {...p} />
          <Line x1={16} y1={2.5} x2={16} y2={5.5} {...p} />
        </>
      )}
      {nombre === 'reloj' && (
        <>
          <Circle cx={12} cy={12} r={9} {...p} />
          <Path d="M12 7v5l3 2" {...p} />
        </>
      )}
      {nombre === 'check' && <Path d="M5 13l4 4L19 7" {...p} />}
      {nombre === 'estrella' && (
        <Path
          d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3z"
          {...p}
        />
      )}
      {nombre === 'ticket' && (
        <>
          <Path
            d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6z"
            {...p}
          />
          <Line x1={12} y1={5} x2={12} y2={19} strokeDasharray="2 2" {...p} />
        </>
      )}
      {nombre === 'pin' && (
        <>
          <Path d="M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10z" {...p} />
          <Circle cx={12} cy={11} r={2} {...p} />
        </>
      )}
      {nombre === 'bolsa' && (
        <>
          <Path d="M6 7H18L19 20H5L6 7Z" {...p} />
          <Path d="M9 7V5C9 3.34 10.34 2 12 2C13.66 2 15 3.34 15 5V7" {...p} />
        </>
      )}
      {nombre === 'camara' && (
        <>
          <Path
            d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"
            {...p}
          />
          <Circle cx={12} cy={13} r={3.5} {...p} />
        </>
      )}
      {nombre === 'cerrar' && (
        <>
          <Line x1={6} y1={6} x2={18} y2={18} {...p} />
          <Line x1={18} y1={6} x2={6} y2={18} {...p} />
        </>
      )}
    </Svg>
  );
}

/* =====================================================================
   Tipos (se exportan: los usan MenuPrincipal y VistaInicioCliente)
   ===================================================================== */

export type ServicioItem = {
  id: string;
  titulo: string;
  subtitulo: string;
  duracion: string;
  precio: number;
  imagen?: ImageSourcePropType;
};

export type BarberoItem = {
  id: string;
  nombre: string;
  especialidad: string;
  calificacion: string;
  diasLaborales: number[]; // 0 = Dom, 1 = Lun ... 6 = Sáb
  /** Horas ocupadas por fecha ('YYYY-MM-DD') o con la clave 'hoy'. */
  horasOcupadas?: Record<string, string[]>;
};

export type CitaConfirmadaData = {
  folio: string;
  servicio: ServicioItem;
  barbero: BarberoItem;
  fechaTexto: string;
  horaTexto: string;
  clienteNombre: string;
  sucursal: string;
  creadaEn: string;
  /** Fecha de la cita en formato 'YYYY-MM-DD' (la usa el calendario). */
  fechaISO: string;
  /** Hora de inicio en formato 24 h. */
  hora24: number;
  /** Descripción que escribió el cliente (opcional). */
  notas?: string;
  /** Foto de referencia del corte (opcional). */
  fotoUri?: string;
};

export type LineaPedido = {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
};

export type PedidoApartadoData = {
  folio: string;
  lineas: LineaPedido[];
  total: number;
  sucursal: string;
  creadoEn: string;
};

type Props = {
  nombreCliente?: string;
  sucursalNombre?: string;
  servicios?: ServicioItem[];
  barberos?: BarberoItem[];
  /** Todas las citas del cliente (viene del estado de MainAppShell). */
  citasActivas?: CitaConfirmadaData[];
  /** Pedidos apartados en la tienda, pendientes por recoger. */
  pedidosPendientes?: PedidoApartadoData[];
  onCitaConfirmada?: (cita: CitaConfirmadaData, resumenCorto: string) => void;
  onIrTienda?: () => void;
  onVolverInicio?: () => void;
  aplicarSafeArea?: boolean;
  espacioInferior?: number;
};

/* =====================================================================
   Datos base
   ===================================================================== */

const SERVICIOS_DEMO: ServicioItem[] = [
  {
    id: 'srv-1',
    titulo: 'Corte de pelo',
    subtitulo: 'Fade, crop, clásico o tijera con lavado y peinado incluido',
    duracion: '40 min',
    precio: 220,
  },
  {
    id: 'srv-2',
    titulo: 'Arreglo de barba',
    subtitulo: 'Perfilado a navaja, toalla caliente y aceite hidratante',
    duracion: '30 min',
    precio: 160,
  },
  {
    id: 'srv-3',
    titulo: 'Corte + Barba',
    subtitulo: 'Servicio completo de cabello y diseño de barba con vaporizador',
    duracion: '60 min',
    precio: 340,
  },
  {
    id: 'srv-4',
    titulo: 'Afeitado de barba',
    subtitulo: 'Ritual tradicional al ras con espuma caliente y bálsamo calmante',
    duracion: '35 min',
    precio: 180,
  },
];

const BARBEROS_DEMO: BarberoItem[] = [
  {
    id: 'b1',
    nombre: 'Carlos Mendoza',
    especialidad: 'Especialista en Fade & Crop',
    calificacion: '4.9',
    diasLaborales: [0, 1, 2, 3, 4, 5, 6],
    horasOcupadas: { hoy: ['12:00 PM'] },
  },
  {
    id: 'b2',
    nombre: 'Diego Ramírez',
    especialidad: 'Barba clásica & Navaja',
    calificacion: '4.8',
    diasLaborales: [0, 1, 2, 3, 4, 5, 6],
    horasOcupadas: { hoy: ['02:00 PM'] },
  },
  {
    id: 'b3',
    nombre: 'Andrés Morales',
    especialidad: 'Cortes a tijera & Textura',
    calificacion: '5.0',
    diasLaborales: [0, 2, 3, 4, 5, 6],
    horasOcupadas: { hoy: ['05:00 PM'] },
  },
  {
    id: 'b4',
    nombre: 'Mateo Silva',
    especialidad: 'Freestyle & Diseño',
    calificacion: '4.9',
    diasLaborales: [0, 1, 3, 4, 5, 6],
    horasOcupadas: { hoy: ['11:00 AM'] },
  },
];

const HORARIOS_BASE = [
  { label: '10:00 AM', hora24: 10 },
  { label: '11:00 AM', hora24: 11 },
  { label: '12:00 PM', hora24: 12 },
  { label: '01:00 PM', hora24: 13 },
  { label: '02:00 PM', hora24: 14 },
  { label: '03:00 PM', hora24: 15 },
  { label: '04:00 PM', hora24: 16 },
  { label: '05:00 PM', hora24: 17 },
  { label: '06:00 PM', hora24: 18 },
  { label: '07:00 PM', hora24: 19 },
];

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_SEMANA_LARGO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_LARGO = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
const DIAS_CALENDARIO = ['L', 'M', 'M', 'J', 'V', 'S', 'D']; // semana empieza en lunes

const SIN_CITAS: CitaConfirmadaData[] = [];
const SIN_PEDIDOS: PedidoApartadoData[] = [];

/* =====================================================================
   Utilidades
   ===================================================================== */

const mxn = (n: number) => `$${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

const pad = (n: number) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' en hora local (evita el desfase de toISOString). */
function claveDia(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fechaDesdeClave(clave: string): Date {
  const [y, m, d] = clave.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function claveHoy(offsetDias = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  return claveDia(d);
}

function etiquetaDiaLarga(clave: string): string {
  const d = fechaDesdeClave(clave);
  const base = `${DIAS_SEMANA_LARGO[d.getDay()]} ${d.getDate()} de ${MESES_LARGO[d.getMonth()].toLowerCase()}`;
  return clave === claveHoy() ? `Hoy · ${base}` : base;
}

function fechaHoraCita(c: CitaConfirmadaData): Date {
  const d = fechaDesdeClave(c.fechaISO);
  d.setHours(c.hora24, 0, 0, 0);
  return d;
}

export function citasOrdenadas(citas: CitaConfirmadaData[]): CitaConfirmadaData[] {
  return [...citas].sort((a, b) => fechaHoraCita(a).getTime() - fechaHoraCita(b).getTime());
}

/** Citas que aún no pasan (se conserva una hora de gracia después de iniciar). */
export function citasPendientesOrdenadas(
  citas: CitaConfirmadaData[],
  ahora: Date = new Date(),
): CitaConfirmadaData[] {
  const limite = ahora.getTime() - 60 * 60 * 1000;
  return citasOrdenadas(citas).filter((c) => fechaHoraCita(c).getTime() >= limite);
}

function obtenerIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return 'BZ';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
}

function nuevoFolio(existentes: string[]): string {
  let folio = '';
  do {
    folio = `BZ-${Math.floor(1000 + Math.random() * 9000)}`;
  } while (existentes.includes(folio));
  return folio;
}

/** Barras del "código de verificación": siempre iguales para el mismo folio. */
function barrasDeFolio(folio: string): number[] {
  const base = folio.replace(/\D/g, '').padEnd(4, '0');
  const barras: number[] = [];
  for (let i = 0; i < 22; i++) {
    const d = Number(base[i % base.length]);
    barras.push(((d + i * 3) % 4) + 1);
  }
  return barras;
}

type DiaAgenda = {
  key: string; // 'YYYY-MM-DD'
  esHoy: boolean;
  etiquetaTop: string;
  numeroDia: string;
  mesTexto: string;
  fechaCompleta: string;
  diaSemana: number;
};

function generarProximosDias(cantidad = 7): DiaAgenda[] {
  const hoy = new Date();
  const ultimaHora = HORARIOS_BASE[HORARIOS_BASE.length - 1].hora24;
  // Si ya pasó el último horario del día, "Hoy" no se ofrece
  const empezarManana = hoy.getHours() >= ultimaHora;
  const lista: DiaAgenda[] = [];
  for (let i = empezarManana ? 1 : 0; lista.length < cantidad; i++) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + i);
    const diaSem = d.getDay();
    const num = String(d.getDate());
    const mes = MESES[d.getMonth()];
    lista.push({
      key: claveDia(d),
      esHoy: i === 0,
      etiquetaTop: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : DIAS_SEMANA[diaSem],
      numeroDia: num,
      mesTexto: mes,
      fechaCompleta: i === 0 ? `Hoy, ${num} ${mes}` : `${DIAS_SEMANA[diaSem]} ${num} ${mes}`,
      diaSemana: diaSem,
    });
  }
  return lista;
}

/**
 * expo-image-picker es opcional: si no está instalado, la app sigue funcionando.
 * Para activarlo:  npx expo install expo-image-picker
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cargarImagePicker(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-image-picker');
  } catch {
    return null;
  }
}

/* =====================================================================
   Comprobante / Pase oficial (reutilizable: lo usa también VistaInicioCliente)
   ===================================================================== */

export function ComprobanteCitaCard({
  cita,
  onCerrar,
  textoBotonPrincipal = 'Listo, volver al inicio',
  textoBotonSecundario,
  onSecundario,
}: {
  cita: CitaConfirmadaData;
  onCerrar: () => void;
  textoBotonPrincipal?: string;
  textoBotonSecundario?: string;
  onSecundario?: () => void;
}) {
  const { colors } = useBzTheme();
  const barras = useMemo(() => barrasDeFolio(cita.folio), [cita.folio]);

  return (
    <View style={[styles.paseCard, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
      {/* Encabezado del pase */}
      <View style={styles.paseTopRow}>
        <View style={[styles.paseBadgeOk, { backgroundColor: colors.BzText }]}>
          <Icono nombre="check" size={13} color={colors.BzBg} />
          <Text style={[styles.paseBadgeTexto, { color: colors.BzBg }]}>CITA CONFIRMADA</Text>
        </View>
        <Text style={[styles.paseFolio, { color: colors.BzMuted }]}>#{cita.folio}</Text>
      </View>

      <Text style={[styles.paseMarca, { color: colors.BzMuted }]}>PASE DE RECEPCIÓN · BARBERZONE</Text>
      <Text style={[styles.paseServicio, { color: colors.BzText }]}>{cita.servicio.titulo}</Text>

      {/* Línea punteada tipo boleto */}
      <View style={styles.paseDividerWrap}>
        <View style={[styles.paseMuescaIzq, { backgroundColor: colors.BzBg }]} />
        <View style={[styles.paseLineaPunteada, { borderColor: colors.BzBorder }]} />
        <View style={[styles.paseMuescaDer, { backgroundColor: colors.BzBg }]} />
      </View>

      <View style={styles.paseGrid}>
        <View style={styles.paseDatoBox}>
          <Text style={[styles.paseLabel, { color: colors.BzMuted }]}>BARBERO ASIGNADO</Text>
          <Text style={[styles.paseValor, { color: colors.BzText }]}>{cita.barbero.nombre}</Text>
        </View>
        <View style={styles.paseDatoBox}>
          <Text style={[styles.paseLabel, { color: colors.BzMuted }]}>CLIENTE</Text>
          <Text style={[styles.paseValor, { color: colors.BzText }]}>{cita.clienteNombre}</Text>
        </View>
      </View>

      <View style={[styles.paseGrid, { marginTop: 14 }]}>
        <View style={styles.paseDatoBox}>
          <Text style={[styles.paseLabel, { color: colors.BzMuted }]}>FECHA</Text>
          <Text style={[styles.paseValor, { color: colors.BzText }]}>{cita.fechaTexto}</Text>
        </View>
        <View style={styles.paseDatoBox}>
          <Text style={[styles.paseLabel, { color: colors.BzMuted }]}>HORA</Text>
          <Text style={[styles.paseValor, { color: colors.BzText }]}>{cita.horaTexto}</Text>
        </View>
      </View>

      <View style={[styles.paseGrid, { marginTop: 14 }]}>
        <View style={styles.paseDatoBox}>
          <Text style={[styles.paseLabel, { color: colors.BzMuted }]}>SUCURSAL</Text>
          <Text style={[styles.paseValor, { color: colors.BzText }]}>{cita.sucursal}</Text>
        </View>
        <View style={styles.paseDatoBox}>
          <Text style={[styles.paseLabel, { color: colors.BzMuted }]}>TOTAL ESTIMADO</Text>
          <Text style={[styles.paseValor, { color: colors.BzText }]}>{mxn(cita.servicio.precio)}</Text>
        </View>
      </View>

      {/* Notas y foto de referencia, si el cliente las agregó */}
      {!!cita.notas && (
        <View style={{ marginTop: 14 }}>
          <Text style={[styles.paseLabel, { color: colors.BzMuted }]}>DESCRIPCIÓN DEL CORTE</Text>
          <Text style={[styles.paseNotas, { color: colors.BzText }]}>{cita.notas}</Text>
        </View>
      )}
      {!!cita.fotoUri && (
        <View style={{ marginTop: 14 }}>
          <Text style={[styles.paseLabel, { color: colors.BzMuted }]}>FOTO DE REFERENCIA</Text>
          <Image
            source={{ uri: cita.fotoUri }}
            style={[styles.paseFoto, { backgroundColor: colors.BzCardInner }]}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Código visual de verificación para recepción */}
      <View style={[styles.paseCodigoBox, { backgroundColor: colors.BzBg, borderColor: colors.BzBorder }]}>
        <View style={styles.barrasRow}>
          {barras.map((w, idx) => (
            <View
              key={idx}
              style={{
                width: w,
                height: 28,
                backgroundColor: colors.BzText,
                opacity: idx % 3 === 0 ? 0.9 : 0.55,
              }}
            />
          ))}
        </View>
        <Text style={[styles.paseNotaRecepcion, { color: colors.BzMuted }]}>
          Muestra este pase en recepción al llegar · Notificado a {cita.barbero.nombre}
        </Text>
      </View>

      <Pressable
        onPress={onCerrar}
        style={({ pressed }) => [
          styles.botonPrimario,
          { backgroundColor: colors.BzText, marginTop: 18, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Text style={[styles.botonPrimarioTexto, { color: colors.BzBg }]}>{textoBotonPrincipal}</Text>
      </Pressable>

      {!!textoBotonSecundario && !!onSecundario && (
        <Pressable
          onPress={onSecundario}
          style={({ pressed }) => [
            styles.botonSecundario,
            { borderColor: colors.BzBorder, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '500' }}>
            {textoBotonSecundario}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

/* =====================================================================
   Vista 1 · piezas del Hub: filas y calendario interactivo
   ===================================================================== */

function FilaCitaPendiente({
  cita,
  onVerPase,
}: {
  cita: CitaConfirmadaData;
  onVerPase: () => void;
}) {
  const { colors } = useBzTheme();
  const d = fechaDesdeClave(cita.fechaISO);
  const esHoy = cita.fechaISO === claveHoy();
  const esManana = cita.fechaISO === claveHoy(1);
  const etiqueta = esHoy ? 'HOY' : esManana ? 'MAÑ' : DIAS_SEMANA[d.getDay()].toUpperCase();

  return (
    <View style={styles.filaCita}>
      <View style={[styles.fechaBloque, { backgroundColor: colors.BzCardInner, borderColor: colors.BzBorder }]}>
        <Text style={{ color: colors.BzMuted, fontSize: 9, fontWeight: '600', letterSpacing: 0.8 }}>
          {etiqueta}
        </Text>
        <Text style={{ color: colors.BzText, fontSize: 19, fontWeight: '600' }}>{d.getDate()}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
          {cita.servicio.titulo}
        </Text>
        <Text style={{ color: colors.BzMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
          {cita.horaTexto} · con {cita.barbero.nombre}
        </Text>
        <Text style={{ color: colors.BzMuted, fontSize: 11, marginTop: 2 }}>#{cita.folio}</Text>
      </View>

      <Pressable
        onPress={onVerPase}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Ver pase de la cita ${cita.folio}`}
        style={({ pressed }) => [
          styles.pillBtn,
          { backgroundColor: colors.BzText, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={{ color: colors.BzBg, fontSize: 11, fontWeight: '600' }}>Ver pase ›</Text>
      </Pressable>
    </View>
  );
}

function FilaPedidoPendiente({
  pedido,
  onVerTicket,
}: {
  pedido: PedidoApartadoData;
  onVerTicket: () => void;
}) {
  const { colors } = useBzTheme();
  const articulos = pedido.lineas.reduce((s, l) => s + l.cantidad, 0);
  const detalle = pedido.lineas
    .map((l) => `${l.nombre}${l.cantidad > 1 ? ` ×${l.cantidad}` : ''}`)
    .join(', ');

  return (
    <View style={styles.filaCita}>
      <View style={[styles.fechaBloque, { backgroundColor: colors.BzCardInner, borderColor: colors.BzBorder }]}>
        <Icono nombre="bolsa" size={22} color={colors.BzText} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
          Pedido #{pedido.folio} · {articulos} {articulos === 1 ? 'artículo' : 'artículos'}
        </Text>
        <Text style={{ color: colors.BzMuted, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
          {detalle}
        </Text>
        <Text style={{ color: colors.BzMuted, fontSize: 11, marginTop: 2 }}>
          {pedido.sucursal} · {mxn(pedido.total)}
        </Text>
      </View>

      <Pressable
        onPress={onVerTicket}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Ver ticket del pedido ${pedido.folio}`}
        style={({ pressed }) => [
          styles.pillBtn,
          { backgroundColor: colors.BzText, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={{ color: colors.BzBg, fontSize: 11, fontWeight: '600' }}>Ver ticket ›</Text>
      </Pressable>
    </View>
  );
}

function CalendarioCitas({
  citas,
  diaSel,
  onSelDia,
  mes,
  onMes,
  onVerPase,
}: {
  citas: CitaConfirmadaData[];
  diaSel: string;
  onSelDia: (clave: string) => void;
  mes: { y: number; m: number };
  onMes: (delta: number) => void;
  onVerPase: (cita: CitaConfirmadaData) => void;
}) {
  const { colors } = useBzTheme();
  const hoy = claveHoy();

  const porDia = useMemo(() => {
    const mapa = new Map<string, CitaConfirmadaData[]>();
    citas.forEach((c) => {
      const lista = mapa.get(c.fechaISO) ?? [];
      lista.push(c);
      mapa.set(c.fechaISO, lista);
    });
    mapa.forEach((lista) => lista.sort((a, b) => a.hora24 - b.hora24));
    return mapa;
  }, [citas]);

  // Celdas del mes: huecos al inicio (semana en lunes) + días
  const celdas = useMemo(() => {
    const primero = new Date(mes.y, mes.m, 1);
    const offset = (primero.getDay() + 6) % 7;
    const diasMes = new Date(mes.y, mes.m + 1, 0).getDate();
    const lista: (number | null)[] = [];
    for (let i = 0; i < offset; i++) lista.push(null);
    for (let d = 1; d <= diasMes; d++) lista.push(d);
    while (lista.length % 7 !== 0) lista.push(null);
    return lista;
  }, [mes.y, mes.m]);

  const citasDelDia = porDia.get(diaSel) ?? [];

  return (
    <View style={[styles.card, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
      {/* Encabezado del mes */}
      <View style={styles.calHeader}>
        <Pressable
          onPress={() => onMes(-1)}
          hitSlop={8}
          accessibilityLabel="Mes anterior"
          style={[styles.calFlecha, { borderColor: colors.BzBorder, backgroundColor: colors.BzCardInner }]}
        >
          <Icono nombre="izq" size={16} color={colors.BzText} />
        </Pressable>
        <Text style={{ color: colors.BzText, fontSize: 16, fontWeight: '600' }}>
          {MESES_LARGO[mes.m]} {mes.y}
        </Text>
        <Pressable
          onPress={() => onMes(1)}
          hitSlop={8}
          accessibilityLabel="Mes siguiente"
          style={[styles.calFlecha, { borderColor: colors.BzBorder, backgroundColor: colors.BzCardInner }]}
        >
          <Icono nombre="der" size={16} color={colors.BzText} />
        </Pressable>
      </View>

      {/* Días de la semana */}
      <View style={styles.calFila}>
        {DIAS_CALENDARIO.map((d, i) => (
          <View key={`${d}-${i}`} style={styles.calCelda}>
            <Text style={{ color: colors.BzMuted, fontSize: 11, fontWeight: '600' }}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Cuadrícula */}
      <View style={styles.calFila}>
        {celdas.map((dia, idx) => {
          if (dia === null) return <View key={`v-${idx}`} style={styles.calCelda} />;
          const clave = `${mes.y}-${pad(mes.m + 1)}-${pad(dia)}`;
          const tieneCita = porDia.has(clave);
          const esHoy = clave === hoy;
          const seleccionado = clave === diaSel;
          const pasado = clave < hoy;

          return (
            <View key={clave} style={styles.calCelda}>
              <Pressable
                onPress={() => onSelDia(clave)}
                accessibilityRole="button"
                accessibilityLabel={`${dia} de ${MESES_LARGO[mes.m]}${tieneCita ? ', tienes cita' : ''}`}
                style={[
                  styles.calDia,
                  {
                    backgroundColor: seleccionado
                      ? colors.BzText
                      : tieneCita
                      ? colors.BzCardInner
                      : 'transparent',
                    borderColor: esHoy && !seleccionado ? colors.BzText : 'transparent',
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: tieneCita || esHoy ? '700' : '400',
                    color: seleccionado ? colors.BzBg : pasado ? colors.BzMuted : colors.BzText,
                  }}
                >
                  {dia}
                </Text>
                {tieneCita && <View style={[styles.calPunto, { backgroundColor: colors.BzSuccess }]} />}
              </Pressable>
            </View>
          );
        })}
      </View>

      {/* Leyenda */}
      <View style={styles.calLeyenda}>
        <View style={[styles.calPunto, { position: 'relative', bottom: 0, backgroundColor: colors.BzSuccess }]} />
        <Text style={{ color: colors.BzMuted, fontSize: 11 }}>Día con cita agendada</Text>
      </View>

      {/* Detalle del día tocado */}
      <View style={[styles.calDetalle, { borderTopColor: colors.BzBorder }]}>
        <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }}>
          {etiquetaDiaLarga(diaSel)}
        </Text>

        {citasDelDia.length === 0 ? (
          <Text style={{ color: colors.BzMuted, fontSize: 12, marginTop: 6 }}>
            Sin citas este día. Toca un día marcado para ver a qué hora tienes cita.
          </Text>
        ) : (
          <View style={{ marginTop: 8, gap: 10 }}>
            {citasDelDia.map((c) => (
              <View
                key={c.folio}
                style={[styles.calCitaItem, { backgroundColor: colors.BzCardInner, borderColor: colors.BzBorder }]}
              >
                <View style={{ alignItems: 'center', minWidth: 62 }}>
                  <Icono nombre="reloj" size={14} color={colors.BzMuted} />
                  <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '700', marginTop: 3 }}>
                    {c.horaTexto}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
                    {c.servicio.titulo}
                  </Text>
                  <Text style={{ color: colors.BzMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                    Con {c.barbero.nombre} · #{c.folio}
                  </Text>
                </View>
                <Pressable onPress={() => onVerPase(c)} hitSlop={8}>
                  <Text style={{ color: colors.BzText, fontSize: 12, fontWeight: '600' }}>Pase ›</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

/* =====================================================================
   Pantalla principal: Hub → Servicios → Formulario → Comprobante
   ===================================================================== */

type Paso = 'hub' | 'servicios' | 'formulario' | 'comprobante';

export function VistaAgendarCliente({
  nombreCliente = 'Juan Pérez',
  sucursalNombre = 'Sucursal Olivete',
  servicios = SERVICIOS_DEMO,
  barberos = BARBEROS_DEMO,
  citasActivas = SIN_CITAS,
  pedidosPendientes = SIN_PEDIDOS,
  onCitaConfirmada,
  onIrTienda,
  onVolverInicio,
  aplicarSafeArea = false,
  espacioInferior = 36,
}: Props) {
  const { colors } = useBzTheme();
  const insets = useSafeAreaInsets();
  const { height: altoPantalla } = useWindowDimensions();

  const [paso, setPaso] = useState<Paso>('hub');

  /* ----- Hub ----- */
  const pendientes = useMemo(() => citasPendientesOrdenadas(citasActivas), [citasActivas]);
  const claveInicial = pendientes[0]?.fechaISO ?? claveHoy();
  const [diaSel, setDiaSel] = useState<string>(claveInicial);
  const [mesVista, setMesVista] = useState<{ y: number; m: number }>(() => {
    const f = fechaDesdeClave(claveInicial);
    return { y: f.getFullYear(), m: f.getMonth() };
  });
  const [verTodasCitas, setVerTodasCitas] = useState(false);
  const [paseModal, setPaseModal] = useState<CitaConfirmadaData | null>(null);
  const [ticketModal, setTicketModal] = useState<PedidoApartadoData | null>(null);

  /* ----- Formulario ----- */
  const [servicioElegido, setServicioElegido] = useState<ServicioItem | null>(null);
  const dias = useMemo(() => generarProximosDias(7), []);
  const [diaElegido, setDiaElegido] = useState<DiaAgenda>(dias[0]);
  const [horaElegida, setHoraElegida] = useState<string>('');
  const [barberoElegido, setBarberoElegido] = useState<BarberoItem | null>(null);
  const [notas, setNotas] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);

  /* ----- Comprobante ----- */
  const [citaGenerada, setCitaGenerada] = useState<CitaConfirmadaData | null>(null);

  const altoTarjetaFeed = Math.max(220, Math.round(altoPantalla * 0.37));
  const topSeguro = (aplicarSafeArea ? insets.top : 0) + 12;

  // Horarios del día elegido (si es hoy, solo los que faltan; se bloquean los que ya tiene ocupados)
  const horarios = useMemo(() => {
    const horaActual = new Date().getHours();
    const bloqueadas = new Set(
      citasActivas.filter((c) => c.fechaISO === diaElegido.key).map((c) => c.horaTexto),
    );
    return HORARIOS_BASE.filter((h) => !diaElegido.esHoy || h.hora24 > horaActual).map((h) => ({
      ...h,
      bloqueada: bloqueadas.has(h.label),
    }));
  }, [diaElegido, citasActivas]);

  // Mantiene una hora válida al cambiar de día
  useEffect(() => {
    if (paso !== 'formulario') return;
    const libres = horarios.filter((h) => !h.bloqueada);
    if (!libres.some((h) => h.label === horaElegida)) {
      setHoraElegida(libres[0]?.label ?? '');
    }
  }, [horarios, paso, horaElegida]);

  // Solo barberos en turno ese día y libres a esa hora
  const barberosDisponibles = useMemo(() => {
    if (!horaElegida) return [];
    return barberos.filter((b) => {
      if (!b.diasLaborales.includes(diaElegido.diaSemana)) return false;
      const ocupadas = [
        ...(b.horasOcupadas?.[diaElegido.key] ?? []),
        ...(diaElegido.esHoy ? b.horasOcupadas?.hoy ?? [] : []),
      ];
      if (ocupadas.includes(horaElegida)) return false;
      const tomadoPorMisCitas = citasActivas.some(
        (c) => c.barbero.id === b.id && c.fechaISO === diaElegido.key && c.horaTexto === horaElegida,
      );
      return !tomadoPorMisCitas;
    });
  }, [barberos, diaElegido, horaElegida, citasActivas]);

  const puedeConfirmar = !!servicioElegido && !!barberoElegido && !!horaElegida;

  /* ----- Acciones ----- */

  const cambiarMes = (delta: number) => {
    setMesVista((prev) => {
      const f = new Date(prev.y, prev.m + delta, 1);
      return { y: f.getFullYear(), m: f.getMonth() };
    });
  };

  const empezarNuevaCita = () => {
    setServicioElegido(null);
    setPaso('servicios');
  };

  const elegirServicio = (srv: ServicioItem) => {
    setServicioElegido(srv);
    setDiaElegido(dias[0]);
    setHoraElegida('');
    setBarberoElegido(null);
    setNotas('');
    setFotoUri(null);
    setPaso('formulario');
  };

  const elegirFoto = async () => {
    const ImagePicker = cargarImagePicker();
    if (!ImagePicker) {
      Alert.alert(
        'Falta expo-image-picker',
        'Para adjuntar una foto instala la librería con:\nnpx expo install expo-image-picker',
      );
      return;
    }
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert(
          'Permiso necesario',
          'Activa el acceso a tus fotos en los ajustes del teléfono para adjuntar una referencia.',
        );
        return;
      }
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions ? ImagePicker.MediaTypeOptions.Images : ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      const uri = resultado?.assets?.[0]?.uri;
      if (!resultado?.canceled && uri) setFotoUri(uri);
    } catch {
      Alert.alert('No se pudo abrir la galería', 'Inténtalo de nuevo en un momento.');
    }
  };

  const confirmarCita = () => {
    if (!servicioElegido || !barberoElegido || !horaElegida) return;
    const slot = HORARIOS_BASE.find((h) => h.label === horaElegida);
    const nueva: CitaConfirmadaData = {
      folio: nuevoFolio(citasActivas.map((c) => c.folio)),
      servicio: servicioElegido,
      barbero: barberoElegido,
      fechaTexto: diaElegido.fechaCompleta,
      horaTexto: horaElegida,
      clienteNombre: nombreCliente,
      sucursal: sucursalNombre,
      creadaEn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fechaISO: diaElegido.key,
      hora24: slot?.hora24 ?? 0,
      notas: notas.trim() ? notas.trim() : undefined,
      fotoUri: fotoUri ?? undefined,
    };

    setCitaGenerada(nueva);
    // El calendario del Hub se coloca en el día de la cita nueva
    setDiaSel(nueva.fechaISO);
    const f = fechaDesdeClave(nueva.fechaISO);
    setMesVista({ y: f.getFullYear(), m: f.getMonth() });
    setPaso('comprobante');

    onCitaConfirmada?.(nueva, `${servicioElegido.titulo} · ${diaElegido.etiquetaTop} ${horaElegida}`);
  };

  const volverAlHub = () => {
    setCitaGenerada(null);
    setServicioElegido(null);
    setBarberoElegido(null);
    setPaso('hub');
  };

  const irAInicio = () => {
    volverAlHub();
    onVolverInicio?.();
  };

  /* =================================================================
     VISTA 4 · COMPROBANTE / PASE OFICIAL
     ================================================================= */
  if (paso === 'comprobante' && citaGenerada) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.BzBg }}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: topSeguro,
            paddingBottom: espacioInferior,
            paddingHorizontal: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerSimple}>
            <Text style={[BzTypography.label, { color: colors.BzMuted }]}>COMPROBANTE OFICIAL</Text>
            <Text style={[BzTypography.title, { color: colors.BzText, marginTop: 4 }]}>
              Tu cita está lista
            </Text>
            <Text style={[styles.headerSub, { color: colors.BzMuted }]}>
              Ya aparece en tu calendario, en tu inicio y en la agenda de {citaGenerada.barbero.nombre}.
            </Text>
          </View>

          <ComprobanteCitaCard
            cita={citaGenerada}
            onCerrar={irAInicio}
            textoBotonPrincipal="Listo, ver en inicio"
            textoBotonSecundario="Ver mi agenda"
            onSecundario={volverAlHub}
          />
        </ScrollView>
      </View>
    );
  }

  /* =================================================================
     VISTA 3 · FORMULARIO (día, hora, barbero, descripción, foto)
     ================================================================= */
  if (paso === 'formulario' && servicioElegido) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.BzBg }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingTop: topSeguro,
            paddingBottom: espacioInferior + 24,
            paddingHorizontal: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={() => setPaso('servicios')} hitSlop={8} style={styles.backRow}>
            <View style={[styles.backCircle, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
              <Icono nombre="atras" size={18} color={colors.BzText} />
            </View>
            <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Cambiar servicio</Text>
          </Pressable>

          {/* Resumen del servicio elegido */}
          <View
            style={[styles.servicioResumenCard, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[BzTypography.label, { color: colors.BzMuted }]}>SERVICIO SELECCIONADO</Text>
              <Text style={[styles.servicioResumenTitulo, { color: colors.BzText }]}>
                {servicioElegido.titulo}
              </Text>
              <Text style={{ color: colors.BzMuted, fontSize: 12, marginTop: 2 }}>
                {servicioElegido.duracion} · {sucursalNombre}
              </Text>
            </View>
            <Text style={[styles.servicioResumenPrecio, { color: colors.BzText }]}>
              {mxn(servicioElegido.precio)}
            </Text>
          </View>

          {/* 1. Día */}
          <Text style={[styles.seccionLabel, { color: colors.BzMuted }]}>1. ELIGE EL DÍA</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
          >
            {dias.map((d) => {
              const activo = d.key === diaElegido.key;
              return (
                <Pressable
                  key={d.key}
                  onPress={() => {
                    setDiaElegido(d);
                    setBarberoElegido(null);
                  }}
                  style={[
                    styles.diaCard,
                    {
                      backgroundColor: activo ? colors.BzText : colors.BzCard,
                      borderColor: activo ? colors.BzText : colors.BzBorder,
                    },
                  ]}
                >
                  <Text
                    style={{ fontSize: 11, fontWeight: '600', color: activo ? colors.BzBg : colors.BzMuted }}
                  >
                    {d.etiquetaTop}
                  </Text>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: '600',
                      marginVertical: 2,
                      color: activo ? colors.BzBg : colors.BzText,
                    }}
                  >
                    {d.numeroDia}
                  </Text>
                  <Text style={{ fontSize: 11, color: activo ? colors.BzBg : colors.BzMuted }}>
                    {d.mesTexto}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* 2. Hora */}
          <Text style={[styles.seccionLabel, { color: colors.BzMuted }]}>2. ELIGE LA HORA</Text>
          <View style={styles.horasGrid}>
            {horarios.map((h) => {
              const activa = h.label === horaElegida;
              return (
                <Pressable
                  key={h.label}
                  disabled={h.bloqueada}
                  onPress={() => {
                    setHoraElegida(h.label);
                    setBarberoElegido(null);
                  }}
                  accessibilityState={{ disabled: h.bloqueada, selected: activa }}
                  style={[
                    styles.horaChip,
                    {
                      backgroundColor: activa ? colors.BzText : colors.BzCard,
                      borderColor: activa ? colors.BzText : colors.BzBorder,
                      opacity: h.bloqueada ? 0.35 : 1,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '500',
                      color: activa ? colors.BzBg : colors.BzText,
                      textDecorationLine: h.bloqueada ? 'line-through' : 'none',
                    }}
                  >
                    {h.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {horarios.some((h) => h.bloqueada) && (
            <Text style={{ color: colors.BzMuted, fontSize: 11, marginTop: 8 }}>
              Las horas tachadas ya tienen una cita tuya.
            </Text>
          )}

          {/* 3. Barberos disponibles */}
          <View style={styles.barberosHeader}>
            <Text style={[styles.seccionLabel, { color: colors.BzMuted, marginTop: 0, marginBottom: 0 }]}>
              3. ESTOS BARBEROS ESTÁN DISPONIBLES
            </Text>
          </View>
          <Text style={{ color: colors.BzText, fontSize: 12, fontWeight: '500', marginBottom: 10 }}>
            {diaElegido.etiquetaTop} {diaElegido.numeroDia} {diaElegido.mesTexto}
            {horaElegida ? ` · ${horaElegida}` : ''}
          </Text>

          {barberosDisponibles.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
              <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '500' }}>
                Sin barberos libres a esa hora
              </Text>
              <Text style={{ color: colors.BzMuted, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                Prueba con otro horario o con otro día.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {barberosDisponibles.map((barbero) => {
                const seleccionado = barberoElegido?.id === barbero.id;
                return (
                  <Pressable
                    key={barbero.id}
                    onPress={() => setBarberoElegido(barbero)}
                    style={[
                      styles.barberoCard,
                      {
                        backgroundColor: colors.BzCard,
                        borderColor: seleccionado ? colors.BzText : colors.BzBorder,
                        borderWidth: seleccionado ? 1.6 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.barberoAvatar,
                        { backgroundColor: seleccionado ? colors.BzText : colors.BzCardInner },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: seleccionado ? colors.BzBg : colors.BzText,
                        }}
                      >
                        {obtenerIniciales(barbero.nombre)}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.barberoNombre, { color: colors.BzText }]}>{barbero.nombre}</Text>
                      <Text style={{ color: colors.BzMuted, fontSize: 12, marginTop: 2 }}>
                        {barbero.especialidad}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Icono nombre="estrella" size={13} color={colors.BzText} />
                        <Text style={{ color: colors.BzText, fontSize: 12, fontWeight: '600' }}>
                          {barbero.calificacion}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.radioOuter,
                          {
                            borderColor: seleccionado ? colors.BzText : colors.BzMuted,
                            backgroundColor: seleccionado ? colors.BzText : 'transparent',
                          },
                        ]}
                      >
                        {seleccionado && <Icono nombre="check" size={12} color={colors.BzBg} />}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* 4. Descripción (opcional) */}
          <Text style={[styles.seccionLabel, { color: colors.BzMuted }]}>4. CUÉNTANOS QUÉ QUIERES (OPCIONAL)</Text>
          <TextInput
            value={notas}
            onChangeText={setNotas}
            multiline
            maxLength={280}
            placeholder="Ej. Mid fade bajo con tijera arriba, sin rebajar mucho la barba"
            placeholderTextColor={colors.BzMuted}
            style={[
              styles.input,
              { color: colors.BzText, backgroundColor: colors.BzCard, borderColor: colors.BzBorder },
            ]}
          />
          <Text style={{ color: colors.BzMuted, fontSize: 11, textAlign: 'right', marginTop: 4 }}>
            {notas.length}/280
          </Text>

          {/* 5. Foto de referencia (opcional) */}
          <Text style={[styles.seccionLabel, { color: colors.BzMuted }]}>5. FOTO DE REFERENCIA (OPCIONAL)</Text>
          {fotoUri ? (
            <View style={[styles.fotoBox, { borderColor: colors.BzBorder, backgroundColor: colors.BzCard }]}>
              <Image source={{ uri: fotoUri }} style={styles.fotoPreview} resizeMode="cover" />
              <View style={styles.fotoAcciones}>
                <Pressable
                  onPress={elegirFoto}
                  style={[styles.fotoBtn, { borderColor: colors.BzBorder, backgroundColor: colors.BzCardInner }]}
                >
                  <Icono nombre="camara" size={14} color={colors.BzText} />
                  <Text style={{ color: colors.BzText, fontSize: 12, fontWeight: '500' }}>Cambiar</Text>
                </Pressable>
                <Pressable
                  onPress={() => setFotoUri(null)}
                  style={[styles.fotoBtn, { borderColor: colors.BzBorder, backgroundColor: colors.BzCardInner }]}
                >
                  <Icono nombre="cerrar" size={14} color={colors.BzDanger} />
                  <Text style={{ color: colors.BzDanger, fontSize: 12, fontWeight: '500' }}>Quitar</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={elegirFoto}
              accessibilityRole="button"
              accessibilityLabel="Adjuntar foto de referencia"
              style={({ pressed }) => [
                styles.fotoVacia,
                { borderColor: colors.BzBorder, backgroundColor: colors.BzCard, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <View style={[styles.fotoIcono, { backgroundColor: colors.BzCardInner }]}>
                <Icono nombre="camara" size={20} color={colors.BzText} />
              </View>
              <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '500' }}>
                Adjuntar foto de referencia
              </Text>
              <Text style={{ color: colors.BzMuted, fontSize: 11, marginTop: 2 }}>
                Enséñale a tu barbero el corte que buscas
              </Text>
            </Pressable>
          )}

          {/* Confirmar */}
          <Pressable
            disabled={!puedeConfirmar}
            onPress={confirmarCita}
            style={({ pressed }) => [
              styles.botonPrimario,
              {
                backgroundColor: puedeConfirmar ? colors.BzText : colors.BzCardInner,
                marginTop: 26,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text style={[styles.botonPrimarioTexto, { color: puedeConfirmar ? colors.BzBg : colors.BzMuted }]}>
              {puedeConfirmar
                ? `Confirmar cita con ${barberoElegido?.nombre.split(' ')[0]}`
                : 'Elige día, hora y barbero para confirmar'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  /* =================================================================
     VISTA 2 · FEED VERTICAL DE SERVICIOS
     ================================================================= */
  if (paso === 'servicios') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.BzBg }}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: topSeguro,
            paddingBottom: espacioInferior,
            paddingHorizontal: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={volverAlHub} hitSlop={8} style={styles.backRow}>
            <View style={[styles.backCircle, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
              <Icono nombre="atras" size={18} color={colors.BzText} />
            </View>
            <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Mi agenda</Text>
          </Pressable>

          <View style={styles.headerSimple}>
            <Text style={[BzTypography.label, { color: colors.BzMuted }]}>
              RESERVA TU LUGAR · {sucursalNombre.toUpperCase()}
            </Text>
            <Text style={[BzTypography.title, { color: colors.BzText, marginTop: 4 }]}>Elige tu servicio</Text>
            <Text style={[styles.headerSub, { color: colors.BzMuted }]}>
              Desliza hacia abajo para ver todos los servicios
            </Text>
          </View>

          <View style={{ gap: 18 }}>
            {servicios.map((srv) => {
              const contenido = (
                <View
                  style={[
                    styles.feedCardInner,
                    { backgroundColor: srv.imagen ? 'rgba(0, 0, 0, 0.48)' : 'transparent' },
                  ]}
                >
                  <View style={styles.feedTopRow}>
                    <View style={[styles.duracionPill, { backgroundColor: colors.BzCardInner }]}>
                      <Icono nombre="reloj" size={12} color={colors.BzText} />
                      <Text style={{ color: colors.BzText, fontSize: 11, fontWeight: '500' }}>
                        {srv.duracion}
                      </Text>
                    </View>
                    <Text style={[styles.feedPrecio, { color: colors.BzText }]}>{mxn(srv.precio)}</Text>
                  </View>

                  <View>
                    <Text style={[styles.feedTitulo, { color: colors.BzText }]}>{srv.titulo}</Text>
                    <Text style={[styles.feedSubtitulo, { color: colors.BzMuted }]} numberOfLines={2}>
                      {srv.subtitulo}
                    </Text>
                  </View>
                </View>
              );

              return (
                <Pressable
                  key={srv.id}
                  onPress={() => elegirServicio(srv)}
                  accessibilityRole="button"
                  accessibilityLabel={`${srv.titulo}, ${mxn(srv.precio)}, ${srv.duracion}. Toca para elegir fecha y barbero`}
                  style={({ pressed }) => [
                    styles.feedCard,
                    {
                      height: altoTarjetaFeed,
                      backgroundColor: colors.BzCard,
                      borderColor: colors.BzBorder,
                      transform: [{ scale: pressed ? 0.985 : 1 }],
                    },
                  ]}
                >
                  {srv.imagen ? (
                    <ImageBackground
                      source={srv.imagen}
                      resizeMode="cover"
                      style={{ flex: 1, width: '100%', height: '100%' }}
                    >
                      {contenido}
                    </ImageBackground>
                  ) : (
                    <>
                      <View style={[styles.decorCircle, { backgroundColor: colors.BzCardInner }]} />
                      {contenido}
                    </>
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }

  /* =================================================================
     VISTA 1 · HUB DE AGENDA
     ================================================================= */
  const citasVisibles = verTodasCitas ? pendientes : pendientes.slice(0, 3);
  const hayAlgoPendiente = pendientes.length > 0 || pedidosPendientes.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.BzBg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: topSeguro,
          paddingBottom: espacioInferior,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSimple}>
          <Text style={[BzTypography.label, { color: colors.BzMuted }]}>
            MI AGENDA · {sucursalNombre.toUpperCase()}
          </Text>
          <Text style={[BzTypography.title, { color: colors.BzText, marginTop: 4 }]}>Tus citas</Text>
        </View>

        {/* Botón principal hasta arriba */}
        <Pressable
          onPress={empezarNuevaCita}
          accessibilityRole="button"
          accessibilityLabel="Agendar nueva cita"
          style={({ pressed }) => [
            styles.botonPrimario,
            styles.botonAgendarTop,
            { backgroundColor: colors.BzText, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Icono nombre="calendario" size={18} color={colors.BzBg} />
          <Text style={[styles.botonPrimarioTexto, { color: colors.BzBg }]}>Agendar nueva cita</Text>
        </Pressable>

        {/* Bloque 1: citas pendientes + productos por recoger */}
        <View style={[styles.card, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
          {!hayAlgoPendiente ? (
            <View style={styles.vacioWrap}>
              <View style={[styles.vacioIcono, { backgroundColor: colors.BzCardInner, borderColor: colors.BzBorder }]}>
                <Icono nombre="calendario" size={24} color={colors.BzText} />
              </View>
              <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '600', marginTop: 12 }}>
                Nada pendiente por ahora
              </Text>
              <Text
                style={{
                  color: colors.BzMuted,
                  fontSize: 12,
                  lineHeight: 17,
                  textAlign: 'center',
                  marginTop: 4,
                }}
              >
                Cuando agendes una cita o apartes productos en la tienda, aparecerán aquí.
              </Text>
              {onIrTienda && (
                <Pressable onPress={onIrTienda} hitSlop={8} style={{ marginTop: 10 }}>
                  <Text style={{ color: colors.BzText, fontSize: 12, fontWeight: '600' }}>Ver tienda ›</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <>
              {/* Citas */}
              <View style={styles.seccionTitulo}>
                <Text style={[BzTypography.label, { color: colors.BzMuted }]}>CITAS PENDIENTES</Text>
                {pendientes.length > 0 && (
                  <View style={[styles.contadorChip, { backgroundColor: colors.BzText }]}>
                    <Text style={{ color: colors.BzBg, fontSize: 10, fontWeight: '700' }}>
                      {pendientes.length}
                    </Text>
                  </View>
                )}
              </View>

              {pendientes.length === 0 ? (
                <Text style={{ color: colors.BzMuted, fontSize: 12 }}>No tienes citas pendientes.</Text>
              ) : (
                <View style={{ gap: 14 }}>
                  {citasVisibles.map((c) => (
                    <FilaCitaPendiente key={c.folio} cita={c} onVerPase={() => setPaseModal(c)} />
                  ))}
                  {pendientes.length > 3 && (
                    <Pressable onPress={() => setVerTodasCitas((v) => !v)} hitSlop={8}>
                      <Text style={{ color: colors.BzText, fontSize: 12, fontWeight: '600' }}>
                        {verTodasCitas ? 'Ver menos' : `Ver ${pendientes.length - 3} más ›`}
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}

              <View style={[styles.divisor, { backgroundColor: colors.BzBorder }]} />

              {/* Productos */}
              <View style={styles.seccionTitulo}>
                <Text style={[BzTypography.label, { color: colors.BzMuted }]}>PRODUCTOS POR RECOGER</Text>
                {pedidosPendientes.length > 0 && (
                  <View style={[styles.contadorChip, { backgroundColor: colors.BzText }]}>
                    <Text style={{ color: colors.BzBg, fontSize: 10, fontWeight: '700' }}>
                      {pedidosPendientes.length}
                    </Text>
                  </View>
                )}
              </View>

              {pedidosPendientes.length === 0 ? (
                <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
                  No tienes productos apartados.
                </Text>
              ) : (
                <View style={{ gap: 14 }}>
                  {pedidosPendientes.map((p) => (
                    <FilaPedidoPendiente key={p.folio} pedido={p} onVerTicket={() => setTicketModal(p)} />
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* Bloque 2: calendario interactivo */}
        <View style={{ marginTop: 16 }}>
          <CalendarioCitas
            citas={citasActivas}
            diaSel={diaSel}
            onSelDia={setDiaSel}
            mes={mesVista}
            onMes={cambiarMes}
            onVerPase={setPaseModal}
          />
        </View>
      </ScrollView>

      {/* Pase de recepción de cualquier cita */}
      <Modal
        visible={!!paseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setPaseModal(null)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
            {paseModal && (
              <ComprobanteCitaCard
                cita={paseModal}
                onCerrar={() => setPaseModal(null)}
                textoBotonPrincipal="Cerrar comprobante"
              />
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Ticket oficial de cualquier pedido apartado */}
      <Modal
        visible={!!ticketModal}
        transparent
        animationType="slide"
        onRequestClose={() => setTicketModal(null)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
            {ticketModal && (
              <ComprobantePedidoCard
                pedido={ticketModal}
                clienteNombre={nombreCliente}
                onCerrar={() => setTicketModal(null)}
                textoBotonPrincipal="Cerrar ticket"
              />
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

export default VistaAgendarCliente;

/* =====================================================================
   Estilos
   ===================================================================== */

const styles = StyleSheet.create({
  headerSimple: {
    marginBottom: 18,
  },
  headerSub: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },

  /* tarjetas generales */
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  divisor: {
    height: 1,
    marginVertical: 16,
  },
  seccionTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  contadorChip: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filaCita: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fechaBloque: {
    width: 50,
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBtn: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 12,
  },

  /* estado vacío */
  vacioWrap: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 10,
  },
  vacioIcono: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* calendario */
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calFlecha: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calFila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCelda: {
    width: '14.2857%',
    alignItems: 'center',
    paddingVertical: 2,
  },
  calDia: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calPunto: {
    position: 'absolute',
    bottom: 4,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  calLeyenda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  calDetalle: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  calCitaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },

  /* botón principal */
  botonPrimario: {
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonAgendarTop: {
    marginBottom: 16,
    flexDirection: 'row',
    gap: 10,
  },
  botonPrimarioTexto: {
    fontSize: 15,
    fontWeight: '600',
  },
  botonSecundario: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  /* feed vertical de servicios */
  feedCard: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    right: -35,
    bottom: -45,
    width: 190,
    height: 190,
    borderRadius: 95,
  },
  feedCardInner: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  feedTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  duracionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  feedPrecio: {
    fontSize: 22,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  feedTitulo: {
    fontSize: 28,
    fontWeight: '400',
  },
  feedSubtitulo: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },

  /* formulario */
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servicioResumenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  servicioResumenTitulo: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 3,
  },
  servicioResumenPrecio: {
    fontSize: 19,
    fontWeight: '600',
  },
  seccionLabel: {
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: '600',
    marginTop: 22,
    marginBottom: 10,
  },
  diaCard: {
    width: 68,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  horaChip: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  barberosHeader: {
    marginTop: 22,
    marginBottom: 4,
  },
  barberoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
  },
  barberoAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barberoNombre: {
    fontSize: 15,
    fontWeight: '600',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
  input: {
    minHeight: 96,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  fotoVacia: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fotoIcono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  fotoBox: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  fotoPreview: {
    width: '100%',
    height: 190,
  },
  fotoAcciones: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  fotoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
  },

  /* comprobante */
  paseCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 22,
    overflow: 'hidden',
  },
  paseTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paseBadgeOk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  paseBadgeTexto: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  paseFolio: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  paseMarca: {
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: '500',
    marginTop: 16,
  },
  paseServicio: {
    fontSize: 24,
    fontWeight: '500',
    marginTop: 4,
  },
  paseDividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    marginHorizontal: -22,
  },
  paseMuescaIzq: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -9,
  },
  paseLineaPunteada: {
    flex: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
  },
  paseMuescaDer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: -9,
  },
  paseGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  paseDatoBox: {
    flex: 1,
  },
  paseLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '500',
  },
  paseValor: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 3,
  },
  paseNotas: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  paseFoto: {
    width: '100%',
    height: 150,
    borderRadius: 14,
    marginTop: 6,
  },
  paseCodigoBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  barrasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  paseNotaRecepcion: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
});