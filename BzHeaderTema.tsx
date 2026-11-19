import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { BzTypography, useBzTheme } from '../constants/BzTheme';
import { RolSesion } from '../constants/Sesion';
import { BzNotificationBell } from './BzNotificationBell';

/* =====================================================================
 * ThemeSelector.kt
 * ===================================================================== */

type PaletaMini = {
  sidebar: string;
  panel: string;
  borde: string;
  fuerte: string;
  suave: string;
  mosaico: string;
};

const MiniOscuro: PaletaMini = {
  sidebar: '#1C1C1E',
  panel: '#111112',
  borde: 'transparent',
  fuerte: '#4A4A50',
  suave: '#2C2C30',
  mosaico: '#232326',
};

const MiniClaro: PaletaMini = {
  sidebar: '#FAFAFC',
  panel: '#FFFFFF',
  borde: 'rgba(0,0,0,0.06)',
  fuerte: '#D6D6DE',
  suave: '#EBEBF0',
  mosaico: '#F2F2F6',
};

/** Dibuja la esquina superior izquierda de una mini-app (lienzo de 100 x 75 unidades). */
const MiniApp: React.FC<{ p: PaletaMini }> = ({ p }) => {
  const sx = 13;
  const sy = 13;
  const px = sx + 25;
  const py = sy + 3;
  const bw = 0.7;

  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 75" preserveAspectRatio="xMinYMin slice">
      {/* barra lateral (se sale por derecha y abajo) */}
      <Rect x={sx} y={sy} width={100} height={75} rx={5} fill={p.sidebar} stroke={p.borde} strokeWidth={bw} />
      {[0, 1, 2].map((i) => (
        <Circle key={i} cx={sx + 4.2 + i * 3.3} cy={sy + 5} r={1} fill={p.suave} />
      ))}
      <Rect x={sx + 3} y={sy + 10} width={19} height={4.6} rx={1.6} fill={p.suave} />
      <Rect x={sx + 4.2} y={sy + 11.2} width={10} height={2.2} rx={1.1} fill={p.fuerte} />
      <Rect x={sx + 4.2} y={sy + 16.6} width={13} height={2.2} rx={1.1} fill={p.suave} />
      <Rect x={sx + 4.2} y={sy + 22.2} width={8} height={2.2} rx={1.1} fill={p.suave} />

      {/* panel de contenido */}
      <Rect x={px} y={py} width={100} height={75} rx={4} fill={p.panel} stroke={p.borde} strokeWidth={bw} />
      <Rect x={px + 5} y={py + 5} width={11} height={2.2} rx={1.1} fill={p.fuerte} />
      <Rect x={px + 5} y={py + 9.2} width={19} height={2.2} rx={1.1} fill={p.suave} />
      {[0, 1, 2].map((i) => (
        <Rect key={i} x={px + 5 + i * 21.5} y={py + 16} width={19} height={12} rx={2.4} fill={p.mosaico} />
      ))}
      <Rect x={px + 5} y={py + 30.5} width={70} height={20} rx={2.4} fill={p.mosaico} />
    </Svg>
  );
};

