import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  EQUIPO_BARBEROS,
  ETIQUETA_ESTADO,
  claveDia,
  fechaDesdeClave,
  horaTextoDe,
  hoyISO,
  minutosDelDia,
  normalizarSucursal,
  type CitaEquipo,
  type EstadoCita,
  type OrigenCita,
} from '../constants/AgendaTipos';
import { folioLibre } from '../constants/AgendaContext';
import { BzColors, useBzTheme } from '../constants/BzTheme';
import { RolSesion, UsuarioBz } from '../constants/Sesion';
import { useDesktopLayout } from '../hooks/useDesktopLayout';
import {
  BotonPrimario,
  BotonSecundario,
  BzSheet,
  CampoTexto,
  ChipTexto,
  Divisor,
  Etiqueta,
  Fila,
  Segmentado,
  Tarjeta,
  Titulo,
} from './BzFase3Ui';

/* =====================================================================
 * AgendaEquipoScreen · Inicia en Hoy a la Izquierda + Mapa 4 Direcciones
 * ===================================================================== */

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const idEstilo = 'bz-dark-scrollbar-style';
  if (!document.getElementById(idEstilo)) {
    const style = document.createElement('style');
    style.id = idEstilo;
    style.innerHTML = `
      .bz-scroll-derecho::-webkit-scrollbar {
        width: 0px;
        height: 0px;
        display: none;
      }
      .bz-scroll-derecho {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
    `;
    document.head.appendChild(style);
  }
}

const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_MIN = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const ETIQUETA_ORIGEN: Record<OrigenCita, string> = {
  CLIENTE: 'Reservó desde la app',
  RECEPCION: 'Agendada en recepción',
  WALK_IN: 'Walk-in',
};

const SERVICIOS_WALKIN = [
  { etiqueta: 'Corte', nombre: 'Corte de pelo', duracionMin: 40, precio: 220 },
  { etiqueta: 'Barba', nombre: 'Arreglo de barba', duracionMin: 30, precio: 160 },
  { etiqueta: 'Corte + barba', nombre: 'Corte + Barba', duracionMin: 60, precio: 340 },
  { etiqueta: 'Ceja', nombre: 'Ceja y bigote', duracionMin: 10, precio: 50 },
];

const HORA_INICIO_GRID = 8; // 8:00 AM
const HORA_FIN_GRID = 21; // 9:00 PM
const BASE_ALTO_HORA = 82;
const ANCHO_COL_HORA = 56;
const BASE_ANCHO_COL_DIA = 155;

const HORAS_GRID = Array.from(
  { length: HORA_FIN_GRID - HORA_INICIO_GRID },
  (_, i) => HORA_INICIO_GRID + i,
);

const PALETA_RECTANGULOS_CLAROS = [
  { bg: '#FEF08A', border: '#CA8A04', text: '#141416', sub: '#422006' }, // Amarillo claro
  { bg: '#BAE6FD', border: '#0284C7', text: '#0C4A6E', sub: '#075985' }, // Azul cielo claro
  { bg: '#BBF7D0', border: '#16A34A', text: '#14532D', sub: '#166534' }, // Verde menta claro
  { bg: '#FED7AA', border: '#EA580C', text: '#431407', sub: '#7C2D12' }, // Durazno claro
  { bg: '#E9D5FF', border: '#7C3AED', text: '#2E1065', sub: '#4C1D95' }, // Lavanda claro
];

function estiloBloqueClaro(citasGrupo: CitaEquipo[]) {
  const principal = citasGrupo[0];
  if (citasGrupo.length === 1) {
    if (principal.estado === 'TERMINADA') {
      return { bg: '#E4E4E7', border: '#71717A', text: '#18181B', sub: '#3F3F46' };
    }
    if (principal.estado === 'EN_SERVICIO') {
      return { bg: '#FDE68A', border: '#D97706', text: '#141416', sub: '#78350F' };
    }
  }
  const semilla = `${principal.barberoId}-${principal.hora24}`;
  let hash = 0;
  for (let i = 0; i < semilla.length; i++) {
    hash = (hash * 31 + semilla.charCodeAt(i)) | 0;
  }
  return PALETA_RECTANGULOS_CLAROS[Math.abs(hash) % PALETA_RECTANGULOS_CLAROS.length];
}

interface GrupoBloqueHorario {
  id: string;
  inicioMin: number;
  finMin: number;
  citas: CitaEquipo[];
}

function agruparCitasSimultaneas(citasDia: CitaEquipo[]): GrupoBloqueHorario[] {
  if (citasDia.length === 0) return [];
  const ordenadas = [...citasDia].sort((a, b) => minutosDelDia(a) - minutosDelDia(b));
  const grupos: GrupoBloqueHorario[] = [];

  for (const c of ordenadas) {
    const ini = minutosDelDia(c);
    const fin = ini + Math.max(25, c.duracionMin);

    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ini < ultimo.finMin) {
      ultimo.citas.push(c);
      ultimo.finMin = Math.max(ultimo.finMin, fin);
    } else {
      grupos.push({
        id: c.id,
        inicioMin: ini,
        finMin: fin,
        citas: [c],
      });
    }
  }

  return grupos;
}

const colorEstado = (e: EstadoCita, c: BzColors): string => {
  switch (e) {
    case 'PROGRAMADA':
      return c.BzText;
    case 'CONFIRMADA':
    case 'LLEGO':
      return c.BzSuccess;
    case 'EN_SERVICIO':
      return c.BzWarning;
    case 'TERMINADA':
      return c.BzMuted;
    case 'CANCELADA':
      return c.BzDanger;
    default:
      return c.BzText;
  }
};

const moverDia = (clave: string, dias: number): string => {
  const d = fechaDesdeClave(clave);
  d.setDate(d.getDate() + dias);
  return claveDia(d);
};

const etiquetaFecha = (clave: string): string => {
  const d = fechaDesdeClave(clave);
  return `${DIAS_CORTO[d.getDay()]} ${d.getDate()} ${MESES_CORTO[d.getMonth()]} ${d.getFullYear()}`;
};

