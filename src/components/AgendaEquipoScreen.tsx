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
} from '../constants/AgendaTipos';
import { folioLibre } from '../constants/AgendaContext';
import { useBzTheme } from '../constants/BzTheme';
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
  Tarjeta,
  Titulo,
} from './BzFase3Ui';

/* =====================================================================
 * AgendaEquipoScreen · Proporciones Exactas (75% Calendario / 25% Panel)
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
const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const SERVICIOS_WALKIN = [
  { etiqueta: 'Corte', nombre: 'Corte de pelo', duracionMin: 40, precio: 220 },
  { etiqueta: 'Barba', nombre: 'Arreglo de barba', duracionMin: 30, precio: 160 },
  { etiqueta: 'Corte + barba', nombre: 'Corte + Barba', duracionMin: 60, precio: 340 },
  { etiqueta: 'Ceja', nombre: 'Ceja y bigote', duracionMin: 10, precio: 50 },
];

const HORA_INICIO_GRID = 9; // 9:00 AM
const HORA_FIN_GRID = 21; // 9:00 PM
const BASE_ALTO_HORA = 66;
const ANCHO_COL_HORA = 46;
const BASE_ANCHO_COL_BARBERO = 120;
const ANCHO_PANEL_DERECHO = 265;

const HORAS_GRID = Array.from(
  { length: HORA_FIN_GRID - HORA_INICIO_GRID },
  (_, i) => HORA_INICIO_GRID + i,
);

function estiloBloqueAgenda(estado: EstadoCita) {
  switch (estado) {
    case 'EN_SERVICIO':
      return {
        bg: '#231E12',
        borderLeft: '#E2C46D',
        text: '#F3F4F6',
        sub: '#9CA3AF',
        badgeColor: '#E2C46D',
        etiqueta: 'En corte',
      };
    case 'LLEGO':
    case 'CONFIRMADA':
      return {
        bg: '#132419',
        borderLeft: '#34A853',
        text: '#F3F4F6',
        sub: '#9CA3AF',
        badgeColor: '#34A853',
        etiqueta: 'Listo',
      };
    case 'PROGRAMADA':
      return {
        bg: '#1E1B13',
        borderLeft: '#B59B50',
        text: '#F3F4F6',
        sub: '#9CA3AF',
        badgeColor: '#D4BC74',
        etiqueta: 'Por atender',
      };
    case 'TERMINADA':
    default:
      return {
        bg: '#1D1D20',
        borderLeft: '#52525B',
        text: '#E4E4E7',
        sub: '#9CA3AF',
        badgeColor: '#9CA3AF',
        etiqueta: 'Terminada',
      };
  }
}

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
  return `${a.getDate()}${mesA} – ${b.getDate()} ${MESES_CORTO[b.getMonth()]} ${b.getFullYear()}`;
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

/* ===================================================================== */

