import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import {
  ETIQUETA_ESTADO,
  fechaDesdeClave,
  type CitaEquipo,
  type FichaCliente,
  type OrigenCita,
} from '../constants/AgendaTipos';
import { useBzTheme } from '../constants/BzTheme';
import {
  BotonPrimario,
  BotonSecundario,
  BzSheet,
  CampoTexto,
  Divisor,
  Etiqueta,
  Fila,
} from './BzFase3Ui';

/* =====================================================================
 * FichaClienteSheet.tsx · Pase Técnico de Servicio (Fase 3)
 *
 * Mismo lenguaje visual del Pase de Recepción del cliente:
 * 1. Cabecera del pase (Estado + Folio + Servicio).
 * 2. Línea perforada con muescas laterales.
 * 3. Grid operativo (Cliente, Teléfono, Fecha, Hora/Duración, Origen, Visitas).
 * 4. Bloque técnico unificado (Lo que pidió hoy + Foto + Alertas + Ficha técnica).
 * 5. Acciones del barbero dentro del pase (sin código de barras ni cobros).
 * ===================================================================== */

const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const ETIQUETA_ORIGEN_CORTO: Record<OrigenCita, string> = {
  CLIENTE: 'App Cliente',
  RECEPCION: 'Recepción',
  WALK_IN: 'Walk-in',
};

function formatearFechaCorta(iso?: string): string {
  if (!iso) return 'Primera visita';
  const d = fechaDesdeClave(iso);
  return `${DIAS_CORTO[d.getDay()]} ${d.getDate()} ${MESES_CORTO[d.getMonth()]}`;
}

export interface FichaClienteSheetProps {
  visible: boolean;
  ficha: FichaCliente | null;
  citaActual?: CitaEquipo | null;
  onDismiss: () => void;
  onIniciarServicio?: (cita: CitaEquipo) => void;
  onIrAServicio?: (cita: CitaEquipo) => void;
  onGuardarNotas?: (notasUltimoCorte: string, maquinaPreferida: string) => void;
}

