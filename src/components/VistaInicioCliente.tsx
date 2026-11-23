import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  FlatList,
  Image,
  ImageBackground,
  Linking,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Line,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { useBzTheme } from '../constants/BzTheme';
import { useCatalogoConfig } from '../constants/CatalogoConfigContext';
import {
  ComprobanteCitaCard,
  type CitaConfirmadaData,
} from './VistaAgendarCliente';

const BannerBarberZoneImg = require('../../assets/images/primera.jpg');

/* ---------- Iconos de línea ---------- */

type NombreIcono =
  | 'caja'
  | 'mas'
  | 'bolsa'
  | 'calendario'
  | 'flecha'
  | 'instagram'
  | 'chevronDown'
  | 'chevronUp'
  | 'externo'
  | 'ajustes'
  | 'salir'
  | 'pin'
  | 'check'
  | 'ticket';

function Icono({ nombre, size = 20, color }: { nombre: NombreIcono; size?: number; color: string }) {
  const p = {
    stroke: color,
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {nombre === 'mas' && (
        <>
          <Line x1={12} y1={5} x2={12} y2={19} {...p} />
          <Line x1={5} y1={12} x2={19} y2={12} {...p} />
        </>
      )}
      {nombre === 'flecha' && (
        <>
          <Line x1={5} y1={12} x2={19} y2={12} {...p} />
          <Path d="M13 6L19 12L13 18" {...p} />
        </>
      )}
      {nombre === 'bolsa' && (
        <>
          <Path d="M6 7H18L19 20H5L6 7Z" {...p} />
          <Path d="M9 7V5C9 3.34 10.34 2 12 2C13.66 2 15 3.34 15 5V7" {...p} />
        </>
      )}
      {nombre === 'calendario' && (
        <>
          <Rect x={3} y={4} width={18} height={17} rx={2.5} {...p} />
          <Line x1={3} y1={9.5} x2={21} y2={9.5} {...p} />
          <Line x1={8} y1={2.5} x2={8} y2={5.5} {...p} />
          <Line x1={16} y1={2.5} x2={16} y2={5.5} {...p} />
        </>
      )}
      {nombre === 'caja' && (
        <>
          <Path d="M21 8L12 3L3 8V16L12 21L21 16V8Z" {...p} />
          <Path d="M3.3 8.2L12 13L20.7 8.2M12 13V21" {...p} />
        </>
      )}
      {nombre === 'instagram' && (
        <>
          <Rect x={3} y={3} width={18} height={18} rx={5} {...p} />
          <Circle cx={12} cy={12} r={4} {...p} />
          <Circle cx={17.5} cy={6.5} r={0.8} fill={color} />
        </>
      )}
      {nombre === 'chevronDown' && <Path d="M6 9L12 15L18 9" {...p} />}
      {nombre === 'chevronUp' && <Path d="M6 15L12 9L18 15" {...p} />}
      {nombre === 'externo' && (
        <>
          <Path d="M14 5H19V10" {...p} />
          <Line x1={10} y1={14} x2={19} y2={5} {...p} />
          <Path d="M19 14V18C19 19.1 18.1 20 17 20H6C4.9 20 4 19.1 4 18V7C4 5.9 4.9 5 6 5H10" {...p} />
        </>
      )}
      {nombre === 'ajustes' && (
        <>
          <Circle cx={12} cy={12} r={3} {...p} />
          <Path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
            {...p}
          />
        </>
      )}
      {nombre === 'salir' && (
        <>
          <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" {...p} />
          <Path d="M16 17l5-5-5-5" {...p} />
          <Line x1={21} y1={12} x2={9} y2={12} {...p} />
        </>
      )}
      {nombre === 'pin' && (
        <>
          <Path d="M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10z" {...p} />
          <Circle cx={12} cy={11} r={2} {...p} />
        </>
      )}
      {nombre === 'check' && <Path d="M5 13l4 4L19 7" {...p} />}
      {nombre === 'ticket' && (
        <>
          <Path
            d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6z"
            {...p}
          />
          <Line x1={12} y1={5} x2={12} y2={19} strokeDasharray="2 2" {...p} />
        </>
      )}
    </Svg>
  );
}

/* ---------- Tipos ---------- */

export type PromoItem = {
  id: string;
  titulo: string;
  descripcion: string;
  precio?: number;
  precioAnterior?: number;
  etiqueta?: string;
  imagen?: ImageSourcePropType;
};

export type ProductoItem = {
  id: string;
  nombre: string;
  precio: number;
  imagen?: ImageSourcePropType;
};

export type NoticiaItem = {
  id: string;
  etiqueta: string;
  titulo: string;
  resumen: string;
  fecha: string;
  urlInstagram?: string;
  imagen?: ImageSourcePropType;
};

export type PreguntaItem = {
  id: string;
  pregunta: string;
  respuesta: string;
};

export type SucursalItem = {
  id: string;
  nombre: string;
  direccion: string;
};

type Props = {
  carritoCount: number;
  citaConfirmada?: string | null;
  citaActiva?: CitaConfirmadaData | null;
  nombreUsuario?: string;
  sucursales?: SucursalItem[];
  sucursalActivaId?: string;
  onCambiarSucursal?: (sucursal: SucursalItem) => void;
  onIrCarrito: () => void;
  onIrAgendar: () => void;
  onIrTienda: () => void;
  onIrConfiguraciones?: () => void;
  onCerrarSesion?: () => void;
  onAgregarProducto: (producto: ProductoItem) => void;
  onVerPromo?: (promo: PromoItem) => void;
  onVerProducto?: (producto: ProductoItem) => void;
  promociones?: PromoItem[];
  productos?: ProductoItem[];
  noticias?: NoticiaItem[];
  instagramUrl?: string;
  instagramUsuario?: string;
  preguntas?: PreguntaItem[];
  aplicarSafeArea?: boolean;
  espacioInferior?: number;
};

