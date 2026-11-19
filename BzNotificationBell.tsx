import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useBzTheme } from '../constants/BzTheme';

// Mismos trazos SVG de la campana original (viewBox 18x18)
const CAMPANA =
  'M3.5 6.5C3.5 3.46279 5.96279 1 9 1C12.0372 1 14.5 3.46279 14.5 6.5V10.75C14.5 11.4408 15.0592 12 15.75 12C16.1642 12 16.5 12.3358 16.5 12.75C16.5 13.1642 16.1642 13.5 15.75 13.5H2.25C1.83579 13.5 1.5 13.1642 1.5 12.75C1.5 12.3358 1.83579 12 2.25 12C2.94079 12 3.5 11.4408 3.5 10.75V6.5Z';
const BADAJO =
  'M10.2 15H7.80099C7.64999 15 7.50799 15.068 7.41299 15.185C7.31799 15.302 7.28099 15.456 7.31199 15.603C7.48499 16.425 8.17999 17 9.00099 17C9.82199 17 10.517 16.425 10.69 15.603C10.721 15.456 10.684 15.302 10.589 15.185C10.494 15.068 10.351 15 10.2 15Z';

const ALTO_DIGITO = 14;

/** Dígito que "rueda" hacia arriba si el número sube y hacia abajo si baja. */
const DigitoRodante: React.FC<{ valor: number; color: string }> = ({ valor, color }) => {
  const [actual, setActual] = useState(valor);
  const [previo, setPrevio] = useState<number | null>(null);
  const prog = useRef(new Animated.Value(1)).current;
  const dir = useRef(1);

  useEffect(() => {
    if (valor === actual) return;
    dir.current = valor > actual ? 1 : -1;
    setPrevio(actual);
    setActual(valor);
    prog.setValue(0);
    Animated.timing(prog, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setPrevio(null));
  }, [valor, actual, prog]);

  const d = dir.current;
  const estiloTexto = { color, fontSize: 10, fontWeight: '600' as const, lineHeight: ALTO_DIGITO };

  return (
    <View style={{ height: ALTO_DIGITO, overflow: 'hidden', justifyContent: 'center' }}>
      {/* fantasma: da el ancho correcto al contenedor */}
      <Text style={[estiloTexto, { opacity: 0 }]}>{actual}</Text>

      {previo !== null && (
        <Animated.Text
          style={[
            estiloTexto,
            StyleSheet.absoluteFillObject,
            {
              opacity: prog.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
              transform: [
                {
                  translateY: prog.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -d * ALTO_DIGITO],
                  }),
                },
              ],
            },
          ]}
        >
          {previo}
        </Animated.Text>
      )}

      <Animated.Text
        style={[
          estiloTexto,
          StyleSheet.absoluteFillObject,
          {
            opacity: prog,
            transform: [
              {
                translateY: prog.interpolate({
                  inputRange: [0, 1],
                  outputRange: [d * ALTO_DIGITO, 0],
                }),
              },
            ],
          },
        ]}
      >
        {actual}
      </Animated.Text>
    </View>
  );
};

/**
 * Campana con badge. Cuando `cantidad` SUBE, la campana se balancea con un
 * resorte poco amortiguado (sigue oscilando) y los dígitos ruedan.
 */
export const BzNotificationBell: React.FC<{
  cantidad: number;
  onPress: () => void;
  tamano?: number;
  maximo?: number;
  colorIcono?: string;
}> = ({ cantidad, onPress, tamano = 40, maximo = 99, colorIcono }) => {
  const { colors } = useBzTheme();
  const color = colorIcono ?? colors.BzText;
  const total = Math.max(0, cantidad);

  const balanceo = useRef(new Animated.Value(0)).current; // grados
  const insignia = useRef(new Animated.Value(total > 0 ? 1 : 0)).current;
  const anterior = useRef(total);
  const sentido = useRef(1);

  useEffect(() => {
    const delta = total - anterior.current;
    anterior.current = total;

    // badge: aparece con resorte, desaparece con fundido
    if (total > 0) {
      Animated.spring(insignia, {
        toValue: 1,
        stiffness: 600,
        damping: 24,
        mass: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(insignia, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    }

    // balanceo solo cuando sube
    if (delta > 0) {
      const peso = 0.7 + (0.6 * Math.min(delta, 5)) / 5;
      // RN no expone la velocidad actual: alternamos el sentido en cada aviso
      sentido.current = -sentido.current;
      const velocidad = Math.max(-900, Math.min(900, sentido.current * 500 * peso));
      Animated.spring(balanceo, {
        toValue: 0,
        velocity: velocidad, // grados por segundo
        stiffness: 220,
        damping: 10, // ≈ ratio 0.34 del Kotlin: 0.34 · 2 · √220
        mass: 1,
        useNativeDriver: true,
      }).start();
    }
  }, [total, balanceo, insignia]);

  const icono = tamano * 0.56;
  const escala = icono / 18;
  // La campana cuelga de arriba (9, 2.16); el badajo gira desde (9, 15). Centro del icono = (9, 9).
  const pivoteCampana = (18 * 0.12 - 9) * escala;
  const pivoteBadajo = (15 - 9) * escala;

  const rotCampana = balanceo.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });
  // el badajo se retrasa: -0.7 · balanceo
  const rotBadajo = balanceo.interpolate({
    inputRange: [-360, 360],
    outputRange: ['252deg', '-252deg'],
  });

  return (
    <View
      style={{ width: tamano, height: tamano }}
      accessibilityLabel={total > 0 ? `Notificaciones, ${total} sin leer` : 'Notificaciones'}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={{
          width: tamano,
          height: tamano,
          borderRadius: tamano / 2,
          backgroundColor: colors.BzCard,
          borderWidth: 1,
          borderColor: colors.BzBorder,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View
          style={{
            width: icono,
            height: icono,
            transform: [{ translateY: pivoteCampana }, { rotate: rotCampana }, { translateY: -pivoteCampana }],
          }}
        >
          <Svg width={icono} height={icono} viewBox="0 0 18 18">
            <Path d={CAMPANA} fill={color} fillOpacity={0.55} fillRule="evenodd" />
          </Svg>
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                transform: [{ translateY: pivoteBadajo }, { rotate: rotBadajo }, { translateY: -pivoteBadajo }],
              },
            ]}
          >
            <Svg width={icono} height={icono} viewBox="0 0 18 18">
              <Path d={BADAJO} fill={color} />
            </Svg>
          </Animated.View>
        </Animated.View>
      </Pressable>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.insignia,
          {
            backgroundColor: colors.BzDanger,
            opacity: insignia,
            transform: [{ scale: insignia }],
          },
        ]}
      >
        {total > maximo ? (
          <Text style={styles.textoInsignia}>{`${maximo}+`}</Text>
        ) : (
          <DigitoRodante valor={total} color="#FFFFFF" />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  insignia: {
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
  textoInsignia: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
});