export const FichaClienteSheet: React.FC<FichaClienteSheetProps> = ({
  visible,
  ficha,
  citaActual,
  onDismiss,
  onIniciarServicio,
  onIrAServicio,
  onGuardarNotas,
}) => {
  const { colors } = useBzTheme();
  const [editandoNotas, setEditandoNotas] = useState(false);
  const [notasDraft, setNotasDraft] = useState('');
  const [maquinaDraft, setMaquinaDraft] = useState('');

  useEffect(() => {
    if (ficha) {
      setNotasDraft(ficha.notasUltimoCorte ?? '');
      setMaquinaDraft(ficha.maquinaPreferida ?? '');
      setEditandoNotas(false);
    }
  }, [ficha, visible]);

  if (!ficha) return null;

  const esNuevo = ficha.visitas === 0;
  const sellos = Math.max(0, Math.min(10, ficha.sellos));
  const puedeIniciar =
    citaActual &&
    (citaActual.estado === 'PROGRAMADA' ||
      citaActual.estado === 'CONFIRMADA' ||
      citaActual.estado === 'LLEGO');
  const estaEnSilla = citaActual?.estado === 'EN_SERVICIO';

  return (
    <BzSheet visible={visible} onDismiss={onDismiss}>
      {/* Contenedor único tipo Pase Técnico */}
      <View
        style={[
          styles.ticketCard,
          { backgroundColor: colors.BzBg, borderColor: colors.BzBorder },
        ]}
      >
        {/* Fila superior: Píldora de estado + Folio */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={[styles.estadoPill, { backgroundColor: colors.BzText }]}>
            <Text style={{ color: colors.BzBg, fontSize: 10, fontWeight: '700', letterSpacing: 0.6 }}>
              ✓ {citaActual ? ETIQUETA_ESTADO[citaActual.estado].toUpperCase() : 'FICHA CLIENTE'}
            </Text>
          </View>
          <Text style={{ color: colors.BzMuted, fontSize: 12, fontWeight: '500' }}>
            {citaActual ? `#${citaActual.folio}` : `${ficha.visitas} visitas`}
          </Text>
        </View>

        {/* Título del Pase */}
        <View style={{ marginTop: 12 }}>
          <Text style={{ color: colors.BzMuted, fontSize: 10, letterSpacing: 1.5 }}>
            PASE TÉCNICO · BARBERZONE
          </Text>
          <Text style={{ color: colors.BzText, fontSize: 24, fontWeight: '400', marginTop: 2 }}>
            {citaActual ? citaActual.servicio : ficha.nombre}
          </Text>
        </View>

        {/* Separador perforado */}
        <View style={styles.perforacionRow}>
          <View style={[styles.muesca, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]} />
          <View style={[styles.lineaPunteada, { borderColor: colors.BzBorder }]} />
          <View style={[styles.muesca, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]} />
        </View>

        {/* Grid 2 columnas: datos operativos esenciales */}
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.gridLabel, { color: colors.BzMuted }]}>CLIENTE</Text>
              <Text style={[styles.gridVal, { color: colors.BzText }]} numberOfLines={1}>
                {ficha.nombre}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.gridLabel, { color: colors.BzMuted }]}>HISTORIAL</Text>
              <Text
                style={[
                  styles.gridVal,
                  { color: esNuevo ? colors.BzWarning : colors.BzSuccess },
                ]}
              >
                {esNuevo ? 'Cliente nuevo' : `${ficha.visitas} visitas · ${sellos}/10 sellos`}
              </Text>
            </View>
          </View>

          {citaActual && (
            <>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.gridLabel, { color: colors.BzMuted }]}>FECHA</Text>
                  <Text style={[styles.gridVal, { color: colors.BzText }]}>
                    {formatearFechaCorta(citaActual.fechaISO)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.gridLabel, { color: colors.BzMuted }]}>HORA · DURACIÓN</Text>
                  <Text style={[styles.gridVal, { color: colors.BzText }]}>
                    {citaActual.horaTexto} ({citaActual.duracionMin} min)
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.gridLabel, { color: colors.BzMuted }]}>TELÉFONO</Text>
                  <Text style={[styles.gridVal, { color: colors.BzText }]} numberOfLines={1}>
                    {ficha.telefono || 'Sin registro'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.gridLabel, { color: colors.BzMuted }]}>ORIGEN</Text>
                  <Text style={[styles.gridVal, { color: colors.BzText }]}>
                    {ETIQUETA_ORIGEN_CORTO[citaActual.origen]}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Bloque técnico unificado (reemplaza el recuadro del código de barras) */}
        <View
          style={[
            styles.cajaTecnica,
            { backgroundColor: colors.BzCard, borderColor: colors.BzBorder },
          ]}
        >
          {/* 1. Descripción del corte pedido hoy */}
          {citaActual && (
            <View style={{ gap: 4 }}>
              <Etiqueta texto="DESCRIPCIÓN DEL CORTE SOLICITADO" />
              <Text
                style={{
                  color: citaActual.notasCliente.trim() ? colors.BzText : colors.BzMuted,
                  fontSize: 13,
                  lineHeight: 19,
                }}
              >
                {citaActual.notasCliente.trim()
                  ? `“${citaActual.notasCliente.trim()}”`
                  : 'Sin indicaciones adicionales para hoy.'}
              </Text>
            </View>
          )}

          {/* 2. Imagen de referencia */}
          {!!citaActual?.fotoUri && (
            <View style={{ gap: 6, marginTop: 4 }}>
              <Etiqueta texto="IMAGEN DE REFERENCIA" />
              <Image
                source={{ uri: citaActual.fotoUri }}
                style={{
                  width: '100%',
                  height: 185,
                  borderRadius: 12,
                  backgroundColor: colors.BzCardInner,
                }}
                resizeMode="cover"
              />
            </View>
          )}

          {/* 3. Alertas del cliente */}
          {ficha.alertas.length > 0 && (
            <>
              <Divisor />
              <View style={{ gap: 4 }}>
                <Text style={{ color: colors.BzWarning, fontSize: 10, letterSpacing: 1.4, fontWeight: '600' }}>
                  ALERTAS DE SILLA
                </Text>
                {ficha.alertas.map((alerta, i) => (
                  <Text key={i} style={{ color: colors.BzText, fontSize: 12, lineHeight: 17 }}>
                    • {alerta}
                  </Text>
                ))}
              </View>
            </>
          )}

          {/* 4. Ficha técnica del último corte */}
          <Divisor />
          <View style={{ gap: 6 }}>
            <Fila>
              <Etiqueta texto="FICHA TÉCNICA · ÚLTIMO CORTE" />
              {onGuardarNotas && !editandoNotas && (
                <Text
                  onPress={() => setEditandoNotas(true)}
                  style={{ color: colors.BzText, fontSize: 11, fontWeight: '600' }}
                >
                  Editar ›
                </Text>
              )}
            </Fila>

            {editandoNotas ? (
              <View style={{ gap: 8 }}>
                <CampoTexto
                  label="Máquina / peines"
                  valor={maquinaDraft}
                  onCambio={setMaquinaDraft}
                  placeholder="Ej. Wahl Magic Clip · #0.5 a #1.5"
                  fondo="bg"
                />
                <CampoTexto
                  label="Detalle técnico"
                  valor={notasDraft}
                  onCambio={setNotasDraft}
                  placeholder="Ej. Fade bajo, tijera arriba con textura..."
                  multiline
                  fondo="bg"
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <BotonSecundario
                      texto="Cancelar"
                      height={38}
                      onPress={() => {
                        setNotasDraft(ficha.notasUltimoCorte ?? '');
                        setMaquinaDraft(ficha.maquinaPreferida ?? '');
                        setEditandoNotas(false);
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <BotonPrimario
                      texto="Guardar"
                      height={38}
                      onPress={() => {
                        onGuardarNotas?.(notasDraft.trim(), maquinaDraft.trim());
                        setEditandoNotas(false);
                      }}
                    />
                  </View>
                </View>
              </View>
            ) : (
              <>
                {ficha.maquinaPreferida ? (
                  <Text style={{ color: colors.BzText, fontSize: 12, fontWeight: '600' }}>
                    Máquina: {ficha.maquinaPreferida}
                  </Text>
                ) : null}
                <Text
                  style={{
                    color: ficha.notasUltimoCorte ? colors.BzText : colors.BzMuted,
                    fontSize: 12,
                    lineHeight: 18,
                  }}
                >
                  {ficha.notasUltimoCorte || 'Sin notas técnicas previas registradas.'}
                </Text>
              </>
            )}
          </View>

          {/* 5. Último servicio realizado */}
          {ficha.historial.length > 0 && (
            <>
              <Divisor />
              <View style={{ gap: 3 }}>
                <Etiqueta texto="ÚLTIMA VISITA REGISTRADA" />
                <Text style={{ color: colors.BzText, fontSize: 12, fontWeight: '500' }}>
                  {ficha.historial[0].servicio} · {formatearFechaCorta(ficha.historial[0].fechaISO)} ({ficha.historial[0].barberoNombre})
                </Text>
                {ficha.historial[0].notas ? (
                  <Text style={{ color: colors.BzMuted, fontSize: 11, fontStyle: 'italic' }}>
                    {ficha.historial[0].notas}
                  </Text>
                ) : null}
              </View>
            </>
          )}
        </View>

        {/* Botones dentro del mismo pase (igual que el comprobante del cliente) */}
        <View style={{ marginTop: 16, gap: 10 }}>
          {puedeIniciar && onIniciarServicio && citaActual && (
            <BotonPrimario
              texto="Iniciar servicio en silla"
              height={48}
              onPress={() => onIniciarServicio(citaActual)}
            />
          )}
          {estaEnSilla && onIrAServicio && citaActual && (
            <BotonPrimario
              texto="Ir a servicio en curso"
              height={48}
              onPress={() => onIrAServicio(citaActual)}
            />
          )}
          <BotonSecundario texto="Cerrar pase" height={46} onPress={onDismiss} />
        </View>
      </View>
    </BzSheet>
  );
};

export default FichaClienteSheet;

const styles = StyleSheet.create({
  ticketCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    overflow: 'hidden',
  },
  estadoPill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
  },
  perforacionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    marginHorizontal: -26,
  },
  muesca: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  lineaPunteada: {
    flex: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    marginHorizontal: 6,
  },
  gridLabel: {
    fontSize: 10,
    letterSpacing: 1.3,
  },
  gridVal: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 3,
  },
  cajaTecnica: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
});