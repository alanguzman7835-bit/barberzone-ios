import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ETIQUETA_ESTADO,
  hoyISO,
  minutosDelDia,
  normalizarSucursal,
  resumenBarbero,
  type CitaEquipo,
  type EstadoCita,
} from '../constants/AgendaTipos';
import { useAgenda } from '../constants/AgendaContext';
import { BzColors, BzTypography, useBzTheme } from '../constants/BzTheme';
import { UsuarioBz } from '../constants/Sesion';
import { useDesktopLayout } from '../hooks/useDesktopLayout';
import {
  BotonPrimario,
  BotonSecundario,
  Divisor,
  Etiqueta,
  Fila,
  Tarjeta,
} from './BzFase3Ui';
import {
  BzAppearanceSheet,
  BzHeader,
  BzNotificacion,
  BzNotificacionesSheet,
  notificacionesIniciales,
} from './BzHeaderTema';
import { DesktopShell } from './DesktopShell';
import FichaClienteSheet from './FichaClienteSheet';

/* =====================================================================
 * VistaInicioBarbero.tsx · Pantalla de Inicio exclusiva del Barbero
 * ===================================================================== */

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

function formatearRango24(cita: CitaEquipo): string {
  const ini = minutosDelDia(cita);
  const fin = ini + cita.duracionMin;
  const h1 = Math.floor(ini / 60);
  const m1 = ini % 60;
  const h2 = Math.floor(fin / 60);
  const m2 = fin % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(h1)}:${pad(m1)} - ${pad(h2)}:${pad(m2)}`;
}

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

/** Reloj central simétrico con anillo dorado/ámbar y manecillas centradas en el eje */
const RelojTurnoIcono: React.FC<{ anilloColor: string }> = ({ anilloColor }) => (
  <View style={[styles.relojOuterRing, { borderColor: anilloColor }]}>
    <View style={styles.relojInnerFace}>
      <View style={styles.pivoteHora}>
        <View style={styles.brazoHora} />
      </View>
      <View style={styles.pivoteMin}>
        <View style={styles.brazoMin} />
      </View>
      <View style={styles.relojCentroPunto} />
    </View>
  </View>
);

export const VistaInicioBarbero: React.FC<{
  usuario: UsuarioBz;
  onIrAgenda: () => void;
  onIrNuevaCita: () => void;
  onIrServicio: () => void;
  onIrComisiones: () => void;
  onIrPerfil: () => void;
}> = ({
  usuario,
  onIrAgenda,
  onIrNuevaCita,
  onIrServicio,
  onIrComisiones,
  onIrPerfil,
}) => {
  const { colors } = useBzTheme();
  const { isDesktop } = useDesktopLayout();
  const { citasEquipo, cambiarEstadoCita, obtenerFichaCliente, guardarNotasFicha } = useAgenda();
  const hoy = hoyISO();

  const [mostrarTema, setMostrarTema] = useState(false);
  const [mostrarNotifs, setMostrarNotifs] = useState(false);
  const [notifs, setNotifs] = useState<BzNotificacion[]>(() =>
    notificacionesIniciales(usuario.rol, colors),
  );
  const [citaFichaSel, setCitaFichaSel] = useState<CitaEquipo | null>(null);

  useEffect(() => {
    setNotifs(notificacionesIniciales(usuario.rol, colors));
  }, [usuario.rol, colors]);

  const resumen = useMemo(
    () => resumenBarbero(citasEquipo, usuario.id, hoy),
    [citasEquipo, usuario.id, hoy],
  );

  const citasHoyBarbero = useMemo(
    () =>
      citasEquipo
        .filter(
          (c) =>
            c.barberoId === usuario.id &&
            c.fechaISO === hoy &&
            c.estado !== 'CANCELADA',
        )
        .sort((a, b) => minutosDelDia(a) - minutosDelDia(b)),
    [citasEquipo, usuario.id, hoy],
  );

  const comisionHoy = useMemo(() => {
    const totalTerminado = citasHoyBarbero
      .filter((c) => c.estado === 'TERMINADA')
      .reduce((acc, c) => acc + c.precio, 0);
    return Math.round(totalTerminado * 0.5);
  }, [citasHoyBarbero]);

  const citaDestacada = resumen.actual ?? resumen.siguiente ?? null;
  const esEnSillaAhora = Boolean(resumen.actual);

  const fichaDestacada = useMemo(
    () => (citaDestacada ? obtenerFichaCliente(citaDestacada) : null),
    [citaDestacada, obtenerFichaCliente],
  );

  const fichaActiva = useMemo(
    () => (citaFichaSel ? obtenerFichaCliente(citaFichaSel) : null),
    [citaFichaSel, obtenerFichaCliente],
  );

  const sucursalEtiqueta = usuario.sucursal
    ? `Sucursal ${normalizarSucursal(usuario.sucursal)}`
    : 'Sucursal Olivete';

  const iniciarServicioDe = (cita: CitaEquipo) => {
    cambiarEstadoCita(cita.id, 'EN_SERVICIO');
    setCitaFichaSel(null);
    onIrServicio();
  };

  const colorAcentoSilla = esEnSillaAhora ? '#E2C46D' : colors.BzSuccess;

  /** Bloque reutilizable de la tarjeta "En silla / Siguiente en silla" */
  const renderTarjetaSilla = () => (
    <Tarjeta padding={16} radius={16} gap={14} style={isDesktop ? { flex: 1 } : undefined}>
      <View style={styles.horarioHeaderRow}>
        <View style={[styles.lineaAcentoIzq, { backgroundColor: colorAcentoSilla }]} />
        <Text style={[styles.horarioHeaderTitulo, { color: colors.BzText }]}>
          {esEnSillaAhora
            ? 'En silla ahora'
            : citaDestacada
            ? 'Siguiente en silla'
            : 'Mi turno hoy'}
        </Text>
        <View style={[styles.lineaAcentoDer, { backgroundColor: colorAcentoSilla }]} />
      </View>

      {citaDestacada ? (
        <>
          <Pressable
            onPress={() => setCitaFichaSel(citaDestacada)}
            style={styles.relojBloqueCentro}
          >
            <RelojTurnoIcono anilloColor={colorAcentoSilla} />

            <Text style={[styles.horarioRangoTxt, { color: colors.BzText }]}>
              {formatearRango24(citaDestacada)}
            </Text>

            <Text style={[styles.horarioServicioTxt, { color: colors.BzText }]}>
              {citaDestacada.servicio.toUpperCase()}
            </Text>

            <Text style={[styles.horarioSubTxt, { color: colors.BzMuted }]}>
              {citaDestacada.clienteNombre} ·{' '}
              {esEnSillaAhora
                ? 'Servicio en curso'
                : `${ETIQUETA_ESTADO[citaDestacada.estado]} (${citaDestacada.duracionMin} min)`}
            </Text>
          </Pressable>

          <View
            style={[
              styles.specTicketBox,
              { backgroundColor: colors.BzBg, borderColor: colors.BzBorder },
            ]}
          >
            <Fila>
              <Etiqueta texto={`ESPECIFICACIÓN DEL PASE · #${citaDestacada.folio}`} />
              <Pressable onPress={() => setCitaFichaSel(citaDestacada)} hitSlop={6}>
                <Text style={{ color: colors.BzText, fontSize: 11, fontWeight: '600' }}>
                  Ver pase ›
                </Text>
              </Pressable>
            </Fila>

            <Text
              style={{
                color: citaDestacada.notasCliente.trim() ? colors.BzText : colors.BzMuted,
                fontSize: 12,
                lineHeight: 18,
              }}
              numberOfLines={3}
            >
              {citaDestacada.notasCliente.trim()
                ? `Pedido: “${citaDestacada.notasCliente.trim()}”`
                : 'Sin indicaciones extra del cliente para este servicio.'}
            </Text>

            {fichaDestacada?.maquinaPreferida ? (
              <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                Máquina habitual: {fichaDestacada.maquinaPreferida}
              </Text>
            ) : null}

            {fichaDestacada && fichaDestacada.alertas.length > 0 ? (
              <Text style={{ color: colors.BzWarning, fontSize: 11, fontWeight: '500' }}>
                ⚠ {fichaDestacada.alertas[0]}
              </Text>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <BotonSecundario
                texto="Ver pase técnico"
                height={42}
                onPress={() => setCitaFichaSel(citaDestacada)}
              />
            </View>
            <View style={{ flex: 1.25 }}>
              {esEnSillaAhora ? (
                <BotonPrimario
                  texto="Ir a silla"
                  height={42}
                  onPress={onIrServicio}
                />
              ) : (
                <BotonPrimario
                  texto="Iniciar en silla"
                  height={42}
                  onPress={() => iniciarServicioDe(citaDestacada)}
                />
              )}
            </View>
          </View>
        </>
      ) : (
        <View style={styles.relojBloqueCentro}>
          <RelojTurnoIcono anilloColor={colors.BzBorder} />
          <Text style={[styles.horarioServicioTxt, { color: colors.BzText, marginTop: 6 }]}>
            SILLA DISPONIBLE
          </Text>
          <Text style={[styles.horarioSubTxt, { color: colors.BzMuted }]}>
            No tienes servicios activos ni pendientes por ahora.
          </Text>
        </View>
      )}
    </Tarjeta>
  );

  /** Bloque reutilizable de la lista "Clientes de hoy" */
  const renderListaClientesHoy = () => (
    <Tarjeta padding={16} radius={16} gap={12} style={isDesktop ? { flex: 1.25 } : undefined}>
      <Fila>
        <Etiqueta texto={`PRÓXIMAS CITAS DE HOY (${citasHoyBarbero.length})`} />
        <Pressable onPress={onIrAgenda}>
          <Text style={{ color: '#E2C46D', fontSize: 12, fontWeight: '600' }}>
            Ver agenda completa ›
          </Text>
        </Pressable>
      </Fila>

      {citasHoyBarbero.length === 0 ? (
        <View style={{ paddingVertical: 16, gap: 6 }}>
          <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '500' }}>
            Sin clientes agendados hoy
          </Text>
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
            Cuando un cliente reserve contigo o recepción registre una cita, aparecerá aquí.
          </Text>
        </View>
      ) : (
        citasHoyBarbero.map((cita, idx) => {
          const cEstado = colorEstado(cita.estado, colors);
          const puedeIniciar =
            cita.estado === 'PROGRAMADA' ||
            cita.estado === 'CONFIRMADA' ||
            cita.estado === 'LLEGO';

          return (
            <View key={cita.id}>
              {idx > 0 && <Divisor />}
              <Pressable
                onPress={() => setCitaFichaSel(cita)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingTop: idx > 0 ? 10 : 2,
                  paddingBottom: 2,
                }}
              >
                {isDesktop ? (
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      backgroundColor: colors.BzCardInner,
                      borderWidth: 1,
                      borderColor: colors.BzBorder,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: colors.BzText, fontSize: 12, fontWeight: '700' }}>
                      {obtenerIniciales(cita.clienteNombre)}
                    </Text>
                  </View>
                ) : (
                  <View
                    style={{
                      width: 4,
                      height: 36,
                      borderRadius: 2,
                      backgroundColor: cEstado,
                    }}
                  />
                )}

                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: colors.BzText, fontSize: 13, fontWeight: '600' }}
                    numberOfLines={1}
                  >
                    {cita.clienteNombre}{' '}
                    <Text style={{ color: colors.BzMuted, fontWeight: '400' }}>
                      · {cita.horaTexto}
                    </Text>
                  </Text>
                  <Text style={{ color: colors.BzMuted, fontSize: 12 }} numberOfLines={1}>
                    {cita.servicio} ({cita.duracionMin} min)
                    {cita.notasCliente ? ' · Con nota' : ''}
                    {cita.fotoUri ? ' · 📷' : ''}
                  </Text>
                </View>

                <View
                  style={{
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    borderRadius: 16,
                    backgroundColor: colors.BzBg,
                    borderWidth: 1,
                    borderColor: colors.BzBorder,
                  }}
                >
                  <Text style={{ color: cEstado, fontSize: 10, fontWeight: '600' }}>
                    {ETIQUETA_ESTADO[cita.estado]}
                  </Text>
                </View>

                {isDesktop && puedeIniciar ? (
                  <Pressable
                    onPress={() => iniciarServicioDe(cita)}
                    style={{
                      backgroundColor: '#E2C46D',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: '#141416', fontSize: 11, fontWeight: '700' }}>
                      Empezar
                    </Text>
                  </Pressable>
                ) : null}
              </Pressable>
            </View>
          );
        })
      )}
    </Tarjeta>
  );

  /** Contenido principal para PC (Desktop Dashboard estilo referencia) */
  const renderDesktopDashboard = () => (
    <DesktopShell
      businessName="BarberZones"
      businessSubtitle={sucursalEtiqueta}
      activeKey="hoy"
      onSelectNav={(key) => {
        if (key === 'agenda') onIrAgenda();
        if (key === 'nueva') onIrNuevaCita();
        if (key === 'silla') onIrServicio();
        if (key === 'comisiones') onIrComisiones();
        if (key === 'perfil') onIrPerfil();
      }}
      navItems={[
        { key: 'hoy', label: 'Hoy' },
        { key: 'agenda', label: 'Citas', badge: resumen.porAtender },
        { key: 'nueva', label: '+ Nueva cita' },
        { key: 'silla', label: 'En silla', badge: resumen.enSilla },
        { key: 'comisiones', label: 'Comisiones' },
        { key: 'perfil', label: 'Mi perfil' },
      ]}
      activeStaff={[
        { initials: obtenerIniciales(usuario.nombre), name: usuario.nombre, online: true },
      ]}
    >
      <View style={{ gap: 20 }}>
        {/* Encabezado superior con fecha grande y acciones rápidas */}
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
              Hola, {usuario.nombre} · {sucursalEtiqueta} · {resumen.citasHoy} citas hoy
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

            <Pressable
              onPress={onIrNuevaCita}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 9,
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

        {/* Fila superior: 4 tarjetas KPI horizontales */}
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <Tarjeta padding={16} radius={16} gap={4} style={{ flex: 1 }}>
            <Text style={[BzTypography.bigNumber, { color: colors.BzText, fontSize: 30, fontWeight: '700' }]}>
              {resumen.citasHoy}
            </Text>
            <Etiqueta texto="CITAS HOY" />
            <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
              {resumen.enSilla > 0 ? `${resumen.enSilla} en silla ahora` : 'Agenda activa'}
            </Text>
          </Tarjeta>

          <Tarjeta padding={16} radius={16} gap={4} style={{ flex: 1 }}>
            <Text style={[BzTypography.bigNumber, { color: colors.BzWarning, fontSize: 30, fontWeight: '700' }]}>
              {resumen.porAtender}
            </Text>
            <Etiqueta texto="POR ATENDER" />
            <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
              {resumen.porAtender === 1 ? 'Cliente pendiente' : 'Clientes pendientes'}
            </Text>
          </Tarjeta>

          <Tarjeta padding={16} radius={16} gap={4} style={{ flex: 1 }}>
            <Text style={[BzTypography.bigNumber, { color: colors.BzText, fontSize: 30, fontWeight: '700' }]}>
              {resumen.atendidosHoy}/{resumen.citasHoy}
            </Text>
            <Etiqueta texto="ATENDIDOS HOY" />
            <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
              Sem: {resumen.atendidosSemana} · Total: {resumen.atendidosTotal}
            </Text>
          </Tarjeta>

          <Pressable onPress={onIrComisiones} style={{ flex: 1 }}>
            <Tarjeta padding={16} radius={16} gap={4} style={{ flex: 1 }}>
              <Text style={[BzTypography.bigNumber, { color: colors.BzSuccess, fontSize: 30, fontWeight: '700' }]}>
                ${comisionHoy}
              </Text>
              <Etiqueta texto="COMISIÓN HOY" />
              <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                Ver desglose ›
              </Text>
            </Tarjeta>
          </Pressable>
        </View>

        {/* Fila inferior: 2 paneles lado a lado */}
        <View style={{ flexDirection: 'row', gap: 18, alignItems: 'flex-start' }}>
          {renderListaClientesHoy()}
          {renderTarjetaSilla()}
        </View>
      </View>
    </DesktopShell>
  );

  return (
    <>
      <BzAppearanceSheet visible={mostrarTema} onDismiss={() => setMostrarTema(false)} />
      <BzNotificacionesSheet
        visible={mostrarNotifs}
        items={notifs}
        onMarcarLeidas={() => setNotifs([])}
        onDismiss={() => setMostrarNotifs(false)}
      />

      <FichaClienteSheet
        visible={citaFichaSel !== null}
        ficha={fichaActiva}
        citaActual={citaFichaSel}
        onDismiss={() => setCitaFichaSel(null)}
        onIniciarServicio={iniciarServicioDe}
        onIrAServicio={() => {
          setCitaFichaSel(null);
          onIrServicio();
        }}
        onGuardarNotas={(notas, maquina) => {
          if (citaFichaSel) {
            guardarNotasFicha(citaFichaSel, notas, maquina);
          }
        }}
      />

      {isDesktop ? (
        renderDesktopDashboard()
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 14 }}
          showsVerticalScrollIndicator={false}
        >
          <BzHeader
            saludo={`Hola, ${usuario.nombre}`}
            rolEtiqueta={`${usuario.rol} · ${sucursalEtiqueta}`}
            notificaciones={notifs.length}
            onRol={onIrPerfil}
            onCampana={() => setMostrarNotifs(true)}
            onTema={() => setMostrarTema(true)}
          />

          {renderTarjetaSilla()}

          {/* Métricas del día en móvil */}
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Tarjeta padding={12} radius={12} gap={4} style={{ flex: 1 }}>
                <Etiqueta texto="CITAS HOY" />
                <Text style={[BzTypography.bigNumber, { color: colors.BzText, fontSize: 24 }]}>
                  {resumen.citasHoy}
                </Text>
                <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                  {resumen.enSilla > 0 ? `${resumen.enSilla} en silla ahora` : 'Agenda activa'}
                </Text>
              </Tarjeta>

              <Tarjeta padding={12} radius={12} gap={4} style={{ flex: 1 }}>
                <Etiqueta texto="ATENDIDOS HOY" />
                <Text style={[BzTypography.bigNumber, { color: colors.BzText, fontSize: 24 }]}>
                  {resumen.atendidosHoy} de {resumen.citasHoy}
                </Text>
                <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                  Sem: {resumen.atendidosSemana} · Total: {resumen.atendidosTotal}
                </Text>
              </Tarjeta>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Tarjeta padding={12} radius={12} gap={4} style={{ flex: 1 }}>
                <Etiqueta texto="POR ATENDER" />
                <Text style={[BzTypography.bigNumber, { color: colors.BzText, fontSize: 24 }]}>
                  {resumen.porAtender}
                </Text>
                <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                  {resumen.porAtender === 1 ? 'Cliente pendiente' : 'Clientes pendientes'}
                </Text>
              </Tarjeta>

              <Pressable onPress={onIrComisiones} style={{ flex: 1 }}>
                <Tarjeta padding={12} radius={12} gap={4} style={{ flex: 1 }}>
                  <Fila>
                    <Etiqueta texto="COMISIÓN HOY" />
                    <Text style={{ color: colors.BzMuted, fontSize: 11 }}>›</Text>
                  </Fila>
                  <Text style={[BzTypography.bigNumber, { color: colors.BzSuccess, fontSize: 24 }]}>
                    ${comisionHoy}
                  </Text>
                  <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                    Ver desglose
                  </Text>
                </Tarjeta>
              </Pressable>
            </View>
          </View>

          {renderListaClientesHoy()}

          {/* Accesos rápidos */}
          <Tarjeta padding={14} radius={14} gap={10}>
            <Etiqueta texto="ACCESOS RÁPIDOS" />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <BotonSecundario texto="Agenda" height={42} onPress={onIrAgenda} />
              </View>
              <View style={{ flex: 1 }}>
                <BotonSecundario texto="+ Nueva cita" height={42} onPress={onIrNuevaCita} />
              </View>
              <View style={{ flex: 1 }}>
                <BotonSecundario texto="Comisiones" height={42} onPress={onIrComisiones} />
              </View>
            </View>
          </Tarjeta>
        </ScrollView>
      )}
    </>
  );
};

