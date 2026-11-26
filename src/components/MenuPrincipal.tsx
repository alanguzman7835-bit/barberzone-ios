import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import {
  citaDeCliente,
  hoyISO,
  horaTextoDe,
  minutosDelDia,
  normalizarSucursal,
  type CitaEquipo,
} from '../constants/AgendaTipos';
import { folioLibre, useAgenda } from '../constants/AgendaContext';
import { BzTypography, useBzTheme } from '../constants/BzTheme';
import { useCatalogoConfig } from '../constants/CatalogoConfigContext';
import { useHorarios } from '../constants/HorariosContext';
import { RolSesion, UsuarioBz } from '../constants/Sesion';
import { useDesktopLayout } from '../hooks/useDesktopLayout';
import { AdminOperacionesScreen } from './AdminOperacionesScreen';
import { AgendaEquipoScreen } from './AgendaEquipoScreen';
import { BarberoPanelScreen } from './BarberoPanelScreen';
import {
  BzAppearanceSheet,
  BzHeader,
  BzNotificacion,
  BzNotificacionesSheet,
  notificacionesIniciales,
} from './BzHeaderTema';
import { GooeyNavBar, GooeyTabItem } from './BzUiShell';
import { CajaScreen } from './CajaScreen';
import { CrearUsuarioScreen } from './CrearUsuarioScreen';
import { DesktopShell } from './DesktopShell';
import { DuenoBaseDatosView } from './DuenoBaseDatosView';
import { HorariosYPermisosScreen } from './HorariosYPermisosScreen';
import { InventarioScreen } from './InventarioScreen';
import VistaAgendarCliente, {
  type CitaConfirmadaData,
  type LineaPedido,
  type PedidoApartadoData,
} from './VistaAgendarCliente';
import VistaInicioBarbero from './VistaInicioBarbero';
import VistaInicioCliente from './VistaInicioCliente';
import VistaPerfilCliente from './VistaPerfilCliente';
import VistaTiendaCliente from './VistaTiendaCliente';

type TabPrincipal =
  | 'INICIO'
  | 'AGENDAR'
  | 'CAJA'
  | 'INVENTARIO'
  | 'DUENO_DASH'
  | 'BARBERO_PANEL'
  | 'TIENDA'
  | 'ROL';

function obtenerIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0] ?? ''}${partes[1][0] ?? ''}`.toUpperCase();
}

function fechaLargaHoy(): string {
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  const d = new Date();
  return `Hoy, ${d.getDate()} de ${meses[d.getMonth()]}`;
}

function formatMoney(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-MX');
}

/* ---------- Iconos Vectoriales de Barra ---------- */

const TabIcon: React.FC<{ tab: TabPrincipal; color: string; isMenu?: boolean }> = ({ tab, color, isMenu }) => {
  if (isMenu) {
    return (
      <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
        <Line x1={4} y1={7} x2={20} y2={7} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        <Line x1={4} y1={12} x2={20} y2={12} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        <Line x1={4} y1={17} x2={20} y2={17} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      </Svg>
    );
  }
  switch (tab) {
    case 'INICIO':
      return (
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
          <Path d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H4C3.45 21 3 20.55 3 20V10.5Z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
          <Path d="M9 21V13H15V21" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
        </Svg>
      );
    case 'AGENDAR':
      return (
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={4} width={18} height={17} rx={2.5} stroke={color} strokeWidth={1.6} />
          <Line x1={3} y1={9.5} x2={21} y2={9.5} stroke={color} strokeWidth={1.6} />
          <Line x1={8} y1={2.5} x2={8} y2={5.5} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
          <Line x1={16} y1={2.5} x2={16} y2={5.5} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        </Svg>
      );
    case 'CAJA':
      return (
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
          <Rect x={2.5} y={5.5} width={19} height={13} rx={2.5} stroke={color} strokeWidth={1.6} />
          <Circle cx={12} cy={12} r={2.5} stroke={color} strokeWidth={1.6} />
        </Svg>
      );
    case 'INVENTARIO':
      return (
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
          <Path d="M21 8L12 3L3 8V16L12 21L21 16V8Z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
          <Path d="M3.3 8.2L12 13L20.7 8.2M12 13V21" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
        </Svg>
      );
    case 'DUENO_DASH':
      return (
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
          <Line x1={6} y1={19} x2={6} y2={11} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Line x1={12} y1={19} x2={12} y2={6} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Line x1={18} y1={19} x2={18} y2={14} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    case 'BARBERO_PANEL':
      return (
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
          <Circle cx={6} cy={6} r={3} stroke={color} strokeWidth={1.6} />
          <Circle cx={6} cy={18} r={3} stroke={color} strokeWidth={1.6} />
          <Line x1={20} y1={4} x2={8.12} y2={15.88} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
          <Line x1={14.47} y1={14.48} x2={20} y2={20} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
          <Line x1={8.12} y1={8.12} x2={12} y2={12} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        </Svg>
      );
    case 'TIENDA':
      return (
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
          <Path d="M6 7H18L19 20H5L6 7Z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
          <Path d="M9 7V5C9 3.34 10.34 2 12 2C13.66 2 15 3.34 15 5V7" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        </Svg>
      );
    case 'ROL':
      return (
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={1.6} />
          <Path d="M4.5 20C4.5 15.5 19.5 15.5 19.5 20" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        </Svg>
      );
  }
};

/* ---------- Helpers visuales compartidos ---------- */

const TarjetaSeccion: React.FC<{
  titulo: string;
  accionTexto: string;
  onAccion: () => void;
  style?: any;
  children: React.ReactNode;
}> = ({ titulo, accionTexto, onAccion, style, children }) => {
  const { colors } = useBzTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }, style]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[BzTypography.label, { color: colors.BzMuted }]}>{titulo}</Text>
        <Pressable onPress={onAccion}>
          <Text style={{ color: '#E2C46D', fontSize: 12, fontWeight: '600' }}>{accionTexto}</Text>
        </Pressable>
      </View>
      {children}
    </View>
  );
};

const FilaResumen: React.FC<{ titulo: string; subtitulo: string; colorPunto: string }> = ({
  titulo,
  subtitulo,
  colorPunto,
}) => {
  const { colors } = useBzTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 }}>
      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colorPunto }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.BzText, fontSize: 13 }}>{titulo}</Text>
        <Text style={{ color: colors.BzMuted, fontSize: 11 }}>{subtitulo}</Text>
      </View>
    </View>
  );
};

const MiniMetrica: React.FC<{ etiqueta: string; valor: string }> = ({ etiqueta, valor }) => {
  const { colors } = useBzTheme();
  return (
    <View
      style={{
        flex: 1,
        padding: 12,
        borderRadius: 12,
        backgroundColor: colors.BzCardInner,
        borderWidth: 1,
        borderColor: colors.BzBorder,
      }}
    >
      <Text style={{ color: colors.BzMuted, fontSize: 11 }}>{etiqueta}</Text>
      <Text style={[BzTypography.bigNumber, { color: colors.BzText, fontSize: 24, fontWeight: '600' }]}>
        {valor}
      </Text>
    </View>
  );
};

const BotonMenuPrimario: React.FC<{ texto: string; onPress: () => void; dorado?: boolean }> = ({
  texto,
  onPress,
  dorado,
}) => {
  const { colors } = useBzTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.btnPrimario, { backgroundColor: dorado ? '#E2C46D' : colors.BzText }]}
    >
      <Text style={{ color: dorado ? '#141416' : colors.BzBg, fontWeight: '700', fontSize: 13 }}>
        {texto}
      </Text>
    </Pressable>
  );
};

const BotonMenuSecundario: React.FC<{ texto: string; onPress: () => void }> = ({ texto, onPress }) => {
  const { colors } = useBzTheme();
  return (
    <Pressable onPress={onPress} style={[styles.btnSecundario, { borderColor: colors.BzBorder }]}>
      <Text style={{ color: colors.BzText, fontSize: 13 }}>{texto}</Text>
    </Pressable>
  );
};

/* ---------- Servicios base del catálogo ---------- */

const SERVICIOS_CATALOGO = [
  { id: 'srv-1', nombre: 'Corte de cabello', duracion: '40 min', duracionMin: 40, precio: 220 },
  { id: 'srv-2', nombre: 'Corte + barba', duracion: '60 min', duracionMin: 60, precio: 340 },
  { id: 'srv-3', nombre: 'Arreglo de barba', duracion: '30 min', duracionMin: 30, precio: 160 },
  { id: 'srv-4', nombre: 'Afeitado de barba', duracion: '35 min', duracionMin: 35, precio: 180 },
];

/* ---------- 0. Vista Reporte y Estadísticas del Dueño (Con Base de Datos y CMS) ---------- */

type PeriodoReporte = 'hoy' | 'semana' | 'mes';
type TabReporte = 'dashboard' | 'precios' | 'sucursales' | 'basedatos';

const PERIODOS_CONFIG: Record<
  PeriodoReporte,
  { vs: string; d: number[]; titulo: string; mejor: string; t: [string, number][] }
> = {
  hoy: {
    vs: 'vs ayer',
    d: [0, 0, 0],
    titulo: 'Ventas por hora',
    mejor: 'Mejor hora',
    t: [
      ['10', 0], ['11', 0], ['12', 0], ['13', 0], ['14', 0],
      ['15', 0], ['16', 0], ['17', 0], ['18', 0], ['19', 0], ['20', 0],
    ],
  },
  semana: {
    vs: 'vs semana pasada',
    d: [0, 0, 0],
    titulo: 'Ventas por día',
    mejor: 'Mejor día',
    t: [
      ['Lun', 0], ['Mar', 0], ['Mié', 0], ['Jue', 0],
      ['Vie', 0], ['Sáb', 0], ['Dom', 0],
    ],
  },
  mes: {
    vs: 'vs mes pasado',
    d: [0, 0, 0],
    titulo: 'Ventas por semana',
    mejor: 'Mejor semana',
    t: [
      ['Sem 1', 0], ['Sem 2', 0], ['Sem 3', 0], ['Sem 4', 0],
    ],
  },
};

const SUCURSALES_REPORTE = [
  { nombre: 'Olivete', venta: 0, citas: 0, encargado: 'Sin asignar', sillas: '4 / 4', ocupacion: 0, meta: 6000 },
  { nombre: 'Centro', venta: 0, citas: 0, encargado: 'Sin asignar', sillas: '4 / 4', ocupacion: 0, meta: 5500 },
  { nombre: 'Providencia', venta: 0, citas: 0, encargado: 'Sin asignar', sillas: '3 / 3', ocupacion: 0, meta: 4800 },
];

const PAGOS_REPORTE: [string, number, string][] = [
  ['Tarjeta', 0, '#E2C46D'],
  ['Efectivo', 0, '#34A853'],
  ['Transferencia', 0, '#6b7280'],
];

const VistaReporteDueno: React.FC<{
  onNewUser: () => void;
  onAbrirHorariosPermisos: (tab: 'HORARIOS' | 'PERMISOS') => void;
}> = ({ onNewUser }) => {
  const { colors } = useBzTheme();
  const { isDesktop } = useDesktopLayout();
  const { productos, empleados, actualizarProducto } = useCatalogoConfig();
  const { citasEquipo } = useAgenda();

  const [tab, setTab] = useState<TabReporte>('dashboard');
  const [periodo, setPeriodo] = useState<PeriodoReporte>('hoy');
  const [sucursal, setSucursal] = useState<string>('TODAS');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [estadosTurno, setEstadosTurno] = useState<Record<string, string>>({});
  const [serviciosLocales, setServiciosLocales] = useState(SERVICIOS_CATALOGO);

  const mostrarAviso = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg((prev) => (prev === msg ? null : prev)), 2000);
  };

  const personalReal = useMemo(
    () => empleados.filter((e) => e.rol !== 'Dueño'),
    [empleados],
  );

  const barberosReales = useMemo(
    () => personalReal.filter((e) => e.rol === 'Barbero'),
    [personalReal],
  );

  const cfg = PERIODOS_CONFIG[periodo];
  const sucFiltradas = sucursal === 'TODAS' ? SUCURSALES_REPORTE : SUCURSALES_REPORTE.filter((s) => s.nombre === sucursal);

  const citasRealesFiltradas = useMemo(
    () =>
      citasEquipo.filter(
        (c) =>
          c.estado !== 'CANCELADA' &&
          (sucursal === 'TODAS' || normalizarSucursal(c.sucursal) === sucursal),
      ),
    [citasEquipo, sucursal],
  );

  const ventaTotal = citasRealesFiltradas.reduce((a, c) => a + (c.precio || 0), 0);
  const citasTotal = citasRealesFiltradas.length;
  const ticketPromedio = citasTotal ? ventaTotal / citasTotal : 0;

  const barFiltrados = useMemo(
    () =>
      barberosReales
        .filter((b) => sucursal === 'TODAS' || b.sucursal === sucursal)
        .map((b) => {
          const citasB = citasEquipo.filter((c) => c.barberoId === b.id && c.estado !== 'CANCELADA');
          const ventaB = citasB.reduce((s, c) => s + (c.precio || 0), 0);
          return {
            id: b.id,
            nombre: b.nombre,
            suc: b.sucursal,
            venta: ventaB,
            citas: citasB.length,
            pctCom: b.comisionPct || 50,
            propina: 0,
          };
        }),
    [barberosReales, citasEquipo, sucursal],
  );

  const maxSuc = Math.max(1, ...SUCURSALES_REPORTE.map((s) => s.venta));
  const maxBar = Math.max(1, ...barFiltrados.map((b) => b.venta));

  const catalogoCombinado = useMemo(
    () => [
      ...serviciosLocales.map((s) => ({
        id: s.id,
        nombre: s.nombre,
        tipo: 'Servicio' as const,
        duracion: s.duracion,
        precio: s.precio,
      })),
      ...productos.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        tipo: 'Producto' as const,
        duracion: '—',
        precio: p.precio,
      })),
    ],
    [serviciosLocales, productos],
  );

  const eqFiltrado = useMemo(
    () =>
      personalReal
        .filter((e) => sucursal === 'TODAS' || e.sucursal === sucursal)
        .map((e) => ({
          id: e.id,
          nombre: e.nombre,
          rol: e.rol,
          suc: e.sucursal,
          horario: '10:00 – 19:00',
          citas: citasEquipo.filter((c) => c.barberoId === e.id && c.estado !== 'CANCELADA').length,
          estado: estadosTurno[e.id] ?? (e.activo ? 'Activo' : 'Inactivo'),
        })),
    [personalReal, sucursal, citasEquipo, estadosTurno],
  );

  const actualizarPrecioItem = (item: { id: string; tipo: 'Servicio' | 'Producto' }, texto: string) => {
    const val = Math.max(0, Number(texto.replace(/\D/g, '')) || 0);
    if (item.tipo === 'Servicio') {
      setServiciosLocales((prev) => prev.map((s) => (s.id === item.id ? { ...s, precio: val } : s)));
    } else {
      actualizarProducto(item.id, { precio: val });
    }
  };

  const cambiarEstadoEmpleado = (id: string, nombre: string) => {
    const orden = ['Activo', 'En corte', 'Permiso'];
    const actual = estadosTurno[id] ?? 'Activo';
    const siguiente = orden[(orden.indexOf(actual) + 1) % orden.length];
    setEstadosTurno((prev) => ({ ...prev, [id]: siguiente }));
    mostrarAviso(`${nombre}: ${siguiente}`);
  };

  const titulosTab: Record<TabReporte, string> = {
    dashboard: 'Reporte',
    precios: 'Precios y comisiones',
    sucursales: 'Sucursales y equipo',
    basedatos: 'Base de datos y App Cliente',
  };

  const renderDelta = (valor: number) => {
    const sube = valor >= 0;
    return (
      <Text style={{ fontSize: 12, fontWeight: '700', color: sube ? colors.BzSuccess : colors.BzDanger }}>
        {sube ? '▲' : '▼'} {Math.abs(valor)}%{' '}
        <Text style={{ color: colors.BzMuted, fontWeight: '500' }}>{cfg.vs}</Text>
      </Text>
    );
  };

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: isDesktop ? 4 : 18,
        paddingVertical: 16,
        gap: 18,
        paddingBottom: 40,
      }}
    >
      {toastMsg && (
        <View
          style={{
            alignSelf: 'center',
            backgroundColor: '#F3F4F6',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: '#0D0D0D', fontSize: 12, fontWeight: '700' }}>{toastMsg}</Text>
        </View>
      )}

      {/* Pestañas superiores */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {(
          [
            ['dashboard', 'Dashboard'],
            ['precios', 'Precios y comisiones'],
            ['sucursales', 'Sucursales y equipo'],
            ['basedatos', 'Base de datos y App'],
          ] as [TabReporte, string][]
        ).map(([key, label]) => {
          const activo = tab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={{
                paddingHorizontal: 18,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: activo ? '#F3F4F6' : colors.BzCard,
                borderWidth: 1,
                borderColor: activo ? '#F3F4F6' : colors.BzBorder,
              }}
            >
              <Text style={{ color: activo ? '#0D0D0D' : colors.BzMuted, fontSize: 13, fontWeight: '700' }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Encabezado + Filtro Sucursal + Selector Periodo */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Text style={[BzTypography.title, { color: colors.BzText, fontSize: isDesktop ? 28 : 22, fontWeight: '800' }]}>
          {titulosTab[tab]}
        </Text>

        {tab !== 'basedatos' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: colors.BzCard,
                borderWidth: 1,
                borderColor: colors.BzBorder,
                borderRadius: 999,
                padding: 4,
                gap: 2,
              }}
            >
              {['TODAS', 'Olivete', 'Centro', 'Providencia'].map((s) => {
                const act = sucursal === s;
                return (
                  <Pressable
                    key={s}
                    onPress={() => setSucursal(s)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: act ? colors.BzCardInner : 'transparent',
                      borderWidth: act ? 1 : 0,
                      borderColor: colors.BzBorder,
                    }}
                  >
                    <Text style={{ color: act ? colors.BzText : colors.BzMuted, fontSize: 12, fontWeight: '600' }}>
                      {s === 'TODAS' ? 'Todas' : s}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View
              style={{
                flexDirection: 'row',
                backgroundColor: colors.BzCard,
                borderWidth: 1,
                borderColor: colors.BzBorder,
                borderRadius: 999,
                padding: 4,
                gap: 2,
              }}
            >
              {(
                [
                  ['hoy', 'Hoy'],
                  ['semana', 'Semana'],
                  ['mes', 'Mes'],
                ] as [PeriodoReporte, string][]
              ).map(([pKey, pLabel]) => {
                const act = periodo === pKey;
                return (
                  <Pressable
                    key={pKey}
                    onPress={() => setPeriodo(pKey)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: act ? '#E2C46D' : 'transparent',
                    }}
                  >
                    <Text style={{ color: act ? '#0D0D0D' : colors.BzMuted, fontSize: 12, fontWeight: '700' }}>
                      {pLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* ==================== TAB 1: DASHBOARD ==================== */}
      {tab === 'dashboard' && (
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 14 }}>
            <View style={[styles.reportCard, { flex: 1.5, backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
              <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Ventas</Text>
              <Text style={{ color: colors.BzSuccess, fontSize: isDesktop ? 42 : 34, fontWeight: '800', marginVertical: 6 }}>
                {formatMoney(ventaTotal)}
              </Text>
              {renderDelta(cfg.d[0])}
            </View>

            <View style={{ flex: 2, flexDirection: 'row', gap: 14 }}>
              <View style={[styles.reportCard, { flex: 1, backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
                <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Citas</Text>
                <Text style={{ color: colors.BzText, fontSize: 32, fontWeight: '800', marginVertical: 8 }}>
                  {citasTotal}
                </Text>
                {renderDelta(cfg.d[1])}
              </View>

              <View style={[styles.reportCard, { flex: 1, backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
                <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Ticket promedio</Text>
                <Text style={{ color: '#E2C46D', fontSize: 32, fontWeight: '800', marginVertical: 8 }}>
                  {formatMoney(ticketPromedio)}
                </Text>
                {renderDelta(cfg.d[2])}
              </View>
            </View>
          </View>

          <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16 }}>
            <View style={[styles.reportCard, { flex: 1, backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
              <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '700', marginBottom: 14 }}>Sucursales</Text>
              {sucFiltradas.map((s, idx) => {
                const pct = Math.min(100, (s.venta / maxSuc) * 100);
                return (
                  <View key={s.nombre} style={{ paddingVertical: 10, borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: colors.BzBorder }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }}>{s.nombre}</Text>
                      <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '700' }}>
                        {formatMoney(s.venta)}{' '}
                        <Text style={{ color: colors.BzMuted, fontSize: 12, fontWeight: '400' }}>
                          {s.citas} citas
                        </Text>
                      </Text>
                    </View>
                    <View style={{ height: 7, backgroundColor: '#222', borderRadius: 99, overflow: 'hidden' }}>
                      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: idx === 0 ? '#E2C46D' : '#8a7640', borderRadius: 99 }} />
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={[styles.reportCard, { flex: 1, backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
                <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '700' }}>Barberos</Text>
                <Text style={{ color: colors.BzMuted, fontSize: 12 }}>por ventas</Text>
              </View>
              {barFiltrados.length === 0 ? (
                <Text style={{ color: colors.BzMuted, fontSize: 13, paddingVertical: 12 }}>
                  Sin barberos registrados en base de datos.
                </Text>
              ) : (
                barFiltrados.map((b, idx) => {
                  const pct = Math.min(100, (b.venta / maxBar) * 100);
                  return (
                    <View key={b.id} style={{ paddingVertical: 10, borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: colors.BzBorder }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }}>{b.nombre}</Text>
                        <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '700' }}>
                          {formatMoney(b.venta)}{' '}
                          <Text style={{ color: colors.BzMuted, fontSize: 12, fontWeight: '400' }}>
                            {b.citas} citas
                          </Text>
                        </Text>
                      </View>
                      <View style={{ height: 7, backgroundColor: '#222', borderRadius: 99, overflow: 'hidden' }}>
                        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: idx === 0 ? '#E2C46D' : '#8a7640', borderRadius: 99 }} />
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>

          <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16 }}>
            <View style={[styles.reportCard, { flex: 1, backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
              <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '700', marginBottom: 14 }}>Servicios top</Text>
              {serviciosLocales.slice(0, 3).map((s, idx) => (
                <View key={s.id} style={{ paddingVertical: 10, borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: colors.BzBorder }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }}>{s.nombre}</Text>
                    <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '700' }}>{formatMoney(0)}</Text>
                  </View>
                  <View style={{ height: 7, backgroundColor: '#222', borderRadius: 99, overflow: 'hidden' }}>
                    <View style={{ width: '0%', height: '100%', backgroundColor: '#E2C46D', borderRadius: 99 }} />
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.reportCard, { flex: 1, backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
              <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '700', marginBottom: 14 }}>Formas de pago</Text>
              {PAGOS_REPORTE.map(([nombre, pct, col]) => (
                <View key={nombre} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: col }} />
                    <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }}>{nombre}</Text>
                  </View>
                  <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '700' }}>
                    {formatMoney(0)}{' '}
                    <Text style={{ color: colors.BzMuted, fontSize: 12, fontWeight: '400' }}>{pct}%</Text>
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* ==================== TAB 2: PRECIOS Y COMISIONES ==================== */}
      {tab === 'precios' && (
        <View style={{ gap: 16 }}>
          <View style={[styles.reportCard, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 6 }}>
              <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '700' }}>Catálogo y tarifas</Text>
              <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Toca un precio para editar</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ minWidth: isDesktop ? '100%' : 550 }}>
                <View style={[styles.tableRow, { borderBottomColor: colors.BzBorder }]}>
                  <Text style={[styles.th, { flex: 1.5, minWidth: 160, color: colors.BzMuted }]}>CONCEPTO</Text>
                  <Text style={[styles.th, { width: 100, color: colors.BzMuted }]}>TIPO</Text>
                  <Text style={[styles.th, { width: 90, color: colors.BzMuted }]}>DURACIÓN</Text>
                  <Text style={[styles.th, { width: 115, textAlign: 'right', color: colors.BzMuted }]}>PRECIO</Text>
                </View>

                {catalogoCombinado.map((item, idx) => (
                  <View
                    key={item.id}
                    style={[
                      styles.tableRow,
                      idx < catalogoCombinado.length - 1 && { borderBottomColor: colors.BzBorder },
                    ]}
                  >
                    <Text style={{ flex: 1.5, minWidth: 160, color: colors.BzText, fontSize: 13, fontWeight: '600' }}>
                      {item.nombre}
                    </Text>
                    <View style={{ width: 100 }}>
                      <View
                        style={[
                          styles.pillBadge,
                          {
                            alignSelf: 'flex-start',
                            borderColor: item.tipo === 'Servicio' ? '#6B5B2E' : '#265936',
                            backgroundColor: item.tipo === 'Servicio' ? '#211D12' : '#132419',
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: item.tipo === 'Servicio' ? '#E2C46D' : colors.BzSuccess }}>
                          {item.tipo}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ width: 90, color: colors.BzMuted, fontSize: 13 }}>{item.duracion}</Text>
                    <View style={{ width: 115, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
                      <Text style={{ color: colors.BzMuted, fontSize: 13 }}>$</Text>
                      <TextInput
                        value={String(item.precio)}
                        onChangeText={(txt) => actualizarPrecioItem(item, txt)}
                        keyboardType="numeric"
                        style={{
                          width: 72,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: colors.BzBg,
                          borderWidth: 1,
                          borderColor: colors.BzBorder,
                          color: '#E2C46D',
                          fontWeight: '700',
                          fontSize: 13,
                          textAlign: 'right',
                          paddingHorizontal: 8,
                        }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={[styles.reportCard, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '700' }}>Comisiones y propinas</Text>
              <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Periodo: {periodo.toUpperCase()}</Text>
            </View>

            {barFiltrados.length === 0 ? (
              <Text style={{ color: colors.BzMuted, fontSize: 13 }}>
                No hay barberos registrados todavía.
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ minWidth: isDesktop ? '100%' : 660 }}>
                  <View style={[styles.tableRow, { borderBottomColor: colors.BzBorder }]}>
                    <Text style={[styles.th, { flex: 1.2, minWidth: 120, color: colors.BzMuted }]}>BARBERO</Text>
                    <Text style={[styles.th, { width: 105, color: colors.BzMuted }]}>SUCURSAL</Text>
                    <Text style={[styles.th, { width: 95, color: colors.BzMuted }]}>% COM.</Text>
                    <Text style={[styles.th, { width: 115, textAlign: 'right', color: colors.BzMuted }]}>VENTA</Text>
                    <Text style={[styles.th, { width: 110, textAlign: 'right', color: colors.BzMuted }]}>COMISIÓN</Text>
                    <Text style={[styles.th, { width: 100, textAlign: 'right', color: colors.BzMuted }]}>PROPINAS</Text>
                    <Text style={[styles.th, { width: 120, textAlign: 'right', color: colors.BzMuted }]}>TOTAL PAGAR</Text>
                  </View>

                  {barFiltrados.map((b, idx) => {
                    const com = b.venta * (b.pctCom / 100);
                    return (
                      <View
                        key={b.id}
                        style={[
                          styles.tableRow,
                          idx < barFiltrados.length - 1 && { borderBottomColor: colors.BzBorder },
                        ]}
                      >
                        <Text style={{ flex: 1.2, minWidth: 120, color: colors.BzText, fontSize: 13, fontWeight: '600' }}>
                          {b.nombre}
                        </Text>
                        <Text style={{ width: 105, color: colors.BzMuted, fontSize: 13 }}>{b.suc}</Text>
                        <View style={{ width: 95 }}>
                          <View style={[styles.pillBadge, { alignSelf: 'flex-start', borderColor: '#6B5B2E', backgroundColor: '#211D12' }]}>
                            <Text style={{ color: '#E2C46D', fontSize: 11, fontWeight: '700' }}>{b.pctCom}%</Text>
                          </View>
                        </View>
                        <Text style={{ width: 115, textAlign: 'right', color: colors.BzText, fontSize: 13 }}>{formatMoney(b.venta)}</Text>
                        <Text style={{ width: 110, textAlign: 'right', color: colors.BzText, fontSize: 13 }}>{formatMoney(com)}</Text>
                        <Text style={{ width: 100, textAlign: 'right', color: colors.BzSuccess, fontSize: 13 }}>+{formatMoney(b.propina)}</Text>
                        <Text style={{ width: 120, textAlign: 'right', color: '#E2C46D', fontSize: 13, fontWeight: '800' }}>
                          {formatMoney(com + b.propina)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      )}

      {/* ==================== TAB 3: SUCURSALES Y EQUIPO ==================== */}
      {tab === 'sucursales' && (
        <View style={{ gap: 16 }}>
          <View style={[styles.reportCard, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '700' }}>
                Equipo y turnos ({eqFiltrado.length})
              </Text>
              <Pressable
                onPress={onNewUser}
                style={{
                  backgroundColor: '#E2C46D',
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 999,
                }}
              >
                <Text style={{ color: '#0D0D0D', fontSize: 12, fontWeight: '700' }}>+ Nuevo integrante</Text>
              </Pressable>
            </View>

            {eqFiltrado.length === 0 ? (
              <Text style={{ color: colors.BzMuted, fontSize: 13, paddingVertical: 14 }}>
                No hay empleados registrados en la base de datos. Usa "+ Nuevo integrante" para dar de alta a tu equipo.
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ minWidth: isDesktop ? '100%' : 680 }}>
                  <View style={[styles.tableRow, { borderBottomColor: colors.BzBorder }]}>
                    <Text style={[styles.th, { flex: 1.2, minWidth: 120, color: colors.BzMuted }]}>INTEGRANTE</Text>
                    <Text style={[styles.th, { width: 120, color: colors.BzMuted }]}>ROL</Text>
                    <Text style={[styles.th, { width: 105, color: colors.BzMuted }]}>SUCURSAL</Text>
                    <Text style={[styles.th, { width: 125, color: colors.BzMuted }]}>HORARIO</Text>
                    <Text style={[styles.th, { width: 70, color: colors.BzMuted }]}>CITAS</Text>
                    <Text style={[styles.th, { width: 105, color: colors.BzMuted }]}>ESTADO</Text>
                    <Text style={[styles.th, { width: 125, textAlign: 'right', color: colors.BzMuted }]}>ACCIÓN</Text>
                  </View>

                  {eqFiltrado.map((e, idx) => {
                    const esActivo = e.estado === 'Activo';
                    const esCorte = e.estado === 'En corte';
                    return (
                      <View
                        key={e.id}
                        style={[
                          styles.tableRow,
                          idx < eqFiltrado.length - 1 && { borderBottomColor: colors.BzBorder },
                        ]}
                      >
                        <Text style={{ flex: 1.2, minWidth: 120, color: colors.BzText, fontSize: 13, fontWeight: '600' }}>
                          {e.nombre}
                        </Text>
                        <Text style={{ width: 120, color: colors.BzText, fontSize: 13 }}>{e.rol}</Text>
                        <Text style={{ width: 105, color: colors.BzMuted, fontSize: 13 }}>{e.suc}</Text>
                        <Text style={{ width: 125, color: colors.BzMuted, fontSize: 13 }}>{e.horario}</Text>
                        <Text style={{ width: 70, color: colors.BzText, fontSize: 13 }}>{e.citas || '—'}</Text>
                        <View style={{ width: 105 }}>
                          <View
                            style={[
                              styles.pillBadge,
                              {
                                alignSelf: 'flex-start',
                                borderColor: esActivo ? '#265936' : esCorte ? '#6B5B2E' : '#6B2B2B',
                                backgroundColor: esActivo ? '#132419' : esCorte ? '#211D12' : '#241414',
                              },
                            ]}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: '700',
                                color: esActivo ? colors.BzSuccess : esCorte ? '#E2C46D' : colors.BzDanger,
                              }}
                            >
                              {e.estado}
                            </Text>
                          </View>
                        </View>
                        <View style={{ width: 125, alignItems: 'flex-end' }}>
                          <Pressable
                            onPress={() => cambiarEstadoEmpleado(e.id, e.nombre)}
                            style={{
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              borderRadius: 8,
                              backgroundColor: colors.BzCardInner,
                              borderWidth: 1,
                              borderColor: colors.BzBorder,
                            }}
                          >
                            <Text style={{ color: colors.BzText, fontSize: 11, fontWeight: '600' }}>Cambiar estado</Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      )}

      {/* ==================== TAB 4: BASE DE DATOS Y APP CLIENTE ==================== */}
      {tab === 'basedatos' && <DuenoBaseDatosView onNewUser={onNewUser} />}
    </ScrollView>
  );
};

/* ---------- 1. Pestaña Inicio (Equipo: Dueño, Encargado, Cajero/Recepción) ---------- */

const VistaInicioResumen: React.FC<{
  usuario: UsuarioBz;
  citaConfirmada: string | null;
  carritoCount: number;
  onIrAgendar: () => void;
  onIrCaja: () => void;
  onIrInventario: () => void;
  onIrReportesDueno: () => void;
  onIrComisiones: () => void;
  onIrTienda: () => void;
  onIrRol: () => void;
  onIrHorariosPermisos: (tab?: 'HORARIOS' | 'PERMISOS') => void;
  onNewUser: () => void;
}> = ({
  usuario,
  citaConfirmada,
  onIrAgendar,
  onIrCaja,
  onIrInventario,
  onIrReportesDueno,
  onIrComisiones,
  onIrRol,
  onIrHorariosPermisos,
  onNewUser,
}) => {
  const { colors } = useBzTheme();
  const { isDesktop } = useDesktopLayout();
  const { citasEquipo } = useAgenda();
  const { permisos } = useHorarios();
  const { empleados, productos, actualizarEmpleado } = useCatalogoConfig();

  const equipoCompleto = useMemo(
    () => empleados.filter((e) => e.rol !== 'Dueño'),
    [empleados],
  );

  const productosStockBajo = useMemo(
    () => productos.filter((p) => p.activo && p.stock <= p.stockMinimo),
    [productos],
  );

  const esCliente = usuario.rol === RolSesion.CLIENTE;
  const esBarbero = usuario.rol === RolSesion.BARBERO;
  const esDueno = usuario.rol === RolSesion.DUENO;
  const esGerencia = usuario.rol === RolSesion.DUENO || usuario.rol === RolSesion.ENCARGADO;
  const tieneCaja = [RolSesion.DUENO, RolSesion.ENCARGADO, RolSesion.RECEPCION].includes(usuario.rol);

  const hoy = hoyISO();
  const citasHoy = useMemo(
    () =>
      citasEquipo
        .filter((c) => c.fechaISO === hoy && c.estado !== 'CANCELADA')
        .sort((a, b) => minutosDelDia(a) - minutosDelDia(b)),
    [citasEquipo, hoy],
  );

  const [mostrarTema, setMostrarTema] = useState(false);
  const [mostrarNotifs, setMostrarNotifs] = useState(false);
  const [notifs, setNotifs] = useState<BzNotificacion[]>(() => notificacionesIniciales(usuario.rol, colors));
  const [rolDropdownId, setRolDropdownId] = useState<string | null>(null);

  useEffect(() => {
    setNotifs(notificacionesIniciales(usuario.rol, colors));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario.rol, colors.BzSuccess, colors.BzWarning]);

  /* ===== DISEÑO ESCRITORIO LIMPIO Y SIMPLE ===== */
  if (isDesktop && !esCliente && !esBarbero) {
    const rolesDisponibles: readonly ('Barbero' | 'Recepción/Caja' | 'Encargado')[] =
      usuario.rol === RolSesion.DUENO
        ? ['Barbero', 'Recepción/Caja', 'Encargado']
        : ['Barbero', 'Recepción/Caja'];

    return (
      <>
        <BzAppearanceSheet visible={mostrarTema} onDismiss={() => setMostrarTema(false)} />
        <BzNotificacionesSheet
          visible={mostrarNotifs}
          items={notifs}
          onMarcarLeidas={() => setNotifs([])}
          onDismiss={() => setMostrarNotifs(false)}
        />

        <View style={{ gap: 18 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <View>
              <Text style={[BzTypography.title, { color: colors.BzText, fontSize: 26, fontWeight: '700' }]}>
                {fechaLargaHoy()}
              </Text>
              <Text style={{ color: colors.BzMuted, fontSize: 13, marginTop: 2 }}>
                Hola, {usuario.nombre} · {esDueno ? 'Todas las sucursales' : `Sucursal ${usuario.sucursal || 'Olivete'}`}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Pressable
                onPress={() => setMostrarNotifs(true)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: colors.BzCard,
                  borderWidth: 1,
                  borderColor: colors.BzBorder,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                    stroke="#E2C46D"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M13.73 21a2 2 0 0 1-3.46 0"
                    stroke="#E2C46D"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                {notifs.length > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 7,
                      right: 8,
                      width: 7,
                      height: 7,
                      borderRadius: 3.5,
                      backgroundColor: colors.BzDanger,
                    }}
                  />
                )}
              </Pressable>

              <Pressable
                onPress={() => setMostrarTema(true)}
                style={{
                  paddingHorizontal: 13,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: colors.BzCard,
                  borderWidth: 1,
                  borderColor: colors.BzBorder,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: colors.BzText, fontSize: 12, fontWeight: '600' }}>Tema</Text>
              </Pressable>

              {esGerencia && (
                <Pressable
                  onPress={onNewUser}
                  style={{
                    paddingHorizontal: 16,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: '#E2C46D',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#141416', fontSize: 13, fontWeight: '700' }}>
                    + Nuevo integrante
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 14 }}>
            <Pressable onPress={onIrCaja} style={{ flex: 1 }}>
              <View style={[styles.kpiCardClean, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
                <Text style={{ color: colors.BzMuted, fontSize: 12, fontWeight: '500' }}>
                  {esDueno ? 'Venta de hoy' : 'Caja del turno'}
                </Text>
                <Text style={{ color: colors.BzSuccess, fontSize: 32, fontWeight: '700', marginTop: 10 }}>
                  {formatMoney(citasHoy.reduce((s, c) => s + (c.precio || 0), 0))}
                </Text>
                <Text style={{ color: '#E2C46D', fontSize: 12, fontWeight: '600', marginTop: 6 }}>
                  Ir a caja
                </Text>
              </View>
            </Pressable>

            <Pressable onPress={onIrAgendar} style={{ flex: 1 }}>
              <View style={[styles.kpiCardClean, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
                <Text style={{ color: colors.BzMuted, fontSize: 12, fontWeight: '500' }}>Citas</Text>
                <Text style={{ color: colors.BzText, fontSize: 32, fontWeight: '700', marginTop: 28 }}>
                  {citasHoy.length}
                </Text>
              </View>
            </Pressable>

            <Pressable onPress={() => onIrHorariosPermisos('PERMISOS')} style={{ flex: 1 }}>
              <View style={[styles.kpiCardClean, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
                <Text style={{ color: colors.BzMuted, fontSize: 12, fontWeight: '500' }}>Permisos</Text>
                <Text style={{ color: '#E2C46D', fontSize: 32, fontWeight: '700', marginTop: 28 }}>
                  {permisos.length}
                </Text>
              </View>
            </Pressable>

            <Pressable onPress={onIrInventario} style={{ flex: 1 }}>
              <View style={[styles.kpiCardClean, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
                <Text style={{ color: colors.BzMuted, fontSize: 12, fontWeight: '500' }}>Stock bajo</Text>
                <Text style={{ color: colors.BzDanger, fontSize: 32, fontWeight: '700', marginTop: 28 }}>
                  {productosStockBajo.length}
                </Text>
              </View>
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
            <View style={{ flex: 1, gap: 16 }}>
              <View style={[styles.cardClean, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
                <View style={styles.cardHeaderClean}>
                  <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '700' }}>Agenda</Text>
                  <Pressable onPress={onIrAgendar}>
                    <Text style={{ color: '#E2C46D', fontSize: 12, fontWeight: '600' }}>Ver todo</Text>
                  </Pressable>
                </View>

                {citasHoy.length > 0 ? (
                  citasHoy.slice(0, 4).map((c, idx) => (
                    <View
                      key={c.id}
                      style={[
                        styles.listRowClean,
                        idx > 0 && { borderTopWidth: 1, borderTopColor: colors.BzBorder },
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                        <View
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: 3.5,
                            backgroundColor: c.estado === 'EN_SERVICIO' ? '#E2C46D' : colors.BzSuccess,
                          }}
                        />
                        <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '700', width: 44 }}>
                          {c.horaTexto}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '600' }}>
                            {c.clienteNombre}
                          </Text>
                          <Text style={{ color: colors.BzMuted, fontSize: 12, marginTop: 1 }}>
                            {c.servicio}
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        onPress={onIrAgendar}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: colors.BzBorder,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: colors.BzMuted, fontSize: 12 }}>✓</Text>
                      </Pressable>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: colors.BzMuted, fontSize: 12, paddingVertical: 8 }}>
                    Sin citas programadas para hoy.
                  </Text>
                )}
              </View>

              {tieneCaja && (
                <View style={[styles.cardClean, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
                  <View style={styles.cardHeaderClean}>
                    <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '700' }}>Stock bajo</Text>
                    <Pressable onPress={onIrInventario}>
                      <Text style={{ color: '#E2C46D', fontSize: 12, fontWeight: '600' }}>Ver stock</Text>
                    </Pressable>
                  </View>

                  {productosStockBajo.length === 0 ? (
                    <Text style={{ color: colors.BzMuted, fontSize: 12, paddingVertical: 6 }}>
                      Todo el inventario tiene stock suficiente.
                    </Text>
                  ) : (
                    productosStockBajo.slice(0, 4).map((prod, idx) => (
                      <View
                        key={prod.id}
                        style={[
                          styles.listRowClean,
                          idx > 0 && { borderTopWidth: 1, borderTopColor: colors.BzBorder },
                        ]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.BzDanger }} />
                          <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '600' }}>
                            {prod.nombre}
                          </Text>
                        </View>
                        <View style={[styles.pillBadge, { borderColor: '#6B2B2B', backgroundColor: '#241414' }]}>
                          <Text style={{ color: colors.BzDanger, fontSize: 11, fontWeight: '600' }}>
                            {prod.stock} de {prod.stockMinimo}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}

              <View style={[styles.cardClean, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
                <View style={styles.cardHeaderClean}>
                  <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '700' }}>Permisos de hoy</Text>
                  <Pressable onPress={() => onIrHorariosPermisos(esGerencia ? 'PERMISOS' : 'HORARIOS')}>
                    <Text style={{ color: '#E2C46D', fontSize: 12, fontWeight: '600' }}>
                      {esGerencia ? 'Gestionar' : 'Ver horarios'}
                    </Text>
                  </Pressable>
                </View>

                {permisos.length === 0 ? (
                  <Text style={{ color: colors.BzMuted, fontSize: 12, paddingVertical: 6 }}>
                    Sin permisos activos hoy.
                  </Text>
                ) : (
                  permisos.map((perm, idx) => (
                    <View
                      key={perm.id}
                      style={[
                        styles.listRowClean,
                        idx > 0 && { borderTopWidth: 1, borderTopColor: colors.BzBorder },
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <View
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: 3.5,
                            backgroundColor: perm.esHoy ? '#E2C46D' : colors.BzSuccess,
                          }}
                        />
                        <View>
                          <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '600' }}>
                            {perm.empleadoNombre}
                          </Text>
                          <Text style={{ color: colors.BzMuted, fontSize: 11, marginTop: 1 }}>
                            {perm.fechaTexto}
                          </Text>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View
                          style={[
                            styles.pillBadge,
                            perm.esHoy
                              ? { borderColor: '#6B5B2E', backgroundColor: '#211D12' }
                              : { borderColor: '#265936', backgroundColor: '#132419' },
                          ]}
                        >
                          <Text
                            style={{
                              color: perm.esHoy ? '#E2C46D' : colors.BzSuccess,
                              fontSize: 11,
                              fontWeight: '600',
                            }}
                          >
                            {perm.tipo}
                          </Text>
                        </View>

                        <Pressable
                          onPress={() => onIrHorariosPermisos('PERMISOS')}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: colors.BzBorder,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ color: colors.BzMuted, fontSize: 11 }}>✕</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>

            <View style={{ flex: 1, gap: 16 }}>
              {esGerencia && (
                <View style={[styles.cardClean, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
                  <View style={styles.cardHeaderClean}>
                    <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '700' }}>Equipo</Text>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 6,
                        backgroundColor: colors.BzCardInner,
                        borderWidth: 1,
                        borderColor: colors.BzBorder,
                      }}
                    >
                      <Text style={{ color: colors.BzMuted, fontSize: 11, fontWeight: '600' }}>
                        {equipoCompleto.length}
                      </Text>
                    </View>
                  </View>

                  {equipoCompleto.length === 0 ? (
                    <Text style={{ color: colors.BzMuted, fontSize: 12, paddingVertical: 8 }}>
                      Sin integrantes registrados aún. Presiona "+ Nuevo integrante" para agregar barberos o personal.
                    </Text>
                  ) : (
                    equipoCompleto.map((emp, idx) => {
                      const abierto = rolDropdownId === emp.id;
                      return (
                        <View
                          key={emp.id}
                          style={[
                            { paddingVertical: 11 },
                            idx > 0 && { borderTopWidth: 1, borderTopColor: colors.BzBorder },
                          ]}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                              <View
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: 17,
                                  backgroundColor: colors.BzCardInner,
                                  borderWidth: 1,
                                  borderColor: colors.BzBorder,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Text style={{ color: colors.BzText, fontSize: 11, fontWeight: '700' }}>
                                  {obtenerIniciales(emp.nombre)}
                                </Text>
                              </View>
                              <View>
                                <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '600' }}>
                                  {emp.nombre}
                                </Text>
                                <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                                  {emp.sucursal}
                                </Text>
                              </View>
                            </View>

                            <Pressable
                              onPress={() => setRolDropdownId(abierto ? null : emp.id)}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 10,
                                backgroundColor: colors.BzCardInner,
                                borderWidth: 1,
                                borderColor: abierto ? '#E2C46D' : colors.BzBorder,
                              }}
                            >
                              <Text style={{ color: colors.BzText, fontSize: 12, fontWeight: '500' }}>
                                {emp.rol.split('/')[0]}
                              </Text>
                              <Text style={{ color: colors.BzMuted, fontSize: 10 }}>⌄</Text>
                            </Pressable>
                          </View>

                          {abierto && (
                            <View style={{ flexDirection: 'row', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
                              {rolesDisponibles.map((rolOpcion) => {
                                const activo = emp.rol === rolOpcion;
                                return (
                                  <Pressable
                                    key={rolOpcion}
                                    onPress={() => {
                                      actualizarEmpleado(emp.id, { rol: rolOpcion });
                                      setRolDropdownId(null);
                                    }}
                                    style={{
                                      paddingHorizontal: 10,
                                      paddingVertical: 5,
                                      borderRadius: 8,
                                      backgroundColor: activo ? '#E2C46D' : colors.BzBg,
                                      borderWidth: 1,
                                      borderColor: activo ? '#E2C46D' : colors.BzBorder,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: activo ? '#141416' : colors.BzText,
                                        fontSize: 11,
                                        fontWeight: activo ? '700' : '400',
                                      }}
                                    >
                                      {rolOpcion.split('/')[0]}
                                    </Text>
                                  </Pressable>
                                );
                              })}
                            </View>
                          )}
                        </View>
                      );
                    })
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </>
    );
  }

  /* ===== VISTA MÓVIL ===== */
  return (
    <>
      <BzAppearanceSheet visible={mostrarTema} onDismiss={() => setMostrarTema(false)} />
      <BzNotificacionesSheet
        visible={mostrarNotifs}
        items={notifs}
        onMarcarLeidas={() => setNotifs([])}
        onDismiss={() => setMostrarNotifs(false)}
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 16 }}>
        <BzHeader
          saludo={`Hola, ${usuario.nombre}`}
          rolEtiqueta={usuario.rol}
          notificaciones={notifs.length}
          onRol={onIrRol}
          onCampana={() => setMostrarNotifs(true)}
          onTema={() => setMostrarTema(true)}
        />

        {esDueno && (
          <TarjetaSeccion
            titulo="RESUMEN GLOBAL · 3 SUCURSALES"
            accionTexto="Ver reportes y BD ›"
            onAccion={onIrReportesDueno}
          >
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <MiniMetrica etiqueta="Venta hoy" valor={formatMoney(citasHoy.reduce((s, c) => s + (c.precio || 0), 0))} />
              <MiniMetrica etiqueta="Citas totales" valor={String(citasHoy.length)} />
            </View>
          </TarjetaSeccion>
        )}

        {esGerencia && (
          <TarjetaSeccion
            titulo="HORARIOS Y TURNOS DEL PERSONAL"
            accionTexto="Abrir panel ›"
            onAccion={() => onIrHorariosPermisos('HORARIOS')}
          >
            <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
              Crea o sube los horarios semanales de Barberos y Cajeros por separado, envíalos en Word por WhatsApp o registra permisos.
            </Text>
            <BotonMenuPrimario
              texto="Crear / Subir Horarios (Barberos y Cajeros)"
              onPress={() => onIrHorariosPermisos('HORARIOS')}
            />
            <BotonMenuSecundario
              texto={`Permisos y días libres (${permisos.length})`}
              onPress={() => onIrHorariosPermisos('PERMISOS')}
            />
          </TarjetaSeccion>
        )}

        {esGerencia && (
          <TarjetaSeccion
            titulo={`EQUIPO Y ROLES (${equipoCompleto.length})`}
            accionTexto="+ Nuevo Barbero / Cajero ›"
            onAccion={onNewUser}
          >
            <BotonMenuPrimario
              texto="Registrar nuevo Barbero / Cajero"
              onPress={onNewUser}
            />

            {equipoCompleto.length === 0 ? (
              <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
                Sin integrantes registrados aún.
              </Text>
            ) : (
              equipoCompleto.map((emp, idx) => {
                const rolesMovil: readonly ('Barbero' | 'Recepción/Caja' | 'Encargado')[] =
                  usuario.rol === RolSesion.DUENO
                    ? ['Barbero', 'Recepción/Caja', 'Encargado']
                    : ['Barbero', 'Recepción/Caja'];

                return (
                  <View key={emp.id} style={{ gap: 6, paddingTop: idx > 0 ? 6 : 2 }}>
                    {idx > 0 && <View style={{ height: 1, backgroundColor: colors.BzBorder, marginBottom: 4 }} />}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '600' }}>
                        {emp.nombre}
                      </Text>
                      <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                        {emp.rol}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                      {rolesMovil.map((rolOpcion) => {
                        const activo = emp.rol === rolOpcion;
                        return (
                          <Pressable
                            key={rolOpcion}
                            onPress={() => actualizarEmpleado(emp.id, { rol: rolOpcion })}
                            style={{
                              paddingHorizontal: 10,
                              paddingVertical: 5,
                              borderRadius: 12,
                              backgroundColor: activo ? colors.BzText : colors.BzCardInner,
                              borderWidth: 1,
                              borderColor: activo ? colors.BzText : colors.BzBorder,
                            }}
                          >
                            <Text
                              style={{
                                color: activo ? colors.BzBg : colors.BzText,
                                fontSize: 11,
                                fontWeight: activo ? '600' : '400',
                              }}
                            >
                              {rolOpcion.split('/')[0]}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })
            )}
          </TarjetaSeccion>
        )}

        {!esCliente && (
          <TarjetaSeccion
            titulo="PERMISOS Y DESCANSOS DEL DÍA"
            accionTexto={esGerencia ? 'Editar / Eliminar ›' : 'Ver horarios ›'}
            onAccion={() => onIrHorariosPermisos(esGerencia ? 'PERMISOS' : 'HORARIOS')}
          >
            {permisos.length === 0 ? (
              <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
                Sin permisos pendientes · Todo el equipo activo.
              </Text>
            ) : (
              permisos.map((perm, idx) => (
                <View key={perm.id}>
                  {idx > 0 && <View style={{ height: 1, backgroundColor: colors.BzBorder, marginVertical: 4 }} />}
                  <FilaResumen
                    titulo={`${perm.empleadoNombre} (${perm.rolEtiqueta.split('/')[0]}) · ${perm.tipo}`}
                    subtitulo={`${perm.fechaTexto} · ${perm.motivo}`}
                    colorPunto={perm.esHoy ? colors.BzWarning : colors.BzSuccess}
                  />
                </View>
              ))
            )}
          </TarjetaSeccion>
        )}

        <TarjetaSeccion
          titulo={esCliente ? 'TU PRÓXIMA CITA' : `VISTAZO DE AGENDA · ${usuario.sucursal.toUpperCase()}`}
          accionTexto={esCliente ? 'Agendar ›' : 'Ver agenda ›'}
          onAccion={onIrAgendar}
        >
          {esCliente ? (
            citaConfirmada ? (
              <>
                <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '500' }}>{citaConfirmada}</Text>
                <Text style={{ color: colors.BzSuccess, fontSize: 12 }}>
                  Sucursal {usuario.sucursal || 'Olivete'} · Confirmada
                </Text>
              </>
            ) : (
              <>
                <Text style={{ color: colors.BzText, fontSize: 14 }}>No tienes citas programadas</Text>
                <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
                  Elige servicio, barbero y horario en menos de 1 minuto.
                </Text>
                <View style={{ height: 4 }} />
                <BotonMenuPrimario texto="Agendar cita ahora" onPress={onIrAgendar} />
              </>
            )
          ) : citasHoy.length === 0 ? (
            <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Sin citas agendadas para hoy.</Text>
          ) : (
            citasHoy.slice(0, 3).map((c, idx) => (
              <View key={c.id}>
                {idx > 0 && <View style={{ height: 1, backgroundColor: colors.BzBorder, marginVertical: 4 }} />}
                <FilaResumen
                  titulo={`${c.horaTexto} · ${c.clienteNombre}`}
                  subtitulo={`${c.servicio} · ${c.barberoNombre}`}
                  colorPunto={colors.BzSuccess}
                />
              </View>
            ))
          )}
        </TarjetaSeccion>

        {esCliente ? (
          <TarjetaSeccion titulo="TARJETA DE LEALTAD" accionTexto="0 / 10 sellos" onAccion={onIrRol}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {Array.from({ length: 10 }).map((_, idx) => (
                <View
                  key={idx}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: colors.BzCardInner,
                  }}
                />
              ))}
            </View>
            <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
              Acumula 10 visitas para ganar tu corte de cortesía.
            </Text>
          </TarjetaSeccion>
        ) : (
          <TarjetaSeccion
            titulo="RESUMEN DEL DÍA"
            accionTexto={esBarbero ? 'Ver productividad ›' : tieneCaja ? 'Ir a caja ›' : 'Mi rol ›'}
            onAccion={esBarbero ? onIrComisiones : tieneCaja ? onIrCaja : onIrRol}
          >
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <MiniMetrica etiqueta="Citas hoy" valor={String(citasHoy.length)} />
              <MiniMetrica
                etiqueta={esBarbero ? 'Generado' : 'Caja turno'}
                valor={formatMoney(citasHoy.reduce((s, c) => s + (c.precio || 0), 0))}
              />
            </View>
          </TarjetaSeccion>
        )}

        {tieneCaja && (
          <TarjetaSeccion titulo="ALERTAS DE INVENTARIO" accionTexto="Ver stock ›" onAccion={onIrInventario}>
            {productosStockBajo.length === 0 ? (
              <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Todo el stock está en niveles óptimos.</Text>
            ) : (
              productosStockBajo.slice(0, 3).map((prod, idx) => (
                <View key={prod.id}>
                  {idx > 0 && <View style={{ height: 1, backgroundColor: colors.BzBorder, marginVertical: 4 }} />}
                  <FilaResumen
                    titulo={prod.nombre}
                    subtitulo={`Quedan ${prod.stock} pz (mínimo ${prod.stockMinimo})`}
                    colorPunto={colors.BzWarning}
                  />
                </View>
              ))
            )}
          </TarjetaSeccion>
        )}
      </ScrollView>
    </>
  );
};

/* ---------- 2. Nueva cita del EQUIPO ---------- */

const SLOTS_EQUIPO: number[] = Array.from({ length: 20 }, (_, i) => 600 + i * 30);

const VistaAgendar: React.FC<{
  usuario: UsuarioBz;
  citasEquipo: CitaEquipo[];
  citaActual: string | null;
  onVolverAgenda: () => void;
  onCrearCita: (cita: CitaEquipo, resumen: string) => void;
}> = ({ usuario, citasEquipo, citaActual, onVolverAgenda, onCrearCita }) => {
  const { colors } = useBzTheme();
  const { empleados } = useCatalogoConfig();
  const hoy = hoyISO();
  const sucursal =
    usuario.sucursal && usuario.sucursal !== 'Todas' ? normalizarSucursal(usuario.sucursal) : 'Olivete';

  const barberosActivos = useMemo(
    () => empleados.filter((e) => e.activo && e.rol === 'Barbero'),
    [empleados],
  );

  const [servicioSel, setServicioSel] = useState(0);
  const [barberoSel, setBarberoSel] = useState<string>(usuario.rol === RolSesion.BARBERO ? usuario.id : 'ANY');
  const [slotSel, setSlotSel] = useState<number | null>(null);
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState<string | null>(null);

  const servicioActual = SERVICIOS_CATALOGO[servicioSel] ?? SERVICIOS_CATALOGO[0];

  const hayChoque = (barberoId: string, inicioMin: number): boolean =>
    citasEquipo.some(
      (c) =>
        c.barberoId === barberoId &&
        c.fechaISO === hoy &&
        c.estado !== 'CANCELADA' &&
        inicioMin < minutosDelDia(c) + c.duracionMin &&
        minutosDelDia(c) < inicioMin + servicioActual.duracionMin,
    );

  const estaOcupado = (inicioMin: number): boolean =>
    barberoSel === 'ANY'
      ? barberosActivos.length === 0 || barberosActivos.every((b) => hayChoque(b.id, inicioMin))
      : hayChoque(barberoSel, inicioMin);

  const slotValido = slotSel !== null && !estaOcupado(slotSel) ? slotSel : null;

  const confirmar = () => {
    if (!nombreCliente.trim()) return setError('Escribe el nombre del cliente');
    if (barberosActivos.length === 0) return setError('No hay barberos registrados aún');
    if (slotValido === null) return setError('Elige una hora disponible');

    const barbero =
      barberoSel === 'ANY'
        ? barberosActivos.find((b) => !hayChoque(b.id, slotValido))
        : barberosActivos.find((b) => b.id === barberoSel);
    if (!barbero) return setError('No hay barberos libres a esa hora');

    const hora24 = Math.floor(slotValido / 60);
    const minuto = slotValido % 60;
    const tel = telefono.replace(/\D/g, '');
    const folio = folioLibre(citasEquipo.map((c) => c.folio));

    const nueva: CitaEquipo = {
      id: `cita-${folio}`,
      folio,
      fechaISO: hoy,
      hora24,
      minuto,
      horaTexto: horaTextoDe(hora24, minuto),
      duracionMin: servicioActual.duracionMin,
      clienteId: tel.length === 10 ? `c-${tel}` : `ext-${folio}`,
      clienteNombre: nombreCliente.trim(),
      telefono: tel.length > 0 ? tel : 'Sin teléfono',
      servicio: servicioActual.nombre,
      precio: servicioActual.precio,
      barberoId: barbero.id,
      barberoNombre: barbero.nombre,
      sucursal,
      estado: 'CONFIRMADA',
      origen: 'RECEPCION',
      notasCliente: '',
      notasTecnicas: '',
    };

    onCrearCita(
      nueva,
      `${nombreCliente.trim()} · ${servicioActual.nombre} · ${nueva.horaTexto} con ${barbero.nombre}`,
    );
    setNombreCliente('');
    setTelefono('');
    setSlotSel(null);
    setError(null);
  };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 14 }}
    >
      <Pressable onPress={onVolverAgenda}>
        <Text style={{ color: colors.BzMuted, fontSize: 13 }}>‹ Volver a agenda</Text>
      </Pressable>

      <Text style={[BzTypography.title, { color: colors.BzText, fontSize: 22 }]}>Nueva cita</Text>
      <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Sucursal {sucursal} · Hoy</Text>

      {citaActual && (
        <View
          style={{
            padding: 12,
            borderRadius: 12,
            backgroundColor: colors.BzCard,
            borderWidth: 1,
            borderColor: colors.BzSuccess,
          }}
        >
          <Text style={{ color: colors.BzSuccess, fontSize: 11, fontWeight: '600' }}>Última cita registrada</Text>
          <Text style={{ color: colors.BzText, fontSize: 13 }}>{citaActual}</Text>
        </View>
      )}

      <Text style={[BzTypography.label, { color: colors.BzMuted }]}>1. CLIENTE</Text>
      <TextInput
        value={nombreCliente}
        onChangeText={(t) => {
          setNombreCliente(t);
          setError(null);
        }}
        placeholder="Nombre del cliente"
        placeholderTextColor={colors.BzMuted}
        style={[styles.input, { color: colors.BzText, backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}
      />
      <TextInput
        value={telefono}
        onChangeText={(t) => setTelefono(t.replace(/\D/g, '').slice(0, 10))}
        placeholder="Teléfono (opcional, 10 dígitos)"
        placeholderTextColor={colors.BzMuted}
        keyboardType="phone-pad"
        style={[styles.input, { color: colors.BzText, backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}
      />

      <Text style={[BzTypography.label, { color: colors.BzMuted }]}>2. SERVICIO</Text>
      {SERVICIOS_CATALOGO.map((srv, idx) => {
        const activo = idx === servicioSel;
        return (
          <Pressable
            key={srv.id}
            onPress={() => setServicioSel(idx)}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 14,
              borderRadius: 12,
              backgroundColor: colors.BzCard,
              borderWidth: 1,
              borderColor: activo ? colors.BzText : colors.BzBorder,
            }}
          >
            <View>
              <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: activo ? '600' : '400' }}>
                {srv.nombre}
              </Text>
              <Text style={{ color: colors.BzMuted, fontSize: 12 }}>{srv.duracion}</Text>
            </View>
            <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '500' }}>${srv.precio}</Text>
          </Pressable>
        );
      })}

      <Text style={[BzTypography.label, { color: colors.BzMuted }]}>3. BARBERO</Text>
      {barberosActivos.length === 0 ? (
        <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
          No hay barberos registrados en Base de datos todavía.
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {[{ id: 'ANY', nombre: 'Cualquiera' }, ...barberosActivos].map((b) => {
            const activo = b.id === barberoSel;
            return (
              <Pressable
                key={b.id}
                onPress={() => {
                  setBarberoSel(b.id);
                  setError(null);
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: activo ? colors.BzText : colors.BzCard,
                  borderWidth: 1,
                  borderColor: activo ? colors.BzText : colors.BzBorder,
                }}
              >
                <Text style={{ color: activo ? colors.BzBg : colors.BzText, fontSize: 12, fontWeight: activo ? '600' : '400' }}>
                  {b.nombre}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <Text style={[BzTypography.label, { color: colors.BzMuted }]}>4. HORARIO DISPONIBLE (HOY)</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {SLOTS_EQUIPO.map((m) => {
          const ocupado = estaOcupado(m);
          const activo = m === slotValido;
          return (
            <Pressable
              key={m}
              disabled={ocupado}
              onPress={() => {
                setSlotSel(m);
                setError(null);
              }}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 16,
                backgroundColor: activo ? colors.BzText : colors.BzCard,
                borderWidth: 1,
                borderColor: activo ? colors.BzText : colors.BzBorder,
                opacity: ocupado ? 0.35 : 1,
              }}
            >
              <Text
                style={{
                  color: activo ? colors.BzBg : colors.BzText,
                  fontSize: 12,
                  fontWeight: activo ? '600' : '400',
                  textDecorationLine: ocupado ? 'line-through' : 'none',
                }}
              >
                {horaTextoDe(Math.floor(m / 60), m % 60)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={{ color: colors.BzMuted, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
        Total estimado: ${servicioActual.precio} · {servicioActual.duracionMin} min
      </Text>
      {error && <Text style={{ color: colors.BzDanger, fontSize: 12, textAlign: 'center' }}>{error}</Text>}
      <BotonMenuPrimario texto="Confirmar cita" onPress={confirmar} />
    </ScrollView>
  );
};

/* ---------- 3. Pestaña Rol y Perfil de Usuario ---------- */

const VistaRolUsuario: React.FC<{
  usuario: UsuarioBz;
  onIrHorarios: () => void;
  onLogout: () => void;
}> = ({ usuario, onIrHorarios, onLogout }) => {
  const { colors } = useBzTheme();
  const [mostrarTema, setMostrarTema] = useState(false);

  const descripcionPermisos: Record<RolSesion, string> = {
    [RolSesion.DUENO]: 'Acceso total: agenda, caja, inventario, reportes globales y alta de personal.',
    [RolSesion.ENCARGADO]: `Opera su sucursal (${usuario.sucursal}): agenda, caja, inventario y autorizaciones.`,
    [RolSesion.RECEPCION]: 'Agenda citas, registra walk-ins, realiza cobros en caja y consulta horarios de barberos y cajeros.',
    [RolSesion.BARBERO]: 'Consulta su agenda del día, horarios semanales de barberos y revisa su productividad.',
    [RolSesion.CLIENTE]: 'Agenda y consulta sus citas, acumula sellos de lealtad y aparta productos.',
  };

  return (
    <>
      <BzAppearanceSheet visible={mostrarTema} onDismiss={() => setMostrarTema(false)} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingVertical: 16, alignItems: 'center', gap: 14 }}>
        <View style={{ height: 8 }} />
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.BzCard,
            borderWidth: 1,
            borderColor: colors.BzMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.BzText, fontSize: 22, fontWeight: '300' }}>{usuario.iniciales}</Text>
        </View>

        <Text style={[BzTypography.title, { color: colors.BzText, fontSize: 20 }]}>{usuario.nombre}</Text>

        <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: colors.BzCard, borderWidth: 1, borderColor: colors.BzBorder }}>
          <Text style={{ color: colors.BzText, fontSize: 12 }}>Rol: {usuario.rol}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder, width: '100%' }]}>
          <Text style={[BzTypography.label, { color: colors.BzMuted }]}>PERMISOS Y ACCESOS DEL ROL</Text>
          <Text style={{ color: colors.BzText, fontSize: 13 }}>{descripcionPermisos[usuario.rol]}</Text>
        </View>

        <BotonMenuPrimario
          texto={
            usuario.rol === RolSesion.RECEPCION
              ? 'Ver horarios (Barberos y Cajeros)'
              : 'Ver horarios semanales de Barberos'
          }
          onPress={onIrHorarios}
        />

        <BotonMenuSecundario texto="Apariencia (claro / oscuro)" onPress={() => setMostrarTema(true)} />

        <View style={{ flex: 1 }} />
        <BotonMenuSecundario texto="Cerrar sesión" onPress={onLogout} />
      </ScrollView>
    </>
  );
};

/* ---------- Contenedor Principal MainAppShell ---------- */

export const MainAppShell: React.FC<{
  usuario: UsuarioBz;
  onLogout: () => void;
}> = ({ usuario, onLogout }) => {
  const { colors } = useBzTheme();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useDesktopLayout();
  const { empleados } = useCatalogoConfig();
  const {
    citasEquipo,
    agregarCita,
    cambiarEstadoCita,
    pedidosApartados,
    registrarPedidoApartado,
  } = useAgenda();
  const [tabActual, setTabActual] = useState<TabPrincipal>('INICIO');

  const [sucursalNombre, setSucursalNombre] = useState(
    usuario.sucursal ? `Sucursal ${usuario.sucursal}` : 'Sucursal Olivete',
  );

  const [citasActivas, setCitasActivas] = useState<CitaConfirmadaData[]>([]);
  const [citaConfirmada, setCitaConfirmada] = useState<string | null>(null);
  const [bolsaCliente, setBolsaCliente] = useState<LineaPedido[]>([]);

  const [creandoNuevaCitaEquipo, setCreandoNuevaCitaEquipo] = useState(false);
  const [creandoUsuario, setCreandoUsuario] = useState(false);
  const [abrirComisiones, setAbrirComisiones] = useState(false);
  const [abriendoHorariosPermisos, setAbriendoHorariosPermisos] = useState<'HORARIOS' | 'PERMISOS' | null>(null);

  const esCliente = usuario.rol === RolSesion.CLIENTE;
  const esBarbero = usuario.rol === RolSesion.BARBERO;

  const carritoCount = useMemo(
    () => bolsaCliente.reduce((sum, l) => sum + l.cantidad, 0),
    [bolsaCliente],
  );

  const pedidosPendientesCliente = useMemo<PedidoApartadoData[]>(
    () =>
      pedidosApartados
        .filter((p) => p.estado === 'PENDIENTE')
        .map((p) => ({
          folio: p.folio,
          lineas: p.lineas.map((l) => ({ ...l })),
          total: p.total,
          sucursal: p.sucursal,
          creadoEn: p.creadoEn,
        })),
    [pedidosApartados],
  );

  const agregarProductoBolsa = (prod: { id: string; nombre: string; precio: number }) => {
    setBolsaCliente((prev) => {
      const existe = prev.find((l) => l.id === prod.id);
      if (existe) {
        return prev.map((l) => (l.id === prod.id ? { ...l, cantidad: l.cantidad + 1 } : l));
      }
      return [...prev, { id: prod.id, nombre: prod.nombre, precio: prod.precio, cantidad: 1 }];
    });
  };

  const cambiarCantidadBolsa = (id: string, delta: number) => {
    setBolsaCliente((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, cantidad: l.cantidad + delta } : l))
        .filter((l) => l.cantidad > 0),
    );
  };

  const confirmarApartadoTienda = (): string => {
    const folio = `PD-${Math.floor(1000 + Math.random() * 9000)}`;
    const total = bolsaCliente.reduce((s, l) => s + l.precio * l.cantidad, 0);
    const hoy = new Date();
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const creadoEn = `${hoy.getDate()} ${meses[hoy.getMonth()]}`;

    registrarPedidoApartado({
      folio,
      clienteNombre: usuario.nombre,
      lineas: bolsaCliente.map((l) => ({ ...l })),
      total,
      sucursal: sucursalNombre,
      creadoEn,
    });

    setBolsaCliente([]);
    return folio;
  };

  const tabsDisponibles = useMemo<TabPrincipal[]>(() => {
    switch (usuario.rol) {
      case RolSesion.CLIENTE:
        return ['INICIO', 'AGENDAR', 'TIENDA', 'ROL'];
      case RolSesion.BARBERO:
        return ['INICIO', 'AGENDAR', 'BARBERO_PANEL', 'ROL'];
      case RolSesion.DUENO:
        return ['INICIO', 'DUENO_DASH', 'AGENDAR', 'CAJA', 'INVENTARIO', 'ROL'];
      default:
        return ['INICIO', 'AGENDAR', 'CAJA', 'INVENTARIO', 'ROL'];
    }
  }, [usuario.rol]);

  const esAdmin = usuario.rol === RolSesion.DUENO || usuario.rol === RolSesion.ENCARGADO;

  const tituloTab: Record<TabPrincipal, string> = {
    INICIO: 'Inicio',
    AGENDAR: !esCliente ? 'Agenda' : 'Agendar',
    CAJA: 'Caja',
    INVENTARIO: 'Stock',
    DUENO_DASH: 'Reportes',
    BARBERO_PANEL: 'Servicio',
    TIENDA: carritoCount > 0 ? `Tienda (${carritoCount})` : 'Tienda',
    ROL: esAdmin ? 'Más' : esCliente ? 'Perfil' : usuario.rol.split('/')[0],
  };

  const gooeyItems: GooeyTabItem[] = tabsDisponibles.map((tab) => ({
    id: tab,
    etiqueta: tituloTab[tab],
    renderIcon: (color) => <TabIcon tab={tab} color={color} isMenu={tab === 'ROL' && esAdmin} />,
  }));

  const indiceActual = Math.max(0, tabsDisponibles.indexOf(tabActual));

  const seleccionarTab = (tab: TabPrincipal) => {
    setCreandoNuevaCitaEquipo(false);
    setCreandoUsuario(false);
    setAbrirComisiones(false);
    setAbriendoHorariosPermisos(null);
    setTabActual(tab);
  };

  const renderContenido = () => {
    if (creandoUsuario) {
      return <CrearUsuarioScreen quien={usuario} onVolver={() => setCreandoUsuario(false)} />;
    }

    if (abriendoHorariosPermisos !== null) {
      return (
        <HorariosYPermisosScreen
          usuario={usuario}
          tabInicial={abriendoHorariosPermisos}
          onVolver={() => setAbriendoHorariosPermisos(null)}
        />
      );
    }

    switch (tabActual) {
      case 'INICIO':
        if (esCliente) {
          return (
            <VistaInicioCliente
              carritoCount={carritoCount}
              citaConfirmada={citaConfirmada}
              onIrCarrito={() => setTabActual('TIENDA')}
              onIrAgendar={() => {
                setCreandoNuevaCitaEquipo(false);
                setTabActual('AGENDAR');
              }}
              onIrTienda={() => setTabActual('TIENDA')}
              onAgregarProducto={(prod) =>
                agregarProductoBolsa({ id: prod.id, nombre: prod.nombre, precio: prod.precio })
              }
            />
          );
        }
        if (esBarbero) {
          return (
            <VistaInicioBarbero
              usuario={usuario}
              onIrAgenda={() => {
                setCreandoNuevaCitaEquipo(false);
                setTabActual('AGENDAR');
              }}
              onIrNuevaCita={() => {
                setCreandoNuevaCitaEquipo(true);
                setTabActual('AGENDAR');
              }}
              onIrServicio={() => {
                setAbrirComisiones(false);
                setTabActual('BARBERO_PANEL');
              }}
              onIrComisiones={() => {
                setAbrirComisiones(true);
                setTabActual('BARBERO_PANEL');
              }}
              onIrPerfil={() => setTabActual('ROL')}
            />
          );
        }
        return (
          <VistaInicioResumen
            usuario={usuario}
            citaConfirmada={citaConfirmada}
            carritoCount={carritoCount}
            onIrAgendar={() => {
              setCreandoNuevaCitaEquipo(false);
              setTabActual('AGENDAR');
            }}
            onIrCaja={() => tabsDisponibles.includes('CAJA') && setTabActual('CAJA')}
            onIrInventario={() => tabsDisponibles.includes('INVENTARIO') && setTabActual('INVENTARIO')}
            onIrReportesDueno={() => tabsDisponibles.includes('DUENO_DASH') && setTabActual('DUENO_DASH')}
            onIrComisiones={() => {
              setAbrirComisiones(true);
              setTabActual('BARBERO_PANEL');
            }}
            onIrTienda={() => setTabActual('TIENDA')}
            onIrRol={() => setTabActual('ROL')}
            onIrHorariosPermisos={(tab) => setAbriendoHorariosPermisos(tab ?? 'HORARIOS')}
            onNewUser={() => setCreandoUsuario(true)}
          />
        );

      case 'AGENDAR':
        if (esCliente) {
          return (
            <VistaAgendarCliente
              nombreCliente={usuario.nombre}
              sucursalNombre={sucursalNombre}
              citasActivas={citasActivas}
              pedidosPendientes={pedidosPendientesCliente}
              onCitaConfirmada={(nuevaCita, resumenCorto) => {
                setCitasActivas((prev) => [...prev, nuevaCita]);
                setCitaConfirmada(resumenCorto);
                agregarCita(citaDeCliente(nuevaCita, usuario.id, usuario.usuario));
              }}
              onIrTienda={() => setTabActual('TIENDA')}
              onVolverInicio={() => setTabActual('INICIO')}
            />
          );
        }
        return !creandoNuevaCitaEquipo ? (
          <AgendaEquipoScreen
            usuario={usuario}
            citas={citasEquipo}
            onNuevaCita={() => setCreandoNuevaCitaEquipo(true)}
            onCambiarEstado={cambiarEstadoCita}
            onAgregarCita={agregarCita}
          />
        ) : (
          <VistaAgendar
            usuario={usuario}
            citasEquipo={citasEquipo}
            citaActual={citaConfirmada}
            onVolverAgenda={() => setCreandoNuevaCitaEquipo(false)}
            onCrearCita={(cita, resumen) => {
              agregarCita(cita);
              setCitaConfirmada(resumen);
              setCreandoNuevaCitaEquipo(false);
            }}
          />
        );

      case 'CAJA':
        return <CajaScreen usuario={usuario} />;

      case 'INVENTARIO':
        return <InventarioScreen usuario={usuario} />;

      case 'DUENO_DASH':
        return (
          <VistaReporteDueno
            onNewUser={() => setCreandoUsuario(true)}
            onAbrirHorariosPermisos={(tab) => setAbriendoHorariosPermisos(tab)}
          />
        );

      case 'BARBERO_PANEL':
        return <BarberoPanelScreen usuario={usuario} abrirEnComisiones={abrirComisiones} />;

      case 'TIENDA':
        return (
          <VistaTiendaCliente
            sucursalNombre={sucursalNombre}
            nombreCliente={usuario.nombre}
            bolsa={bolsaCliente}
            onAgregarLinea={agregarProductoBolsa}
            onCambiarCantidad={cambiarCantidadBolsa}
            onConfirmarApartado={confirmarApartadoTienda}
            onVerEnAgenda={() => setTabActual('AGENDAR')}
          />
        );

      case 'ROL':
        if (esCliente) {
          return (
            <VistaPerfilCliente
              usuario={usuario}
              sucursalNombre={sucursalNombre}
              onCambiarSucursal={setSucursalNombre}
              citasActivas={citasActivas}
              citaConfirmada={citaConfirmada}
              pedidosPendientes={pedidosPendientesCliente}
              carritoCount={carritoCount}
              onIrAgendar={() => setTabActual('AGENDAR')}
              onIrTienda={() => setTabActual('TIENDA')}
              onLogout={onLogout}
            />
          );
        }
        return esAdmin ? (
          <AdminOperacionesScreen
            usuario={usuario}
            onIrInventario={() => setTabActual('INVENTARIO')}
            onNewUser={() => setCreandoUsuario(true)}
            onLogout={onLogout}
          />
        ) : (
          <VistaRolUsuario
            usuario={usuario}
            onIrHorarios={() => setAbriendoHorariosPermisos('HORARIOS')}
            onLogout={onLogout}
          />
        );
    }
  };

  /* ===== EN PC: MISMO MENÚ LATERAL FIJO (DesktopShell) EN TODAS LAS VISTAS ===== */
  if (isDesktop) {
    const hoy = hoyISO();
    const citasPendientes = citasEquipo.filter(
      (c) =>
        c.fechaISO === hoy &&
        c.estado !== 'CANCELADA' &&
        c.estado !== 'TERMINADA',
    ).length;

    const desktopNavItems = tabsDisponibles.map((tab) => {
      const activo = tab === tabActual;
      const iconColor = activo ? '#E2C46D' : colors.BzMuted;
      return {
        key: tab,
        label: tituloTab[tab],
        icon: <TabIcon tab={tab} color={iconColor} isMenu={tab === 'ROL' && esAdmin} />,
        badge:
          tab === 'AGENDAR' && !esCliente
            ? citasPendientes
            : tab === 'TIENDA'
            ? carritoCount
            : undefined,
      };
    });

    const staffActivo = !esCliente
      ? empleados
          .filter((e) => e.activo && e.rol !== 'Dueño')
          .map((e) => ({
            initials: obtenerIniciales(e.nombre),
            name: e.nombre,
            online: true,
          }))
      : [];

    return (
      <DesktopShell
        businessName="BarberZones"
        businessSubtitle={`${usuario.rol} · ${usuario.sucursal || 'Olivete'}`}
        navItems={desktopNavItems}
        activeKey={tabActual}
        onSelectNav={(key) => seleccionarTab(key as TabPrincipal)}
        activeStaff={staffActivo}
      >
        {renderContenido()}
      </DesktopShell>
    );
  }

  /* ===== EN MÓVIL: BARRA FLOTANTE INFERIOR CON SAFE AREA ===== */
  const esOscuro = colors.BzBg.startsWith('#0') || colors.BzBg.startsWith('#1');

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.BzBg,
        paddingTop: Math.max(insets.top, 12),
      }}
    >
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} />

      <View style={{ flex: 1 }}>{renderContenido()}</View>

      <View
        style={{
          backgroundColor: colors.BzBg,
          paddingHorizontal: 10,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 10),
          zIndex: 50,
        }}
      >
        <GooeyNavBar
          items={gooeyItems}
          selectedIndex={indiceActual}
          onSelect={(idx) => seleccionarTab(tabsDisponibles[idx])}
        />
      </View>
    </View>
  );
};

export const MenuPrincipal = MainAppShell;
export default MainAppShell;

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  reportCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  kpiCardClean: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 118,
    justifyContent: 'space-between',
  },
  cardClean: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  cardHeaderClean: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listRowClean: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    gap: 10,
  },
  pillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    gap: 10,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  btnPrimario: {
    width: '100%',
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecundario: {
    width: '100%',
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
});