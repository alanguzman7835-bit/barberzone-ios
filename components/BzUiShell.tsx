import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { BzStatusColors, BzTypography, useBzTheme } from '../constants/BzTheme';
import { RolSesion } from '../constants/Sesion';

export interface BzNotificacion {
  titulo: string;
  detalle: string;
  color: string;
}

export const notificacionesIniciales = (rol: RolSesion): BzNotificacion[] => {
  switch (rol) {
    case RolSesion.DUENO:
      return [
        { titulo: 'Corte de caja con diferencia', detalle: 'Olivete · −$20', color: BzStatusColors.BzWarning },
        { titulo: '3 productos con stock bajo', detalle: 'Revisa inventario', color: BzStatusColors.BzWarning },
      ];
    case RolSesion.ENCARGADO:
      return [
        { titulo: 'Solicitud de traspaso', detalle: 'Oblatos pide 6 uds de Shampoo', color: BzStatusColors.BzWarning },
      ];
    case RolSesion.RECEPCION:
      return [
        { titulo: 'Cliente en lista de espera', detalle: 'Mario D. · Corte', color: BzStatusColors.BzWarning },
      ];
    case RolSesion.BARBERO:
      return [
        { titulo: 'Siguiente cita 11:30', detalle: 'Andrés López · Corte + barba', color: BzStatusColors.BzSuccess },
      ];
    case RolSesion.CLIENTE:
      return [
        { titulo: 'Recordatorio de tu cita', detalle: 'Hoy 11:30 · Sucursal Olivete', color: BzStatusColors.BzSuccess },
      ];
  }
};

/* ---------- Campana Animada ---------- */

const CAMPANA_PATH =
  'M3.5 6.5C3.5 3.46279 5.96279 1 9 1C12.0372 1 14.5 3.46279 14.5 6.5V10.75C14.5 11.4408 15.0592 12 15.75 12C16.1642 12 16.5 12.3358 16.5 12.75C16.5 13.1642 16.1642 13.5 15.75 13.5H2.25C1.83579 13.5 1.5 13.1642 1.5 12.75C1.5 12.3358 1.83579 12 2.25 12C2.94079 12 3.5 11.4408 3.5 10.75V6.5Z';
const BADAJO_PATH =
  'M10.2 15H7.80099C7.64999 15 7.50799 15.068 7.41299 15.185C7.31799 15.302 7.28099 15.456 7.31199 15.603C7.48499 16.425 8.17999 17 9.00099 17C9.82199 17 10.517 16.425 10.69 15.603C10.721 15.456 10.684 15.302 10.589 15.185C10.494 15.068 10.351 15 10.2 15Z';

