import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import {
  EQUIPO_BARBEROS,
  citaDeCliente,
  hoyISO,
  horaTextoDe,
  minutosDelDia,
  normalizarSucursal,
  type CitaEquipo,
} from '../constants/AgendaTipos';
import { folioLibre, useAgenda } from '../constants/AgendaContext';
import { BzTypography, useBzTheme } from '../constants/BzTheme';
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

/* ---------- 0. Vista Reporte y Estadísticas del Dueño (Con Base de Datos y CMS) ---------- */

type PeriodoReporte = 'hoy' | 'semana' | 'mes';
type TabReporte = 'dashboard' | 'precios' | 'sucursales' | 'basedatos';

const PERIODOS_CONFIG: Record<
  PeriodoReporte,
  { k: number; vs: string; d: number[]; titulo: string; mejor: string; t: [string, number][] }
> = {
  hoy: {
    k: 1,
    vs: 'vs ayer',
    d: [8, 5, 3],
    titulo: 'Ventas por hora',
    mejor: 'Mejor hora',
    t: [
      ['10', 700], ['11', 900], ['12', 1200], ['13', 1500], ['14', 1300],
      ['15', 1100], ['16', 1600], ['17', 1900], ['18', 2400], ['19', 2100], ['20', 1870],
    ],
  },
  semana: {
    k: 6.4,
    vs: 'vs semana pasada',
    d: [5, 4, 1],
    titulo: 'Ventas por día',
    mejor: 'Mejor día',
    t: [
      ['Lun', 13200], ['Mar', 12100], ['Mié', 14800], ['Jue', 15900],
      ['Vie', 19700], ['Sáb', 21800], ['Dom', 8548],
    ],
  },
  mes: {
    k: 27.5,
    vs: 'vs mes pasado',
    d: [-3, -2, -1],
    titulo: 'Ventas por semana',
    mejor: 'Mejor semana',
    t: [
      ['Sem 1', 104200], ['Sem 2', 112300], ['Sem 3', 118900], ['Sem 4', 120275],
    ],
  },
};

const SUCURSALES_REPORTE = [
  { nombre: 'Olivete', venta: 6270, citas: 18, encargado: 'Sofía L.', sillas: '4 / 4', ocupacion: 92, meta: 6000 },
  { nombre: 'Centro', venta: 5410, citas: 15, encargado: 'Ana M.', sillas: '3 / 4', ocupacion: 81, meta: 5500 },
  { nombre: 'Providencia', venta: 4890, citas: 13, encargado: 'Luis G.', sillas: '3 / 3', ocupacion: 86, meta: 4800 },
];

const BARBEROS_REPORTE = [
  { nombre: 'Carlos R.', suc: 'Olivete', venta: 5320, citas: 14, pctCom: 50, propina: 420 },
  { nombre: 'Andrés M.', suc: 'Centro', venta: 4410, citas: 12, pctCom: 50, propina: 350 },
  { nombre: 'Mateo S.', suc: 'Providencia', venta: 4320, citas: 12, pctCom: 45, propina: 290 },
  { nombre: 'Diego M.', suc: 'Olivete', venta: 2520, citas: 8, pctCom: 45, propina: 180 },
];

const COBROS_REPORTE = [
  { folio: 'OLI-128', hora: '18:40', cliente: 'Luis Ortiz', concepto: 'Corte + barba', barbero: 'Carlos R.', suc: 'Olivete', pago: 'Tarjeta', total: 374 },
  { folio: 'CEN-094', hora: '18:15', cliente: 'Andrés López', concepto: 'Corte + Pomada', barbero: 'Andrés M.', suc: 'Centro', pago: 'Efectivo', total: 440 },
  { folio: 'PRO-061', hora: '17:50', cliente: 'Pablo Ruiz', concepto: 'Arreglo de barba', barbero: 'Mateo S.', suc: 'Providencia', pago: 'Transferencia', total: 176 },
  { folio: 'OLI-127', hora: '17:20', cliente: 'Hugo Peña', concepto: 'Corte de cabello', barbero: 'Diego M.', suc: 'Olivete', pago: 'Tarjeta', total: 242 },
  { folio: 'CEN-093', hora: '16:45', cliente: 'Mario Díaz', concepto: 'Corte + barba', barbero: 'Andrés M.', suc: 'Centro', pago: 'Tarjeta', total: 374 },
  { folio: 'OLI-126', hora: '16:10', cliente: 'Raúl Torres', concepto: 'Corte de cabello', barbero: 'Carlos R.', suc: 'Olivete', pago: 'Efectivo', total: 242 },
  { folio: 'PRO-060', hora: '15:30', cliente: 'Beto López', concepto: 'Corte + barba', barbero: 'Mateo S.', suc: 'Providencia', pago: 'Tarjeta', total: 374 },
];

const PAGOS_REPORTE: [string, number, string][] = [
  ['Tarjeta', 54, '#E2C46D'],
  ['Efectivo', 33, '#34A853'],
  ['Transferencia', 13, '#6b7280'],
];