const etiquetaSemana = (inicio: string): string => {
  const a = fechaDesdeClave(inicio);
  const b = fechaDesdeClave(moverDia(inicio, 6));
  const mesA = a.getMonth() === b.getMonth() ? '' : ` ${MESES_CORTO[a.getMonth()]}`;
  return `${a.getDate()}${mesA} - ${b.getDate()} ${MESES_CORTO[b.getMonth()]} ${b.getFullYear()}`;
};

const ordenarPorHora = (a: CitaEquipo, b: CitaEquipo) => minutosDelDia(a) - minutosDelDia(b);

interface ItemListaEspera {
  id: number;
  cliente: string;
  servicio: string;
  barberoId: string;
  esperaMin: number;
}

type ModoVistaAgenda = 'Horario' | 'Día' | 'Semana';

const nombreBarbero = (id: string): string =>
  id === 'ANY' ? 'Cualquiera' : EQUIPO_BARBEROS.find((b) => b.id === id)?.nombre ?? id;

/* ===================================================================== */

export const AgendaEquipoScreen: React.FC<{
  usuario: UsuarioBz;
  citas: CitaEquipo[];
  onNuevaCita: () => void;
  onCambiarEstado: (id: string, estado: EstadoCita) => void;
  onAgregarCita: (cita: CitaEquipo) => void;
}> = ({ usuario, citas, onNuevaCita, onCambiarEstado, onAgregarCita }) => {
  const { colors, dark } = useBzTheme();
  const { isDesktop } = useDesktopLayout();
  const esBarbero = usuario.rol === RolSesion.BARBERO;
  const hoy = hoyISO();

  const sucursalUsuario =
    usuario.sucursal && usuario.sucursal !== 'Todas' ? normalizarSucursal(usuario.sucursal) : null;
  const etiquetaSucursal = sucursalUsuario ?? 'Todas las sucursales';

  // Inicia exactamente en hoy, y diaInicioGrid controla la primera columna a la izquierda
  const [diaSel, setDiaSel] = useState<string>(hoy);
  const [diaInicioGrid, setDiaInicioGrid] = useState<string>(hoy);
  const [modoVista, setModoVista] = useState<ModoVistaAgenda>('Horario');
  const [barberoFiltro, setBarberoFiltro] = useState<string>('TODOS');
  const [citasFocusIds, setCitasFocusIds] = useState<string[]>([]);
  const [mostrarWalkIn, setMostrarWalkIn] = useState(false);

  const [zoom, setZoom] = useState<number>(1);
  const altoHoraActual = Math.round(BASE_ALTO_HORA * zoom);
  const anchoColDiaActual = Math.round(BASE_ANCHO_COL_DIA * Math.max(0.95, zoom));

  const acercar = () => setZoom((z) => Math.min(2.2, Number((z + 0.2).toFixed(2))));
  const alejar = () => setZoom((z) => Math.max(0.6, Number((z - 0.2).toFixed(2))));
  const resetZoom = () => setZoom(1);

  const mapContainerRef = useRef<any>(null);
  const hScrollRef = useRef<any>(null);
  const vScrollRef = useRef<any>(null);
  const hOffsetRef = useRef(0);
  const vOffsetRef = useRef(0);
  const dragStateRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    startScrollX: 0,
    startScrollY: 0,
  });
  const [isGrabbing, setIsGrabbing] = useState(false);

  const [altoPantallaWeb, setAltoPantallaWeb] = useState<number>(() =>
    Platform.OS === 'web' && typeof window !== 'undefined' ? Math.max(540, window.innerHeight - 115) : 640,
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onResize = () => setAltoPantallaWeb(Math.max(540, window.innerHeight - 115));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const moverScroll2D = (dx: number, dy: number) => {
      const nextX = Math.max(0, dragStateRef.current.startScrollX - dx);
      const nextY = Math.max(0, dragStateRef.current.startScrollY - dy);
      hOffsetRef.current = nextX;
      vOffsetRef.current = nextY;

      hScrollRef.current?.scrollTo?.({ x: nextX, animated: false });
      vScrollRef.current?.scrollTo?.({ y: nextY, animated: false });

      if (mapContainerRef.current && typeof mapContainerRef.current.querySelectorAll === 'function') {
        const nodos = mapContainerRef.current.querySelectorAll('div');
        nodos.forEach((el: HTMLElement) => {
          if (el.scrollWidth > el.clientWidth + 2) el.scrollLeft = nextX;
          if (el.scrollHeight > el.clientHeight + 2) el.scrollTop = nextY;
        });
      }
    };

    const onWindowMouseMove = (ev: MouseEvent) => {
      if (!dragStateRef.current.active) return;
      const dx = ev.clientX - dragStateRef.current.startX;
      const dy = ev.clientY - dragStateRef.current.startY;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        dragStateRef.current.moved = true;
      }
      if (dragStateRef.current.moved) {
        ev.preventDefault();
        moverScroll2D(dx, dy);
      }
    };

    const onWindowMouseUp = () => {
      if (!dragStateRef.current.active) return;
      dragStateRef.current.active = false;
      setIsGrabbing(false);
      setTimeout(() => {
        dragStateRef.current.moved = false;
      }, 40);
    };

    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
    };
  }, []);

  const [listaEspera, setListaEspera] = useState<ItemListaEspera[]>([
    { id: 1, cliente: 'Hugo P.', servicio: 'Barba', barberoId: 'ANY', esperaMin: 15 },
    { id: 2, cliente: 'Raúl T.', servicio: 'Ceja', barberoId: 'b1', esperaMin: 25 },
    { id: 3, cliente: 'Beto L.', servicio: 'Corte', barberoId: 'ANY', esperaMin: 35 },
  ]);

  const visibles = useMemo(
    () =>
      citas.filter(
        (c) =>
          c.estado !== 'CANCELADA' &&
          (!sucursalUsuario || c.sucursal === sucursalUsuario) &&
          (esBarbero
            ? c.barberoId === usuario.id
            : barberoFiltro === 'TODOS' || c.barberoId === barberoFiltro),
      ),
    [citas, sucursalUsuario, esBarbero, usuario.id, barberoFiltro],
  );

  const citasDelDia = useMemo(
    () => visibles.filter((c) => c.fechaISO === diaSel).sort(ordenarPorHora),
    [visibles, diaSel],
  );

  const citasPanelDerecho = useMemo(() => {
    if (citasFocusIds.length > 0) {
      const filtradas = visibles
        .filter((c) => citasFocusIds.includes(c.id))
        .sort(ordenarPorHora);
      if (filtradas.length > 0) return filtradas;
    }
    return citasDelDia;
  }, [citasFocusIds, visibles, citasDelDia]);

  // 7 días consecutivos empezando a la izquierda en diaInicioGrid (hoy por defecto)
  const diasSemana = useMemo(
    () => Array.from({ length: 7 }, (_, i) => moverDia(diaInicioGrid, i)),
    [diaInicioGrid],
  );

  const esVistaSemanal = modoVista === 'Semana' || modoVista === 'Horario';
  const paso = esVistaSemanal ? 7 : 1;
  const irAnterior = () => {
    setCitasFocusIds([]);
    if (esVistaSemanal) {
      const nuevoInicio = moverDia(diaInicioGrid, -paso);
      setDiaInicioGrid(nuevoInicio);
      setDiaSel(nuevoInicio);
    } else {
      const nuevoDia = moverDia(diaSel, -1);
      setDiaSel(nuevoDia);
      setDiaInicioGrid(nuevoDia);
    }
  };
  const irSiguiente = () => {
    setCitasFocusIds([]);
    if (esVistaSemanal) {
      const nuevoInicio = moverDia(diaInicioGrid, paso);
      setDiaInicioGrid(nuevoInicio);
      setDiaSel(nuevoInicio);
    } else {
      const nuevoDia = moverDia(diaSel, 1);
      setDiaSel(nuevoDia);
      setDiaInicioGrid(nuevoDia);
    }
  };
  const esHoyVisible = esVistaSemanal ? diaInicioGrid === hoy : diaSel === hoy;

  const ahora = new Date();
  const minAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const offsetAhora = minAhora - HORA_INICIO_GRID * 60;
  const mostrarLineaAhora = offsetAhora >= 0 && offsetAhora <= HORAS_GRID.length * 60;
  const topLineaAhora = (offsetAhora / 60) * altoHoraActual;

  const asignarEspera = (espera: ItemListaEspera) => {
    const now = new Date();
    const hora24 = now.getHours();
    const minuto = now.getMinutes();
    const inicio = hora24 * 60 + minuto;
    const srv = SERVICIOS_WALKIN.find((s) => s.etiqueta === espera.servicio) ?? SERVICIOS_WALKIN[0];
    const sucursal = sucursalUsuario ?? 'Olivete';

    const ocupado = (barberoId: string) =>
      citas.some(
        (c) =>
          c.barberoId === barberoId &&
          c.fechaISO === hoy &&
          c.estado !== 'CANCELADA' &&
          c.estado !== 'TERMINADA' &&
          inicio < minutosDelDia(c) + c.duracionMin &&
          minutosDelDia(c) < inicio + srv.duracionMin,
      );

    const barbero =
      espera.barberoId !== 'ANY'
        ? EQUIPO_BARBEROS.find((b) => b.id === espera.barberoId) ?? EQUIPO_BARBEROS[0]
        : EQUIPO_BARBEROS.find((b) => !ocupado(b.id)) ?? EQUIPO_BARBEROS[0];

    const folio = folioLibre(citas.map((c) => c.folio));

    onAgregarCita({
      id: `cita-${folio}`,
      folio,
      fechaISO: hoy,
      hora24,
      minuto,
      horaTexto: horaTextoDe(hora24, minuto),
      duracionMin: srv.duracionMin,
      clienteId: `ext-${folio}`,
      clienteNombre: espera.cliente,
      telefono: 'Sin teléfono',
      servicio: srv.nombre,
      precio: srv.precio,
      barberoId: barbero.id,
      barberoNombre: barbero.nombre,
      sucursal,
      estado: 'LLEGO',
      origen: 'WALK_IN',
      notasCliente: '',
      notasTecnicas: '',
    });

    setListaEspera((l) => l.filter((x) => x.id !== espera.id));
    setDiaSel(hoy);
    setDiaInicioGrid(hoy);
    setCitasFocusIds([]);
  };

  const renderCita = (cita: CitaEquipo) => {
    const esWalkIn = cita.origen === 'WALK_IN';
    const colorBorde = esWalkIn && cita.estado !== 'TERMINADA' ? colors.BzWarning : colorEstado(cita.estado, colors);
    const seleccionada = isDesktop && citasFocusIds.includes(cita.id);

    return (
      <Pressable
        key={cita.id}
        onPress={() => {
          setDiaSel(cita.fechaISO);
          setCitasFocusIds([cita.id]);
        }}
      >
        <Tarjeta
          padding={12}
          radius={12}
          gap={0}
          style={seleccionada ? { borderColor: '#E2C46D', borderWidth: 1.5 } : undefined}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 4, height: 42, borderRadius: 2, backgroundColor: colorBorde }} />
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '600' }}>{cita.horaTexto}</Text>
                <Text style={{ color: colors.BzText, fontSize: 13, flexShrink: 1 }} numberOfLines={1}>
                  · {cita.clienteNombre}
                </Text>
              </View>
              <Text style={{ color: colors.BzMuted, fontSize: 11 }} numberOfLines={1}>
                {cita.servicio} · {cita.barberoNombre} ({cita.duracionMin} min)
              </Text>
              {(cita.notasCliente.length > 0 || !!cita.fotoUri) && (
                <Text style={{ color: colors.BzMuted, fontSize: 10, marginTop: 2 }}>
                  {cita.fotoUri ? '📷 ' : ''}
                  {cita.notasCliente.length > 0 ? 'Con descripción del cliente' : 'Con foto de referencia'}
                </Text>
              )}
            </View>
            <View
              style={{
                borderRadius: 20,
                backgroundColor: colors.BzBg,
                borderWidth: 1,
                borderColor: colors.BzBorder,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: colorBorde, fontSize: 10 }}>{ETIQUETA_ESTADO[cita.estado]}</Text>
            </View>
          </View>
        </Tarjeta>
      </Pressable>
    );
  };

  const handleMouseDown = (e: any) => {
    if (Platform.OS !== 'web') return;
    const ev = e?.nativeEvent ?? e;
    if (ev.button !== 0) return;

    if (mapContainerRef.current && typeof mapContainerRef.current.querySelectorAll === 'function') {
      const nodos = mapContainerRef.current.querySelectorAll('div');
      nodos.forEach((el: HTMLElement) => {
        if (el.scrollWidth > el.clientWidth + 2) hOffsetRef.current = el.scrollLeft;
        if (el.scrollHeight > el.clientHeight + 2) vOffsetRef.current = el.scrollTop;
      });
    }

    dragStateRef.current = {
      active: true,
      moved: false,
      startX: ev.clientX ?? ev.pageX ?? 0,
      startY: ev.clientY ?? ev.pageY ?? 0,
      startScrollX: hOffsetRef.current,
      startScrollY: vOffsetRef.current,
    };
    setIsGrabbing(true);
  };

  /* ----- Cuadrícula de Calendario Tipo Mapa 4 Direcciones ----- */
  const renderCalendarioEjecutivo = () => {
    const altoTotal = HORAS_GRID.length * altoHoraActual;
    const anchoTotalDias = diasSemana.length * anchoColDiaActual;
    const anchoGridTotal = ANCHO_COL_HORA + anchoTotalDias;

    const contenidoGrid = (
      <View style={{ width: anchoGridTotal, minWidth: '100%', flex: 1 }}>
        {/* Encabezado de días fijo arriba (empieza en HOY a la izquierda) */}
        <View
          style={[
            styles.gridHeaderRow,
            { backgroundColor: colors.BzCardInner, borderBottomColor: colors.BzBorder },
          ]}
        >
          <View
            style={{
              width: ANCHO_COL_HORA,
              borderRightWidth: 1,
              borderRightColor: colors.BzBorder,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.BzMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>
              HORA
            </Text>
          </View>

          {diasSemana.map((clave) => {
            const d = fechaDesdeClave(clave);
            const esHoyCol = clave === hoy;
            const esDiaActivo = clave === diaSel;
            const cantCitas = visibles.filter((c) => c.fechaISO === clave).length;

            return (
              <Pressable
                key={clave}
                onPress={() => {
                  if (dragStateRef.current.moved) return;
                  setDiaSel(clave);
                  setCitasFocusIds([]);
                }}
                style={[
                  styles.gridDayHeader,
                  {
                    width: anchoColDiaActual,
                    flexGrow: 1,
                    borderRightColor: colors.BzBorder,
                    backgroundColor: esHoyCol
                      ? dark
                        ? 'rgba(226, 196, 109, 0.10)'
                        : 'rgba(226, 196, 109, 0.18)'
                      : esDiaActivo
                      ? dark
                        ? 'rgba(255, 255, 255, 0.03)'
                        : 'rgba(0, 0, 0, 0.03)'
                      : 'transparent',
                  },
                ]}
              >
                <Text
                  style={{
                    color: esHoyCol || esDiaActivo ? '#E2C46D' : colors.BzMuted,
                    fontSize: 10,
                    fontWeight: '700',
                    letterSpacing: 1,
                  }}
                >
                  {esHoyCol ? `HOY · ${DIAS_MIN[d.getDay()]}` : DIAS_MIN[d.getDay()]}
                </Text>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 2,
                  }}
                >
                  <View
                    style={[
                      styles.dayNumberCircle,
                      esHoyCol && { backgroundColor: '#E2C46D' },
                      !esHoyCol && esDiaActivo && { borderWidth: 1.5, borderColor: '#E2C46D' },
                    ]}
                  >
                    <Text
                      style={{
                        color: esHoyCol ? '#141416' : colors.BzText,
                        fontSize: 14,
                        fontWeight: '700',
                      }}
                    >
                      {d.getDate()}
                    </Text>
                  </View>

                  {cantCitas > 0 && (
                    <View
                      style={{
                        backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        paddingHorizontal: 6,
                        paddingVertical: 1,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: colors.BzMuted, fontSize: 10, fontWeight: '600' }}>
                        {cantCitas}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Cuerpo de horas con scroll vertical interno */}
        <ScrollView
          ref={vScrollRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(e) => {
            vOffsetRef.current = e.nativeEvent.contentOffset.y;
          }}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View style={{ flexDirection: 'row', height: altoTotal }}>
            {/* Columna izquierda de horas */}
            <View
              style={{
                width: ANCHO_COL_HORA,
                borderRightWidth: 1,
                borderRightColor: colors.BzBorder,
                backgroundColor: colors.BzCardInner,
              }}
            >
              {HORAS_GRID.map((h) => (
                <View
                  key={h}
                  style={{
                    height: altoHoraActual,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.BzBorder,
                    paddingTop: 6,
                    paddingRight: 8,
                    alignItems: 'flex-end',
                  }}
                >
                  <Text
                    style={{
                      color: colors.BzMuted,
                      fontSize: 11,
                      fontWeight: '500',
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {h < 10 ? `0${h}:00` : `${h}:00`}
                  </Text>
                </View>
              ))}
            </View>

            {/* Columnas de días */}
            <View style={{ flexDirection: 'row', height: altoTotal, flex: 1 }}>
              {diasSemana.map((clave) => {
                const delDia = visibles.filter((c) => c.fechaISO === clave);
                const bloques = agruparCitasSimultaneas(delDia);
                const esHoyCol = clave === hoy;

                return (
                  <View
                    key={clave}
                    style={{
                      width: anchoColDiaActual,
                      flexGrow: 1,
                      height: altoTotal,
                      borderRightWidth: 1,
                      borderRightColor: colors.BzBorder,
                      backgroundColor: esHoyCol
                        ? dark
                          ? 'rgba(226, 196, 109, 0.03)'
                          : 'rgba(226, 196, 109, 0.07)'
                        : 'transparent',
                    }}
                  >
                    {HORAS_GRID.map((h) => (
                      <View
                        key={h}
                        style={{
                          height: altoHoraActual,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.BzBorder,
                          justifyContent: 'center',
                        }}
                      >
                        {zoom >= 1.2 && (
                          <View
                            style={{
                              height: 1,
                              backgroundColor: colors.BzBorder,
                              opacity: 0.4,
                            }}
                          />
                        )}
                      </View>
                    ))}

                    {esHoyCol && mostrarLineaAhora && (
                      <View
                        pointerEvents="none"
                        style={[styles.nowLineWrap, { top: topLineaAhora }]}
                      >
                        <View style={styles.nowDot} />
                        <View style={styles.nowLine} />
                      </View>
                    )}

                    {bloques.map((bloque) => {
                      const offsetMin = bloque.inicioMin - HORA_INICIO_GRID * 60;
                      const duracionBloque = bloque.finMin - bloque.inicioMin;
                      if (offsetMin + duracionBloque <= 0 || offsetMin >= HORAS_GRID.length * 60) {
                        return null;
                      }

                      const topPx = Math.max(0, (offsetMin / 60) * altoHoraActual) + 2;
                      const minAltoPorCitas = bloque.citas.length > 1 ? bloque.citas.length * 24 + 10 : 38;
                      const heightPx = Math.max(minAltoPorCitas, (duracionBloque / 60) * altoHoraActual - 4);
                      const estilo = estiloBloqueClaro(bloque.citas);
                      const contieneSeleccionada =
                        isDesktop &&
                        citasFocusIds.length > 0 &&
                        bloque.citas.some((c) => citasFocusIds.includes(c.id));

                      if (bloque.citas.length === 1) {
                        const cita = bloque.citas[0];
                        return (
                          <Pressable
                            key={bloque.id}
                            onPress={() => {
                              if (dragStateRef.current.moved) return;
                              setDiaSel(cita.fechaISO);
                              setCitasFocusIds([cita.id]);
                            }}
                            style={({ pressed }) => [
                              styles.rectClaro,
                              {
                                top: topPx,
                                height: heightPx,
                                backgroundColor: estilo.bg,
                                borderColor: contieneSeleccionada ? '#FFFFFF' : estilo.border,
                                borderWidth: contieneSeleccionada ? 2.5 : 1.5,
                              },
                              pressed && { opacity: 0.9 },
                            ]}
                          >
                            <Text
                              style={[styles.rectLineaPrincipal, { color: estilo.text }]}
                              numberOfLines={1}
                            >
                              • {cita.barberoNombre}
                            </Text>
                            {heightPx >= 44 && (
                              <Text
                                style={[styles.rectLineaSub, { color: estilo.sub }]}
                                numberOfLines={1}
                              >
                                {cita.horaTexto} · {cita.clienteNombre}
                              </Text>
                            )}
                            {heightPx >= 64 && (
                              <Text
                                style={[styles.rectLineaSub, { color: estilo.sub, opacity: 0.85 }]}
                                numberOfLines={1}
                              >
                                {cita.servicio}
                              </Text>
                            )}
                          </Pressable>
                        );
                      }

                      return (
                        <Pressable
                          key={bloque.id}
                          onPress={() => {
                            if (dragStateRef.current.moved) return;
                            setDiaSel(bloque.citas[0].fechaISO);
                            setCitasFocusIds(bloque.citas.map((c) => c.id));
                          }}
                          style={({ pressed }) => [
                            styles.rectClaro,
                            {
                              top: topPx,
                              height: heightPx,
                              backgroundColor: estilo.bg,
                              borderColor: contieneSeleccionada ? '#FFFFFF' : estilo.border,
                              borderWidth: contieneSeleccionada ? 2.5 : 1.5,
                              paddingVertical: 4,
                              justifyContent: 'center',
                              gap: 2,
                            },
                            pressed && { opacity: 0.9 },
                          ]}
                        >
                          {bloque.citas.map((citaItem, idx) => (
                            <View key={citaItem.id} style={styles.filaBarberoApilado}>
                              <Text
                                style={[styles.rectLineaPrincipal, { color: estilo.text }]}
                                numberOfLines={1}
                              >
                                {idx === 0 ? `• ${citaItem.barberoNombre}` : `  ${citaItem.barberoNombre}`}
                                <Text style={[styles.rectHoraInline, { color: estilo.sub }]}>
                                  {' '}({citaItem.horaTexto} · {citaItem.clienteNombre.split(' ')[0]})
                                </Text>
                              </Text>
                            </View>
                          ))}
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>
    );

    const webMapEvents =
      Platform.OS === 'web'
        ? ({
            onMouseDown: handleMouseDown,
            onWheel: (e: any) => {
              const ev = e?.nativeEvent ?? e;
              if (ev.ctrlKey) {
                ev.preventDefault?.();
                const deltaY = ev.deltaY ?? 0;
                if (deltaY < 0) acercar();
                else if (deltaY > 0) alejar();
              }
            },
          } as any)
        : {};

    return (
      <View
        ref={mapContainerRef}
        {...webMapEvents}
        style={[
          styles.gridOuter,
          { backgroundColor: colors.BzCard, borderColor: colors.BzBorder },
          Platform.OS === 'web' && ({ cursor: isGrabbing ? 'grabbing' : 'grab', userSelect: 'none' } as any),
        ]}
      >
        <ScrollView
          ref={hScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          scrollEventThrottle={16}
          onScroll={(e) => {
            hOffsetRef.current = e.nativeEvent.contentOffset.x;
          }}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {contenidoGrid}
        </ScrollView>
      </View>
    );
  };

  /* ================================================================= */

  return (
    <View
      style={[
        {
          paddingHorizontal: isDesktop ? 0 : 16,
          paddingVertical: 8,
          gap: 12,
        },
        isDesktop && Platform.OS === 'web'
          ? { height: altoPantallaWeb, maxHeight: altoPantallaWeb, overflow: 'hidden' }
          : { flex: 1 },
      ]}
    >
      {/* Barra superior de navegación de fecha + Controles de Zoom + Acciones */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.BzCard,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.BzBorder,
              paddingHorizontal: 6,
              paddingVertical: 4,
              gap: 6,
            }}
          >
            <Pressable
              onPress={irAnterior}
              hitSlop={8}
              style={{ paddingHorizontal: 8, paddingVertical: 4 }}
            >
              <Text style={{ color: colors.BzText, fontSize: 18, fontWeight: '600' }}>‹</Text>
            </Pressable>

            <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '700', paddingHorizontal: 4 }}>
              {esVistaSemanal ? etiquetaSemana(diaInicioGrid) : etiquetaFecha(diaSel)}
            </Text>

            <Pressable
              onPress={irSiguiente}
              hitSlop={8}
              style={{ paddingHorizontal: 8, paddingVertical: 4 }}
            >
              <Text style={{ color: colors.BzText, fontSize: 18, fontWeight: '600' }}>›</Text>
            </Pressable>
          </View>

          {!esHoyVisible && (
            <Pressable
              onPress={() => {
                setDiaSel(hoy);
                setDiaInicioGrid(hoy);
                setCitasFocusIds([]);
                hOffsetRef.current = 0;
                hScrollRef.current?.scrollTo?.({ x: 0, animated: true });
              }}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: colors.BzCard,
                borderWidth: 1,
                borderColor: colors.BzBorder,
              }}
            >
              <Text style={{ color: '#E2C46D', fontSize: 12, fontWeight: '700' }}>Hoy</Text>
            </Pressable>
          )}

          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
            {etiquetaSucursal}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {modoVista === 'Horario' && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.BzCard,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.BzBorder,
                overflow: 'hidden',
              }}
            >
              <Pressable
                onPress={alejar}
                disabled={zoom <= 0.6}
                style={({ pressed }) => ({
                  paddingHorizontal: 11,
                  paddingVertical: 7,
                  opacity: zoom <= 0.6 ? 0.35 : pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '700' }}>−</Text>
              </Pressable>

              <Pressable
                onPress={resetZoom}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 7,
                  borderLeftWidth: 1,
                  borderRightWidth: 1,
                  borderColor: colors.BzBorder,
                }}
              >
                <Text
                  style={{
                    color: zoom === 1 ? colors.BzMuted : '#E2C46D',
                    fontSize: 11,
                    fontWeight: '700',
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {Math.round(zoom * 100)}%
                </Text>
              </Pressable>

              <Pressable
                onPress={acercar}
                disabled={zoom >= 2.2}
                style={({ pressed }) => ({
                  paddingHorizontal: 11,
                  paddingVertical: 7,
                  opacity: zoom >= 2.2 ? 0.35 : pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '700' }}>+</Text>
              </Pressable>
            </View>
          )}

          {!esBarbero && (
            <Pressable
              onPress={() => setMostrarWalkIn(true)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: colors.BzCard,
                borderWidth: 1,
                borderColor: colors.BzBorder,
              }}
            >
              <Text style={{ color: colors.BzText, fontSize: 12, fontWeight: '600' }}>+ Walk-in</Text>
            </Pressable>
          )}

          <Pressable
            onPress={onNuevaCita}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: '#E2C46D',
            }}
          >
            <Text style={{ color: '#141416', fontSize: 12, fontWeight: '800' }}>
              + Nueva cita
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Selector de vista (Horario / Día / Semana) + Filtro por Barbero */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Segmentado
          ajustado
          size={11}
          padV={6}
          opciones={['Horario', 'Día', 'Semana']}
          valor={modoVista}
          onChange={(v) => setModoVista(v as ModoVistaAgenda)}
        />

        {!esBarbero && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ gap: 6 }}
          >
            <ChipTexto
              texto="Todos los barberos"
              size={11}
              padH={12}
              apagado
              activo={barberoFiltro === 'TODOS'}
              onPress={() => {
                setBarberoFiltro('TODOS');
                setCitasFocusIds([]);
              }}
            />
            {EQUIPO_BARBEROS.map((b) => (
              <ChipTexto
                key={b.id}
                texto={b.nombre}
                size={11}
                padH={12}
                apagado
                activo={barberoFiltro === b.id}
                onPress={() => {
                  setBarberoFiltro(b.id);
                  setCitasFocusIds([]);
                }}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Contenedor dividido en PC: Mapa fijo a la izquierda + Scroll limpio a la derecha */}
      <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column', gap: 16, minWidth: 0, minHeight: 0 }}>
        <View style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
          {modoVista === 'Horario' ? (
            renderCalendarioEjecutivo()
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
              {modoVista === 'Día' && (
                <>
                  {citasDelDia.length === 0 ? (
                    <Tarjeta padding={16} radius={12} gap={4}>
                      <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '500' }}>
                        Sin citas este día
                      </Text>
                      <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
                        {esBarbero
                          ? 'No tienes citas agendadas para esta fecha.'
                          : 'Toca "+ Nueva cita" para agendar una o cambia de día con las flechas.'}
                      </Text>
                    </Tarjeta>
                  ) : (
                    citasDelDia.map(renderCita)
                  )}

                  {diaSel === hoy && listaEspera.length > 0 && !esBarbero && (
                    <>
                      <View style={{ height: 6 }} />
                      <Text style={{ color: colors.BzMuted, fontSize: 11, letterSpacing: 1.5, fontWeight: '600' }}>
                        LISTA DE ESPERA ({listaEspera.length})
                      </Text>
                      {listaEspera.map((espera) => (
                        <Tarjeta key={`w_${espera.id}`} padding={12} radius={12} gap={0}>
                          <Fila>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.BzWarning }} />
                              <View style={{ flex: 1 }}>
                                <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '500' }}>
                                  {espera.cliente} · {espera.servicio}
                                </Text>
                                <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                                  Barbero: {nombreBarbero(espera.barberoId)} · ~{espera.esperaMin} min
                                </Text>
                              </View>
                            </View>
                            <Pressable
                              onPress={() => asignarEspera(espera)}
                              style={{
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: colors.BzBorder,
                              }}
                            >
                              <Text style={{ color: colors.BzText, fontSize: 11 }}>Asignar</Text>
                            </Pressable>
                          </Fila>
                        </Tarjeta>
                      ))}
                    </>
                  )}
                </>
              )}

              {modoVista === 'Semana' &&
                diasSemana.map((clave) => {
                  const delDia = visibles.filter((c) => c.fechaISO === clave).sort(ordenarPorHora);
                  const d = fechaDesdeClave(clave);
                  const esHoyDia = clave === hoy;
                  return (
                    <View key={clave} style={{ gap: 8 }}>
                      <Pressable
                        onPress={() => {
                          setDiaSel(clave);
                          setModoVista('Día');
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: 6,
                        }}
                      >
                        <Text
                          style={{
                            color: esHoyDia ? '#E2C46D' : colors.BzMuted,
                            fontSize: 12,
                            fontWeight: '700',
                          }}
                        >
                          {DIAS_CORTO[d.getDay()]} {d.getDate()} {MESES_CORTO[d.getMonth()]}
                          {esHoyDia ? ' · Hoy' : ''}
                        </Text>
                        <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                          {delDia.length === 0 ? 'Sin citas' : `${delDia.length} ${delDia.length === 1 ? 'cita' : 'citas'} ›`}
                        </Text>
                      </Pressable>
                      {delDia.map(renderCita)}
                      <Divisor />
                    </View>
                  );
                })}
            </ScrollView>
          )}
        </View>

        {/* Panel lateral derecho fijo en PC: Scroll limpio sin franja blanca */}
        {isDesktop && (
          <View
            style={{
              width: 315,
              flexShrink: 0,
              height: '100%',
              backgroundColor: colors.BzCard,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.BzBorder,
              overflow: 'hidden',
            }}
          >
            {/* Cabecera fija del panel de detalles */}
            <View
              style={{
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.BzBorder,
                backgroundColor: colors.BzCardInner,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#E2C46D', fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
                  {citasFocusIds.length > 0
                    ? `BLOQUE SELECCIONADO (${citasPanelDerecho.length})`
                    : `DETALLE DEL DÍA (${citasPanelDerecho.length})`}
                </Text>
                <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '700', marginTop: 1 }}>
                  {etiquetaFecha(diaSel)}
                </Text>
              </View>

              {citasFocusIds.length > 0 && (
                <Pressable
                  onPress={() => setCitasFocusIds([])}
                  style={{
                    paddingHorizontal: 9,
                    paddingVertical: 5,
                    borderRadius: 8,
                    backgroundColor: colors.BzCard,
                    borderWidth: 1,
                    borderColor: colors.BzBorder,
                  }}
                >
                  <Text style={{ color: colors.BzText, fontSize: 11, fontWeight: '600' }}>
                    Ver todas ({citasDelDia.length})
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Contenedor con scroll nativo independiente y barra oculta */}
            <ScrollView
              {...(Platform.OS === 'web' ? ({ className: 'bz-scroll-derecho' } as any) : {})}
              style={[
                { flex: 1, minHeight: 0 },
                Platform.OS === 'web' && ({ overscrollBehavior: 'contain' } as any),
              ]}
              contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 28 }}
              showsVerticalScrollIndicator={false}
            >
              {citasPanelDerecho.length === 0 ? (
                <View style={{ padding: 14, gap: 6 }}>
                  <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }}>
                    Sin citas para este día
                  </Text>
                  <Text style={{ color: colors.BzMuted, fontSize: 12, lineHeight: 18 }}>
                    Arrastra el calendario como un mapa o haz clic en cualquier día o rectángulo para ver aquí el detalle acumulado de cada reserva.
                  </Text>
                </View>
              ) : (
                citasPanelDerecho.map((citaItem, index) => (
                  <View
                    key={citaItem.id}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: colors.BzBg,
                      borderWidth: 1,
                      borderColor: citasFocusIds.includes(citaItem.id) ? '#E2C46D' : colors.BzBorder,
                    }}
                  >
                    <DetalleCitaCard
                      cita={citaItem}
                      indice={index + 1}
                      total={citasPanelDerecho.length}
                      esBarbero={esBarbero}
                      onAvanzarEstado={(e) => onCambiarEstado(citaItem.id, e)}
                      onCancelar={() => {
                        onCambiarEstado(citaItem.id, 'CANCELADA');
                        setCitasFocusIds((prev) => prev.filter((id) => id !== citaItem.id));
                      }}
                    />
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* En móvil se mantiene el sheet inferior con scroll */}
      {!isDesktop && (
        <BzSheet visible={citasFocusIds.length > 0} onDismiss={() => setCitasFocusIds([])}>
          <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ gap: 14, paddingBottom: 8 }}>
            {citasPanelDerecho.map((citaItem, index) => (
              <DetalleCitaCard
                key={citaItem.id}
                cita={citaItem}
                indice={index + 1}
                total={citasPanelDerecho.length}
                esBarbero={esBarbero}
                onAvanzarEstado={(e) => onCambiarEstado(citaItem.id, e)}
                onCancelar={() => {
                  onCambiarEstado(citaItem.id, 'CANCELADA');
                  setCitasFocusIds((prev) => prev.filter((id) => id !== citaItem.id));
                }}
              />
            ))}
            <BotonSecundario texto="Cerrar" height={44} onPress={() => setCitasFocusIds([])} />
          </ScrollView>
        </BzSheet>
      )}

      {/* Registrar walk-in */}
      <BzSheet visible={mostrarWalkIn} onDismiss={() => setMostrarWalkIn(false)}>
        <RegistrarWalkInSheet
          posicion={listaEspera.length + 1}
          onAgregar={(nombre, servicio, barberoId) => {
            setListaEspera((l) => [
              ...l,
              {
                id: Math.max(0, ...l.map((x) => x.id)) + 1,
                cliente: nombre,
                servicio,
                barberoId,
                esperaMin: (l.length + 1) * 15,
              },
            ]);
            setMostrarWalkIn(false);
            setDiaSel(hoy);
            setDiaInicioGrid(hoy);
            setModoVista('Día');
          }}
          onCancelar={() => setMostrarWalkIn(false)}
        />
      </BzSheet>
    </View>
  );
};

