import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { BzTypography, useBzTheme } from '../constants/BzTheme';
export type CategoriaId = 'cremas' | 'barba' | 'shampoo' | 'ceras' | 'tonicos' | 'accesorios';

export type ProductoTiendaItem = {
  id: string;
  nombre: string;
  desc: string;
  detalleLargo: string;
  precio: number;
  categoria: CategoriaId;
  ventas: number;
  disponible: boolean;
  imagen?: ImageSourcePropType;
};

/* =====================================================================
   Iconos compartidos para la vista de detalle
   ===================================================================== */

export function IconoCategoriaProducto({
  id,
  color,
  size = 28,
}: {
  id: CategoriaId;
  color: string;
  size?: number;
}) {
  const p = {
    stroke: color,
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {id === 'cremas' && (
        <>
          <Rect x={5} y={9} width={14} height={10} rx={3} {...p} />
          <Path d="M7 9V6.5C7 5.67 7.67 5 8.5 5h7c.83 0 1.5.67 1.5 1.5V9" {...p} />
          <Line x1={9} y1={14} x2={15} y2={14} {...p} />
        </>
      )}
      {id === 'barba' && (
        <>
          <Path d="M9 3h6v3l2 2v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V8l2-2V3z" {...p} />
          <Line x1={10} y1={12} x2={14} y2={12} {...p} />
        </>
      )}
      {id === 'shampoo' && (
        <>
          <Rect x={7} y={7} width={10} height={14} rx={3} {...p} />
          <Path d="M10 7V4h4v3" {...p} />
          <Path d="M12 4h3.5" {...p} />
        </>
      )}
      {id === 'ceras' && (
        <>
          <Circle cx={12} cy={13} r={7} {...p} />
          <Path d="M8 8c1.5-2 6.5-2 8 0" {...p} />
        </>
      )}
      {id === 'tonicos' && (
        <>
          <Rect x={8} y={8} width={8} height={13} rx={2.5} {...p} />
          <Path d="M10 8V5h4v3M9 4h6" {...p} />
        </>
      )}
      {id === 'accesorios' && (
        <>
          <Rect x={4} y={8} width={16} height={5} rx={1.5} {...p} />
          <Line x1={7} y1={13} x2={7} y2={18} {...p} />
          <Line x1={10.5} y1={13} x2={10.5} y2={18} {...p} />
          <Line x1={14} y1={13} x2={14} y2={18} {...p} />
          <Line x1={17.5} y1={13} x2={17.5} y2={18} {...p} />
        </>
      )}
    </Svg>
  );
}

/* =====================================================================
   Props
   ===================================================================== */

type Props = {
  producto: ProductoTiendaItem;
  categoriaNombre: string;
  sucursalNombre: string;
  totalArticulosCarrito: number;
  relacionados: ProductoTiendaItem[];
  topSeguro: number;
  onVolver: () => void;
  onAbrirCarrito: () => void;
  onAgregarUnidades: (prod: ProductoTiendaItem, cantidad: number) => void;
  onSeleccionarRelacionado: (prod: ProductoTiendaItem) => void;
  renderTarjetaRelacionado: (prod: ProductoTiendaItem, estiloAncho: object) => React.ReactNode;
};

/* =====================================================================
   Vista de Detalle de Producto
   ===================================================================== */

