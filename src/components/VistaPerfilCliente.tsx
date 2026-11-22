import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BzTypography, useBzTheme } from '../constants/BzTheme';
import { UsuarioBz } from '../constants/Sesion';
import { BzAppearanceSheet } from './BzHeaderTema';
import {
  type CitaConfirmadaData,
  type PedidoApartadoData,
} from './VistaAgendarCliente';

type Props = {
  usuario: UsuarioBz;
  sucursalNombre: string;
  onCambiarSucursal: (nombre: string) => void;
  citasActivas: CitaConfirmadaData[];
  citaConfirmada: string | null;
  pedidosPendientes: PedidoApartadoData[];
  carritoCount: number;
  onIrAgendar: () => void;
  onIrTienda: () => void;
  onLogout: () => void;
};

const SUCURSALES_CLIENTE = [
  { id: 'suc-1', nombre: 'Sucursal Olivete', direccion: 'Av. Olivete 240, Centro' },
  { id: 'suc-2', nombre: 'Sucursal Centro', direccion: 'Calle Hidalgo #88' },
  { id: 'suc-3', nombre: 'Sucursal Tonalá Norte', direccion: 'Blvd. Juárez #115' },
];

const HISTORIAL_CLIENTE_DEMO = [
  {
    id: 'h1',
    fecha: 'Hace 3 semanas',
    servicio: 'Corte de cabello',
    barbero: 'Carlos R.',
    nota: 'Desvanecido bajo #1.5, tijera arriba con textura natural.',
    precio: '$180',
  },
  {
    id: 'h2',
    fecha: 'Hace 6 semanas',
    servicio: 'Corte + barba',
    barbero: 'Diego M.',
    nota: 'Barba rebajada con #2 y perfilado a navaja con toalla caliente.',
    precio: '$280',
  },
];

const TarjetaSeccion: React.FC<{
  titulo: string;
  accionTexto: string;
  onAccion: () => void;
  children: React.ReactNode;
}> = ({ titulo, accionTexto, onAccion, children }) => {
  const { colors } = useBzTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[BzTypography.label, { color: colors.BzMuted }]}>{titulo}</Text>
        <Pressable onPress={onAccion}>
          <Text style={{ color: colors.BzText, fontSize: 12 }}>{accionTexto}</Text>
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
        padding: 10,
        borderRadius: 10,
        backgroundColor: colors.BzCardInner,
        borderWidth: 1,
        borderColor: colors.BzBorder,
      }}
    >
      <Text style={{ color: colors.BzMuted, fontSize: 11 }}>{etiqueta}</Text>
      <Text style={[BzTypography.bigNumber, { color: colors.BzText, fontSize: 22 }]}>{valor}</Text>
    </View>
  );
};

