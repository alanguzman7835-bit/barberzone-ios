import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';

/* ---------- Identidad visual ---------- */

const FONDO = '#0A0A0A';
const MARFIL = '#F5F5F0';
const GRIS = 'rgba(245, 245, 240, 0.55)';
const LINEA_FINA = 'rgba(245, 245, 240, 0.28)';

/* ---------- Coreografía (ms) ---------- */

const T = {
  linea: { delay: 0, duracion: 500 }, //     0.0 – 0.5 s  el trazo
  letras: { delay: 400, duracion: 600 }, //  0.4 – 1.0 s  apertura del monograma
  textos: { delay: 800, duracion: 500 }, //  0.8 – 1.3 s  tipografía editorial
  salida: { delay: 1600, duracion: 500 }, // 1.6 – 2.1 s  salida limpia
};
const MOVIMIENTO_REDUCIDO = { espera: 800, salida: 300 };

const DESPLAZ_LETRAS = 12; // px
const DESPLAZ_TEXTO = 6; // px
const ANCHO_LINEA = 44; // px, líneas horizontales a los costados de cada etiqueta

type Props = {
  /** Se ejecuta cuando termina la salida; ahí puedes desmontar el splash. */
  onFinish?: () => void;
};

export default function SplashAnimadoBz({ onFinish }: Props) {
  const linea = useRef(new Animated.Value(0)).current;
  const letras = useRef(new Animated.Value(0)).current;
  const textos = useRef(new Animated.Value(0)).current;
  const salida = useRef(new Animated.Value(0)).current;

  const [saliendo, setSaliendo] = useState(false);
  const [oculto, setOculto] = useState(false);
  const [reducido, setReducido] = useState(false);

  // Siempre se llama a la versión más reciente de onFinish sin reiniciar la animación
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    let cancelado = false;
    let terminado = false;
    let animacion: Animated.CompositeAnimation | null = null;
    let temporizador: ReturnType<typeof setTimeout> | null = null;

    const terminar = () => {
      if (cancelado || terminado) return;
      terminado = true;
      setOculto(true);
      onFinishRef.current?.();
    };

    const iniciar = (reducir: boolean) => {
      if (cancelado) return;

      if (reducir) {
        // Sin movimiento: logo estático 800 ms y un fade-out simple
        setReducido(true);
        linea.setValue(1);
        letras.setValue(1);
        textos.setValue(1);
        animacion = Animated.sequence([
          Animated.delay(MOVIMIENTO_REDUCIDO.espera),
          Animated.timing(salida, {
            toValue: 1,
            duration: MOVIMIENTO_REDUCIDO.salida,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]);
        temporizador = setTimeout(() => setSaliendo(true), MOVIMIENTO_REDUCIDO.espera);
      } else {
        const suave = Easing.out(Easing.cubic);
        animacion = Animated.parallel([
          Animated.timing(linea, {
            toValue: 1,
            delay: T.linea.delay,
            duration: T.linea.duracion,
            easing: suave,
            useNativeDriver: true,
          }),
          Animated.timing(letras, {
            toValue: 1,
            delay: T.letras.delay,
            duration: T.letras.duracion,
            easing: suave,
            useNativeDriver: true,
          }),
          Animated.timing(textos, {
            toValue: 1,
            delay: T.textos.delay,
            duration: T.textos.duracion,
            easing: suave,
            useNativeDriver: true,
          }),
          Animated.timing(salida, {
            toValue: 1,
            delay: T.salida.delay,
            duration: T.salida.duracion,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ]);
        temporizador = setTimeout(() => setSaliendo(true), T.salida.delay);
      }

      animacion.start(({ finished }) => {
        if (finished) terminar();
      });
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then(iniciar)
      .catch(() => iniciar(false));

    return () => {
      cancelado = true;
      animacion?.stop();
      if (temporizador) clearTimeout(temporizador);
    };
  }, [linea, letras, textos, salida]);

  if (oculto) return null;

  /* ---------- Valores derivados (todos con driver nativo) ---------- */

  const letraBX = letras.interpolate({ inputRange: [0, 1], outputRange: [DESPLAZ_LETRAS, 0] });
  const letraZX = letras.interpolate({ inputRange: [0, 1], outputRange: [-DESPLAZ_LETRAS, 0] });

  const textoY = textos.interpolate({ inputRange: [0, 1], outputRange: [DESPLAZ_TEXTO, 0] });
  // Las líneas laterales crecen desde el texto hacia afuera: se compensa el escalado
  // (que ocurre desde el centro) para dejar fijo el extremo que toca la etiqueta.
  const lineaIzqX = textos.interpolate({ inputRange: [0, 1], outputRange: [ANCHO_LINEA / 2, 0] });
  const lineaDerX = textos.interpolate({ inputRange: [0, 1], outputRange: [-ANCHO_LINEA / 2, 0] });

  const opacidadSalida = salida.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const escalaSalida = salida.interpolate({
    inputRange: [0, 1],
    outputRange: reducido ? [1, 1] : [1, 1.03],
  });

  const Etiqueta = ({ texto }: { texto: string }) => (
    <Animated.View
      style={[styles.etiquetaFila, { opacity: textos, transform: [{ translateY: textoY }] }]}
    >
      <Animated.View
        style={[styles.lineaHoriz, { transform: [{ translateX: lineaIzqX }, { scaleX: textos }] }]}
      />
      <Text style={styles.etiqueta}>{texto}</Text>
      <Animated.View
        style={[styles.lineaHoriz, { transform: [{ translateX: lineaDerX }, { scaleX: textos }] }]}
      />
    </Animated.View>
  );

  return (
    <Animated.View
      // Durante la salida deja pasar los toques hacia la pantalla principal
      pointerEvents={saliendo ? 'none' : 'auto'}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.contenedor,
        { opacity: opacidadSalida, transform: [{ scale: escalaSalida }] },
      ]}
    >
      <Etiqueta texto="BARBER ZONE" />

      <View style={styles.monograma}>
        <Animated.Text
          style={[styles.letra, { opacity: letras, transform: [{ translateX: letraBX }] }]}
        >
          B
        </Animated.Text>

        <Animated.View style={[styles.divisor, { transform: [{ scaleY: linea }] }]} />

        <Animated.Text
          style={[styles.letra, { opacity: letras, transform: [{ translateX: letraZX }] }]}
        >
          Z
        </Animated.Text>
      </View>

      <Etiqueta texto="CUT, SHAVE & FADE" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 999,
    elevation: 999,
    backgroundColor: FONDO,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 44,
  },
  monograma: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  letra: {
    color: MARFIL,
    fontSize: 64,
    lineHeight: 76,
    fontWeight: '200',
    includeFontPadding: false,
  },
  divisor: {
    width: 1,
    height: 96,
    backgroundColor: MARFIL,
  },
  etiquetaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  etiqueta: {
    color: GRIS,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 5,
  },
  lineaHoriz: {
    width: ANCHO_LINEA,
    height: 1,
    backgroundColor: LINEA_FINA,
  },
});