export function VistaDetalleProducto({
  producto,
  categoriaNombre,
  sucursalNombre,
  totalArticulosCarrito,
  relacionados,
  topSeguro,
  onVolver,
  onAbrirCarrito,
  onAgregarUnidades,
  renderTarjetaRelacionado,
}: Props) {
  const { colors } = useBzTheme();

  const [cantidad, setCantidad] = useState<number>(1);
  const [zoomAbierto, setZoomAbierto] = useState(false);
  const [avisoAgregado, setAvisoAgregado] = useState<string | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.BzBg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: topSeguro, paddingBottom: 36, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado: regresar + ruta Catálogo / Categoría + botón carrito */}
        <View style={styles.topBar}>
          <Pressable onPress={onVolver} hitSlop={8} style={styles.backBtn}>
            <View style={[styles.circleBtn, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Line x1={19} y1={12} x2={5} y2={12} stroke={colors.BzText} strokeWidth={1.7} strokeLinecap="round" />
                <Path d="M11 6L5 12L11 18" stroke={colors.BzText} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
            <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
              Catálogo / <Text style={{ color: colors.BzText, fontWeight: '500' }}>{categoriaNombre}</Text>
            </Text>
          </Pressable>

          <Pressable
            onPress={onAbrirCarrito}
            accessibilityRole="button"
            accessibilityLabel="Ver carrito"
            style={[
              styles.circleBtn,
              {
                backgroundColor: totalArticulosCarrito > 0 ? colors.BzText : colors.BzCard,
                borderColor: totalArticulosCarrito > 0 ? colors.BzText : colors.BzBorder,
              },
            ]}
          >
            <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
              <Path
                d="M6 7H18L19 20H5L6 7Z"
                stroke={totalArticulosCarrito > 0 ? colors.BzBg : colors.BzText}
                strokeWidth={1.7}
                strokeLinejoin="round"
              />
              <Path
                d="M9 7V5C9 3.34 10.34 2 12 2C13.66 2 15 3.34 15 5V7"
                stroke={totalArticulosCarrito > 0 ? colors.BzBg : colors.BzText}
                strokeWidth={1.7}
                strokeLinecap="round"
              />
            </Svg>
            {totalArticulosCarrito > 0 && (
              <View style={[styles.cartDot, { backgroundColor: colors.BzSuccess }]}>
                <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800' }}>
                  {totalArticulosCarrito}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Tarjeta grande de imagen del producto + lupa de zoom */}
        <Pressable
          onPress={() => setZoomAbierto(true)}
          accessibilityRole="button"
          accessibilityLabel="Ampliar imagen del producto"
          style={[styles.imagenBox, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}
        >
          {producto.imagen ? (
            <Image
              source={producto.imagen as ImageSourcePropType}
              style={styles.imagenReal}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.iconoHalo, { backgroundColor: colors.BzCardInner }]}>
              <IconoCategoriaProducto id={producto.categoria} color={colors.BzText} size={84} />
            </View>
          )}

          {/* Botón lupa esquina superior derecha */}
          <View style={[styles.zoomBadge, { backgroundColor: colors.BzText }]}>
            <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
              <Circle cx={11} cy={11} r={6.5} stroke={colors.BzBg} strokeWidth={2} />
              <Line x1={16} y1={16} x2={21} y2={21} stroke={colors.BzBg} strokeWidth={2} strokeLinecap="round" />
              <Line x1={11} y1={8.5} x2={11} y2={13.5} stroke={colors.BzBg} strokeWidth={1.8} strokeLinecap="round" />
              <Line x1={8.5} y1={11} x2={13.5} y2={11} stroke={colors.BzBg} strokeWidth={1.8} strokeLinecap="round" />
            </Svg>
          </View>
        </Pressable>

        {/* Ficha de información: Categoría, Nombre, Precio, Descripción y Disponible */}
        <View style={styles.infoWrap}>
          <Text style={[BzTypography.label, { color: colors.BzMuted, letterSpacing: 1.8 }]}>
            {categoriaNombre.toUpperCase()}
          </Text>

          <Text style={[styles.titulo, { color: colors.BzText }]}>
            {producto.nombre.toUpperCase()}
          </Text>

          <Text style={[styles.precio, { color: colors.BzText }]}>${producto.precio}</Text>

          <Text style={[styles.descCorta, { color: colors.BzText }]}>{producto.desc}</Text>

          <Text style={[styles.descLarga, { color: colors.BzMuted }]}>{producto.detalleLargo}</Text>

          {/* Estado Disponible */}
          <View style={styles.estadoRow}>
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: producto.disponible ? colors.BzSuccess : colors.BzDanger,
              }}
            />
            <Text
              style={{
                color: producto.disponible ? colors.BzSuccess : colors.BzDanger,
                fontSize: 12,
                fontWeight: '600',
              }}
            >
              {producto.disponible ? `Disponible en ${sucursalNombre}` : 'Agotado'}
            </Text>
          </View>

          {/* Selector de Cantidad [ - ]  1  [ + ] */}
          <View style={styles.cantidadRow}>
            <Text style={{ color: colors.BzMuted, fontSize: 13, fontWeight: '500' }}>Cantidad</Text>
            <View style={styles.stepperBox}>
              <Pressable
                onPress={() => setCantidad((c) => Math.max(1, c - 1))}
                style={[styles.stepBtn, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}
              >
                <Text style={{ color: colors.BzText, fontSize: 16, fontWeight: '600' }}>−</Text>
              </Pressable>
              <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '700', minWidth: 28, textAlign: 'center' }}>
                {cantidad}
              </Text>
              <Pressable
                onPress={() => setCantidad((c) => Math.min(20, c + 1))}
                style={[styles.stepBtn, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}
              >
                <Text style={{ color: colors.BzText, fontSize: 16, fontWeight: '600' }}>+</Text>
              </Pressable>
            </View>
          </View>

          {/* Confirmación visual al agregar */}
          {avisoAgregado && (
            <View style={[styles.avisoOkBox, { backgroundColor: colors.BzCard, borderColor: colors.BzSuccess }]}>
              <Text style={{ color: colors.BzSuccess, fontSize: 12, fontWeight: '600' }}>
                ✓ {avisoAgregado}
              </Text>
            </View>
          )}

          {/* Botones: AGREGAR AL CARRITO + IR A COMPRAR */}
          <View style={styles.botonesRow}>
            <Pressable
              onPress={() => {
                onAgregarUnidades(producto, cantidad);
                setAvisoAgregado(
                  `Agregaste ${cantidad} ${cantidad === 1 ? 'unidad' : 'unidades'} al carrito`,
                );
              }}
              style={({ pressed }) => [
                styles.btnSecundario,
                {
                  borderColor: colors.BzText,
                  backgroundColor: colors.BzCard,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={{ color: colors.BzText, fontSize: 12, fontWeight: '700', letterSpacing: 0.6 }}>
                AGREGAR AL CARRITO
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                onAgregarUnidades(producto, cantidad);
                onAbrirCarrito();
              }}
              style={({ pressed }) => [
                styles.btnPrimario,
                {
                  backgroundColor: colors.BzText,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Text style={{ color: colors.BzBg, fontSize: 12, fontWeight: '700', letterSpacing: 0.6 }}>
                IR A COMPRAR
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Productos relacionados */}
        {relacionados.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <Text style={[BzTypography.label, { color: colors.BzMuted, marginBottom: 10 }]}>
              TAMBIÉN EN {categoriaNombre.toUpperCase()}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
            >
              {relacionados.map((rel) => renderTarjetaRelacionado(rel, { width: 148 }))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Modal de Zoom de imagen */}
      <Modal
        visible={zoomAbierto}
        transparent
        animationType="fade"
        onRequestClose={() => setZoomAbierto(false)}
      >
        <Pressable style={styles.zoomModalOverlay} onPress={() => setZoomAbierto(false)}>
          <View style={[styles.zoomModalCard, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
            {producto.imagen ? (
              <Image
                source={producto.imagen as ImageSourcePropType}
                style={styles.zoomImagenFull}
                resizeMode="contain"
              />
            ) : (
              <IconoCategoriaProducto id={producto.categoria} color={colors.BzText} size={135} />
            )}
            <Text style={{ color: colors.BzText, fontSize: 16, fontWeight: '600', marginTop: 16 }}>
              {producto.nombre}
            </Text>
            <Text style={{ color: colors.BzMuted, fontSize: 12, marginTop: 4 }}>
              Toca en cualquier parte para cerrar
            </Text>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export default VistaDetalleProducto;

/* =====================================================================
   Estilos
   ===================================================================== */

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagenBox: {
    width: '100%',
    height: 270,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagenReal: {
    width: '85%',
    height: '85%',
  },
  iconoHalo: {
    width: 156,
    height: 156,
    borderRadius: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoWrap: {
    marginTop: 20,
  },
  titulo: {
    fontSize: 23,
    fontWeight: '400',
    letterSpacing: 0.6,
    marginTop: 6,
  },
  precio: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  descCorta: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 12,
  },
  descLarga: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  estadoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 14,
  },
  cantidadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 18,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avisoOkBox: {
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  botonesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  btnSecundario: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  btnPrimario: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  zoomModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  zoomModalCard: {
    width: '100%',
    borderRadius: 26,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
  },
  zoomImagenFull: {
    width: 240,
    height: 240,
  },
});