const TarjetaTema: React.FC<{ esOscuro: boolean; seleccionado: boolean; onPress: () => void }> = ({
  esOscuro,
  seleccionado,
  onPress,
}) => {
  const { colors } = useBzTheme();
  return (
    <View style={{ alignItems: 'center' }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityState={{ selected: seleccionado }}
        style={{
          width: 140,
          aspectRatio: 4 / 3,
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: colors.BzCardInner,
          borderWidth: seleccionado ? 1.5 : 1,
          borderColor: seleccionado ? colors.BzText : colors.BzBorder,
        }}
      >
        <MiniApp p={esOscuro ? MiniOscuro : MiniClaro} />
      </Pressable>
      <Text
        style={{
          marginTop: 10,
          fontSize: 12,
          fontWeight: '500',
          color: seleccionado ? colors.BzText : colors.BzMuted,
        }}
      >
        {esOscuro ? 'Oscuro' : 'Claro'}
      </Text>
    </View>
  );
};

export const BzThemeSelector: React.FC<{ esOscuro: boolean; onChange: (oscuro: boolean) => void }> = ({
  esOscuro,
  onChange,
}) => (
  <View style={{ flexDirection: 'row', gap: 20 }}>
    <TarjetaTema esOscuro seleccionado={esOscuro} onPress={() => onChange(true)} />
    <TarjetaTema esOscuro={false} seleccionado={!esOscuro} onPress={() => onChange(false)} />
  </View>
);

/** Hoja inferior reutilizable (equivale a ModalBottomSheet de Material3). */
const HojaInferior: React.FC<{
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
}> = ({ visible, onDismiss, children }) => {
  const { colors } = useBzTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.fondoHoja} onPress={onDismiss} />
      <View
        style={[
          styles.hoja,
          { backgroundColor: colors.BzCard, paddingBottom: 28 + insets.bottom },
        ]}
      >
        <View style={[styles.agarre, { backgroundColor: colors.BzBorder }]} />
        {children}
      </View>
    </Modal>
  );
};

/** Hoja "Apariencia". El cambio se aplica y se guarda al instante. */
export const BzAppearanceSheet: React.FC<{ visible: boolean; onDismiss: () => void }> = ({
  visible,
  onDismiss,
}) => {
  const { colors, dark, setDark } = useBzTheme();
  return (
    <HojaInferior visible={visible} onDismiss={onDismiss}>
      <Text style={[BzTypography.label, { color: colors.BzMuted }]}>APARIENCIA</Text>
      <Text style={[BzTypography.title, { color: colors.BzText, fontSize: 20, marginTop: 6 }]}>
        Elige tu tema
      </Text>
      <View style={{ height: 20 }} />
      <BzThemeSelector esOscuro={dark} onChange={setDark} />
    </HojaInferior>
  );
};

/* =====================================================================
 * BzHeader.kt
 * ===================================================================== */

export type BzNotificacion = { titulo: string; detalle: string; color: string };

type PaletaAlertas = { BzWarning: string; BzSuccess: string };

// ⚠️ Colores de respaldo. Pasa `colors` de useBzTheme() para usar los de tu tema.
const ALERTAS_POR_DEFECTO: PaletaAlertas = { BzWarning: '#E0A030', BzSuccess: '#3DBB6B' };

/** Notificaciones de ejemplo por rol (reemplazar por datos reales). */
export function notificacionesIniciales(
  rol: RolSesion,
  paleta: PaletaAlertas = ALERTAS_POR_DEFECTO,
): BzNotificacion[] {
  const { BzWarning, BzSuccess } = paleta;
  switch (rol) {
    case RolSesion.DUENO:
      return [
        { titulo: 'Corte de caja con diferencia', detalle: 'Olivete · −$20', color: BzWarning },
        { titulo: '3 productos con stock bajo', detalle: 'Revisa inventario', color: BzWarning },
      ];
    case RolSesion.ENCARGADO:
      return [{ titulo: 'Solicitud de traspaso', detalle: 'Oblatos pide 6 uds de Shampoo', color: BzWarning }];
    case RolSesion.RECEPCION:
      return [{ titulo: 'Cliente en lista de espera', detalle: 'Mario D. · Corte', color: BzWarning }];
    case RolSesion.BARBERO:
      return [{ titulo: 'Siguiente cita 11:30', detalle: 'Andrés López · Corte + barba', color: BzSuccess }];
    case RolSesion.CLIENTE:
      return [{ titulo: 'Recordatorio de tu cita', detalle: 'Hoy 11:30 · Sucursal Olivete', color: BzSuccess }];
  }
}

