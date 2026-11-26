import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useBzTheme } from '../constants/BzTheme';

/**
 * TransicionVistaBz
 *
 * Cambia entre vistas sin corte seco:
 *   1. La vista actual se esfuma (opacity 1 -> 0 y sube 4 px).
 *   2. En el punto más bajo de opacidad se cambia el contenido.
 *   3. La vista nueva emerge (opacity 0 -> 1 y sube desde 6 px a 0).
 *
 * El fondo (BzBg del tema) queda fijo detrás, así que nunca hay destellos.
 * Solo usa la API Animated de React Native, con useNativeDriver: true.
 */

export type TransicionVistaBzProps = {
  /** Identificador de la vista activa. Cuando cambia, se dispara la transición. */
  vistaKey: string;
  children: React.ReactNode;
  /** Duración del esfumado de salida en ms. */
  duracionSalida?: number;
  /** Duración de la aparición de entrada en ms. */
  duracionEntrada?: number;
  /** Desplazamiento vertical al salir (negativo = hacia arriba). */
  desplazamientoSalida?: number;
  /** Desplazamiento vertical inicial al entrar. */
  desplazamientoEntrada?: number;
  style?: StyleProp<ViewStyle>;
};

// En React Native Web el driver nativo no existe: Animated usa JS automáticamente.
const NATIVO = true;

export function TransicionVistaBz({
  vistaKey,
  children,
  duracionSalida = 140,
  duracionEntrada = 220,
  desplazamientoSalida = -4,
  desplazamientoEntrada = 6,
  style,
}: TransicionVistaBzProps) {
  const { colors } = useBzTheme();

  const opacidad = useRef(new Animated.Value(1)).current;
  const desplazamiento = useRef(new Animated.Value(0)).current;

  // Vista que se está dibujando ahora (puede ir un paso atrás de vistaKey durante la salida).
  const [vistaMostrada, setVistaMostrada] = useState(vistaKey);
  const [bloqueado, setBloqueado] = useState(false);

  const mostradaRef = useRef(vistaKey);
  const objetivoRef = useRef(vistaKey);
  // Último contenido de la vista mostrada: se conserva mientras dura la animación de salida.
  const instantaneaRef = useRef<React.ReactNode>(children);
  const animacionRef = useRef<Animated.CompositeAnimation | null>(null);
  const entradaPendienteRef = useRef(false);
  const reducirMovimientoRef = useRef(false);
  const montadoRef = useRef(true);

  /* ---------- Accesibilidad: reducir movimiento ---------- */
  useEffect(() => {
    let activo = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((valor) => {
        if (activo) reducirMovimientoRef.current = valor;
      })
      .catch(() => {});
    const suscripcion = AccessibilityInfo.addEventListener('reduceMotionChanged', (valor) => {
      reducirMovimientoRef.current = valor;
    });
    return () => {
      activo = false;
      suscripcion?.remove?.();
    };
  }, []);

  /* ---------- Limpieza al desmontar ---------- */
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
      animacionRef.current?.stop();
      animacionRef.current = null;
    };
  }, []);

  /* ---------- Animaciones ---------- */

  const detener = () => {
    animacionRef.current?.stop();
    animacionRef.current = null;
  };

  const iniciarEntrada = () => {
    detener();
    const easing = Easing.out(Easing.cubic);
    const anim = Animated.parallel([
      Animated.timing(opacidad, { toValue: 1, duration: duracionEntrada, easing, useNativeDriver: NATIVO }),
      Animated.timing(desplazamiento, { toValue: 0, duration: duracionEntrada, easing, useNativeDriver: NATIVO }),
    ]);
    animacionRef.current = anim;
    anim.start(({ finished }) => {
      if (!finished) return; // fue interrumpida por otra transición
      if (animacionRef.current === anim) animacionRef.current = null;
      if (montadoRef.current) setBloqueado(false);
    });
  };

  const iniciarSalida = () => {
    detener();
    const easing = Easing.in(Easing.quad);
    const anim = Animated.parallel([
      Animated.timing(opacidad, { toValue: 0, duration: duracionSalida, easing, useNativeDriver: NATIVO }),
      Animated.timing(desplazamiento, {
        toValue: desplazamientoSalida,
        duration: duracionSalida,
        easing,
        useNativeDriver: NATIVO,
      }),
    ]);
    animacionRef.current = anim;
    anim.start(({ finished }) => {
      if (!finished || !montadoRef.current) return; // interrumpida: la nueva transición se encarga
      if (animacionRef.current === anim) animacionRef.current = null;

      // Punto más bajo de opacidad: se cambia el contenido sin que se note.
      opacidad.setValue(0);
      desplazamiento.setValue(desplazamientoEntrada);

      const destino = objetivoRef.current;
      if (destino === mostradaRef.current) {
        iniciarEntrada();
        return;
      }
      mostradaRef.current = destino;
      entradaPendienteRef.current = true;
      setVistaMostrada(destino);
    });
  };

  /* ---------- Entrada: se lanza cuando ya se montó el contenido nuevo ----------
   * Va ANTES del efecto de vistaKey a propósito: si el usuario cambia otra vez
   * justo en ese instante, la nueva salida cancela esta entrada. */
  useEffect(() => {
    if (!entradaPendienteRef.current) return;
    entradaPendienteRef.current = false;
    iniciarEntrada();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vistaMostrada]);

  /* ---------- Cambio de vista ---------- */
  useEffect(() => {
    objetivoRef.current = vistaKey;

    // Regresó a la vista que ya se mostraba (cambio rápido A -> B -> A): solo se restaura.
    if (vistaKey === mostradaRef.current) {
      if (animacionRef.current) iniciarEntrada();
      return;
    }

    // Reducir movimiento: cambio instantáneo.
    if (reducirMovimientoRef.current) {
      detener();
      opacidad.setValue(1);
      desplazamiento.setValue(0);
      mostradaRef.current = vistaKey;
      setVistaMostrada(vistaKey);
      setBloqueado(false);
      return;
    }

    setBloqueado(true);
    iniciarSalida();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vistaKey]);

  /* ---------- Contenido ---------- */
  useEffect(() => {
    // Mientras la vista mostrada es la activa, guardamos su contenido más reciente.
    if (vistaMostrada === vistaKey) instantaneaRef.current = children;
  });

  const contenido = vistaMostrada === vistaKey ? children : instantaneaRef.current;

  return (
    <View style={[styles.contenedor, { backgroundColor: colors.BzBg }, style]}>
      <Animated.View
        style={[
          styles.contenido,
          { opacity: opacidad, transform: [{ translateY: desplazamiento }] },
          { pointerEvents: bloqueado ? 'none' : 'auto' },
        ]}
      >
        {/* La key fuerza a montar de cero la vista nueva, aunque sea del mismo tipo de componente */}
        <React.Fragment key={vistaMostrada}>{contenido}</React.Fragment>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  contenido: { flex: 1 },
});

export default TransicionVistaBz;