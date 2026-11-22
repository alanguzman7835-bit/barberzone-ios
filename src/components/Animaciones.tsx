import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { useBzTheme } from '../constants/BzTheme';

export enum EstadoPin {
  NORMAL = 'NORMAL',
  EXITO = 'EXITO',
  ERROR = 'ERROR',
}

export const OjoAnimado: React.FC<{ abierto: boolean; color: string }> = ({ abierto, color }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    {abierto ? (
      <>
        <Path
          d="M2 12C4 7.8 7.5 5.5 12 5.5C16.5 5.5 20 7.8 22 12C20 16.2 16.5 18.5 12 18.5C7.5 18.5 4 16.2 2 12Z"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.5} />
      </>
    ) : (
      <>
        <Path
          d="M2 12C4 15.2 7.5 17 12 17C16.5 17 20 15.2 22 12"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Line x1={4.4} y1={14.6} x2={3} y2={16.4} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        <Line x1={9} y1={16.6} x2={8.5} y2={19} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        <Line x1={15} y1={16.6} x2={15.5} y2={19} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        <Line x1={19.6} y1={14.6} x2={21} y2={16.4} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      </>
    )}
  </Svg>
);

const NIVELES = [
  { label: 'Débil', color: '#E5484D' },
  { label: 'Regular', color: '#E8A317' },
  { label: 'Buena', color: '#9B9BA3' },
  { label: 'Fuerte', color: '#2E9E5B' },
];

export const fortalezaContrasena = (v: string): number => {
  if (!v) return 0;
  const puntos = [
    v.length >= 8,
    v.length >= 12,
    /[a-z]/.test(v) && /[A-Z]/.test(v),
    /\d/.test(v),
    /[^A-Za-z0-9]/.test(v),
  ].filter(Boolean).length;
  return Math.min(4, Math.max(1, puntos));
};

export const CampoContrasenaAnimado: React.FC<{
  value: string;
  onChange: (text: string) => void;
  placeholder: string;
  mostrarFortaleza?: boolean;
  maxCaracteres?: number;
  leading?: React.ReactNode;
}> = ({ value, onChange, placeholder, mostrarFortaleza = false, maxCaracteres = 20, leading }) => {
  const { colors } = useBzTheme();
  const [visible, setVisible] = useState(false);
  const [enfocado, setEnfocado] = useState(false);
  const nivel = fortalezaContrasena(value);

  return (
    <View style={{ width: '100%' }}>
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.BzBg,
            borderColor: enfocado ? colors.BzText : colors.BzBorder,
          },
        ]}
      >
        {leading && <View style={{ marginRight: 10 }}>{leading}</View>}
        <TextInput
          value={value}
          onChangeText={(t) => onChange(t.slice(0, maxCaracteres))}
          placeholder={placeholder}
          placeholderTextColor={colors.BzMuted}
          secureTextEntry={!visible}
          autoCapitalize="none"
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          style={[styles.textInput, { color: colors.BzText }]}
        />
        <Pressable onPress={() => setVisible(!visible)} style={styles.eyeBtn}>
          <OjoAnimado abierto={visible} color={colors.BzMuted} />
        </Pressable>
      </View>

      {mostrarFortaleza && nivel > 0 && (
        <View style={{ paddingHorizontal: 4, paddingTop: 10, gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: i < nivel ? NIVELES[nivel - 1].color : colors.BzBorder,
                }}
              />
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.BzMuted, fontSize: 11 }}>Seguridad de la contraseña</Text>
            <Text style={{ color: colors.BzText, opacity: 0.8, fontSize: 11, fontWeight: '500' }}>
              {NIVELES[nivel - 1].label}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export const CasillasPin: React.FC<{ pin: string; estado: EstadoPin; longitud?: number }> = ({
  pin,
  estado,
  longitud = 4,
}) => {
  const { colors } = useBzTheme();
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.timing(cursorOpacity, { toValue: 0, duration: 550, useNativeDriver: true }),
      ])
    );
    blink.start();
    return () => blink.stop();
  }, [cursorOpacity]);

  useEffect(() => {
    if (estado === EstadoPin.ERROR) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: -10, duration: 70, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 70, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -4, duration: 70, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 70, useNativeDriver: true }),
      ]).start();
    } else {
      shakeAnim.setValue(0);
    }
  }, [estado, shakeAnim]);

  return (
    <Animated.View style={{ flexDirection: 'row', gap: 10, transform: [{ translateX: shakeAnim }] }}>
      {Array.from({ length: longitud }).map((_, i) => {
        const lleno = pin.length > i;
        const mostrarCursor = estado === EstadoPin.NORMAL && pin.length === i;
        const borderColor =
          estado === EstadoPin.ERROR
            ? colors.BzDanger
            : estado === EstadoPin.EXITO
            ? colors.BzSuccess
            : colors.BzBorder;
        const borderWidth = estado === EstadoPin.ERROR || estado === EstadoPin.EXITO ? 2 : 1;

        return (
          <View
            key={i}
            style={[
              styles.pinBox,
              {
                backgroundColor: colors.BzCard,
                borderColor,
                borderWidth,
              },
            ]}
          >
            {lleno && <Text style={{ color: colors.BzText, fontSize: 26, fontWeight: '600' }}>•</Text>}
            {mostrarCursor && (
              <Animated.View
                style={{
                  width: 2,
                  height: 24,
                  backgroundColor: colors.BzText,
                  borderRadius: 1,
                  opacity: cursorOpacity,
                }}
              />
            )}
          </View>
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderRadius: 10,
    paddingLeft: 14,
    paddingRight: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  eyeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});