const BotonCircular: React.FC<{ onPress: () => void; children: React.ReactNode }> = ({ onPress, children }) => {
  const { colors } = useBzTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.BzCard,
        borderWidth: 1,
        borderColor: colors.BzBorder,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </Pressable>
  );
};

const IconoTema: React.FC<{ oscuro: boolean; color: string }> = ({ oscuro, color }) =>
  oscuro ? (
    // LightMode (sol): se muestra cuando el tema actual es oscuro
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={4} stroke={color} strokeWidth={1.6} />
      <Line x1={12} y1={2} x2={12} y2={4.5} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={12} y1={19.5} x2={12} y2={22} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={2} y1={12} x2={4.5} y2={12} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={19.5} y1={12} x2={22} y2={12} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={4.9} y1={4.9} x2={6.7} y2={6.7} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={17.3} y1={17.3} x2={19.1} y2={19.1} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={4.9} y1={19.1} x2={6.7} y2={17.3} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={17.3} y1={6.7} x2={19.1} y2={4.9} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  ) : (
    // DarkMode (luna)
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );

/**
 * Encabezado de pantalla de inicio:
 *   B|Z · BARBERZONE                    [tema] [campana]
 *   Hola, Dueño                          (• Dueño)
 */
export const BzHeader: React.FC<{
  saludo: string;
  rolEtiqueta: string;
  notificaciones: number;
  onRol: () => void;
  onCampana: () => void;
  onTema: () => void;
}> = ({ saludo, rolEtiqueta, notificaciones, onRol, onCampana, onTema }) => {
  const { colors, dark } = useBzTheme();
  return (
    <View style={{ width: '100%' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[BzTypography.label, { color: colors.BzMuted, flex: 1 }]}>B|Z · BARBERZONE</Text>
        <BotonCircular onPress={onTema}>
          <IconoTema oscuro={dark} color={colors.BzText} />
        </BotonCircular>
        <View style={{ width: 10 }} />
        <BzNotificationBell cantidad={notificaciones} onPress={onCampana} />
      </View>

      <View style={{ height: 8 }} />

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text numberOfLines={1} style={[BzTypography.title, { color: colors.BzText, flex: 1 }]}>
          {saludo}
        </Text>
        <View style={{ width: 10 }} />
        <Pressable
          onPress={onRol}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 20,
            backgroundColor: colors.BzCard,
            borderWidth: 1,
            borderColor: colors.BzBorder,
          }}
        >
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.BzSuccess }} />
          <Text numberOfLines={1} style={{ color: colors.BzText, fontSize: 11 }}>
            {rolEtiqueta}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export const BzNotificacionesSheet: React.FC<{
  visible: boolean;
  items: BzNotificacion[];
  onMarcarLeidas: () => void;
  onDismiss: () => void;
}> = ({ visible, items, onMarcarLeidas, onDismiss }) => {
  const { colors } = useBzTheme();
  return (
    <HojaInferior visible={visible} onDismiss={onDismiss}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[BzTypography.label, { color: colors.BzMuted, flex: 1 }]}>NOTIFICACIONES</Text>
        {items.length > 0 && (
          <Pressable onPress={onMarcarLeidas}>
            <Text style={{ color: colors.BzText, fontSize: 12 }}>Marcar como leídas</Text>
          </Pressable>
        )}
      </View>

      <View style={{ height: 12 }} />

      {items.length === 0 ? (
        <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Estás al día. No hay notificaciones nuevas.</Text>
      ) : (
        items.map((n, i) => (
          <View key={`${n.titulo}-${i}`}>
            {i > 0 && <View style={{ height: 1, backgroundColor: colors.BzBorder }} />}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 }}>
              <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: n.color }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.BzText, fontSize: 14 }}>{n.titulo}</Text>
                <Text style={{ color: colors.BzMuted, fontSize: 12 }}>{n.detalle}</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </HojaInferior>
  );
};

const styles = StyleSheet.create({
  fondoHoja: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  hoja: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  agarre: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
});