export const VistaPerfilCliente: React.FC<Props> = ({
  usuario,
  sucursalNombre,
  onCambiarSucursal,
  citasActivas,
  citaConfirmada,
  pedidosPendientes,
  carritoCount,
  onIrAgendar,
  onIrTienda,
  onLogout,
}) => {
  const { colors } = useBzTheme();
  const insets = useSafeAreaInsets();
  const [mostrarTema, setMostrarTema] = useState(false);
  const [modalSucursal, setModalSucursal] = useState(false);

  const sellosActuales = 7;
  const sellosMeta = 10;

  return (
    <>
      <BzAppearanceSheet visible={mostrarTema} onDismiss={() => setMostrarTema(false)} />

      <Modal
        visible={modalSucursal}
        transparent
        animationType="fade"
        onRequestClose={() => setModalSucursal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setModalSucursal(false)}
        >
          <Pressable
            style={[styles.modalBox, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[BzTypography.label, { color: colors.BzMuted }]}>SUCURSAL PREFERIDA</Text>
            <Text style={{ color: colors.BzText, fontSize: 16, fontWeight: '500', marginBottom: 4 }}>
              Elige dónde te atiendes
            </Text>
            {SUCURSALES_CLIENTE.map((suc) => {
              const activa = suc.nombre === sucursalNombre;
              return (
                <Pressable
                  key={suc.id}
                  onPress={() => {
                    onCambiarSucursal(suc.nombre);
                    setModalSucursal(false);
                  }}
                  style={[
                    styles.sucursalRow,
                    {
                      backgroundColor: colors.BzCardInner,
                      borderColor: activa ? colors.BzText : colors.BzBorder,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: activa ? '600' : '400' }}>
                      {suc.nombre}
                    </Text>
                    <Text style={{ color: colors.BzMuted, fontSize: 11 }}>{suc.direccion}</Text>
                  </View>
                  {activa && (
                    <Text style={{ color: colors.BzSuccess, fontSize: 12, fontWeight: '600' }}>Activa</Text>
                  )}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: 28,
          paddingHorizontal: 20,
          gap: 14,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera de Perfil */}
        <View style={[styles.card, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: colors.BzCardInner,
                borderWidth: 1,
                borderColor: colors.BzText,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.BzText, fontSize: 20, fontWeight: '400' }}>
                {usuario.iniciales}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[BzTypography.title, { color: colors.BzText, fontSize: 20 }]} numberOfLines={1}>
                {usuario.nombre}
              </Text>
              <Text style={{ color: colors.BzMuted, fontSize: 12, marginTop: 2 }}>
                Cliente BarberZone · Nivel Gold
              </Text>
              <Pressable
                onPress={() => setModalSucursal(true)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}
              >
                <Text style={{ color: colors.BzText, fontSize: 12, fontWeight: '500' }}>
                  📍 {sucursalNombre}
                </Text>
                <Text style={{ color: colors.BzMuted, fontSize: 11 }}>· Cambiar ›</Text>
              </Pressable>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <MiniMetrica etiqueta="Visitas totales" valor="14" />
            <MiniMetrica etiqueta="Citas activas" valor={String(citasActivas.length || (citaConfirmada ? 1 : 0))} />
            <MiniMetrica etiqueta="En bolsa" valor={String(carritoCount)} />
          </View>
        </View>

        {/* Tarjeta de Lealtad */}
        <TarjetaSeccion
          titulo="TARJETA DE LEALTAD"
          accionTexto={`${sellosActuales} / ${sellosMeta} sellos`}
          onAccion={onIrAgendar}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6 }}>
            {Array.from({ length: sellosMeta }).map((_, idx) => {
              const lleno = idx < sellosActuales;
              return (
                <View
                  key={idx}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    maxWidth: 24,
                    borderRadius: 12,
                    backgroundColor: lleno ? colors.BzText : colors.BzCardInner,
                    borderWidth: 1,
                    borderColor: lleno ? colors.BzText : colors.BzBorder,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: lleno ? colors.BzBg : colors.BzMuted, fontSize: 10, fontWeight: '700' }}>
                    {lleno ? '✓' : idx + 1}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
            Te faltan {sellosMeta - sellosActuales} cortes para desbloquear tu servicio de cortesía.
          </Text>
        </TarjetaSeccion>

        {/* Mis Citas */}
        <TarjetaSeccion
          titulo="MIS CITAS PROGRAMADAS"
          accionTexto="+ Nueva cita ›"
          onAccion={onIrAgendar}
        >
          {citasActivas.length > 0 ? (
            citasActivas.map((cita, idx) => {
              const c = cita as Record<string, any>;
              const nombreServicio =
                typeof c.servicio === 'string' ? c.servicio : c.servicio?.nombre ?? 'Servicio';
              const nombreBarbero =
                typeof c.barbero === 'string' ? c.barbero : c.barbero?.nombre ?? 'Asignado';
              const cuando =
                c.fechaHora ??
                [c.fechaTexto ?? c.fechaISO, c.horaTexto ?? (c.hora24 != null ? `${c.hora24}:00` : '')]
                  .filter(Boolean)
                  .join(' · ');
              return (
                <View key={cita.folio ?? idx}>
                  {idx > 0 && <View style={{ height: 1, backgroundColor: colors.BzBorder, marginVertical: 6 }} />}
                  <FilaResumen
                    titulo={cuando ? `${nombreServicio} · ${cuando}` : nombreServicio}
                    subtitulo={`Barbero: ${nombreBarbero} · Folio ${cita.folio}`}
                    colorPunto={colors.BzSuccess}
                  />
                </View>
              );
            })
          ) : citaConfirmada ? (
            <FilaResumen
              titulo={citaConfirmada}
              subtitulo={`${sucursalNombre} · Confirmada`}
              colorPunto={colors.BzSuccess}
            />
          ) : (
            <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
              Aún no tienes citas próximas. Agenda tu siguiente visita cuando quieras.
            </Text>
          )}
        </TarjetaSeccion>

        {/* Mis Pedidos Apartados */}
        <TarjetaSeccion
          titulo="MIS PEDIDOS EN TIENDA"
          accionTexto={carritoCount > 0 ? `Bolsa (${carritoCount}) ›` : 'Ir a tienda ›'}
          onAccion={onIrTienda}
        >
          {pedidosPendientes.length > 0 ? (
            pedidosPendientes.map((ped, idx) => (
              <View key={ped.folio}>
                {idx > 0 && <View style={{ height: 1, backgroundColor: colors.BzBorder, marginVertical: 6 }} />}
                <FilaResumen
                  titulo={`Folio ${ped.folio} · $${ped.total} MXN`}
                  subtitulo={`${ped.lineas.length} artículo(s) · Recoger en ${ped.sucursal}`}
                  colorPunto={colors.BzWarning}
                />
              </View>
            ))
          ) : (
            <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
              {carritoCount > 0
                ? `Tienes ${carritoCount} producto(s) listos en tu bolsa para apartar.`
                : 'No tienes pedidos apartados por recoger.'}
            </Text>
          )}
        </TarjetaSeccion>

        {/* Historial de Cortes y Notas de Estilo */}
        <TarjetaSeccion
          titulo="HISTORIAL Y NOTAS DE ESTILO"
          accionTexto="Repetir corte ›"
          onAccion={onIrAgendar}
        >
          {HISTORIAL_CLIENTE_DEMO.map((visita, idx) => (
            <View key={visita.id}>
              {idx > 0 && <View style={{ height: 1, backgroundColor: colors.BzBorder, marginVertical: 6 }} />}
              <View style={{ gap: 2 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '500' }}>
                    {visita.servicio} · {visita.barbero}
                  </Text>
                  <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '500' }}>
                    {visita.precio}
                  </Text>
                </View>
                <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                  {visita.fecha} · "{visita.nota}"
                </Text>
              </View>
            </View>
          ))}
        </TarjetaSeccion>

        {/* Preferencias y Sesión */}
        <View style={{ gap: 10, marginTop: 4 }}>
          <Pressable
            onPress={() => setMostrarTema(true)}
            style={[styles.btnSecundario, { borderColor: colors.BzBorder }]}
          >
            <Text style={{ color: colors.BzText, fontSize: 14 }}>Apariencia (tema claro / oscuro)</Text>
          </Pressable>

          <Pressable
            onPress={() => setModalSucursal(true)}
            style={[styles.btnSecundario, { borderColor: colors.BzBorder }]}
          >
            <Text style={{ color: colors.BzText, fontSize: 14 }}>Cambiar sucursal preferida</Text>
          </Pressable>

          <Pressable
            onPress={onLogout}
            style={[styles.btnSecundario, { borderColor: colors.BzDanger }]}
          >
            <Text style={{ color: colors.BzDanger, fontSize: 14, fontWeight: '500' }}>Cerrar sesión</Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
};

export default VistaPerfilCliente;

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  btnSecundario: {
    width: '100%',
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  sucursalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
});