/* ---------- Datos base ---------- */

const SUCURSALES_DEMO: SucursalItem[] = [
  { id: 'suc-1', nombre: 'Sucursal Olivete', direccion: 'Av. Olivete 240, Centro' },
  { id: 'suc-2', nombre: 'Sucursal Providencia', direccion: 'Calle Rubén Darío 1120' },
  { id: 'suc-3', nombre: 'Sucursal Tonalá', direccion: 'Av. Tonaltecas 85, Zona Centro' },
];

const NOTICIAS_DEMO: NoticiaItem[] = [
  {
    id: 'n1',
    etiqueta: 'NUEVA COLECCIÓN',
    titulo: 'Tendencias de corte Fade & Crop esta temporada',
    resumen: 'Mira los últimos trabajos de nuestro equipo en sucursal Olivete y guarda tu referencia.',
    fecha: 'Hace 2 días',
  },
  {
    id: 'n2',
    etiqueta: 'HORARIO ESPECIAL',
    titulo: 'Abrimos domingos de 10:00 a 16:00 hrs',
    resumen: 'Agenda tu lugar con anticipación desde la app para evitar filas de fin de semana.',
    fecha: 'Hace 5 días',
  },
  {
    id: 'n3',
    etiqueta: 'COMUNIDAD',
    titulo: 'Sello doble en visitas de martes y miércoles',
    resumen: 'Completa tu tarjeta de lealtad más rápido y obtén tu corte de cortesía.',
    fecha: 'Esta semana',
  },
];

const PREGUNTAS_DEMO: PreguntaItem[] = [
  {
    id: 'faq-1',
    pregunta: '¿Con cuánto tiempo puedo cancelar o reagendar mi cita?',
    respuesta:
      'Puedes modificar o cancelar tu cita sin costo hasta 2 horas antes de tu horario reservado para liberar el espacio a otro cliente.',
  },
  {
    id: 'faq-2',
    pregunta: '¿Cuál es el tiempo de tolerancia al llegar a sucursal?',
    respuesta:
      'Contamos con 10 minutos de tolerancia después de la hora agendada. Pasado ese tiempo tu turno puede reasignarse.',
  },
  {
    id: 'faq-3',
    pregunta: '¿Cómo recojo los productos que aparto en la tienda?',
    respuesta:
      'Tus productos quedan apartados en recepción de tu sucursal seleccionada y puedes pagarlos al momento de tu cita o al pasar por ellos.',
  },
  {
    id: 'faq-4',
    pregunta: '¿Qué métodos de pago aceptan en sucursal?',
    respuesta:
      'Aceptamos efectivo, tarjetas de débito/crédito (Visa, Mastercard, Amex) y transferencias bancarias.',
  },
];

/* ---------- Constantes de layout ---------- */

const INTERVALO_MS = 10000;
const MARGEN = 20;
const GAP = 12;
const ASOMA = 36;