export const AgendaEquipoScreen: React.FC<{
  usuario: UsuarioBz;
  citas: CitaEquipo[];
  onNuevaCita: () => void;
  onCambiarEstado: (id: string, estado: EstadoCita) => void;
  onAgregarCita: (cita: CitaEquipo) => void;
}> = ({ usuario, citas, onNuevaCita, onCambiarEstado, onAgregarCita }) => {
  const { colors } = useBzTheme();
  const { isDesktop } = useDesktopLayout();
  const esBarbero = usuario.rol === RolSesion.BARBERO;
  const hoy = hoyISO();

  const sucursalUsuario =
    usuario.sucursal && usuario.sucursal !== 'Todas' ? normalizarSucursal(usuario.sucursal) : null;

  const [diaSel, setDiaSel] = useState<string>(hoy);
  const [diaInicioGrid, setDiaInicioGrid] = useState<string>(hoy);
  const [modoVista, setModoVista] = useState<ModoVistaAgenda>('Horario');
  const [barberoFiltro, setBarberoFiltro] = useState<string>(
    esBarbero ? usuario.id : 'TODOS',
  );
  const [citasFocusIds, setCitasFocusIds] = useState<string[]>([]);
  const [mostrarWalkIn, setMostrarWalkIn] = useState(false);

  const [zoom, setZoom] = useState<number>(1);
  const altoHoraActual = Math.round(BASE_ALTO_HORA * zoom);
  const minAnchoColumna = Math.round(BASE_ANCHO_COL_BARBERO * zoom);

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
    Platform.OS === 'web' && typeof window !== 'undefined' ? Math.max(540, window.innerHeight - 96) : 640,
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onResize = () => setAltoPantallaWeb(Math.max(540, window.innerHeight - 96));
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

  const citaSeleccionada = useMemo(() => {
    if (citasFocusIds.length > 0) {
      const encontrada = visibles.find((c) => c.id === citasFocusIds[0]);
      if (encontrada) return encontrada;
    }
    return citasDelDia.find((c) => c.estado === 'EN_SERVICIO') ?? citasDelDia[0] ?? null;
  }, [citasFocusIds, visibles, citasDelDia]);

  const barberosColumnas = useMemo(
    () =>
      esBarbero
        ? EQUIPO_BARBEROS.filter((b) => b.id === usuario.id)
        : barberoFiltro === 'TODOS'
        ? EQUIPO_BARBEROS
        : EQUIPO_BARBEROS.filter((b) => b.id === barberoFiltro),
    [esBarbero, usuario.id, barberoFiltro],
  );

  const diasSemana = useMemo(
    () => Array.from({ length: 7 }, (_, i) => moverDia(diaInicioGrid, i)),
    [diaInicioGrid],
  );

  const esVistaSemanal = modoVista === 'Semana';
  const irAnterior = () => {
    setCitasFocusIds([]);
    if (esVistaSemanal) {
      const nuevoInicio = moverDia(diaInicioGrid, -7);
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
      const nuevoInicio = moverDia(diaInicioGrid, 7);
      setDiaInicioGrid(nuevoInicio);
      setDiaSel(nuevoInicio);
    } else {
      const nuevoDia = moverDia(diaSel, 1);
      setDiaSel(nuevoDia);
      setDiaInicioGrid(nuevoDia);
    }
  };
  const esHoyVisible = diaSel === hoy;

  const ahora = new Date();
  const minAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const offsetAhora = minAhora - HORA_INICIO_GRID * 60;
  const mostrarLineaAhora =
    diaSel === hoy && offsetAhora >= 0 && offsetAhora <= HORAS_GRID.length * 60;
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
    const nuevoId = `cita-${folio}`;

    onAgregarCita({
      id: nuevoId,
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
    setCitasFocusIds([nuevoId]);
  };

  const renderCita = (cita: CitaEquipo) => {
    const st = estiloBloqueAgenda(cita.estado);
    const seleccionada = citaSeleccionada?.id === cita.id;

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
          style={{
            backgroundColor: st.bg,
            borderLeftWidth: 3.5,
            borderLeftColor: st.borderLeft,
            borderColor: seleccionada ? '#E2C46D' : colors.BzBorder,
            borderWidth: 1,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.BzText, fontSize: 12.5, fontWeight: '700' }} numberOfLines={1}>
                {cita.horaTexto} {cita.clienteNombre}
              </Text>
              <Text style={{ color: colors.BzMuted, fontSize: 11.5, marginTop: 2 }} numberOfLines={1}>
                {cita.servicio} · {cita.barberoNombre} ({cita.duracionMin} min)
              </Text>
            </View>
            <View
              style={{
                borderRadius: 20,
                backgroundColor: colors.BzBg,
                borderWidth: 1,
                borderColor: colors.BzBorder,
                paddingHorizontal: 9,
                paddingVertical: 3.5,
              }}
            >
              <Text style={{ color: st.badgeColor, fontSize: 10.5, fontWeight: '700' }}>
                {ETIQUETA_ESTADO[cita.estado]}
              </Text>
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

  /* ----- Cuadrícula de Horario por Barbero (4 Columnas Completas) ----- */
  const renderCalendarioEjecutivo = () => {
    const altoTotal = HORAS_GRID.length * altoHoraActual;
    const anchoTotalBarberos = barberosColumnas.length * minAnchoColumna;
    const anchoGridTotal = ANCHO_COL_HORA + anchoTotalBarberos;

    const contenidoGrid = (
      <View style={{ minWidth: anchoGridTotal, width: '100%', flex: 1 }}>
        {/* Encabezado de barberos fijo arriba */}
        <View
          style={[
            styles.gridHeaderRow,
            { backgroundColor: colors.BzCard, borderBottomColor: colors.BzBorder },
          ]}
        >
          <View style={{ width: ANCHO_COL_HORA }} />

          {barberosColumnas.map((barbero) => (
            <View
              key={barbero.id}
              style={[
                styles.gridDayHeader,
                {
                  flex: 1,
                  minWidth: minAnchoColumna,
                },
              ]}
            >
              <Text style={{ color: colors.BzText, fontSize: 12.5, fontWeight: '700' }}>
                {barbero.nombre}
              </Text>
            </View>
          ))}
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
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <View style={{ flexDirection: 'row', height: altoTotal }}>
            {/* Columna izquierda de horas */}
            <View style={{ width: ANCHO_COL_HORA }}>
              {HORAS_GRID.map((h) => (
                <View
                  key={h}
                  style={{
                    height: altoHoraActual,
                    paddingTop: 5,
                    paddingRight: 8,
                    alignItems: 'flex-end',
                  }}
                >
                  <Text
                    style={{
                      color: colors.BzMuted,
                      fontSize: 10.5,
                      fontWeight: '500',
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {`${h}:00`}
                  </Text>
                </View>
              ))}
            </View>

            {/* Columnas de cada barbero */}
            <View style={{ flexDirection: 'row', height: altoTotal, flex: 1, position: 'relative' }}>
              {barberosColumnas.map((barbero, colIdx) => {
                const citasBarbero = citasDelDia.filter((c) => c.barberoId === barbero.id);

                return (
                  <View
                    key={barbero.id}
                    style={{
                      flex: 1,
                      minWidth: minAnchoColumna,
                      height: altoTotal,
                      borderLeftWidth: colIdx > 0 ? 1 : 0,
                      borderLeftColor: colors.BzBorder,
                    }}
                  >
                    {HORAS_GRID.map((h) => (
                      <View
                        key={h}
                        style={{
                          height: altoHoraActual,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.BzBorder,
                        }}
                      />
                    ))}

                    {citasBarbero.map((cita) => {
                      const offsetMin = minutosDelDia(cita) - HORA_INICIO_GRID * 60;
                      const duracionBloque = Math.max(30, cita.duracionMin);
                      if (offsetMin + duracionBloque <= 0 || offsetMin >= HORAS_GRID.length * 60) {
                        return null;
                      }

                      const topPx = Math.max(0, (offsetMin / 60) * altoHoraActual) + 2;
                      const heightPx = Math.max(40, (duracionBloque / 60) * altoHoraActual - 4);
                      const st = estiloBloqueAgenda(cita.estado);
                      const seleccionada = citaSeleccionada?.id === cita.id;

                      return (
                        <Pressable
                          key={cita.id}
                          onPress={() => {
                            if (dragStateRef.current.moved) return;
                            setDiaSel(cita.fechaISO);
                            setCitasFocusIds([cita.id]);
                          }}
                          style={({ pressed }) => [
                            styles.bloqueCitaDark,
                            {
                              top: topPx,
                              height: heightPx,
                              backgroundColor: st.bg,
                              borderLeftColor: st.borderLeft,
                              borderColor: seleccionada ? '#E2C46D' : 'transparent',
                              borderWidth: seleccionada ? 1 : 0,
                              borderLeftWidth: 3,
                            },
                            pressed && { opacity: 0.9 },
                          ]}
                        >
                          <Text
                            style={{ color: st.text, fontSize: 11.5, fontWeight: '700' }}
                            numberOfLines={1}
                          >
                            {cita.horaTexto} {cita.clienteNombre}
                          </Text>
                          {heightPx >= 36 && (
                            <Text
                              style={{ color: st.sub, fontSize: 10.5, marginTop: 1.5 }}
                              numberOfLines={1}
                            >
                              {cita.servicio}
                            </Text>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })}

              {mostrarLineaAhora && (
                <View pointerEvents="none" style={[styles.nowLineWrap, { top: topLineaAhora }]}>
                  <View style={styles.nowLine} />
                </View>
              )}
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
          style={{ flex: 1 }}
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
          paddingVertical: 6,
          gap: 10,
        },
        isDesktop && Platform.OS === 'web'
          ? { height: altoPantallaWeb, maxHeight: altoPantallaWeb, overflow: 'hidden' }
          : { flex: 1 },
      ]}
    >
      {/* Fila 1: Navegación de fecha + Hoy + Horario/Día/Semana + Walk-in / + Cita */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Rango de fecha */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Pressable onPress={irAnterior} hitSlop={8} style={{ paddingHorizontal: 4, paddingVertical: 3 }}>
              <Text style={{ color: colors.BzMuted, fontSize: 17, fontWeight: '700' }}>‹</Text>
            </Pressable>

            <Text style={{ color: colors.BzText, fontSize: 16, fontWeight: '800' }}>
              {modoVista === 'Día' ? etiquetaFecha(diaSel) : etiquetaSemana(diaInicioGrid)}
            </Text>

            <Pressable onPress={irSiguiente} hitSlop={8} style={{ paddingHorizontal: 4, paddingVertical: 3 }}>
              <Text style={{ color: colors.BzMuted, fontSize: 17, fontWeight: '700' }}>›</Text>
            </Pressable>
          </View>

          {/* Botón Hoy */}
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
              height: 32,
              borderRadius: 9,
              backgroundColor: colors.BzCard,
              borderWidth: 1,
              borderColor: !esHoyVisible ? '#E2C46D' : colors.BzBorder,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: !esHoyVisible ? '#E2C46D' : colors.BzText, fontSize: 11.5, fontWeight: '700' }}>
              Hoy
            </Text>
          </Pressable>

          {/* Switch Horario | Día | Semana */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colors.BzCard,
              borderWidth: 1,
              borderColor: colors.BzBorder,
              borderRadius: 10,
              padding: 2.5,
            }}
          >
            {(['Horario', 'Día', 'Semana'] as ModoVistaAgenda[]).map((op) => {
              const act = modoVista === op;
              return (
                <Pressable
                  key={op}
                  onPress={() => setModoVista(op)}
                  style={{
                    paddingHorizontal: 13,
                    paddingVertical: 5,
                    borderRadius: 8,
                    backgroundColor: act ? '#F3F4F6' : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      color: act ? '#0D0D0D' : colors.BzMuted,
                      fontSize: 11.5,
                      fontWeight: '700',
                    }}
                  >
                    {op}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Controles derecha: Zoom + Walk-in + + Cita */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {modoVista === 'Horario' && isDesktop && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.BzCard,
                borderRadius: 9,
                borderWidth: 1,
                borderColor: colors.BzBorder,
                overflow: 'hidden',
              }}
            >
              <Pressable
                onPress={alejar}
                disabled={zoom <= 0.6}
                style={({ pressed }) => ({
                  paddingHorizontal: 9,
                  paddingVertical: 6,
                  opacity: zoom <= 0.6 ? 0.35 : pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '700' }}>−</Text>
              </Pressable>

              <Pressable
                onPress={resetZoom}
                style={{
                  paddingHorizontal: 7,
                  paddingVertical: 6,
                  borderLeftWidth: 1,
                  borderRightWidth: 1,
                  borderColor: colors.BzBorder,
                }}
              >
                <Text style={{ color: zoom === 1 ? colors.BzMuted : '#E2C46D', fontSize: 10.5, fontWeight: '700' }}>
                  {Math.round(zoom * 100)}%
                </Text>
              </Pressable>

              <Pressable
                onPress={acercar}
                disabled={zoom >= 2.2}
                style={({ pressed }) => ({
                  paddingHorizontal: 9,
                  paddingVertical: 6,
                  opacity: zoom >= 2.2 ? 0.35 : pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '700' }}>+</Text>
              </Pressable>
            </View>
          )}

          {!esBarbero && (
            <Pressable
              onPress={() => setMostrarWalkIn(true)}
              style={{
                paddingHorizontal: 14,
                height: 34,
                borderRadius: 9,
                backgroundColor: colors.BzCard,
                borderWidth: 1,
                borderColor: colors.BzBorder,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.BzText, fontSize: 11.5, fontWeight: '700' }}>Walk-in</Text>
            </Pressable>
          )}

          <Pressable
            onPress={onNuevaCita}
            style={{
              paddingHorizontal: 14,
              height: 34,
              borderRadius: 9,
              backgroundColor: '#F3F4F6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#0D0D0D', fontSize: 11.5, fontWeight: '800' }}>+ Cita</Text>
          </Pressable>
        </View>
      </View>

      {/* Fila 2: Filtros de barbero (izquierda) + Leyenda de estados (derecha) */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        {!esBarbero && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
            {[{ id: 'TODOS', nombre: 'Todos' }, ...EQUIPO_BARBEROS].map((b) => {
              const act = barberoFiltro === b.id;
              return (
                <Pressable
                  key={b.id}
                  onPress={() => {
                    setBarberoFiltro(b.id);
                    setCitasFocusIds([]);
                  }}
                  style={{
                    paddingHorizontal: 13,
                    paddingVertical: 5.5,
                    borderRadius: 999,
                    backgroundColor: act ? '#F3F4F6' : colors.BzCard,
                    borderWidth: 1,
                    borderColor: act ? '#F3F4F6' : colors.BzBorder,
                  }}
                >
                  <Text
                    style={{
                      color: act ? '#0D0D0D' : colors.BzMuted,
                      fontSize: 11.5,
                      fontWeight: '700',
                    }}
                  >
                    {b.nombre}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Leyenda de estados */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {[
            { label: 'En corte', color: '#E2C46D' },
            { label: 'Listo', color: '#34A853' },
            { label: 'Por atender', color: '#D4BC74' },
            { label: 'Terminada', color: '#6B7280' },
          ].map((st) => (
            <View
              key={st.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: 10,
                paddingVertical: 4.5,
                borderRadius: 999,
                backgroundColor: colors.BzCard,
                borderWidth: 1,
                borderColor: colors.BzBorder,
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: st.color }} />
              <Text style={{ color: colors.BzMuted, fontSize: 10.5, fontWeight: '600' }}>{st.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Fila 3: Contenedor Principal (~75% Calendario / 265px Fijos Panel Derecho) */}
      <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column', gap: 12, minWidth: 0, minHeight: 0 }}>
        <View style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
          {modoVista === 'Horario' ? (
            renderCalendarioEjecutivo()
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
              {modoVista === 'Día' &&
                (citasDelDia.length === 0 ? (
                  <Tarjeta padding={16} radius={12} gap={4}>
                    <Text style={{ color: colors.BzText, fontSize: 13.5, fontWeight: '600' }}>
                      Sin citas este día
                    </Text>
                    <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
                      Toca "+ Cita" para agendar o cambia de fecha arriba.
                    </Text>
                  </Tarjeta>
                ) : (
                  citasDelDia.map(renderCita)
                ))}

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

        {/* Panel lateral derecho encapsulado en View de ancho fijo (265px) para que NO se estire */}
        {isDesktop && (
          <View
            style={{
              width: ANCHO_PANEL_DERECHO,
              maxWidth: ANCHO_PANEL_DERECHO,
              minWidth: ANCHO_PANEL_DERECHO,
              flexGrow: 0,
              flexShrink: 0,
              height: '100%',
            }}
          >
            <ScrollView
              {...(Platform.OS === 'web' ? ({ className: 'bz-scroll-derecho' } as any) : {})}
              style={{ flex: 1, width: '100%' }}
              contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
            >
              {/* TARJETA 1: LISTA DE ESPERA */}
              {!esBarbero && (
                <View
                  style={[
                    styles.sideCard,
                    { backgroundColor: colors.BzCard, borderColor: colors.BzBorder },
                  ]}
                >
                  <Text style={styles.sideCardTitle}>LISTA DE ESPERA ({listaEspera.length})</Text>

                  {listaEspera.length === 0 ? (
                    <Text style={{ color: colors.BzMuted, fontSize: 11.5, paddingVertical: 4 }}>
                      Sin clientes en espera.
                    </Text>
                  ) : (
                    listaEspera.map((espera, idx) => (
                      <View
                        key={espera.id}
                        style={[
                          styles.esperaItemRow,
                          idx > 0 && { borderTopWidth: 1, borderTopColor: colors.BzBorder },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '700' }}>
                            {espera.cliente}
                          </Text>
                          <Text style={{ color: colors.BzMuted, fontSize: 11, marginTop: 1.5 }}>
                            {espera.servicio} · ~{espera.esperaMin} min
                          </Text>
                        </View>

                        <Pressable
                          onPress={() => asignarEspera(espera)}
                          style={{
                            paddingHorizontal: 11,
                            paddingVertical: 6,
                            borderRadius: 9,
                            backgroundColor: colors.BzCardInner,
                            borderWidth: 1,
                            borderColor: colors.BzBorder,
                          }}
                        >
                          <Text style={{ color: colors.BzText, fontSize: 11.5, fontWeight: '700' }}>
                            Asignar
                          </Text>
                        </Pressable>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* TARJETA 2: CITA SELECCIONADA */}
              <View
                style={[
                  styles.sideCard,
                  { backgroundColor: colors.BzCard, borderColor: colors.BzBorder },
                ]}
              >
                <Text style={styles.sideCardTitle}>CITA SELECCIONADA</Text>

                {!citaSeleccionada ? (
                  <Text style={{ color: colors.BzMuted, fontSize: 12, lineHeight: 18 }}>
                    Toca cualquier bloque del horario para ver el detalle de la cita.
                  </Text>
                ) : (
                  <CitaSeleccionadaCard
                    cita={citaSeleccionada}
                    esBarbero={esBarbero}
                    onAvanzarEstado={(nuevoEstado) => onCambiarEstado(citaSeleccionada.id, nuevoEstado)}
                    onCancelar={() => {
                      onCambiarEstado(citaSeleccionada.id, 'CANCELADA');
                      setCitasFocusIds([]);
                    }}
                  />
                )}
              </View>
            </ScrollView>
          </View>
        )}
      </View>

      {/* En móvil se mantiene el sheet inferior con scroll */}
      {!isDesktop && (
        <BzSheet visible={citasFocusIds.length > 0 && !!citaSeleccionada} onDismiss={() => setCitasFocusIds([])}>
          <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ gap: 12, paddingBottom: 8 }}>
            {citaSeleccionada && (
              <CitaSeleccionadaCard
                cita={citaSeleccionada}
                esBarbero={esBarbero}
                onAvanzarEstado={(nuevoEstado) => onCambiarEstado(citaSeleccionada.id, nuevoEstado)}
                onCancelar={() => {
                  onCambiarEstado(citaSeleccionada.id, 'CANCELADA');
                  setCitasFocusIds([]);
                }}
              />
            )}
            <BotonSecundario texto="Cerrar" height={42} onPress={() => setCitasFocusIds([])} />
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
          }}
          onCancelar={() => setMostrarWalkIn(false)}
        />
      </BzSheet>
    </View>
  );
};

/* ===================================================================== */

const CitaSeleccionadaCard: React.FC<{
  cita: CitaEquipo;
  esBarbero: boolean;
  onAvanzarEstado: (e: EstadoCita) => void;
  onCancelar: () => void;
}> = ({ cita, esBarbero, onAvanzarEstado, onCancelar }) => {
  const { colors } = useBzTheme();

  let siguiente: { estado: EstadoCita; texto: string } | null = null;
  if (cita.estado === 'PROGRAMADA' || cita.estado === 'CONFIRMADA') {
    siguiente = { estado: 'LLEGO', texto: 'Marcar llegada' };
  } else if (cita.estado === 'LLEGO') {
    siguiente = { estado: 'EN_SERVICIO', texto: 'Iniciar corte' };
  } else if (cita.estado === 'EN_SERVICIO' && !esBarbero) {
    siguiente = { estado: 'TERMINADA', texto: 'Terminar y pasar a caja' };
  }

  const finMin = minutosDelDia(cita) + cita.duracionMin;
  const horaFin = horaTextoDe(Math.floor(finMin / 60), finMin % 60);
  const st = estiloBloqueAgenda(cita.estado);
  const sePuedeCancelar = !esBarbero && cita.estado !== 'TERMINADA' && cita.estado !== 'CANCELADA';
  const uriLimpia = (cita.fotoUri ?? '').trim();
  const tieneFotoValida =
    uriLimpia.startsWith('http://') ||
    uriLimpia.startsWith('https://') ||
    uriLimpia.startsWith('data:image/') ||
    uriLimpia.startsWith('file://');

  return (
    <View style={{ width: '100%', gap: 8 }}>
      <View>
        <Text style={{ color: colors.BzText, fontSize: 16, fontWeight: '800' }}>
          {cita.clienteNombre}
        </Text>
        <Text style={{ color: colors.BzMuted, fontSize: 11.5, marginTop: 2 }}>
          {cita.telefono} · {cita.servicio} · {cita.duracionMin} min
        </Text>
      </View>

      <Text style={{ color: colors.BzText, fontSize: 12, fontWeight: '600' }}>
        {cita.horaTexto} – {horaFin} · {cita.barberoNombre} ·{' '}
        <Text style={{ color: st.badgeColor }}>{st.etiqueta}</Text>
      </Text>

      <Text style={{ color: colors.BzMuted, fontSize: 11.5 }}>
        Nota: {cita.notasCliente || cita.notasTecnicas || 'Sin notas especiales'}
      </Text>

      {tieneFotoValida && (
        <Image
          source={{ uri: uriLimpia }}
          style={{ width: '100%', height: 100, borderRadius: 9, backgroundColor: colors.BzCardInner }}
          resizeMode="cover"
        />
      )}

      {siguiente && (
        <Pressable
          onPress={() => onAvanzarEstado(siguiente!.estado)}
          style={{
            marginTop: 4,
            height: 40,
            borderRadius: 10,
            backgroundColor: '#F3F4F6',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#0D0D0D', fontSize: 12.5, fontWeight: '800' }}>
            {siguiente.texto}
          </Text>
        </Pressable>
      )}

      {cita.estado === 'TERMINADA' && (
        <View
          style={{
            marginTop: 4,
            height: 38,
            borderRadius: 10,
            backgroundColor: colors.BzCardInner,
            borderWidth: 1,
            borderColor: colors.BzBorder,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.BzSuccess, fontSize: 11.5, fontWeight: '700' }}>
            Servicio terminado ✓
          </Text>
        </View>
      )}

      {sePuedeCancelar && (
        <Pressable
          onPress={onCancelar}
          style={{
            paddingVertical: 6.5,
            borderRadius: 9,
            borderWidth: 1,
            borderColor: colors.BzBorder,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: colors.BzDanger, fontSize: 11.5, fontWeight: '600' }}>
            Cancelar cita
          </Text>
        </Pressable>
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
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gridHeaderRow: {
    flexDirection: 'row',
    height: 42,
    borderBottomWidth: 1,
  },
  gridDayHeader: {
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
  nowLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#EF4444',
  },
  bloqueCitaDark: {
    position: 'absolute',
    left: 4,
    right: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingTop: 5,
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  sideCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  sideCardTitle: {
    color: '#9CA3AF',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  esperaItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7.5,
    gap: 8,
  },
});