/* ===================================================================== */

const DetalleCitaCard: React.FC<{
  cita: CitaEquipo;
  indice: number;
  total: number;
  esBarbero: boolean;
  onAvanzarEstado: (e: EstadoCita) => void;
  onCancelar: () => void;
}> = ({ cita, indice, total, esBarbero, onAvanzarEstado, onCancelar }) => {
  const { colors } = useBzTheme();

  let siguiente: { estado: EstadoCita; texto: string } | null = null;
  if (cita.estado === 'PROGRAMADA' || cita.estado === 'CONFIRMADA') {
    siguiente = { estado: 'LLEGO', texto: 'Marcar llegada' };
  } else if (cita.estado === 'LLEGO') {
    siguiente = { estado: 'EN_SERVICIO', texto: 'Iniciar servicio en silla' };
  } else if (cita.estado === 'EN_SERVICIO' && !esBarbero) {
    siguiente = { estado: 'TERMINADA', texto: 'Terminar servicio' };
  }

  const sePuedeCancelar = !esBarbero && cita.estado !== 'TERMINADA' && cita.estado !== 'CANCELADA';
  const fecha = fechaDesdeClave(cita.fechaISO);

  return (
    <View style={{ width: '100%', gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '700', flexShrink: 1 }}>
          #{indice}/{total} · {cita.horaTexto}
        </Text>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 10,
            backgroundColor: colors.BzCard,
            borderWidth: 1,
            borderColor: colors.BzBorder,
          }}
        >
          <Text style={{ color: colorEstado(cita.estado, colors), fontSize: 10, fontWeight: '700' }}>
            {ETIQUETA_ESTADO[cita.estado]}
          </Text>
        </View>
      </View>

      <View style={{ gap: 4 }}>
        <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '700' }}>{cita.clienteNombre}</Text>
        <Text style={{ color: colors.BzMuted, fontSize: 11 }}>Tel: {cita.telefono}</Text>
        <Divisor />
        <Text style={{ color: colors.BzText, fontSize: 12 }}>
          Barbero: <Text style={{ fontWeight: '700', color: '#E2C46D' }}>{cita.barberoNombre}</Text> · {cita.sucursal}
        </Text>
        <Text style={{ color: colors.BzText, fontSize: 12 }}>
          Servicio: {cita.servicio} ({cita.duracionMin} min)
          {!esBarbero ? ` · $${cita.precio}` : ''}
        </Text>
        <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
          Fecha: {DIAS_CORTO[fecha.getDay()]} {fecha.getDate()} {MESES_CORTO[fecha.getMonth()]} · Folio {cita.folio}
        </Text>
        <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
          Origen: {ETIQUETA_ORIGEN[cita.origen]}
        </Text>
      </View>

      {cita.notasCliente.length > 0 && (
        <View
          style={{
            padding: 8,
            borderRadius: 8,
            backgroundColor: colors.BzCard,
            borderWidth: 1,
            borderColor: colors.BzBorder,
            gap: 2,
          }}
        >
          <Text style={{ color: colors.BzMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>
            DESCRIPCIÓN DEL CORTE
          </Text>
          <Text style={{ color: colors.BzText, fontSize: 12, lineHeight: 17 }}>{cita.notasCliente}</Text>
        </View>
      )}

      {!!cita.fotoUri && (
        <View style={{ gap: 4 }}>
          <Text style={{ color: colors.BzMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>
            IMAGEN DE REFERENCIA
          </Text>
          <Image
            source={{ uri: cita.fotoUri }}
            style={{ width: '100%', height: 130, borderRadius: 8, backgroundColor: colors.BzCardInner }}
            resizeMode="cover"
          />
        </View>
      )}

      {cita.notasTecnicas.length > 0 && (
        <View
          style={{
            padding: 8,
            borderRadius: 8,
            backgroundColor: colors.BzCard,
            borderWidth: 1,
            borderColor: colors.BzBorder,
            gap: 2,
          }}
        >
          <Text style={{ color: colors.BzMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>
            NOTAS DEL BARBERO
          </Text>
          <Text style={{ color: colors.BzText, fontSize: 12, lineHeight: 17 }}>{cita.notasTecnicas}</Text>
        </View>
      )}

      {(siguiente || sePuedeCancelar) && (
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
          {siguiente && (
            <Pressable
              onPress={() => onAvanzarEstado(siguiente!.estado)}
              style={{
                flex: 1,
                paddingVertical: 9,
                paddingHorizontal: 8,
                borderRadius: 8,
                backgroundColor: '#E2C46D',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#141416', fontSize: 11, fontWeight: '800' }} numberOfLines={1}>
                {siguiente.texto}
              </Text>
            </Pressable>
          )}

          {sePuedeCancelar && (
            <Pressable
              onPress={onCancelar}
              style={{
                paddingVertical: 9,
                paddingHorizontal: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.BzDanger,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.BzDanger, fontSize: 11, fontWeight: '600' }}>
                Cancelar
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

/* ===================================================================== */

const RegistrarWalkInSheet: React.FC<{
  posicion: number;
  onAgregar: (nombre: string, servicio: string, barberoId: string) => void;
  onCancelar: () => void;
}> = ({ posicion, onAgregar, onCancelar }) => {
  const { colors } = useBzTheme();
  const [nombre, setNombre] = useState('');
  const [servicioSel, setServicioSel] = useState(SERVICIOS_WALKIN[0].etiqueta);
  const [barberoSel, setBarberoSel] = useState('ANY');

  const barberos = [{ id: 'ANY', nombre: 'Cualquiera' }, ...EQUIPO_BARBEROS];

  return (
    <>
      <Titulo texto="Registrar walk-in" />
      <CampoTexto valor={nombre} onCambio={setNombre} placeholder="Nombre del cliente" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {SERVICIOS_WALKIN.map((s) => (
          <ChipTexto
            key={s.etiqueta}
            texto={s.etiqueta}
            inactivoBg="bg"
            activo={s.etiqueta === servicioSel}
            onPress={() => setServicioSel(s.etiqueta)}
          />
        ))}
      </ScrollView>

      <Etiqueta texto="BARBERO PREFERIDO" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {barberos.map((b) => (
          <ChipTexto
            key={b.id}
            texto={b.nombre}
            inactivoBg="bg"
            activo={b.id === barberoSel}
            onPress={() => setBarberoSel(b.id)}
          />
        ))}
      </ScrollView>

      <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
        Espera estimada: ~{posicion * 15} min (Posición {posicion})
      </Text>

      <BotonPrimario
        texto="Agregar a la lista"
        height={46}
        semibold={false}
        onPress={() => {
          if (nombre.trim()) onAgregar(nombre.trim(), servicioSel, barberoSel);
        }}
      />
      <BotonSecundario texto="Cancelar" height={44} onPress={onCancelar} />
    </>
  );
};

const styles = StyleSheet.create({
  gridOuter: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gridHeaderRow: {
    flexDirection: 'row',
    height: 54,
    borderBottomWidth: 1,
  },
  gridDayHeader: {
    borderRightWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dayNumberCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowLineWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  nowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginLeft: -4,
  },
  nowLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#EF4444',
  },
  rectClaro: {
    position: 'absolute',
    left: 4,
    right: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  filaBarberoApilado: {
    paddingVertical: 1,
  },
  rectLineaPrincipal: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  rectHoraInline: {
    fontSize: 11,
    fontWeight: '500',
  },
  rectLineaSub: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },
});