const mxn = (n: number) => `$${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

function obtenerIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return 'BZ';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
}

/* ---------- Botón flotante del carrito ---------- */

const TAM_BURBUJA = 54;
const BORDE_BURBUJA = 12;

function BurbujaCarrito({
  cantidad,
  onPress,
  area,
  topMin,
}: {
  cantidad: number;
  onPress: () => void;
  area: { w: number; h: number };
  topMin: number;
}) {
  const { colors } = useBzTheme();

  const fondoBurbuja = colors.BzText;
  const colorBolsa = colors.BzBg;

  const pos = useRef(new Animated.ValueXY()).current;
  const flota = useRef(new Animated.Value(0)).current;
  const escala = useRef(new Animated.Value(1)).current;

  const reposo = useRef({ x: 0, y: 0 });
  const colocada = useRef(false);
  const [lista, setLista] = useState(false);
  const vigente = useRef({ area, topMin, onPress });
  vigente.current = { area, topMin, onPress };

  useEffect(() => {
    const maxX = area.w - TAM_BURBUJA - BORDE_BURBUJA;
    const maxY = area.h - TAM_BURBUJA - BORDE_BURBUJA;
    const previo = colocada.current ? reposo.current : { x: maxX, y: topMin + 14 };
    const x = Math.max(BORDE_BURBUJA, Math.min(maxX, previo.x));
    const y = Math.max(topMin, Math.min(maxY, previo.y));
    colocada.current = true;
    reposo.current = { x, y };
    pos.setValue({ x, y });
    setLista(true);
  }, [area.w, area.h, topMin, pos]);

  useEffect(() => {
    let activo = true;
    let loop: Animated.CompositeAnimation | null = null;
    AccessibilityInfo.isReduceMotionEnabled().then((reducir) => {
      if (!activo || reducir) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(flota, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(flota, {
            toValue: 0,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
    });
    return () => {
      activo = false;
      loop?.stop();
    };
  }, [flota]);

  const pegarse = (x: number, y: number, vx: number, vy: number) => {
    const { area: a, topMin: t } = vigente.current;
    const maxX = a.w - TAM_BURBUJA - BORDE_BURBUJA;
    const maxY = a.h - TAM_BURBUJA - BORDE_BURBUJA;
    const centro = x + TAM_BURBUJA / 2 + vx * 120;
    const destX = centro < a.w / 2 ? BORDE_BURBUJA : maxX;
    const destY = Math.max(t, Math.min(maxY, y + vy * 120));
    reposo.current = { x: destX, y: destY };
    Animated.spring(pos, {
      toValue: { x: destX, y: destY },
      useNativeDriver: false,
      friction: 7,
      tension: 70,
    }).start();
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pos.setOffset(reposo.current);
        pos.setValue({ x: 0, y: 0 });
        Animated.spring(escala, { toValue: 1.1, friction: 6, useNativeDriver: true }).start();
      },
      onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, g) => {
        pos.flattenOffset();
        Animated.spring(escala, { toValue: 1, friction: 6, useNativeDriver: true }).start();
        if (Math.abs(g.dx) < 6 && Math.abs(g.dy) < 6) {
          pos.setValue(reposo.current);
          vigente.current.onPress();
          return;
        }
        pegarse(reposo.current.x + g.dx, reposo.current.y + g.dy, g.vx, g.vy);
      },
      onPanResponderTerminate: () => {
        pos.flattenOffset();
        Animated.spring(escala, { toValue: 1, friction: 6, useNativeDriver: true }).start();
        Animated.spring(pos, {
          toValue: reposo.current,
          useNativeDriver: false,
        }).start();
      },
    }),
  ).current;

  const sube = flota.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });

  return (
    <Animated.View
      {...pan.panHandlers}
      accessible
      accessibilityRole="button"
      accessibilityLabel={cantidad > 0 ? `Carrito, ${cantidad} artículos` : 'Carrito vacío'}
      accessibilityHint="Arrástralo para moverlo. Tócalo para abrir el carrito."
      onAccessibilityTap={onPress}
      style={[
        styles.burbujaWrap,
        { opacity: lista ? 1 : 0, transform: pos.getTranslateTransform() },
      ]}
    >
      <Animated.View
        style={{
          width: TAM_BURBUJA,
          height: TAM_BURBUJA,
          transform: [{ translateY: sube }, { scale: escala }],
        }}
      >
        <View
          style={[
            styles.burbuja,
            {
              backgroundColor: fondoBurbuja,
              borderColor: colors.BzBorder,
              shadowColor: '#000000',
            },
          ]}
        >
          <Svg
            width={TAM_BURBUJA}
            height={TAM_BURBUJA}
            viewBox="0 0 54 54"
            style={StyleSheet.absoluteFill}
          >
            <Defs>
              <RadialGradient id="bzBurbuja" cx="35%" cy="28%" r="80%" fx="35%" fy="28%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.22} />
                <Stop offset="60%" stopColor={fondoBurbuja} stopOpacity={0} />
                <Stop offset="100%" stopColor="#000000" stopOpacity={0.25} />
              </RadialGradient>
            </Defs>
            <Circle cx={27} cy={27} r={27} fill={fondoBurbuja} />
            <Circle cx={27} cy={27} r={27} fill="url(#bzBurbuja)" />
            <Circle
              cx={27}
              cy={27}
              r={26.3}
              fill="none"
              stroke={colorBolsa}
              strokeOpacity={0.22}
              strokeWidth={1.2}
            />
            <Ellipse
              cx={19}
              cy={14}
              rx={10}
              ry={5.5}
              fill="#FFFFFF"
              fillOpacity={0.22}
              transform="rotate(-28 19 14)"
            />
            <Ellipse
              cx={37}
              cy={42}
              rx={6}
              ry={2.4}
              fill={colorBolsa}
              fillOpacity={0.14}
              transform="rotate(-28 37 42)"
            />
          </Svg>
          <Icono nombre="bolsa" size={22} color={colorBolsa} />
        </View>

        {cantidad > 0 && (
          <View
            pointerEvents="none"
            style={[styles.badge, { backgroundColor: colors.BzDanger, borderColor: colors.BzBg }]}
          >
            <Text style={styles.badgeTexto}>{cantidad > 99 ? '99+' : String(cantidad)}</Text>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
}

/* ---------- Tarjeta de promoción / categoría ---------- */

function PromoCard({
  item,
  ancho,
  onPress,
}: {
  item: PromoItem;
  ancho: number;
  onPress: () => void;
}) {
  const { colors } = useBzTheme();

  if (item.imagen) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${item.titulo}. Ver en tienda`}
        style={[
          styles.promo,
          {
            width: ancho,
            backgroundColor: colors.BzCard,
            borderColor: colors.BzBorder,
            padding: 0,
          },
        ]}
      >
        <ImageBackground
          source={item.imagen}
          resizeMode="cover"
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            justifyContent: 'flex-end',
            alignItems: 'flex-start',
          }}
        >
          <View
            style={{
              backgroundColor: 'rgba(12, 12, 12, 0.85)',
              paddingHorizontal: 18,
              paddingVertical: 11,
              borderTopRightRadius: 18,
              borderTopWidth: 1,
              borderRightWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.14)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                letterSpacing: 0.3,
              }}
            >
              {item.titulo}
            </Text>
            <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 16, fontWeight: '500' }}>
              ›
            </Text>
          </View>
        </ImageBackground>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Promoción: ${item.titulo}. Ver en tienda`}
      style={[
        styles.promo,
        {
          width: ancho,
          backgroundColor: colors.BzCard,
          borderColor: colors.BzBorder,
        },
      ]}
    >
      <View style={[styles.circuloGrande, { backgroundColor: colors.BzCardInner }]} />
      <View style={[styles.circuloChico, { borderColor: colors.BzBorder }]} />

      <View>
        <Text style={[styles.etiquetaPromo, { color: colors.BzMuted }]}>PROMOCIÓN</Text>
        <Text style={[styles.tituloPromo, { color: colors.BzText }]} numberOfLines={2}>
          {item.titulo}
        </Text>
        <Text style={[styles.descPromo, { color: colors.BzMuted }]} numberOfLines={2}>
          {item.descripcion}
        </Text>
      </View>

      <View style={styles.pieDePromo}>
        <View style={styles.precios}>
          {item.precio !== undefined && (
            <Text style={[styles.precioPromo, { color: colors.BzText }]}>{mxn(item.precio)}</Text>
          )}
          {item.precioAnterior !== undefined && (
            <Text style={[styles.precioViejo, { color: colors.BzMuted }]}>
              {mxn(item.precioAnterior)}
            </Text>
          )}
          {item.etiqueta && (
            <View style={[styles.chip, { backgroundColor: colors.BzText }]}>
              <Text style={[styles.chipTexto, { color: colors.BzBg }]}>{item.etiqueta}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.verTienda, { color: colors.BzText }]}>Ver en tienda ›</Text>
      </View>
    </Pressable>
  );
}

/* ---------- Tarjeta de producto ---------- */

function ProductoCard({
  item,
  ancho,
  onPress,
  onAgregar,
}: {
  item: ProductoItem;
  ancho: number;
  onPress: () => void;
  onAgregar: () => void;
}) {
  const { colors } = useBzTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.nombre}, ${mxn(item.precio)}`}
      style={[
        styles.producto,
        { width: ancho, backgroundColor: colors.BzCard, borderColor: colors.BzBorder },
      ]}
    >
      <View
        style={[
          styles.productoImagen,
          { backgroundColor: colors.BzCardInner, height: ancho * 0.62 },
        ]}
      >
        {item.imagen ? (
          <Image source={item.imagen} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <Icono nombre="caja" size={28} color={colors.BzMuted} />
        )}
      </View>

      <Text style={[styles.productoNombre, { color: colors.BzText }]} numberOfLines={1}>
        {item.nombre}
      </Text>

      <View style={styles.productoPie}>
        <Text style={[styles.productoPrecio, { color: colors.BzText }]}>{mxn(item.precio)}</Text>
        <Pressable
          onPress={onAgregar}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Agregar ${item.nombre} al carrito`}
          style={({ pressed }) => [
            styles.botonMas,
            { backgroundColor: colors.BzText, transform: [{ scale: pressed ? 0.9 : 1 }] },
          ]}
        >
          <Icono nombre="mas" size={16} color={colors.BzBg} />
        </Pressable>
      </View>
    </Pressable>
  );
}

/* ---------- Tarjeta de Noticia (ligada a Instagram) ---------- */

function NoticiaCard({
  item,
  ancho,
  onAbrirIg,
}: {
  item: NoticiaItem;
  ancho: number;
  onAbrirIg: () => void;
}) {
  const { colors } = useBzTheme();

  return (
    <Pressable
      onPress={onAbrirIg}
      accessibilityRole="button"
      accessibilityLabel={`Noticia: ${item.titulo}. Ver en Instagram`}
      style={({ pressed }) => [
        styles.noticiaCard,
        {
          width: ancho,
          backgroundColor: colors.BzCard,
          borderColor: colors.BzBorder,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.noticiaTop}>
        <View style={[styles.noticiaChip, { backgroundColor: colors.BzCardInner }]}>
          <Text style={[styles.noticiaEtiqueta, { color: colors.BzText }]}>{item.etiqueta}</Text>
        </View>
        <Icono nombre="instagram" size={18} color={colors.BzMuted} />
      </View>

      <Text style={[styles.noticiaTitulo, { color: colors.BzText }]} numberOfLines={2}>
        {item.titulo}
      </Text>
      <Text style={[styles.noticiaResumen, { color: colors.BzMuted }]} numberOfLines={3}>
        {item.resumen}
      </Text>

      <View style={[styles.noticiaPie, { borderTopColor: colors.BzBorder }]}>
        <Text style={{ color: colors.BzMuted, fontSize: 11 }}>{item.fecha}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ color: colors.BzText, fontSize: 12, fontWeight: '500' }}>
            Ver en Instagram
          </Text>
          <Icono nombre="externo" size={13} color={colors.BzText} />
        </View>
      </View>
    </Pressable>
  );
}

/* ---------- Pantalla ---------- */

export function VistaInicioCliente({
  carritoCount,
  citaConfirmada,
  citaActiva = null,
  nombreUsuario = 'Juan Pérez',
  sucursales = SUCURSALES_DEMO,
  sucursalActivaId,
  onCambiarSucursal,
  onIrCarrito,
  onIrAgendar,
  onIrTienda,
  onIrConfiguraciones,
  onCerrarSesion,
  onAgregarProducto,
  onVerPromo,
  onVerProducto,
  promociones,
  productos,
  noticias = NOTICIAS_DEMO,
  instagramUrl = 'https://www.instagram.com/',
  instagramUsuario = '@barberzone.mx',
  preguntas = PREGUNTAS_DEMO,
  aplicarSafeArea = false,
  espacioInferior = 36,
}: Props) {
  const { colors } = useBzTheme();
 const { obtenerImagenSeccion, productos: productosDB, slidesHero } = useCatalogoConfig();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [area, setArea] = useState<{ w: number; h: number } | null>(null);
  const [menuPerfilVisible, setMenuPerfilVisible] = useState(false);
  const [menuSucursalVisible, setMenuSucursalVisible] = useState(false);
  const [verComprobanteModal, setVerComprobanteModal] = useState(false);
  const [sucursalInternaId, setSucursalInternaId] = useState<string>(
    sucursalActivaId ?? sucursales[0]?.id ?? '',
  );
  const [preguntaAbierta, setPreguntaAbierta] = useState<string | null>(
    preguntas[0]?.id ?? null,
  );

  // Imágenes editables en tiempo real desde el panel del Dueño
  const urlHeroCliente = obtenerImagenSeccion('HERO_CLIENTE');
  const urlPromoBanner = obtenerImagenSeccion('PROMO_BANNER');
  const urlLealtadFondo = obtenerImagenSeccion('LEALTAD_FONDO');

  // Carrusel hero sincronizado con las imágenes que el dueño configure
 // 2. En listaPromos:
const listaPromos = useMemo<PromoItem[]>(() => {
  if (promociones && promociones.length > 0) return promociones;
  if (slidesHero && slidesHero.length > 0) {
    return slidesHero.map((s) => ({
      id: s.id,
      titulo: s.titulo,
      descripcion: '',
      imagen: s.imagenUrl ? { uri: s.imagenUrl } : BannerBarberZoneImg,
    }));
  }
  return [
    {
      id: 'promo-default',
      titulo: 'Explorar catálogo',
      descripcion: '',
      imagen: BannerBarberZoneImg,
    },
  ];
}, [promociones, slidesHero]);

  // Productos reales agregados por el dueño en la base de datos
  const listaProductos = useMemo<ProductoItem[]>(() => {
    if (productos && productos.length > 0) return productos;
    return productosDB
      .filter((p) => p.activo)
      .map((p) => ({
        id: p.id,
        nombre: p.nombre,
        precio: p.precio,
        imagen: p.imagenUrl ? { uri: p.imagenUrl } : undefined,
      }));
  }, [productos, productosDB]);

  const idActual = sucursalActivaId ?? sucursalInternaId;
  const sucursalActual =
    sucursales.find((s) => s.id === idActual) ?? sucursales[0] ?? {
      id: 'default',
      nombre: 'Sucursal Olivete',
      direccion: '',
    };

  const iniciales = obtenerIniciales(nombreUsuario);
  const anchoPromo = width - MARGEN - ASOMA - GAP;
  const paso = anchoPromo + GAP;
  const anchoProducto = (width - MARGEN * 2 - GAP) / 2;
  const anchoNoticia = Math.min(280, width * 0.74);

  const listaRef = useRef<FlatList<PromoItem>>(null);
  const indiceRef = useRef(0);
  const arrastrando = useRef(false);
  const [indice, setIndice] = useState(0);
  const [reinicio, setReinicio] = useState(0);

  const irA = (i: number) => {
    indiceRef.current = i;
    setIndice(i);
    listaRef.current?.scrollToOffset({ offset: i * paso, animated: true });
  };

  useEffect(() => {
    if (listaPromos.length < 2) return;
    const id = setInterval(() => {
      if (arrastrando.current) return;
      irA((indiceRef.current + 1) % listaPromos.length);
    }, INTERVALO_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listaPromos.length, reinicio, paso]);

  const alTerminarDeslizar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / paso);
    const limpio = Math.max(0, Math.min(listaPromos.length - 1, i));
    indiceRef.current = limpio;
    setIndice(limpio);
  };

  const abrirInstagram = (urlDestino?: string) => {
    const enlace = urlDestino || instagramUrl;
    Linking.openURL(enlace).catch(() => {});
  };

  const topSeguro = (aplicarSafeArea ? insets.top : 0) + 8;

  const resumenProxima = citaActiva
    ? `${citaActiva.servicio.titulo} · ${citaActiva.fechaTexto} ${citaActiva.horaTexto}`
    : citaConfirmada;

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.BzBg }}
      onLayout={(e) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: topSeguro, paddingBottom: espacioInferior }}
        showsVerticalScrollIndicator={false}
      >
        {/* 0. Barra superior: Perfil compacto a la izquierda + Selector de sucursal al centro */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => setMenuPerfilVisible(true)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Perfil de ${nombreUsuario}. Abrir opciones`}
            style={({ pressed }) => [
              styles.perfilCirculo,
              {
                borderColor: colors.BzBorder,
                backgroundColor: colors.BzCard,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Text style={[styles.perfilIniciales, { color: colors.BzText }]}>{iniciales}</Text>
          </Pressable>

          <Pressable
            onPress={() => setMenuSucursalVisible(true)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Sucursal actual: ${sucursalActual.nombre}. Toca para cambiar`}
            style={({ pressed }) => [
              styles.sucursalPill,
              {
                borderColor: colors.BzBorder,
                backgroundColor: colors.BzCard,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Icono nombre="pin" size={14} color={colors.BzText} />
            <Text
              style={[styles.sucursalTexto, { color: colors.BzText }]}
              numberOfLines={1}
            >
              {sucursalActual.nombre}
            </Text>
            <Icono nombre="chevronDown" size={14} color={colors.BzMuted} />
          </Pressable>

          <View style={styles.topBarSpacer} />
        </View>

        {/* 1. Carrusel hero superior (imágenes/GIFs editables por el dueño) */}
        <View>
          <FlatList
            ref={listaRef}
            data={listaPromos}
            keyExtractor={(p) => p.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={paso}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum
            ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
            contentContainerStyle={{ paddingLeft: MARGEN, paddingRight: ASOMA + GAP }}
            getItemLayout={(_, i) => ({ length: paso, offset: paso * i, index: i })}
            onScrollBeginDrag={() => {
              arrastrando.current = true;
            }}
            onScrollEndDrag={() => {
              arrastrando.current = false;
              setReinicio((r) => r + 1);
            }}
            onMomentumScrollEnd={alTerminarDeslizar}
            renderItem={({ item }) => (
              <PromoCard
                item={item}
                ancho={anchoPromo}
                onPress={() => (onVerPromo ? onVerPromo(item) : onIrTienda())}
              />
            )}
          />
        </View>

        {/* Indicadores de página */}
        {listaPromos.length > 1 && (
          <View style={styles.puntos} accessibilityElementsHidden>
            {listaPromos.map((p, i) => (
              <Pressable key={p.id} onPress={() => irA(i)} hitSlop={6}>
                <View
                  style={[
                    styles.punto,
                    i === indice
                      ? { width: 18, backgroundColor: colors.BzText }
                      : { width: 6, backgroundColor: colors.BzBorder },
                  ]}
                />
              </Pressable>
            ))}
          </View>
        )}

        {/* 2. Banner de acceso rápido: Agendar nueva cita */}
        <Pressable
          onPress={onIrAgendar}
          accessibilityRole="button"
          accessibilityLabel="Agendar nueva cita"
          style={({ pressed }) => [
            styles.banner,
            {
              marginHorizontal: MARGEN,
              backgroundColor: colors.BzText,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <View style={[styles.bannerIcono, { backgroundColor: colors.BzBg }]}>
            <Icono nombre="calendario" size={20} color={colors.BzText} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitulo, { color: colors.BzBg }]}>Agendar nueva cita</Text>
            <Text
              style={[styles.bannerSub, { color: colors.BzBg, opacity: 0.7 }]}
              numberOfLines={1}
            >
              {resumenProxima ? `Próxima: ${resumenProxima}` : 'Elige servicio, barbero y horario'}
            </Text>
          </View>
          <View style={[styles.bannerFlecha, { backgroundColor: colors.BzBg }]}>
            <Icono nombre="flecha" size={16} color={colors.BzText} />
          </View>
        </Pressable>

        {/* Documento / Pase de cita confirmada reflejado en Inicio */}
        {citaActiva && (
          <Pressable
            onPress={() => setVerComprobanteModal(true)}
            accessibilityRole="button"
            accessibilityLabel={`Ver pase de cita confirmada con ${citaActiva.barbero.nombre}`}
            style={({ pressed }) => [
              styles.paseInicioCard,
              {
                marginHorizontal: MARGEN,
                backgroundColor: colors.BzCard,
                borderColor: colors.BzBorder,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={[styles.paseInicioIcono, { backgroundColor: colors.BzCardInner }]}>
              <Icono nombre="ticket" size={18} color={colors.BzText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '600' }}>
                Pase de cita · #{citaActiva.folio}
              </Text>
              <Text
                style={{ color: colors.BzMuted, fontSize: 12, marginTop: 2 }}
                numberOfLines={1}
              >
                Con {citaActiva.barbero.nombre} · {citaActiva.horaTexto}
              </Text>
            </View>
            <View style={[styles.paseInicioChip, { backgroundColor: colors.BzText }]}>
              <Text style={{ color: colors.BzBg, fontSize: 11, fontWeight: '600' }}>
                Ver pase ›
              </Text>
            </View>
          </Pressable>
        )}

        {/* 3. Tienda BarberZone (solo productos reales agregados por el dueño) */}
        <View style={[styles.encabezado, { marginHorizontal: MARGEN }]}>
          <Text style={[styles.encabezadoTitulo, { color: colors.BzMuted }]}>TIENDA BARBERZONE</Text>
          <Pressable onPress={onIrTienda} hitSlop={8}>
            <Text style={{ color: colors.BzText, fontSize: 12 }}>Ver catálogo ›</Text>
          </Pressable>
        </View>

        {listaProductos.length === 0 ? (
          <View
            style={{
              marginHorizontal: MARGEN,
              padding: 20,
              borderRadius: 18,
              backgroundColor: colors.BzCard,
              borderWidth: 1,
              borderColor: colors.BzBorder,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }}>
              Catálogo en preparación
            </Text>
            <Text style={{ color: colors.BzMuted, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
              Pronto verás aquí los productos disponibles en sucursal.
            </Text>
          </View>
        ) : (
          <View style={[styles.cuadricula, { paddingHorizontal: MARGEN }]}>
            {listaProductos.slice(0, 6).map((p) => (
              <ProductoCard
                key={p.id}
                item={p}
                ancho={anchoProducto}
                onPress={() => (onVerProducto ? onVerProducto(p) : onIrTienda())}
                onAgregar={() => onAgregarProducto(p)}
              />
            ))}
          </View>
        )}

        <Pressable
          onPress={onIrTienda}
          style={({ pressed }) => [
            styles.botonSecundarioAncho,
            {
              marginHorizontal: MARGEN,
              borderColor: colors.BzBorder,
              backgroundColor: colors.BzCard,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '500' }}>
            Explorar toda la tienda
          </Text>
          <Icono nombre="flecha" size={15} color={colors.BzText} />
        </Pressable>

        {/* Banner visual editable (Lealtad / Comunidad) */}
        {!!urlLealtadFondo && (
          <View style={{ paddingHorizontal: MARGEN, marginTop: 22 }}>
            <Image
              source={{ uri: urlLealtadFondo }}
              resizeMode="cover"
              style={{
                width: '100%',
                height: 130,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.BzBorder,
              }}
            />
          </View>
        )}

        {/* 4. Noticias y Novedades ligadas a Instagram */}
        <View style={[styles.encabezado, { marginHorizontal: MARGEN }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icono nombre="instagram" size={14} color={colors.BzMuted} />
            <Text style={[styles.encabezadoTitulo, { color: colors.BzMuted }]}>
              NOTICIAS · INSTAGRAM
            </Text>
          </View>
          <Pressable onPress={() => abrirInstagram()} hitSlop={8}>
            <Text style={{ color: colors.BzText, fontSize: 12 }}>{instagramUsuario} ›</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: MARGEN, gap: GAP }}
        >
          {noticias.map((item) => (
            <NoticiaCard
              key={item.id}
              item={item}
              ancho={anchoNoticia}
              onAbrirIg={() => abrirInstagram(item.urlInstagram)}
            />
          ))}
        </ScrollView>

        {/* 5. Preguntas Frecuentes (FAQ) */}
        <View style={[styles.encabezado, { marginHorizontal: MARGEN }]}>
          <Text style={[styles.encabezadoTitulo, { color: colors.BzMuted }]}>PREGUNTAS FRECUENTES</Text>
        </View>

        <View
          style={[
            styles.faqContenedor,
            {
              marginHorizontal: MARGEN,
              backgroundColor: colors.BzCard,
              borderColor: colors.BzBorder,
            },
          ]}
        >
          {preguntas.map((faq, idx) => {
            const abierta = preguntaAbierta === faq.id;
            return (
              <View
                key={faq.id}
                style={idx > 0 ? { borderTopWidth: 1, borderTopColor: colors.BzBorder } : undefined}
              >
                <Pressable
                  onPress={() => setPreguntaAbierta(abierta ? null : faq.id)}
                  style={styles.faqCabecera}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: abierta }}
                >
                  <Text style={[styles.faqPregunta, { color: colors.BzText }]}>{faq.pregunta}</Text>
                  <Icono
                    nombre={abierta ? 'chevronUp' : 'chevronDown'}
                    size={18}
                    color={colors.BzMuted}
                  />
                </Pressable>
                {abierta && (
                  <Text style={[styles.faqRespuesta, { color: colors.BzMuted }]}>{faq.respuesta}</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* 6. Final / Pie de página */}
        <View
          style={[styles.footer, { marginHorizontal: MARGEN, borderTopColor: colors.BzBorder }]}
        >
          <Text style={[styles.footerMarca, { color: colors.BzText }]}>B|Z · BARBERZONE</Text>
          <Text style={[styles.footerDetalle, { color: colors.BzMuted }]}>
            Lun a Sáb · 10:00 – 20:00 hrs · Dom · 10:00 – 16:00 hrs
          </Text>
          <Pressable
            onPress={() => abrirInstagram()}
            style={[styles.footerIgBtn, { borderColor: colors.BzBorder }]}
          >
            <Icono nombre="instagram" size={14} color={colors.BzText} />
            <Text style={{ color: colors.BzText, fontSize: 12 }}>Síguenos en {instagramUsuario}</Text>
          </Pressable>
          <Text style={[styles.footerCopy, { color: colors.BzMuted }]}>
            © {new Date().getFullYear()} BarberZone · Todos los derechos reservados
          </Text>
        </View>
      </ScrollView>

      {/* Burbuja arrastrable: flota sobre toda la pantalla */}
      {area && (
        <BurbujaCarrito cantidad={carritoCount} onPress={onIrCarrito} area={area} topMin={topSeguro} />
      )}

      {/* Pestaña inferior (Bottom Sheet) del Perfil */}
      <Modal
        visible={menuPerfilVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuPerfilVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setMenuPerfilVisible(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.bottomSheet,
              {
                backgroundColor: colors.BzCard,
                borderColor: colors.BzBorder,
                paddingBottom: Math.max(insets.bottom, 20) + 12,
              },
            ]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.BzBorder }]} />

            <View style={styles.sheetHeader}>
              <View
                style={[
                  styles.sheetAvatar,
                  { borderColor: colors.BzBorder, backgroundColor: colors.BzBg },
                ]}
              >
                <Text style={[styles.sheetIniciales, { color: colors.BzText }]}>{iniciales}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetNombre, { color: colors.BzText }]}>{nombreUsuario}</Text>
                <Text style={[styles.sheetSub, { color: colors.BzMuted }]}>Cuenta de cliente</Text>
              </View>
            </View>

            <View style={[styles.sheetDivider, { backgroundColor: colors.BzBorder }]} />

            <Pressable
              onPress={() => {
                setMenuPerfilVisible(false);
                onIrConfiguraciones?.();
              }}
              style={({ pressed }) => [
                styles.sheetOpcion,
                { backgroundColor: pressed ? colors.BzCardInner : 'transparent' },
              ]}
            >
              <View style={[styles.sheetIconBox, { backgroundColor: colors.BzCardInner }]}>
                <Icono nombre="ajustes" size={19} color={colors.BzText} />
              </View>
              <Text style={[styles.sheetOpcionTexto, { color: colors.BzText }]}>
                Configuraciones
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setMenuPerfilVisible(false);
                onCerrarSesion?.();
              }}
              style={({ pressed }) => [
                styles.sheetOpcion,
                { backgroundColor: pressed ? colors.BzCardInner : 'transparent' },
              ]}
            >
              <View style={[styles.sheetIconBox, { backgroundColor: colors.BzCardInner }]}>
                <Icono nombre="salir" size={19} color={colors.BzDanger} />
              </View>
              <Text style={[styles.sheetOpcionTexto, { color: colors.BzDanger }]}>
                Salir del perfil
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Pestaña inferior (Bottom Sheet) para cambiar de Sucursal */}
      <Modal
        visible={menuSucursalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuSucursalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setMenuSucursalVisible(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.bottomSheet,
              {
                backgroundColor: colors.BzCard,
                borderColor: colors.BzBorder,
                paddingBottom: Math.max(insets.bottom, 20) + 12,
              },
            ]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.BzBorder }]} />

            <Text style={[styles.sheetTituloModal, { color: colors.BzText }]}>
              Seleccionar sucursal
            </Text>
            <Text style={[styles.sheetSubModal, { color: colors.BzMuted }]}>
              Elige la barbería donde deseas agendar o recoger productos
            </Text>

            <View style={[styles.sheetDivider, { backgroundColor: colors.BzBorder, marginTop: 14 }]} />

            {sucursales.map((suc) => {
              const seleccionada = suc.id === sucursalActual.id;
              return (
                <Pressable
                  key={suc.id}
                  onPress={() => {
                    setSucursalInternaId(suc.id);
                    onCambiarSucursal?.(suc);
                    setMenuSucursalVisible(false);
                  }}
                  style={({ pressed }) => [
                    styles.sheetOpcion,
                    {
                      backgroundColor: seleccionada
                        ? colors.BzCardInner
                        : pressed
                        ? colors.BzCardInner
                        : 'transparent',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.sheetIconBox,
                      {
                        backgroundColor: seleccionada ? colors.BzText : colors.BzCardInner,
                      },
                    ]}
                  >
                    <Icono
                      nombre="pin"
                      size={18}
                      color={seleccionada ? colors.BzBg : colors.BzText}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sheetOpcionTexto, { color: colors.BzText }]}>
                      {suc.nombre}
                    </Text>
                    {!!suc.direccion && (
                      <Text style={{ color: colors.BzMuted, fontSize: 12, marginTop: 2 }}>
                        {suc.direccion}
                      </Text>
                    )}
                  </View>
                  {seleccionada && <Icono nombre="check" size={18} color={colors.BzText} />}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal del comprobante oficial de cita para mostrar en recepción */}
      <Modal
        visible={verComprobanteModal && !!citaActiva}
        transparent
        animationType="slide"
        onRequestClose={() => setVerComprobanteModal(false)}
      >
        <View style={styles.modalComprobanteOverlay}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              padding: 20,
            }}
          >
            {citaActiva && (
              <ComprobanteCitaCard
                cita={citaActiva}
                onCerrar={() => setVerComprobanteModal(false)}
                textoBotonPrincipal="Cerrar pase"
              />
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

/* ---------- Estilos ---------- */

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: MARGEN,
    paddingTop: 4,
    paddingBottom: 14,
  },
  perfilCirculo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perfilIniciales: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.8,
  },
  sucursalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    maxWidth: '64%',
  },
  sucursalTexto: {
    fontSize: 13,
    fontWeight: '500',
  },
  topBarSpacer: {
    width: 40,
    height: 40,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalComprobanteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.74)',
  },
  bottomSheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 14,
  },
  sheetAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetIniciales: {
    fontSize: 15,
    fontWeight: '500',
  },
  sheetNombre: {
    fontSize: 16,
    fontWeight: '600',
  },
  sheetSub: {
    fontSize: 12,
    marginTop: 2,
  },
  sheetTituloModal: {
    fontSize: 17,
    fontWeight: '600',
  },
  sheetSubModal: {
    fontSize: 12,
    marginTop: 3,
  },
  sheetDivider: {
    height: 1,
    marginBottom: 8,
  },
  sheetOpcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  sheetIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOpcionTexto: {
    fontSize: 15,
    fontWeight: '500',
  },

  promo: {
    minHeight: 196,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  circuloGrande: {
    position: 'absolute',
    right: -50,
    bottom: -60,
    width: 190,
    height: 190,
    borderRadius: 95,
  },
  circuloChico: {
    position: 'absolute',
    right: 40,
    top: 70,
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
  },
  etiquetaPromo: {
    fontSize: 10,
    letterSpacing: 1.8,
    fontWeight: '500',
    paddingRight: 64,
  },
  tituloPromo: { fontSize: 26, fontWeight: '300', marginTop: 6, paddingRight: 24 },
  descPromo: { fontSize: 13, lineHeight: 18, marginTop: 6, paddingRight: 24 },
  pieDePromo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  precios: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  precioPromo: { fontSize: 20, fontWeight: '500', fontVariant: ['tabular-nums'] },
  precioViejo: { fontSize: 13, textDecorationLine: 'line-through' },
  chip: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  chipTexto: { fontSize: 11, fontWeight: '600' },
  verTienda: { fontSize: 12, fontWeight: '500' },

  burbujaWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 20,
    width: TAM_BURBUJA,
    height: TAM_BURBUJA,
  },
  burbuja: {
    width: TAM_BURBUJA,
    height: TAM_BURBUJA,
    borderRadius: TAM_BURBUJA / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTexto: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },

  puntos: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 14,
  },
  punto: { height: 6, borderRadius: 3 },

  banner: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bannerIcono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitulo: { fontSize: 16, fontWeight: '600' },
  bannerSub: { fontSize: 12, marginTop: 2 },
  bannerFlecha: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  paseInicioCard: {
    marginTop: 10,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paseInicioIcono: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paseInicioChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },

  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 26,
    marginBottom: 12,
  },
  encabezadoTitulo: { fontSize: 10, letterSpacing: 1.8, fontWeight: '500' },

  cuadricula: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  producto: { borderRadius: 18, borderWidth: 1, padding: 10 },
  productoImagen: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productoNombre: { fontSize: 13, fontWeight: '500', marginTop: 10 },
  productoPie: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  productoPrecio: { fontSize: 15, fontWeight: '500', fontVariant: ['tabular-nums'] },
  botonMas: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonSecundarioAncho: {
    marginTop: 12,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  noticiaCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 168,
  },
  noticiaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noticiaChip: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  noticiaEtiqueta: {
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  noticiaTitulo: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 10,
    lineHeight: 20,
  },
  noticiaResumen: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  noticiaPie: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 12,
  },

  faqContenedor: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  faqPregunta: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  faqRespuesta: {
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },

  footer: {
    marginTop: 32,
    paddingTop: 22,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  footerMarca: {
    fontSize: 12,
    letterSpacing: 2.4,
    fontWeight: '600',
  },
  footerDetalle: {
    fontSize: 11,
    textAlign: 'center',
  },
  footerIgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  footerCopy: {
    fontSize: 10,
    marginTop: 6,
  },
});

export default VistaInicioCliente;