export const BzNotificationBell: React.FC<{
  cantidad: number;
  onPress: () => void;
  tamano?: number;
}> = ({ cantidad, onPress, tamano = 40 }) => {
  const { colors } = useBzTheme();
  const total = Math.max(0, cantidad);
  const swingAnim = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(total > 0 ? 1 : 0)).current;
  const prevRef = useRef(total);

  useEffect(() => {
    const delta = total - prevRef.current;
    prevRef.current = total;

    Animated.spring(badgeScale, {
      toValue: total > 0 ? 1 : 0,
      friction: 5,
      tension: 120,
      useNativeDriver: true,
    }).start();

    if (delta > 0) {
      Animated.sequence([
        Animated.timing(swingAnim, { toValue: -16, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(swingAnim, { toValue: 13, duration: 110, useNativeDriver: true }),
        Animated.timing(swingAnim, { toValue: -9, duration: 110, useNativeDriver: true }),
        Animated.timing(swingAnim, { toValue: 5, duration: 110, useNativeDriver: true }),
        Animated.timing(swingAnim, { toValue: -2, duration: 100, useNativeDriver: true }),
        Animated.timing(swingAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [total, swingAnim, badgeScale]);

  const rotate = swingAnim.interpolate({
    inputRange: [-20, 20],
    outputRange: ['-20deg', '20deg'],
  });

  return (
    <View style={{ width: tamano, height: tamano }}>
      <Pressable
        onPress={onPress}
        style={[
          styles.circleBtn,
          {
            width: tamano,
            height: tamano,
            borderRadius: tamano / 2,
            backgroundColor: colors.BzCard,
            borderColor: colors.BzBorder,
          },
        ]}
      >
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Svg width={tamano * 0.56} height={tamano * 0.56} viewBox="0 0 18 18" fill="none">
            <Path d={CAMPANA_PATH} fill={colors.BzText} fillOpacity={0.55} fillRule="evenodd" clipRule="evenodd" />
            <Path d={BADAJO_PATH} fill={colors.BzText} />
          </Svg>
        </Animated.View>
      </Pressable>

      {total > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.badge,
            {
              backgroundColor: colors.BzDanger,
              transform: [{ scale: badgeScale }],
            },
          ]}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>
            {total > 99 ? '99+' : String(total)}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

/* ---------- Selector de Tema (Miniaturas Oscuro / Claro) ---------- */

const MiniAppPreview: React.FC<{ oscuro: boolean }> = ({ oscuro }) => {
  const p = oscuro
    ? { sidebar: '#1C1C1E', panel: '#111112', borde: 'transparent', fuerte: '#4A4A50', suave: '#2C2C30', mosaico: '#232326' }
    : { sidebar: '#FAFAFC', panel: '#FFFFFF', borde: 'rgba(0,0,0,0.06)', fuerte: '#D6D6DE', suave: '#EBEBF0', mosaico: '#F2F2F6' };

  const sx = 13;
  const sy = 13;
  const px = sx + 25;
  const py = sy + 3;

  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 75">
      {/* Barra lateral */}
      <Rect x={sx} y={sy} width={100} height={75} rx={5} fill={p.sidebar} stroke={p.borde} strokeWidth={0.6} />
      {[0, 1, 2].map((i) => (
        <Circle key={i} cx={sx + 4.2 + i * 3.3} cy={sy + 5} r={1} fill={p.suave} />
      ))}
      <Rect x={sx + 3} y={sy + 10} width={19} height={4.6} rx={1.6} fill={p.suave} />
      <Rect x={sx + 4.2} y={sy + 11.2} width={10} height={2.2} rx={1.1} fill={p.fuerte} />
      <Rect x={sx + 4.2} y={sy + 16.6} width={13} height={2.2} rx={1.1} fill={p.suave} />
      <Rect x={sx + 4.2} y={sy + 22.2} width={8} height={2.2} rx={1.1} fill={p.suave} />

      {/* Panel de contenido */}
      <Rect x={px} y={py} width={100} height={75} rx={4} fill={p.panel} stroke={p.borde} strokeWidth={0.6} />
      <Rect x={px + 5} y={py + 5} width={11} height={2.2} rx={1.1} fill={p.fuerte} />
      <Rect x={px + 5} y={py + 9.2} width={19} height={2.2} rx={1.1} fill={p.suave} />
      {[0, 1, 2].map((i) => (
        <Rect key={i} x={px + 5 + i * 21.5} y={py + 16} width={19} height={12} rx={2.4} fill={p.mosaico} />
      ))}
      <Rect x={px + 5} y={py + 30.5} width={70} height={20} rx={2.4} fill={p.mosaico} />
    </Svg>
  );
};

export const BzAppearanceSheet: React.FC<{ visible: boolean; onDismiss: () => void }> = ({ visible, onDismiss }) => {
  const { dark, setDark, colors } = useBzTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.sheetBackdrop} onPress={onDismiss}>
        <Pressable style={[styles.sheetContainer, { backgroundColor: colors.BzCard }]} onPress={() => {}}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.BzBorder }]} />
          <Text style={[BzTypography.label, { color: colors.BzMuted }]}>APARIENCIA</Text>
          <Text style={[BzTypography.title, { color: colors.BzText, fontSize: 20, marginTop: 6, marginBottom: 20 }]}>
            Elige tu tema
          </Text>

          <View style={{ flexDirection: 'row', gap: 20 }}>
            {[
              { label: 'Oscuro', value: true },
              { label: 'Claro', value: false },
            ].map((item) => {
              const selected = dark === item.value;
              return (
                <Pressable
                  key={item.label}
                  onPress={() => setDark(item.value)}
                  style={{ flex: 1, alignItems: 'center' }}
                >
                  <View
                    style={{
                      width: '100%',
                      aspectRatio: 4 / 3,
                      borderRadius: 16,
                      overflow: 'hidden',
                      backgroundColor: colors.BzCardInner,
                      borderWidth: selected ? 1.5 : 1,
                      borderColor: selected ? colors.BzText : colors.BzBorder,
                    }}
                  >
                    <MiniAppPreview oscuro={item.value} />
                  </View>
                  <Text
                    style={{
                      marginTop: 10,
                      fontSize: 12,
                      fontWeight: '500',
                      color: selected ? colors.BzText : colors.BzMuted,
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

/* ---------- Encabezado Superior BzHeader ---------- */

const SunIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={4} stroke={color} strokeWidth={1.6} />
    <Path
      d="M12 2V4M12 20V22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M2 12H4M20 12H22M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
    />
  </Svg>
);

const MoonIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const BzHeader: React.FC<{
  saludo: string;
  rolEtiqueta: string;
  notificaciones: number;
  onRol: () => void;
  onCampana: () => void;
  onTema: () => void;
}> = ({ saludo, rolEtiqueta, notificaciones, onRol, onCampana, onTema }) => {
  const { dark, colors } = useBzTheme();

  return (
    <View style={{ width: '100%' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[BzTypography.label, { color: colors.BzMuted, flex: 1 }]}>B|Z · BARBERZONE</Text>
        <Pressable
          onPress={onTema}
          style={[
            styles.circleBtn,
            { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.BzCard, borderColor: colors.BzBorder },
          ]}
        >
          {dark ? <SunIcon color={colors.BzText} /> : <MoonIcon color={colors.BzText} />}
        </Pressable>
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

/* ---------- Hoja Inferior de Notificaciones ---------- */

export const BzNotificacionesSheet: React.FC<{
  visible: boolean;
  items: BzNotificacion[];
  onMarcarLeidas: () => void;
  onDismiss: () => void;
}> = ({ visible, items, onMarcarLeidas, onDismiss }) => {
  const { colors } = useBzTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.sheetBackdrop} onPress={onDismiss}>
        <Pressable style={[styles.sheetContainer, { backgroundColor: colors.BzCard }]} onPress={() => {}}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.BzBorder }]} />
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
            <Text style={{ color: colors.BzMuted, fontSize: 13 }}>
              Estás al día. No hay notificaciones nuevas.
            </Text>
          ) : (
            items.map((n, i) => (
              <View key={i}>
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
        </Pressable>
      </Pressable>
    </Modal>
  );
};

/* ---------- Barra de Navegación Inferior Líquida (GooeyNavBar) ---------- */

export interface GooeyTabItem {
  id: string;
  etiqueta: string;
  renderIcon: (color: string) => React.ReactNode;
}

export const GooeyNavBar: React.FC<{
  items: GooeyTabItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}> = ({ items, selectedIndex, onSelect }) => {
  const { colors } = useBzTheme();
  const [barWidth, setBarWidth] = useState(0);
  const slideAnim = useRef(new Animated.Value(selectedIndex)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: selectedIndex,
      friction: 7,
      tension: 85,
      useNativeDriver: true,
    }).start();
  }, [selectedIndex, slideAnim]);

  const tabWidth = barWidth > 0 && items.length > 0 ? (barWidth - 8) / items.length : 0;
  const translateX = slideAnim.interpolate({
    inputRange: items.map((_, i) => i),
    outputRange: items.map((_, i) => i * tabWidth),
    extrapolate: 'clamp',
  });

  return (
    <View
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      style={[
        styles.gooeyBar,
        {
          backgroundColor: colors.BzCard,
          borderColor: colors.BzBorder,
        },
      ]}
    >
      {tabWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.gooeyPill,
            {
              width: tabWidth,
              backgroundColor: colors.BzText,
              transform: [{ translateX }],
            },
          ]}
        />
      )}

      {items.map((item, idx) => {
        const active = idx === selectedIndex;
        const contentColor = active ? colors.BzBg : colors.BzMuted;
        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect(idx)}
            style={styles.gooeyTab}
          >
            {item.renderIcon(contentColor)}
            <Text
              numberOfLines={1}
              style={{
                color: contentColor,
                fontSize: 10,
                fontWeight: active ? '600' : '400',
                marginTop: 2,
              }}
            >
              {item.etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  circleBtn: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    height: 18,
    minWidth: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 34,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 18,
  },
  gooeyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    padding: 4,
    position: 'relative',
  },
  gooeyPill: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: 26,
  },
  gooeyTab: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});