export default VistaInicioBarbero;

const styles = StyleSheet.create({
  horarioHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lineaAcentoIzq: {
    width: 14,
    height: 2,
    borderRadius: 1,
  },
  horarioHeaderTitulo: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  lineaAcentoDer: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  relojBloqueCentro: {
    alignItems: 'center',
    paddingVertical: 6,
    gap: 4,
  },
  relojOuterRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  relojInnerFace: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#8BB5F8',
    borderWidth: 5,
    borderColor: '#5B6BC0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pivoteHora: {
    position: 'absolute',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'flex-start',
    transform: [{ rotate: '0deg' }],
  },
  brazoHora: {
    width: 4.5,
    height: 17,
    borderRadius: 3,
    backgroundColor: '#5B6BC0',
    marginTop: 3,
  },
  pivoteMin: {
    position: 'absolute',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'flex-start',
    transform: [{ rotate: '125deg' }],
  },
  brazoMin: {
    width: 4.5,
    height: 20,
    borderRadius: 3,
    backgroundColor: '#5B6BC0',
    marginTop: 2,
  },
  relojCentroPunto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5B6BC0',
  },
  horarioRangoTxt: {
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  horarioServicioTxt: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  horarioSubTxt: {
    fontSize: 12,
    textAlign: 'center',
  },
  specTicketBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
});