const VistaReporteDueno: React.FC<{
  onNewUser: () => void;
  onAbrirHorariosPermisos: (tab: 'HORARIOS' | 'PERMISOS') => void;
}> = ({ onNewUser, onAbrirHorariosPermisos }) => {
  const { colors } = useBzTheme();
  const { isDesktop } = useDesktopLayout();

  const [tab, setTab] = useState<TabReporte>('dashboard');
  const [periodo, setPeriodo] = useState<PeriodoReporte>('hoy');
  const [sucursal, setSucursal] = useState<string>('TODAS');
  const [pagoFiltro, setPagoFiltro] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [catalogo, setCatalogo] = useState([
    { id: 's1', nombre: 'Corte de cabello', tipo: 'Servicio', duracion: '40 min', precio: 220, volumenHoy: 24 },
    { id: 's2', nombre: 'Corte + barba', tipo: 'Servicio', duracion: '60 min', precio: 340, volumenHoy: 14 },
    { id: 's3', nombre: 'Arreglo de barba', tipo: 'Servicio', duracion: '30 min', precio: 160, volumenHoy: 11 },
    { id: 's4', nombre: 'Pomada mate 100g', tipo: 'Producto', duracion: '—', precio: 220, volumenHoy: 7 },
    { id: 's5', nombre: 'Shampoo menta 250ml', tipo: 'Producto', duracion: '—', precio: 155, volumenHoy: 5 },
  ]);

  const [equipoTurnos, setEquipoTurnos] = useState([
    { id: 'e1', nombre: 'Carlos R.', rol: 'Barbero', suc: 'Olivete', horario: '10:00 – 19:00', citas: 14, estado: 'En corte' },
    { id: 'e2', nombre: 'Diego M.', rol: 'Barbero', suc: 'Olivete', horario: '11:00 – 20:00', citas: 8, estado: 'Activo' },
    { id: 'e3', nombre: 'Andrés M.', rol: 'Barbero', suc: 'Centro', horario: '10:00 – 19:00', citas: 12, estado: 'En corte' },
    { id: 'e4', nombre: 'Mateo S.', rol: 'Barbero', suc: 'Providencia', horario: '11:00 – 20:00', citas: 12, estado: 'Activo' },
    { id: 'e5', nombre: 'Ana M.', rol: 'Recepción', suc: 'Centro', horario: '10:00 – 18:00', citas: 0, estado: 'Activo' },
    { id: 'e6', nombre: 'Sofía L.', rol: 'Encargado', suc: 'Olivete', horario: '10:00 – 20:00', citas: 0, estado: 'Activo' },
  ]);

  const mostrarAviso = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg((prev) => (prev === msg ? null : prev)), 2000);
  };

  const cfg = PERIODOS_CONFIG[periodo];
  const k = cfg.k;
  const sucFiltradas = sucursal === 'TODAS' ? SUCURSALES_REPORTE : SUCURSALES_REPORTE.filter((s) => s.nombre === sucursal);
  const factorSuc = sucursal === 'TODAS' ? 1 : sucFiltradas[0].venta / 16570;

  const ventaTotal = sucFiltradas.reduce((a, s) => a + s.venta, 0) * k;
  const citasTotal = Math.round(sucFiltradas.reduce((a, s) => a + s.citas, 0) * k);
  const ticketPromedio = citasTotal ? ventaTotal / citasTotal : 0;
  const nuevosClientes = Math.max(1, Math.round(12 * k * factorSuc));

  const serieGrafica = cfg.t.map(([l, v]) => [l, Math.round(v * factorSuc)] as [string, number]);
  const maxGrafica = Math.max(...serieGrafica.map((x) => x[1]));
  const peakGrafica = serieGrafica.find((x) => x[1] === maxGrafica) ?? serieGrafica[0];
  const minGrafica = serieGrafica.reduce((a, b) => (b[1] < a[1] ? b : a));

  const barFiltrados = sucursal === 'TODAS' ? BARBEROS_REPORTE : BARBEROS_REPORTE.filter((b) => b.suc === sucursal);
  const maxSuc = Math.max(...SUCURSALES_REPORTE.map((s) => s.venta)) * k;
  const maxBar = Math.max(...BARBEROS_REPORTE.map((b) => b.venta)) * k;

  const srvTop = catalogo.slice(0, 3).map((s) => ({
    nombre: s.nombre,
    monto: s.precio * s.volumenHoy * factorSuc * k,
  }));
  const totalSrvTop = srvTop.reduce((a, s) => a + s.monto, 0);

  const cobrosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return COBROS_REPORTE.filter((item) => {
      const okSuc = sucursal === 'TODAS' || item.suc === sucursal;
      const okPay = pagoFiltro === 'TODOS' || item.pago === pagoFiltro;
      const okTxt =
        !q ||
        item.cliente.toLowerCase().includes(q) ||
        item.barbero.toLowerCase().includes(q) ||
        item.folio.toLowerCase().includes(q);
      return okSuc && okPay && okTxt;
    });
  }, [sucursal, pagoFiltro, busqueda]);

  const eqFiltrado = sucursal === 'TODAS' ? equipoTurnos : equipoTurnos.filter((e) => e.suc === sucursal);

  const actualizarPrecio = (id: string, texto: string) => {
    const val = Math.max(0, Number(texto.replace(/\D/g, '')) || 0);
    setCatalogo((prev) => prev.map((s) => (s.id === id ? { ...s, precio: val } : s)));
  };

  const cambiarEstadoEmpleado = (id: string) => {
    const orden = ['Activo', 'En corte', 'Permiso'];
    setEquipoTurnos((prev) =>
      prev.map((emp) => {
        if (emp.id !== id) return emp;
        const siguiente = orden[(orden.indexOf(emp.estado) + 1) % orden.length];
        mostrarAviso(`${emp.nombre}: ${siguiente}`);
        return { ...emp, estado: siguiente };
      }),
    );
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
      {/* Aviso flotante (Toast) */}
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
            {/* Pills Sucursal */}
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

            {/* Pills Periodo */}
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
          {/* 3 KPIs principales */}
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

          {/* 4 Mini KPIs */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {[
              ['Clientes nuevos', `${nuevosClientes}`, `${Math.round((nuevosClientes / Math.max(1, citasTotal)) * 100)}% de las citas`],
              ['Clientes que regresan', '74%', 'del total'],
              ['Cancelaciones', `${Math.max(1, Math.round(3 * k * factorSuc))}`, '6% de las citas'],
              ['Propinas', formatMoney(1240 * k * factorSuc), '7.5% de ventas'],
            ].map(([lbl, num, sub]) => (
              <View
                key={lbl}
                style={[
                  styles.reportCard,
                  {
                    flex: isDesktop ? 1 : undefined,
                    width: isDesktop ? undefined : '48%',
                    padding: 16,
                    backgroundColor: colors.BzCard,
                    borderColor: colors.BzBorder,
                  },
                ]}
              >
                <Text style={{ color: colors.BzMuted, fontSize: 12 }}>{lbl}</Text>
                <Text style={{ color: colors.BzText, fontSize: 24, fontWeight: '800', marginVertical: 4 }}>{num}</Text>
                <Text style={{ color: colors.BzMuted, fontSize: 11 }}>{sub}</Text>
              </View>
            ))}
          </View>

          {/* Gráfica de barras */}
          <View style={[styles.reportCard, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
            <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '700', marginBottom: 16 }}>
              {cfg.titulo}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 160, gap: isDesktop ? 10 : 5 }}>
              {serieGrafica.map(([label, val]) => {
                const esPico = val === maxGrafica;
                const altura = maxGrafica > 0 ? Math.max(12, Math.round((val / maxGrafica) * 120)) : 12;
                return (
                  <View key={label} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                    {esPico && (
                      <Text style={{ color: colors.BzText, fontSize: 10, fontWeight: '700' }} numberOfLines={1}>
                        {formatMoney(val)}
                      </Text>
                    )}
                    <View
                      style={{
                        width: '100%',
                        maxWidth: 42,
                        height: altura,
                        borderRadius: 6,
                        backgroundColor: esPico ? '#E2C46D' : '#3a3320',
                      }}
                    />
                    <Text style={{ color: esPico ? colors.BzText : colors.BzMuted, fontSize: 11, fontWeight: esPico ? '700' : '400' }}>
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
              <View style={[styles.pillBadge, { borderColor: colors.BzBorder }]}>
                <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
                  {cfg.mejor}:{' '}
                  <Text style={{ color: colors.BzText, fontWeight: '700' }}>
                    {peakGrafica[0]}{periodo === 'hoy' ? ':00' : ''}
                  </Text>
                </Text>
              </View>
              <View style={[styles.pillBadge, { borderColor: colors.BzBorder }]}>
                <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
                  Más flojo:{' '}
                  <Text style={{ color: colors.BzText, fontWeight: '700' }}>
                    {minGrafica[0]}{periodo === 'hoy' ? ':00' : ''}
                  </Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Grid 2x2: Sucursales, Barberos, Servicios top, Formas de pago */}
          <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16 }}>
            <View style={[styles.reportCard, { flex: 1, backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
              <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '700', marginBottom: 14 }}>Sucursales</Text>
              {sucFiltradas.map((s, idx) => {
                const v = s.venta * k;
                const pct = maxSuc > 0 ? Math.min(100, (v / maxSuc) * 100) : 0;
                return (
                  <View key={s.nombre} style={{ paddingVertical: 10, borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: colors.BzBorder }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }}>{s.nombre}</Text>
                      <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '700' }}>
                        {formatMoney(v)}{' '}
                        <Text style={{ color: colors.BzMuted, fontSize: 12, fontWeight: '400' }}>
                          {Math.round(s.citas * k)} citas
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
              {barFiltrados.map((b, idx) => {
                const v = b.venta * k;
                const pct = maxBar > 0 ? Math.min(100, (v / maxBar) * 100) : 0;
                return (
                  <View key={b.nombre} style={{ paddingVertical: 10, borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: colors.BzBorder }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }}>{b.nombre}</Text>
                      <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '700' }}>
                        {formatMoney(v)}{' '}
                        <Text style={{ color: colors.BzMuted, fontSize: 12, fontWeight: '400' }}>
                          {Math.round(b.citas * k)} citas
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
          </View>

          <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16 }}>
            <View style={[styles.reportCard, { flex: 1, backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
              <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '700', marginBottom: 14 }}>Servicios top</Text>
              {srvTop.map((s, idx) => {
                const pct = totalSrvTop > 0 ? Math.round((s.monto / totalSrvTop) * 100) : 0;
                return (
                  <View key={s.nombre} style={{ paddingVertical: 10, borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: colors.BzBorder }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }}>
                        {s.nombre} <Text style={{ color: colors.BzMuted, fontSize: 12 }}>{pct}%</Text>
                      </Text>
                      <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '700' }}>{formatMoney(s.monto)}</Text>
                    </View>
                    <View style={{ height: 7, backgroundColor: '#222', borderRadius: 99, overflow: 'hidden' }}>
                      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: idx === 0 ? '#E2C46D' : '#8a7640', borderRadius: 99 }} />
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={[styles.reportCard, { flex: 1, backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
              <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '700', marginBottom: 14 }}>Formas de pago</Text>
              <View style={{ flexDirection: 'row', height: 11, borderRadius: 99, overflow: 'hidden', gap: 3, marginBottom: 14 }}>
                {PAGOS_REPORTE.map(([nombre, pct, col]) => (
                  <View key={nombre} style={{ flex: pct, backgroundColor: col }} />
                ))}
              </View>
              {PAGOS_REPORTE.map(([nombre, pct, col]) => (
                <View key={nombre} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: col }} />
                    <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }}>{nombre}</Text>
                  </View>
                  <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '700' }}>
                    {formatMoney((ventaTotal * pct) / 100)}{' '}
                    <Text style={{ color: colors.BzMuted, fontSize: 12, fontWeight: '400' }}>{pct}%</Text>
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Últimos cobros */}
          <View style={[styles.reportCard, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '700' }}>Últimos cobros</Text>
              <Text style={{ color: colors.BzMuted, fontSize: 12 }}>{cobrosFiltrados.length} registros</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <TextInput
                value={busqueda}
                onChangeText={setBusqueda}
                placeholder="Buscar cliente, barbero o folio..."
                placeholderTextColor={colors.BzMuted}
                style={{
                  backgroundColor: colors.BzBg,
                  borderWidth: 1,
                  borderColor: colors.BzBorder,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  height: 38,
                  minWidth: 220,
                  color: colors.BzText,
                  fontSize: 13,
                }}
              />

              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                {['TODOS', 'Tarjeta', 'Efectivo', 'Transferencia'].map((p) => {
                  const act = pagoFiltro === p;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setPagoFiltro(p)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 999,
                        backgroundColor: act ? '#E2C46D' : colors.BzBg,
                        borderWidth: 1,
                        borderColor: act ? '#E2C46D' : colors.BzBorder,
                      }}
                    >
                      <Text style={{ color: act ? '#0D0D0D' : colors.BzMuted, fontSize: 12, fontWeight: '700' }}>
                        {p === 'TODOS' ? 'Todos' : p}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ minWidth: isDesktop ? '100%' : 720 }}>
                <View style={[styles.tableRow, { borderBottomColor: colors.BzBorder }]}>
                  <Text style={[styles.th, { width: 85, color: colors.BzMuted }]}>FOLIO</Text>
                  <Text style={[styles.th, { width: 65, color: colors.BzMuted }]}>HORA</Text>
                  <Text style={[styles.th, { flex: 1.2, minWidth: 120, color: colors.BzMuted }]}>CLIENTE</Text>
                  <Text style={[styles.th, { flex: 1.4, minWidth: 140, color: colors.BzMuted }]}>CONCEPTO</Text>
                  <Text style={[styles.th, { width: 100, color: colors.BzMuted }]}>BARBERO</Text>
                  <Text style={[styles.th, { width: 95, color: colors.BzMuted }]}>SUCURSAL</Text>
                  <Text style={[styles.th, { width: 110, color: colors.BzMuted }]}>PAGO</Text>
                  <Text style={[styles.th, { width: 85, textAlign: 'right', color: colors.BzMuted }]}>TOTAL</Text>
                </View>

                {cobrosFiltrados.length === 0 ? (
                  <Text style={{ color: colors.BzMuted, fontSize: 13, paddingVertical: 18, textAlign: 'center' }}>
                    Sin resultados con ese filtro
                  </Text>
                ) : (
                  cobrosFiltrados.map((item, idx) => (
                    <View
                      key={item.folio}
                      style={[
                        styles.tableRow,
                        idx < cobrosFiltrados.length - 1 && { borderBottomColor: colors.BzBorder },
                      ]}
                    >
                      <Text style={{ width: 85, color: colors.BzText, fontSize: 13, fontWeight: '700' }}>{item.folio}</Text>
                      <Text style={{ width: 65, color: colors.BzMuted, fontSize: 13 }}>{item.hora}</Text>
                      <Text style={{ flex: 1.2, minWidth: 120, color: colors.BzText, fontSize: 13 }}>{item.cliente}</Text>
                      <Text style={{ flex: 1.4, minWidth: 140, color: colors.BzText, fontSize: 13 }}>{item.concepto}</Text>
                      <Text style={{ width: 100, color: colors.BzText, fontSize: 13 }}>{item.barbero}</Text>
                      <Text style={{ width: 95, color: colors.BzMuted, fontSize: 13 }}>{item.suc}</Text>
                      <View style={{ width: 110 }}>
                        <View
                          style={[
                            styles.pillBadge,
                            {
                              alignSelf: 'flex-start',
                              borderColor: item.pago === 'Tarjeta' ? '#6B5B2E' : item.pago === 'Efectivo' ? '#265936' : colors.BzBorder,
                              backgroundColor: item.pago === 'Tarjeta' ? '#211D12' : item.pago === 'Efectivo' ? '#132419' : colors.BzCardInner,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '700',
                              color: item.pago === 'Tarjeta' ? '#E2C46D' : item.pago === 'Efectivo' ? colors.BzSuccess : colors.BzMuted,
                            }}
                          >
                            {item.pago}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ width: 85, textAlign: 'right', color: colors.BzSuccess, fontSize: 13, fontWeight: '700' }}>
                        {formatMoney(item.total)}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* ==================== TAB 2: PRECIOS Y COMISIONES ==================== */}
      {tab === 'precios' && (
        <View style={{ gap: 16 }}>
          <View style={[styles.reportCard, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 6 }}>
              <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '700' }}>Catálogo y tarifas</Text>
              <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Toca un precio para editar y recalcular</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ minWidth: isDesktop ? '100%' : 650 }}>
                <View style={[styles.tableRow, { borderBottomColor: colors.BzBorder }]}>
                  <Text style={[styles.th, { flex: 1.5, minWidth: 160, color: colors.BzMuted }]}>CONCEPTO</Text>
                  <Text style={[styles.th, { width: 100, color: colors.BzMuted }]}>TIPO</Text>
                  <Text style={[styles.th, { width: 90, color: colors.BzMuted }]}>DURACIÓN</Text>
                  <Text style={[styles.th, { width: 115, textAlign: 'right', color: colors.BzMuted }]}>PRECIO</Text>
                  <Text style={[styles.th, { width: 100, textAlign: 'right', color: colors.BzMuted }]}>CANTIDAD</Text>
                  <Text style={[styles.th, { width: 130, textAlign: 'right', color: colors.BzMuted }]}>PROYECTADO</Text>
                </View>

                {catalogo.map((item, idx) => {
                  const vol = Math.round(item.volumenHoy * k * factorSuc);
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.tableRow,
                        idx < catalogo.length - 1 && { borderBottomColor: colors.BzBorder },
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
                          onChangeText={(txt) => actualizarPrecio(item.id, txt)}
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
                      <Text style={{ width: 100, textAlign: 'right', color: colors.BzMuted, fontSize: 13 }}>{vol}</Text>
                      <Text style={{ width: 130, textAlign: 'right', color: colors.BzText, fontSize: 13, fontWeight: '700' }}>
                        {formatMoney(item.precio * vol)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          <View style={[styles.reportCard, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '700' }}>Comisiones y propinas</Text>
              <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Periodo: {periodo.toUpperCase()}</Text>
            </View>

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
                  const vGen = b.venta * k;
                  const com = vGen * (b.pctCom / 100);
                  const prop = b.propina * k;
                  return (
                    <View
                      key={b.nombre}
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
                      <Text style={{ width: 115, textAlign: 'right', color: colors.BzText, fontSize: 13 }}>{formatMoney(vGen)}</Text>
                      <Text style={{ width: 110, textAlign: 'right', color: colors.BzText, fontSize: 13 }}>{formatMoney(com)}</Text>
                      <Text style={{ width: 100, textAlign: 'right', color: colors.BzSuccess, fontSize: 13 }}>+{formatMoney(prop)}</Text>
                      <Text style={{ width: 120, textAlign: 'right', color: '#E2C46D', fontSize: 13, fontWeight: '800' }}>
                        {formatMoney(com + prop)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* ==================== TAB 3: SUCURSALES Y EQUIPO ==================== */}
      {tab === 'sucursales' && (
        <View style={{ gap: 16 }}>
          <View style={[styles.reportCard, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 6 }}>
              <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '700' }}>Comparativa de sucursales</Text>
              <Pressable onPress={() => onAbrirHorariosPermisos('HORARIOS')}>
                <Text style={{ color: '#E2C46D', fontSize: 12, fontWeight: '700' }}>Gestionar horarios ›</Text>
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ minWidth: isDesktop ? '100%' : 650 }}>
                <View style={[styles.tableRow, { borderBottomColor: colors.BzBorder }]}>
                  <Text style={[styles.th, { flex: 1.2, minWidth: 110, color: colors.BzMuted }]}>SUCURSAL</Text>
                  <Text style={[styles.th, { width: 110, color: colors.BzMuted }]}>ENCARGADO</Text>
                  <Text style={[styles.th, { width: 90, color: colors.BzMuted }]}>SILLAS</Text>
                  <Text style={[styles.th, { width: 95, color: colors.BzMuted }]}>OCUPACIÓN</Text>
                  <Text style={[styles.th, { width: 110, textAlign: 'right', color: colors.BzMuted }]}>VENTAS</Text>
                  <Text style={[styles.th, { width: 110, textAlign: 'right', color: colors.BzMuted }]}>META</Text>
                  <Text style={[styles.th, { width: 125, textAlign: 'right', color: colors.BzMuted }]}>ESTADO</Text>
                </View>

                {sucFiltradas.map((s, idx) => {
                  const vAct = s.venta * k;
                  const mAct = s.meta * k;
                  const cumple = vAct >= mAct;
                  return (
                    <View
                      key={s.nombre}
                      style={[
                        styles.tableRow,
                        idx < sucFiltradas.length - 1 && { borderBottomColor: colors.BzBorder },
                      ]}
                    >
                      <Text style={{ flex: 1.2, minWidth: 110, color: colors.BzText, fontSize: 13, fontWeight: '700' }}>{s.nombre}</Text>
                      <Text style={{ width: 110, color: colors.BzText, fontSize: 13 }}>{s.encargado}</Text>
                      <Text style={{ width: 90, color: colors.BzMuted, fontSize: 13 }}>{s.sillas}</Text>
                      <Text style={{ width: 95, color: colors.BzText, fontSize: 13, fontWeight: '700' }}>{s.ocupacion}%</Text>
                      <Text style={{ width: 110, textAlign: 'right', color: colors.BzText, fontSize: 13, fontWeight: '700' }}>
                        {formatMoney(vAct)}
                      </Text>
                      <Text style={{ width: 110, textAlign: 'right', color: colors.BzMuted, fontSize: 13 }}>
                        {formatMoney(mAct)}
                      </Text>
                      <View style={{ width: 125, alignItems: 'flex-end' }}>
                        <View
                          style={[
                            styles.pillBadge,
                            {
                              borderColor: cumple ? '#265936' : '#6B5B2E',
                              backgroundColor: cumple ? '#132419' : '#211D12',
                            },
                          ]}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '700', color: cumple ? colors.BzSuccess : '#E2C46D' }}>
                            {cumple ? 'Meta superada' : 'En curso'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          <View style={[styles.reportCard, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '700' }}>Equipo y turnos</Text>
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

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ minWidth: isDesktop ? '100%' : 680 }}>
                <View style={[styles.tableRow, { borderBottomColor: colors.BzBorder }]}>
                  <Text style={[styles.th, { flex: 1.2, minWidth: 120, color: colors.BzMuted }]}>INTEGRANTE</Text>
                  <Text style={[styles.th, { width: 100, color: colors.BzMuted }]}>ROL</Text>
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
                      <Text style={{ width: 100, color: colors.BzText, fontSize: 13 }}>{e.rol}</Text>
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
                          onPress={() => cambiarEstadoEmpleado(e.id)}
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
  const { permisos, horariosBarberos, horariosCajeros, cambiarRolIntegrante } = useHorarios();
  const equipoCompleto = [...horariosBarberos, ...horariosCajeros];

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
    const t = setTimeout(() => {
      setNotifs((prev) => [{ titulo: 'Nueva cita agendada', detalle: 'Juan Pérez · 12:15', color: colors.BzSuccess }, ...prev]);
    }, 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario.rol, colors.BzSuccess, colors.BzWarning]);

  /* ===== DISEÑO ESCRITORIO LIMPIO Y SIMPLE ===== */
  if (isDesktop && !esCliente && !esBarbero) {
    const rolesDisponibles =
      usuario.rol === RolSesion.DUENO
        ? [RolSesion.BARBERO, RolSesion.RECEPCION, RolSesion.ENCARGADO]
        : [RolSesion.BARBERO, RolSesion.RECEPCION];

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
                  {esDueno ? '$16,570' : '$6,270'}
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
                  2
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
                  <View style={styles.listRowClean}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.BzSuccess }} />
                      <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '700', width: 44 }}>
                        15:00
                      </Text>
                      <View>
                        <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '600' }}>
                          Carlos Mendoza
                        </Text>
                        <Text style={{ color: colors.BzMuted, fontSize: 12, marginTop: 1 }}>
                          Corte de pelo
                        </Text>
                      </View>
                    </View>
                    <View
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
                    </View>
                  </View>
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

                  <View style={styles.listRowClean}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#E2C46D' }} />
                      <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '600' }}>
                        Pomada mate 100g
                      </Text>
                    </View>
                    <View style={[styles.pillBadge, { borderColor: '#6B5B2E', backgroundColor: '#211D12' }]}>
                      <Text style={{ color: '#E2C46D', fontSize: 11, fontWeight: '600' }}>4 de 8</Text>
                    </View>
                  </View>

                  <View style={[styles.listRowClean, { borderTopWidth: 1, borderTopColor: colors.BzBorder }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.BzDanger }} />
                      <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '600' }}>
                        Shampoo menta 250ml
                      </Text>
                    </View>
                    <View style={[styles.pillBadge, { borderColor: '#6B2B2B', backgroundColor: '#241414' }]}>
                      <Text style={{ color: colors.BzDanger, fontSize: 11, fontWeight: '600' }}>3 de 6</Text>
                    </View>
                  </View>
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

                  {equipoCompleto.map((emp, idx) => {
                    const abierto = rolDropdownId === emp.empleadoId;
                    return (
                      <View
                        key={emp.empleadoId}
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
                            onPress={() => setRolDropdownId(abierto ? null : emp.empleadoId)}
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
                              {emp.rolSesion.split('/')[0]}
                            </Text>
                            <Text style={{ color: colors.BzMuted, fontSize: 10 }}>⌄</Text>
                          </Pressable>
                        </View>

                        {abierto && (
                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
                            {rolesDisponibles.map((rolOpcion) => {
                              const activo = emp.rolSesion === rolOpcion;
                              return (
                                <Pressable
                                  key={rolOpcion}
                                  onPress={() => {
                                    cambiarRolIntegrante(emp.empleadoId, rolOpcion);
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
                  })}
                </View>
              )}
            </View>
          </View>
        </View>
      </>
    );
  }

  /* ===== VISTA MÓVIL ORIGINAL INTACTA ===== */
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
              <MiniMetrica etiqueta="Venta hoy" valor="$16,570" />
              <MiniMetrica etiqueta="Citas totales" valor="46" />
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

            {equipoCompleto.map((emp, idx) => (
              <View key={emp.empleadoId} style={{ gap: 6, paddingTop: idx > 0 ? 6 : 2 }}>
                {idx > 0 && <View style={{ height: 1, backgroundColor: colors.BzBorder, marginBottom: 4 }} />}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '600' }}>
                    {emp.nombre}
                  </Text>
                  <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                    {emp.rolSesion}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  {(usuario.rol === RolSesion.DUENO
                    ? [RolSesion.BARBERO, RolSesion.RECEPCION, RolSesion.ENCARGADO]
                    : [RolSesion.BARBERO, RolSesion.RECEPCION]
                  ).map((rolOpcion) => {
                    const activo = emp.rolSesion === rolOpcion;
                    return (
                      <Pressable
                        key={rolOpcion}
                        onPress={() => cambiarRolIntegrante(emp.empleadoId, rolOpcion)}
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
            ))}
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
          ) : (
            <>
              <FilaResumen titulo="10:00 · Juan Pérez" subtitulo="Corte · Carlos R." colorPunto={colors.BzSuccess} />
              <View style={{ height: 1, backgroundColor: colors.BzBorder }} />
              <FilaResumen titulo="11:30 · Andrés López" subtitulo="Corte + barba · Diego M." colorPunto={colors.BzText} />
              <View style={{ height: 1, backgroundColor: colors.BzBorder }} />
              <FilaResumen titulo="Lista de espera" subtitulo="3 clientes en fila" colorPunto={colors.BzWarning} />
            </>
          )}
        </TarjetaSeccion>

        {esCliente ? (
          <TarjetaSeccion titulo="TARJETA DE LEALTAD" accionTexto="7 / 10 sellos" onAccion={onIrRol}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {Array.from({ length: 10 }).map((_, idx) => (
                <View
                  key={idx}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: idx < 7 ? colors.BzText : colors.BzCardInner,
                  }}
                />
              ))}
            </View>
            <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
              Te faltan 3 visitas para tu corte de cortesía.
            </Text>
          </TarjetaSeccion>
        ) : (
          <TarjetaSeccion
            titulo="RESUMEN DEL DÍA"
            accionTexto={esBarbero ? 'Ver productividad ›' : tieneCaja ? 'Ir a caja ›' : 'Mi rol ›'}
            onAccion={esBarbero ? onIrComisiones : tieneCaja ? onIrCaja : onIrRol}
          >
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <MiniMetrica etiqueta="Citas hoy" valor="12" />
              <MiniMetrica
                etiqueta={esBarbero ? 'Generado' : 'Caja turno'}
                valor={esBarbero ? '$1,840' : '$6,270'}
              />
            </View>
          </TarjetaSeccion>
        )}

        {tieneCaja && (
          <TarjetaSeccion titulo="ALERTAS DE INVENTARIO" accionTexto="Ver stock ›" onAccion={onIrInventario}>
            <FilaResumen titulo="Pomada mate 100g" subtitulo="Quedan 4 pz (mínimo 8)" colorPunto={colors.BzWarning} />
            <View style={{ height: 1, backgroundColor: colors.BzBorder }} />
            <FilaResumen titulo="Shampoo menta 250ml" subtitulo="Quedan 3 pz (mínimo 6)" colorPunto={colors.BzWarning} />
          </TarjetaSeccion>
        )}
      </ScrollView>
    </>
  );
};

/* ---------- 2. Nueva cita del EQUIPO ---------- */

const SERVICIOS_EQUIPO = [
  { nombre: 'Corte de pelo', duracionMin: 40, precio: 220 },
  { nombre: 'Arreglo de barba', duracionMin: 30, precio: 160 },
  { nombre: 'Corte + Barba', duracionMin: 60, precio: 340 },
  { nombre: 'Afeitado de barba', duracionMin: 35, precio: 180 },
];

const SLOTS_EQUIPO: number[] = Array.from({ length: 20 }, (_, i) => 600 + i * 30);

const VistaAgendar: React.FC<{
  usuario: UsuarioBz;
  citasEquipo: CitaEquipo[];
  citaActual: string | null;
  onVolverAgenda: () => void;
  onCrearCita: (cita: CitaEquipo, resumen: string) => void;
}> = ({ usuario, citasEquipo, citaActual, onVolverAgenda, onCrearCita }) => {
  const { colors } = useBzTheme();
  const hoy = hoyISO();
  const sucursal =
    usuario.sucursal && usuario.sucursal !== 'Todas' ? normalizarSucursal(usuario.sucursal) : 'Olivete';

  const [servicioSel, setServicioSel] = useState(0);
  const [barberoSel, setBarberoSel] = useState<string>(usuario.rol === RolSesion.BARBERO ? usuario.id : 'ANY');
  const [slotSel, setSlotSel] = useState<number | null>(null);
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState<string | null>(null);

  const servicio = SERVICIOS_EQUIPO[servicioSel];

  const hayChoque = (barberoId: string, inicioMin: number): boolean =>
    citasEquipo.some(
      (c) =>
        c.barberoId === barberoId &&
        c.fechaISO === hoy &&
        c.estado !== 'CANCELADA' &&
        inicioMin < minutosDelDia(c) + c.duracionMin &&
        minutosDelDia(c) < inicioMin + servicio.duracionMin,
    );

  const estaOcupado = (inicioMin: number): boolean =>
    barberoSel === 'ANY'
      ? EQUIPO_BARBEROS.every((b) => hayChoque(b.id, inicioMin))
      : hayChoque(barberoSel, inicioMin);

  const slotValido = slotSel !== null && !estaOcupado(slotSel) ? slotSel : null;

  const confirmar = () => {
    if (!nombreCliente.trim()) return setError('Escribe el nombre del cliente');
    if (slotValido === null) return setError('Elige una hora disponible');

    const barbero =
      barberoSel === 'ANY'
        ? EQUIPO_BARBEROS.find((b) => !hayChoque(b.id, slotValido))
        : EQUIPO_BARBEROS.find((b) => b.id === barberoSel);
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
      duracionMin: servicio.duracionMin,
      clienteId: tel.length === 10 ? `c-${tel}` : `ext-${folio}`,
      clienteNombre: nombreCliente.trim(),
      telefono: tel.length > 0 ? tel : 'Sin teléfono',
      servicio: servicio.nombre,
      precio: servicio.precio,
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
      `${nombreCliente.trim()} · ${servicio.nombre} · ${nueva.horaTexto} con ${barbero.nombre}`,
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
      {SERVICIOS_EQUIPO.map((srv, idx) => {
        const activo = idx === servicioSel;
        return (
          <Pressable
            key={srv.nombre}
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
              <Text style={{ color: colors.BzMuted, fontSize: 12 }}>{srv.duracionMin} min</Text>
            </View>
            <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '500' }}>${srv.precio}</Text>
          </Pressable>
        );
      })}

      <Text style={[BzTypography.label, { color: colors.BzMuted }]}>3. BARBERO</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {[{ id: 'ANY', nombre: 'Cualquiera' }, ...EQUIPO_BARBEROS].map((b) => {
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
      <Text style={{ color: colors.BzMuted, fontSize: 11 }}>Las horas tachadas ya están ocupadas.</Text>

      <Text style={{ color: colors.BzMuted, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
        Total estimado: ${servicio.precio} · {servicio.duracionMin} min
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
  const { isDesktop } = useDesktopLayout();
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
      ? EQUIPO_BARBEROS.map((b) => ({
          initials: obtenerIniciales(b.nombre),
          name: b.nombre,
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

  /* ===== EN MÓVIL: BARRA FLOTANTE INFERIOR ORIGINAL ===== */
  return (
    <View style={{ flex: 1, backgroundColor: colors.BzBg }}>
      <View style={{ flex: 1 }}>{renderContenido()}</View>

      <View style={{ backgroundColor: colors.BzBg, paddingHorizontal: 10, paddingVertical: 10 }}>
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