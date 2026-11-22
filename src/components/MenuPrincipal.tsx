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
import { DuenoPanelScreen } from './DuenoPanelScreen';
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
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  const d = new Date();
  return `${dias[d.getDay()]} ${d.getDate()} de ${meses[d.getMonth()]}`;
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
  const citasPendientesCount = citasHoy.filter(
    (c) => c.estado === 'PROGRAMADA' || c.estado === 'CONFIRMADA' || c.estado === 'LLEGO',
  ).length;

  const [mostrarTema, setMostrarTema] = useState(false);
  const [mostrarNotifs, setMostrarNotifs] = useState(false);
  const [notifs, setNotifs] = useState<BzNotificacion[]>(() => notificacionesIniciales(usuario.rol, colors));

  useEffect(() => {
    setNotifs(notificacionesIniciales(usuario.rol, colors));
    const t = setTimeout(() => {
      setNotifs((prev) => [{ titulo: 'Nueva cita agendada', detalle: 'Juan Pérez · 12:15', color: colors.BzSuccess }, ...prev]);
    }, 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario.rol, colors.BzSuccess, colors.BzWarning]);

  /* ===== DISEÑO ESCRITORIO PARA ENCARGADO / DUEÑO / CAJERO ===== */
  if (isDesktop && !esCliente && !esBarbero) {
    return (
      <>
        <BzAppearanceSheet visible={mostrarTema} onDismiss={() => setMostrarTema(false)} />
        <BzNotificacionesSheet
          visible={mostrarNotifs}
          items={notifs}
          onMarcarLeidas={() => setNotifs([])}
          onDismiss={() => setMostrarNotifs(false)}
        />

        <View style={{ gap: 20 }}>
          {/* Encabezado ejecutivo con fecha grande */}
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
              <Text style={[BzTypography.title, { color: colors.BzText, fontWeight: '700' }]}>
                {fechaLargaHoy()}
              </Text>
              <Text style={{ color: colors.BzMuted, fontSize: 13, marginTop: 2 }}>
                Hola, {usuario.nombre} · {usuario.rol} · Sucursal {usuario.sucursal || 'Olivete'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Pressable
                onPress={() => setMostrarNotifs(true)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: 10,
                  backgroundColor: colors.BzCard,
                  borderWidth: 1,
                  borderColor: colors.BzBorder,
                }}
              >
                <Text style={{ color: colors.BzText, fontSize: 12, fontWeight: '600' }}>
                  Avisos ({notifs.length})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setMostrarTema(true)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: 10,
                  backgroundColor: colors.BzCard,
                  borderWidth: 1,
                  borderColor: colors.BzBorder,
                }}
              >
                <Text style={{ color: colors.BzText, fontSize: 12, fontWeight: '600' }}>
                  Tema
                </Text>
              </Pressable>

              {esGerencia && (
                <Pressable
                  onPress={onNewUser}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                    borderRadius: 10,
                    backgroundColor: '#E2C46D',
                  }}
                >
                  <Text style={{ color: '#141416', fontSize: 12, fontWeight: '800' }}>
                    + Nuevo Barbero / Cajero
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Fila superior: 4 Tarjetas KPI */}
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <Pressable onPress={onIrAgendar} style={{ flex: 1 }}>
              <View style={[styles.card, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
                <Text style={[BzTypography.bigNumber, { color: colors.BzText, fontSize: 30, fontWeight: '700' }]}>
                  {citasHoy.length || 12}
                </Text>
                <Text style={[BzTypography.label, { color: colors.BzMuted }]}>CITAS HOY</Text>
                <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                  {citasPendientesCount} por atender · Ver agenda ›
                </Text>
              </View>
            </Pressable>

            <Pressable onPress={onIrCaja} style={{ flex: 1 }}>
              <View style={[styles.card, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
                <Text style={[BzTypography.bigNumber, { color: colors.BzSuccess, fontSize: 30, fontWeight: '700' }]}>
                  {esDueno ? '$16,570' : '$6,270'}
                </Text>
                <Text style={[BzTypography.label, { color: colors.BzMuted }]}>
                  {esDueno ? 'VENTA GLOBAL HOY' : 'CAJA DEL TURNO'}
                </Text>
                <Text style={{ color: colors.BzMuted, fontSize: 11 }}>Ir a caja ›</Text>
              </View>
            </Pressable>

            <Pressable onPress={() => onIrHorariosPermisos('PERMISOS')} style={{ flex: 1 }}>
              <View style={[styles.card, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
                <Text style={[BzTypography.bigNumber, { color: colors.BzWarning, fontSize: 30, fontWeight: '700' }]}>
                  {permisos.length}
                </Text>
                <Text style={[BzTypography.label, { color: colors.BzMuted }]}>PERMISOS ACTIVOS</Text>
                <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                  {equipoCompleto.length} integrantes en plantilla
                </Text>
              </View>
            </Pressable>

            <Pressable onPress={onIrInventario} style={{ flex: 1 }}>
              <View style={[styles.card, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
                <Text style={[BzTypography.bigNumber, { color: colors.BzDanger, fontSize: 30, fontWeight: '700' }]}>
                  2
                </Text>
                <Text style={[BzTypography.label, { color: colors.BzMuted }]}>ALERTAS DE STOCK</Text>
                <Text style={{ color: colors.BzMuted, fontSize: 11 }}>Revisar inventario ›</Text>
              </View>
            </Pressable>
          </View>

          {/* Fila inferior: 2 columnas lado a lado */}
          <View style={{ flexDirection: 'row', gap: 18, alignItems: 'flex-start' }}>
            {/* Columna Izquierda: Agenda + Horarios y Permisos */}
            <View style={{ flex: 1.15, gap: 16 }}>
              <TarjetaSeccion
                titulo={`VISTAZO DE AGENDA · ${(usuario.sucursal || 'OLIVETE').toUpperCase()}`}
                accionTexto="Abrir horario completo ›"
                onAccion={onIrAgendar}
              >
                {citasHoy.length > 0 ? (
                  citasHoy.slice(0, 5).map((c, idx) => (
                    <View key={c.id} style={{ gap: 6 }}>
                      {idx > 0 && <View style={{ height: 1, backgroundColor: colors.BzBorder }} />}
                      <FilaResumen
                        titulo={`${c.horaTexto} · ${c.clienteNombre}`}
                        subtitulo={`${c.servicio} · ${c.barberoNombre}`}
                        colorPunto={c.estado === 'EN_SERVICIO' ? colors.BzWarning : colors.BzSuccess}
                      />
                    </View>
                  ))
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

              {esGerencia && (
                <TarjetaSeccion
                  titulo="HORARIOS Y TURNOS DEL PERSONAL"
                  accionTexto="Abrir panel ›"
                  onAccion={() => onIrHorariosPermisos('HORARIOS')}
                >
                  <Text style={{ color: colors.BzMuted, fontSize: 12, lineHeight: 18 }}>
                    Crea o sube los horarios semanales de Barberos y Cajeros por separado, envíalos en Word por WhatsApp o registra permisos.
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <BotonMenuPrimario
                        dorado
                        texto="Horarios (Barberos y Cajeros)"
                        onPress={() => onIrHorariosPermisos('HORARIOS')}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <BotonMenuSecundario
                        texto={`Permisos (${permisos.length})`}
                        onPress={() => onIrHorariosPermisos('PERMISOS')}
                      />
                    </View>
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
            </View>

            {/* Columna Derecha: Equipo y Roles + Permisos del día */}
            <View style={{ flex: 1, gap: 16 }}>
              {esGerencia && (
                <TarjetaSeccion
                  titulo={`EQUIPO Y ROLES (${equipoCompleto.length})`}
                  accionTexto="+ Nuevo Barbero / Cajero ›"
                  onAccion={onNewUser}
                >
                  {equipoCompleto.map((emp, idx) => (
                    <View key={emp.empleadoId} style={{ gap: 6, paddingTop: idx > 0 ? 6 : 2 }}>
                      {idx > 0 && <View style={{ height: 1, backgroundColor: colors.BzBorder, marginBottom: 4 }} />}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
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
                              Sucursal {emp.sucursal}
                            </Text>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 6 }}>
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
                                  borderRadius: 10,
                                  backgroundColor: activo ? '#E2C46D' : colors.BzCardInner,
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
                      </View>
                    </View>
                  ))}
                </TarjetaSeccion>
              )}

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
            accionTexto="Ver reportes ›"
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
            accionTexto={esBarbero ? 'Ver comisiones ›' : tieneCaja ? 'Ir a caja ›' : 'Mi rol ›'}
            onAccion={esBarbero ? onIrComisiones : tieneCaja ? onIrCaja : onIrRol}
          >
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <MiniMetrica etiqueta="Citas hoy" valor="12" />
              <MiniMetrica
                etiqueta={esBarbero ? 'Comisiones' : 'Caja turno'}
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
          <DuenoPanelScreen
            usuario={usuario}
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

  /* ===== EN PC: MENÚ LATERAL FIJO (DesktopShell) ===== */
  if (isDesktop) {
    // VistaInicioBarbero ya trae su propio DesktopShell completo cuando está en INICIO
    if (esBarbero && tabActual === 'INICIO' && !creandoUsuario && abriendoHorariosPermisos === null) {
      return <View style={{ flex: 1, backgroundColor: colors.BzBg }}>{renderContenido()}</View>;
    }

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