import React, { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { BzTypography, useBzTheme } from '../constants/BzTheme';
import { useCatalogoConfig, type ProductoDB } from '../constants/CatalogoConfigContext';
import ComprobantePedidoCard from './ComprobantePedidoCard';
import type { LineaPedido, PedidoApartadoData } from './VistaAgendarCliente';
import VistaDetalleProducto, {
  IconoCategoriaProducto,
  type CategoriaId,
  type ProductoTiendaItem,
} from './VistaDetalleProducto';

/* =====================================================================
   Tipos
   ===================================================================== */

export type CategoriaVisual = {
  id: CategoriaId;
  nombre: string;
  imagen?: ImageSourcePropType;
};

type Props = {
  sucursalNombre: string;
  nombreCliente?: string;
  bolsa: LineaPedido[];
  onAgregarLinea: (prod: { id: string; nombre: string; precio: number }) => void;
  onCambiarCantidad: (id: string, delta: number) => void;
  onConfirmarApartado: () => string;
  onVerEnAgenda: () => void;
  aplicarSafeArea?: boolean;
};

/* =====================================================================
   Constantes de layout (idénticas a VistaInicioCliente)
   ===================================================================== */

const MARGEN = 20;
const GAP = 12;

/* =====================================================================
   Categorías visuales
   ===================================================================== */

const CATEGORIAS_VISUALES: CategoriaVisual[] = [
  { id: 'cremas', nombre: 'Cremas' },
  { id: 'barba', nombre: 'Barba' },
  { id: 'shampoo', nombre: 'Shampoo' },
  { id: 'ceras', nombre: 'Ceras' },
  { id: 'tonicos', nombre: 'Tónicos' },
  { id: 'accesorios', nombre: 'Equipo' },
];

function mapearCategoriaId(catTexto: string): CategoriaId {
  const c = catTexto.toLowerCase();
  if (c.includes('crema') || c.includes('pomada') || c.includes('peinado')) return 'cremas';
  if (c.includes('barba') || c.includes('aceite')) return 'barba';
  if (c.includes('shampoo') || c.includes('capilar')) return 'shampoo';
  if (c.includes('cera')) return 'ceras';
  if (c.includes('tonic') || c.includes('tónic') || c.includes('spray')) return 'tonicos';
  return 'accesorios';
}

function convertirProductoDB(p: ProductoDB): ProductoTiendaItem {
  return {
    id: p.id,
    nombre: p.nombre,
    desc: `${p.categoria} · ${p.stock} disponibles`,
    detalleLargo: `Producto disponible en sucursal ${p.sucursal}. Existencia actual: ${p.stock} unidades listas para recoger.`,
    precio: p.precio,
    categoria: mapearCategoriaId(p.categoria),
    imagen: p.imagenUrl ? { uri: p.imagenUrl } : undefined,
    ventas: 50,
    disponible: p.activo && p.stock > 0,
  };
}

/* =====================================================================
   Componente principal: VistaTiendaCliente
   ===================================================================== */

export function VistaTiendaCliente({
  sucursalNombre,
  nombreCliente = 'Cliente BarberZone',
  bolsa,
  onAgregarLinea,
  onCambiarCantidad,
  onConfirmarApartado,
  onVerEnAgenda,
  aplicarSafeArea = false,
}: Props) {
  const { colors } = useBzTheme();
  const { productos, obtenerImagenSeccion } = useCatalogoConfig();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [anchoContenedor, setAnchoContenedor] = useState(windowWidth);

  // Mismo cálculo de topSeguro que VistaInicioCliente
  const topSeguro = (aplicarSafeArea ? insets.top : 0) + 8;

  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaId | null>(null);
  const [productoDetalle, setProductoDetalle] = useState<ProductoTiendaItem | null>(null);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [folioRecienApartado, setFolioRecienApartado] = useState<string | null>(null);
  const [ticketGenerado, setTicketGenerado] = useState<PedidoApartadoData | null>(null);

  const imagenPortadaTienda = obtenerImagenSeccion('TIENDA_PORTADA');

  // Solo productos reales agregados por el dueño que estén activos
  const catalogoReal = useMemo(
    () => productos.filter((p) => p.activo).map(convertirProductoDB),
    [productos],
  );

  // Columnas adaptables: 2 en móvil, 3 o 4 en pantalla ancha de PC
  const columnas = anchoContenedor >= 900 ? 4 : anchoContenedor >= 620 ? 3 : 2;
  const anchoTarjetaGrid =
    (anchoContenedor - MARGEN * 2 - GAP * (columnas - 1)) / columnas;

  const cantidadEnBolsa = (id: string) => bolsa.find((l) => l.id === id)?.cantidad ?? 0;
  const totalArticulos = useMemo(() => bolsa.reduce((s, l) => s + l.cantidad, 0), [bolsa]);
  const totalPagar = useMemo(() => bolsa.reduce((s, l) => s + l.precio * l.cantidad, 0), [bolsa]);

  // Filas por categoría (solo muestra las categorías que ya tengan productos reales)
  const filasPorCategoria = useMemo(() => {
    return CATEGORIAS_VISUALES.map((cat) => ({
      id: cat.id,
      titulo: cat.nombre,
      items: catalogoReal.filter((p) => p.categoria === cat.id),
    })).filter((fila) => fila.items.length > 0);
  }, [catalogoReal]);

  // Lista filtrada cuando el usuario escribe en búsqueda o toca un círculo de categoría
  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return catalogoReal.filter((p) => {
      if (categoriaActiva && p.categoria !== categoriaActiva) return false;
      if (!q) return true;
      return (
        p.nombre.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q)
      );
    });
  }, [catalogoReal, busqueda, categoriaActiva]);

  const mostrandoFiltro = !!categoriaActiva || busqueda.trim().length > 0;
  const nombreCategoriaActiva =
    CATEGORIAS_VISUALES.find((c) => c.id === categoriaActiva)?.nombre ?? 'Resultados';

  const agregarVariasUnidades = (prod: ProductoTiendaItem, cantidad: number) => {
    setFolioRecienApartado(null);
    for (let i = 0; i < cantidad; i++) {
      onAgregarLinea({ id: prod.id, nombre: prod.nombre, precio: prod.precio });
    }
  };

  /* ---------- Render de tarjeta compacta (para carrusel y grid) ---------- */
  const renderTarjetaProducto = (prod: ProductoTiendaItem, estiloAncho: object) => {
    const qty = cantidadEnBolsa(prod.id);
    return (
      <Pressable
        key={prod.id}
        onPress={() => setProductoDetalle(prod)}
        accessibilityRole="button"
        accessibilityLabel={`Ver detalles de ${prod.nombre}`}
        style={({ pressed }) => [
          styles.prodCard,
          estiloAncho,
          {
            backgroundColor: colors.BzCard,
            borderColor: qty > 0 ? colors.BzText : colors.BzBorder,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
        ]}
      >
        <View style={[styles.prodVisual, { backgroundColor: colors.BzCardInner }]}>
          {prod.imagen ? (
            <Image source={prod.imagen} style={styles.prodImg} resizeMode="cover" />
          ) : (
            <IconoCategoriaProducto id={prod.categoria} color={colors.BzText} size={32} />
          )}
          {qty > 0 && (
            <View style={[styles.badgeCantidad, { backgroundColor: colors.BzText }]}>
              <Text style={{ color: colors.BzBg, fontSize: 10, fontWeight: '700' }}>{qty}</Text>
            </View>
          )}
        </View>

        <View style={styles.prodInfo}>
          <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '600' }} numberOfLines={2}>
            {prod.nombre}
          </Text>
          <Text style={{ color: colors.BzMuted, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
            {prod.desc}
          </Text>

          <View style={styles.prodBottomRow}>
            <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '700' }}>
              ${prod.precio}
            </Text>

            {qty === 0 ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  agregarVariasUnidades(prod, 1);
                }}
                hitSlop={6}
                style={[styles.btnAddMini, { backgroundColor: colors.BzText }]}
              >
                <Text style={{ color: colors.BzBg, fontSize: 15, fontWeight: '600', lineHeight: 17 }}>
                  +
                </Text>
              </Pressable>
            ) : (
              <View style={styles.stepperMini}>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    onCambiarCantidad(prod.id, -1);
                  }}
                  hitSlop={4}
                  style={[styles.stepBtn, { borderColor: colors.BzBorder }]}
                >
                  <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '600' }}>−</Text>
                </Pressable>
                <Text
                  style={{
                    color: colors.BzText,
                    fontSize: 12,
                    fontWeight: '700',
                    minWidth: 14,
                    textAlign: 'center',
                  }}
                >
                  {qty}
                </Text>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    agregarVariasUnidades(prod, 1);
                  }}
                  hitSlop={4}
                  style={[styles.stepBtn, { backgroundColor: colors.BzText, borderColor: colors.BzText }]}
                >
                  <Text style={{ color: colors.BzBg, fontSize: 13, fontWeight: '600' }}>+</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  /* ---------- Modales compartidos: Carrito + Ticket generado ---------- */
  const renderModales = () => (
    <>
      <Modal
        visible={carritoAbierto}
        transparent
        animationType="slide"
        onRequestClose={() => setCarritoAbierto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
            <View style={styles.modalTop}>
              <View>
                <Text style={[BzTypography.label, { color: colors.BzMuted }]}>TU CARRITO</Text>
                <Text style={{ color: colors.BzText, fontSize: 19, fontWeight: '600', marginTop: 2 }}>
                  Recoge en {sucursalNombre}
                </Text>
              </View>
              <Pressable onPress={() => setCarritoAbierto(false)} hitSlop={10}>
                <Text style={{ color: colors.BzMuted, fontSize: 18 }}>✕</Text>
              </Pressable>
            </View>

            {bolsa.length === 0 ? (
              <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '500' }}>
                  Tu carrito está vacío
                </Text>
                <Text style={{ color: colors.BzMuted, fontSize: 12, marginTop: 4 }}>
                  Toca "+" en cualquier producto para agregarlo.
                </Text>
              </View>
            ) : (
              <>
                <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 12, paddingVertical: 8 }}>
                  {bolsa.map((linea) => (
                    <View
                      key={linea.id}
                      style={[styles.cartRow, { backgroundColor: colors.BzCardInner, borderColor: colors.BzBorder }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '500' }}>
                          {linea.nombre}
                        </Text>
                        <Text style={{ color: colors.BzMuted, fontSize: 12, marginTop: 2 }}>
                          ${linea.precio} c/u · Subtotal ${linea.precio * linea.cantidad}
                        </Text>
                      </View>

                      <View style={styles.stepperMini}>
                        <Pressable
                          onPress={() => onCambiarCantidad(linea.id, -1)}
                          style={[styles.stepBtn, { borderColor: colors.BzBorder }]}
                        >
                          <Text style={{ color: colors.BzText, fontSize: 14 }}>−</Text>
                        </Pressable>
                        <Text
                          style={{
                            color: colors.BzText,
                            fontSize: 13,
                            fontWeight: '700',
                            minWidth: 18,
                            textAlign: 'center',
                          }}
                        >
                          {linea.cantidad}
                        </Text>
                        <Pressable
                          onPress={() => onAgregarLinea({ id: linea.id, nombre: linea.nombre, precio: linea.precio })}
                          style={[styles.stepBtn, { backgroundColor: colors.BzText, borderColor: colors.BzText }]}
                        >
                          <Text style={{ color: colors.BzBg, fontSize: 14 }}>+</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </ScrollView>

                <View style={[styles.cartTotalRow, { borderTopColor: colors.BzBorder }]}>
                  <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Total a pagar en sucursal</Text>
                  <Text style={{ color: colors.BzText, fontSize: 20, fontWeight: '700' }}>${totalPagar}</Text>
                </View>

                <Pressable
                  onPress={() => {
                    const lineasSnapshot = bolsa.map((l) => ({ ...l }));
                    const totalSnapshot = totalPagar;
                    const folio = onConfirmarApartado();
                    const ahora = new Date();
                    const horaStr = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    setFolioRecienApartado(folio);
                    setTicketGenerado({
                      folio,
                      lineas: lineasSnapshot,
                      total: totalSnapshot,
                      sucursal: sucursalNombre,
                      creadoEn: `Hoy · ${horaStr}`,
                    });
                    setCarritoAbierto(false);
                    setProductoDetalle(null);
                  }}
                  style={[styles.btnConfirmarPedido, { backgroundColor: colors.BzText }]}
                >
                  <Text style={{ color: colors.BzBg, fontSize: 14, fontWeight: '600' }}>
                    Apartar pedido ({totalArticulos} artículos)
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal con el Ticket oficial de compra/apartado */}
      <Modal
        visible={!!ticketGenerado}
        transparent
        animationType="slide"
        onRequestClose={() => setTicketGenerado(null)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
            {ticketGenerado && (
              <ComprobantePedidoCard
                pedido={ticketGenerado}
                clienteNombre={nombreCliente}
                onCerrar={() => setTicketGenerado(null)}
                textoBotonPrincipal="Listo, seguir en tienda"
                textoBotonSecundario="Ver en mi agenda"
                onSecundario={() => {
                  setTicketGenerado(null);
                  onVerEnAgenda();
                }}
              />
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );

  /* =====================================================================
     SI SE SELECCIONÓ UN PRODUCTO: RENDERIZA VistaDetalleProducto
     ===================================================================== */
  if (productoDetalle) {
    const catNombre =
      CATEGORIAS_VISUALES.find((c) => c.id === productoDetalle.categoria)?.nombre ?? 'Catálogo';
    const relacionados = catalogoReal
      .filter((p) => p.categoria === productoDetalle.categoria && p.id !== productoDetalle.id)
      .slice(0, 4);

    return (
      <>
        <VistaDetalleProducto
          key={productoDetalle.id}
          producto={productoDetalle}
          categoriaNombre={catNombre}
          sucursalNombre={sucursalNombre}
          totalArticulosCarrito={totalArticulos}
          relacionados={relacionados}
          topSeguro={topSeguro}
          onVolver={() => setProductoDetalle(null)}
          onAbrirCarrito={() => setCarritoAbierto(true)}
          onAgregarUnidades={agregarVariasUnidades}
          onSeleccionarRelacionado={(prod) => setProductoDetalle(prod)}
          renderTarjetaRelacionado={renderTarjetaProducto}
        />
        {renderModales()}
      </>
    );
  }

  /* =====================================================================
     VISTA PRINCIPAL DE TIENDA
     ===================================================================== */
  return (
    <View
      style={{ flex: 1, backgroundColor: colors.BzBg }}
      onLayout={(e) => setAnchoContenedor(e.nativeEvent.layout.width)}
    >
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: topSeguro, paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. BARRA DE BÚSQUEDA + CARRITO (mismas dimensiones que topBar de Inicio) */}
        <View style={styles.topBar}>
          <View style={[styles.searchPill, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
            <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
              <Circle cx={11} cy={11} r={7} stroke={colors.BzMuted} strokeWidth={1.8} />
              <Line
                x1={16.5}
                y1={16.5}
                x2={21}
                y2={21}
                stroke={colors.BzMuted}
                strokeWidth={1.8}
                strokeLinecap="round"
              />
            </Svg>
            <TextInput
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Buscar productos..."
              placeholderTextColor={colors.BzMuted}
              style={[styles.searchInput, { color: colors.BzText }]}
            />
            {busqueda.length > 0 && (
              <Pressable onPress={() => setBusqueda('')} hitSlop={8}>
                <Text style={{ color: colors.BzMuted, fontSize: 13, fontWeight: '600' }}>✕</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={() => setCarritoAbierto(true)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={
              totalArticulos > 0 ? `Carrito, ${totalArticulos} artículos` : 'Carrito vacío'
            }
            style={({ pressed }) => [
              styles.cartCircle,
              {
                backgroundColor: colors.BzCard,
                borderColor: colors.BzBorder,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
              <Path
                d="M6 7H18L19 20H5L6 7Z"
                stroke={colors.BzText}
                strokeWidth={1.7}
                strokeLinejoin="round"
              />
              <Path
                d="M9 7V5C9 3.34 10.34 2 12 2C13.66 2 15 3.34 15 5V7"
                stroke={colors.BzText}
                strokeWidth={1.7}
                strokeLinecap="round"
              />
            </Svg>
            {totalArticulos > 0 && (
              <View
                pointerEvents="none"
                style={[styles.cartDot, { backgroundColor: colors.BzDanger, borderColor: colors.BzBg }]}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700' }}>
                  {totalArticulos > 99 ? '99+' : String(totalArticulos)}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Portada editable por el dueño (misma altura 196 y radio 24 que el banner de Inicio) */}
        {!!imagenPortadaTienda && (
          <View style={{ paddingHorizontal: MARGEN, marginBottom: 16 }}>
            <Image
              source={{ uri: imagenPortadaTienda }}
              resizeMode="cover"
              style={{
                width: '100%',
                height: 196,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: colors.BzBorder,
              }}
            />
          </View>
        )}

        {/* Confirmación rápida si acaba de apartar un pedido */}
        {folioRecienApartado && (
          <View
            style={[
              styles.bannerApartado,
              { backgroundColor: colors.BzCard, borderColor: colors.BzSuccess },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.BzSuccess, fontSize: 12, fontWeight: '700' }}>
                Pedido #{folioRecienApartado} apartado en {sucursalNombre}
              </Text>
              <Text style={{ color: colors.BzMuted, fontSize: 11, marginTop: 2 }}>
                Ya está listo en tu sección "Productos por recoger".
              </Text>
            </View>
            <Pressable onPress={onVerEnAgenda} hitSlop={8}>
              <Text style={{ color: colors.BzText, fontSize: 12, fontWeight: '600' }}>Ver ›</Text>
            </Pressable>
          </View>
        )}

        {/* 2. CÍRCULOS DE CATEGORÍAS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.circulosRow}
        >
          <Pressable
            onPress={() => {
              setCategoriaActiva(null);
              setBusqueda('');
            }}
            accessibilityRole="button"
            accessibilityLabel="Ver todo"
            style={[
              styles.circuloItem,
              {
                backgroundColor: !mostrandoFiltro ? colors.BzText : colors.BzCard,
                borderColor: !mostrandoFiltro ? colors.BzText : colors.BzBorder,
                borderWidth: !mostrandoFiltro ? 2 : 1,
              },
            ]}
          >
            <Text
              style={{
                color: !mostrandoFiltro ? colors.BzBg : colors.BzText,
                fontSize: 12,
                fontWeight: '700',
              }}
            >
              Todo
            </Text>
          </Pressable>

          {CATEGORIAS_VISUALES.map((cat) => {
            const activo = categoriaActiva === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setCategoriaActiva((prev) => (prev === cat.id ? null : cat.id))}
                accessibilityRole="button"
                accessibilityLabel={`Ver ${cat.nombre}`}
                style={[
                  styles.circuloItem,
                  {
                    backgroundColor: activo ? colors.BzText : colors.BzCard,
                    borderColor: activo ? colors.BzText : colors.BzBorder,
                    borderWidth: activo ? 2 : 1,
                  },
                ]}
              >
                {cat.imagen ? (
                  <Image source={cat.imagen} style={styles.circuloImg} resizeMode="cover" />
                ) : (
                  <IconoCategoriaProducto
                    id={cat.id}
                    color={activo ? colors.BzBg : colors.BzText}
                    size={26}
                  />
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 3. CATÁLOGO REAL O ESTADO VACÍO */}
        {catalogoReal.length === 0 ? (
          <View style={{ paddingHorizontal: MARGEN, marginTop: 20 }}>
            <View style={[styles.vacioCard, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
              <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '600' }}>
                Aún no hay productos disponibles
              </Text>
              <Text style={{ color: colors.BzMuted, fontSize: 12, marginTop: 6, textAlign: 'center' }}>
                Pronto agregaremos nuevos productos a la tienda de {sucursalNombre}.
              </Text>
            </View>
          </View>
        ) : mostrandoFiltro ? (
          <View style={{ paddingHorizontal: MARGEN, marginTop: 8 }}>
            <View style={styles.filtroHeader}>
              <View>
                <Text style={[BzTypography.label, { color: colors.BzMuted }]}>CATÁLOGO FILTRADO</Text>
                <Text style={[BzTypography.title, { color: colors.BzText, fontSize: 20, marginTop: 2 }]}>
                  {categoriaActiva ? nombreCategoriaActiva : `Resultados para "${busqueda}"`}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setCategoriaActiva(null);
                  setBusqueda('');
                }}
                style={[styles.btnLimpiar, { borderColor: colors.BzBorder, backgroundColor: colors.BzCard }]}
              >
                <Text style={{ color: colors.BzText, fontSize: 12, fontWeight: '500' }}>Ver todo</Text>
              </Pressable>
            </View>

            {productosFiltrados.length === 0 ? (
              <View style={[styles.vacioCard, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
                <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }}>
                  No encontramos productos
                </Text>
                <Text style={{ color: colors.BzMuted, fontSize: 12, marginTop: 4 }}>
                  Prueba con otra palabra o toca el círculo "Todo".
                </Text>
              </View>
            ) : (
              <View style={styles.gridMix}>
                {productosFiltrados.map((prod) =>
                  renderTarjetaProducto(prod, { width: anchoTarjetaGrid }),
                )}
              </View>
            )}
          </View>
        ) : (
          <>
            {filasPorCategoria.map((fila) => (
              <View key={fila.id} style={{ marginTop: 18 }}>
                <View style={styles.seccionHeader}>
                  <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '600' }}>
                    {fila.titulo}
                  </Text>
                  <Pressable onPress={() => setCategoriaActiva(fila.id)} hitSlop={8}>
                    <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Ver todos ›</Text>
                  </Pressable>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: MARGEN, gap: GAP }}
                >
                  {fila.items.map((prod) =>
                    renderTarjetaProducto(prod, { width: 164 }),
                  )}
                </ScrollView>
              </View>
            ))}

            <View style={{ paddingHorizontal: MARGEN, marginTop: 24 }}>
              <Text style={[BzTypography.label, { color: colors.BzMuted }]}>CATÁLOGO COMPLETO</Text>
              <Text
                style={{
                  color: colors.BzText,
                  fontSize: 17,
                  fontWeight: '600',
                  marginTop: 2,
                  marginBottom: 12,
                }}
              >
                Todos los productos ({catalogoReal.length})
              </Text>

              <View style={styles.gridMix}>
                {catalogoReal.map((prod) =>
                  renderTarjetaProducto(prod, { width: anchoTarjetaGrid }),
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* BARRA FLOTANTE DE CARRITO SI HAY PRODUCTOS */}
      {totalArticulos > 0 && (
        <View style={[styles.floatingBarWrap, { backgroundColor: colors.BzBg, borderTopColor: colors.BzBorder }]}>
          <Pressable
            onPress={() => setCarritoAbierto(true)}
            style={[styles.floatingBarBtn, { backgroundColor: colors.BzText }]}
          >
            <Text style={{ color: colors.BzBg, fontSize: 13, fontWeight: '600' }}>
              Ver carrito ({totalArticulos})
            </Text>
            <Text style={{ color: colors.BzBg, fontSize: 14, fontWeight: '700' }}>
              ${totalPagar}
            </Text>
          </Pressable>
        </View>
      )}

      {renderModales()}
    </View>
  );
}

export default VistaTiendaCliente;

/* =====================================================================
   Estilos (homologados con VistaInicioCliente)
   ===================================================================== */

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GAP,
    paddingHorizontal: MARGEN,
    paddingTop: 4,
    paddingBottom: 14,
  },
  searchPill: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  cartCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerApartado: {
    marginHorizontal: MARGEN,
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circulosRow: {
    paddingHorizontal: MARGEN,
    gap: GAP,
    paddingVertical: 4,
  },
  circuloItem: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circuloImg: {
    width: '100%',
    height: '100%',
  },
  seccionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: MARGEN,
    marginBottom: 10,
  },
  filtroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  btnLimpiar: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  gridMix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  prodCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  prodVisual: {
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prodImg: {
    width: '100%',
    height: '100%',
  },
  badgeCantidad: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prodInfo: {
    padding: 11,
    justifyContent: 'space-between',
    flex: 1,
  },
  prodBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  btnAddMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stepBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vacioCard: {
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
  floatingBarWrap: {
    paddingHorizontal: MARGEN,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  floatingBarBtn: {
    height: 46,
    borderRadius: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  modalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  cartTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  btnConfirmarPedido: {
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});