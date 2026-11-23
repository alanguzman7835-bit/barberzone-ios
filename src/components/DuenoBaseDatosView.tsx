import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useBzTheme } from '../constants/BzTheme';
import {
  useCatalogoConfig,
  type ProductoDB,
} from '../constants/CatalogoConfigContext';

type Props = {
  onNewUser?: () => void;
};

type TabBaseDatos = 'PRODUCTOS' | 'EMPLEADOS' | 'IMAGENES';

const CATEGORIAS_PRODUCTO = [
  'Cremas',
  'Barba',
  'Shampoo',
  'Ceras',
  'Tónicos',
  'Accesorios',
];

const SUCURSALES = ['Olivete', 'Centro', 'Providencia'];

const SERVICIOS_EDITABLES = [
  {
    clave: 'Corte de pelo',
    duracion: '40 min',
    precio: '$220',
    subtitulo: 'Fade, crop, clásico o tijera con lavado y peinado incluido',
  },
  {
    clave: 'Arreglo de barba',
    duracion: '30 min',
    precio: '$160',
    subtitulo: 'Perfilado a navaja, toalla caliente y aceite hidratante',
  },
  {
    clave: 'Corte + Barba',
    duracion: '60 min',
    precio: '$340',
    subtitulo: 'Servicio completo de cabello y diseño de barba con vaporizador',
  },
  {
    clave: 'Afeitado de barba',
    duracion: '35 min',
    precio: '$180',
    subtitulo: 'Ritual tradicional al ras con espuma caliente y bálsamo calmante',
  },
];

export const DuenoBaseDatosView: React.FC<Props> = ({ onNewUser }) => {
  const { colors } = useBzTheme();
  const {
    productos,
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
    vaciarProductos,
    empleados,
    actualizarEmpleado,
    subiendoImagen,
  } = useCatalogoConfig();

  const [tabActiva, setTabActiva] = useState<TabBaseDatos>('PRODUCTOS');
  const [busqueda, setBusqueda] = useState('');
  const [avisoToast, setAvisoToast] = useState<string | null>(null);

  const [modalProducto, setModalProducto] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('Cremas');
  const [nuevaSucursal, setNuevaSucursal] = useState('Olivete');
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [nuevoStock, setNuevoStock] = useState('10');
  const [nuevoStockMin, setNuevoStockMin] = useState('5');
  const [nuevaImgProd, setNuevaImgProd] = useState('');

  const mostrarAviso = (msg: string) => {
    setAvisoToast(msg);
    setTimeout(() => setAvisoToast((prev) => (prev === msg ? null : prev)), 2500);
  };

  const seleccionarImagenGaleria = async (onPicked: (uri: string) => void) => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert(
        'Permiso requerido',
        'Activa el acceso a la galería para subir imágenes o GIFs.',
      );
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      onPicked(res.assets[0].uri);
    }
  };

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q) ||
        p.sucursal.toLowerCase().includes(q),
    );
  }, [productos, busqueda]);

  const empleadosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return empleados;
    return empleados.filter(
      (e) =>
        e.nombre.toLowerCase().includes(q) ||
        e.rol.toLowerCase().includes(q) ||
        e.sucursal.toLowerCase().includes(q),
    );
  }, [empleados, busqueda]);

  const handleGuardarProducto = async () => {
    if (!nuevoNombre.trim()) {
      Alert.alert('Falta el nombre', 'Escribe el nombre del producto.');
      return;
    }
    const precioNum = Math.max(0, Number(nuevoPrecio) || 0);
    const stockNum = Math.max(0, parseInt(nuevoStock, 10) || 0);
    const minNum = Math.max(0, parseInt(nuevoStockMin, 10) || 5);

    await agregarProducto({
      nombre: nuevoNombre.trim(),
      categoria: nuevaCategoria,
      precio: precioNum,
      stock: stockNum,
      stockMinimo: minNum,
      sucursal: nuevaSucursal,
      imagenUrl:
        nuevaImgProd.trim() ||
        'https://images.unsplash.com/photo-1626808642875-0aa545482dfb?w=600',
      activo: true,
    });

    setNuevoNombre('');
    setNuevoPrecio('');
    setNuevoStock('10');
    setNuevaImgProd('');
    setModalProducto(false);
    mostrarAviso('Producto guardado y sincronizado con la tienda');
  };

  const confirmarEliminarProducto = (prod: ProductoDB) => {
    Alert.alert(
      'Eliminar producto',
      `¿Seguro que deseas eliminar "${prod.nombre}" de la base de datos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await eliminarProducto(prod.id);
            mostrarAviso('Producto eliminado');
          },
        },
      ],
    );
  };

  return (
    <View style={{ gap: 18 }}>
      {avisoToast && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastText}>✓ {avisoToast}</Text>
        </View>
      )}

      <View style={styles.topActionsRow}>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {(
            [
              ['PRODUCTOS', `Productos (${productos.length})`],
              ['EMPLEADOS', `Empleados (${empleados.length})`],
              ['IMAGENES', 'Imágenes de la App Cliente'],
            ] as [TabBaseDatos, string][]
          ).map(([key, label]) => {
            const activo = tabActiva === key;
            return (
              <Pressable
                key={key}
                onPress={() => {
                  setTabActiva(key);
                  setBusqueda('');
                }}
                style={[
                  styles.subTabPill,
                  {
                    backgroundColor: activo ? '#E2C46D' : colors.BzCard,
                    borderColor: activo ? '#E2C46D' : colors.BzBorder,
                  },
                ]}
              >
                <Text
                  style={{
                    color: activo ? '#0D0D0D' : colors.BzText,
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {tabActiva !== 'IMAGENES' && (
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextInput
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder={
                tabActiva === 'PRODUCTOS'
                  ? 'Buscar producto...'
                  : 'Buscar empleado...'
              }
              placeholderTextColor={colors.BzMuted}
              style={[
                styles.searchInput,
                {
                  backgroundColor: colors.BzCard,
                  borderColor: colors.BzBorder,
                  color: colors.BzText,
                },
              ]}
            />

            {tabActiva === 'PRODUCTOS' ? (
              <>
                <Pressable
                  onPress={() => setModalProducto(true)}
                  style={styles.primaryGoldBtn}
                >
                  <Text style={styles.primaryGoldBtnText}>+ Agregar producto</Text>
                </Pressable>

                {productos.length > 0 && (
                  <Pressable
                    onPress={() =>
                      Alert.alert(
                        'Vaciar todo el inventario',
                        '¿Seguro que deseas eliminar TODOS los productos de la base de datos? Esta acción no se puede deshacer.',
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          {
                            text: 'Sí, borrar todo',
                            style: 'destructive',
                            onPress: async () => {
                              await vaciarProductos();
                              mostrarAviso('Inventario vaciado por completo');
                            },
                          },
                        ],
                      )
                    }
                    style={[styles.deleteBtn, { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10 }]}
                  >
                    <Text style={{ color: '#F87171', fontSize: 12, fontWeight: '700' }}>
                      Vaciar stock
                    </Text>
                  </Pressable>
                )}
              </>
            ) : (
              onNewUser && (
                <Pressable onPress={onNewUser} style={styles.primaryGoldBtn}>
                  <Text style={styles.primaryGoldBtnText}>+ Nuevo empleado</Text>
                </Pressable>
              )
            )}
          </View>
        )}
      </View>

      {/* ==================== PESTAÑA 1: PRODUCTOS ==================== */}
      {tabActiva === 'PRODUCTOS' && (
        <View
          style={[
            styles.panelCard,
            { backgroundColor: colors.BzCard, borderColor: colors.BzBorder },
          ]}
        >
          <View style={styles.panelHeader}>
            <Text style={{ color: colors.BzText, fontSize: 16, fontWeight: '700' }}>
              Base de Datos · Catálogo de Productos
            </Text>
            <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
              Los cambios se reflejan en tiempo real en la Tienda del Cliente
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ minWidth: 780, width: '100%' }}>
              <View style={[styles.tableHeader, { borderBottomColor: colors.BzBorder }]}>
                <Text style={[styles.th, { width: 58, color: colors.BzMuted }]}>IMG</Text>
                <Text style={[styles.th, { flex: 1.5, color: colors.BzMuted }]}>PRODUCTO</Text>
                <Text style={[styles.th, { width: 110, color: colors.BzMuted }]}>CATEGORÍA</Text>
                <Text style={[styles.th, { width: 110, color: colors.BzMuted }]}>SUCURSAL</Text>
                <Text style={[styles.th, { width: 95, color: colors.BzMuted }]}>PRECIO</Text>
                <Text style={[styles.th, { width: 125, color: colors.BzMuted }]}>STOCK</Text>
                <Text style={[styles.th, { width: 85, color: colors.BzMuted }]}>VISIBLE</Text>
                <Text style={[styles.th, { width: 90, textAlign: 'right', color: colors.BzMuted }]}>
                  ACCIONES
                </Text>
              </View>

              {productosFiltrados.length === 0 ? (
                <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                  <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }}>
                    Aún no hay productos registrados
                  </Text>
                  <Text style={{ color: colors.BzMuted, fontSize: 12, marginTop: 4 }}>
                    Toca "+ Agregar producto" para publicar el primero en la tienda.
                  </Text>
                </View>
              ) : (
                productosFiltrados.map((prod, idx) => {
                  const stockBajo = prod.stock <= prod.stockMinimo;
                  return (
                    <View
                      key={prod.id}
                      style={[
                        styles.tableRow,
                        idx < productosFiltrados.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: colors.BzBorder,
                        },
                      ]}
                    >
                      <View style={{ width: 58 }}>
                        <Image
                          source={{ uri: prod.imagenUrl }}
                          style={styles.thumbImg}
                          resizeMode="cover"
                        />
                      </View>

                      <View style={{ flex: 1.5, paddingRight: 8 }}>
                        <Text
                          style={{ color: colors.BzText, fontSize: 13, fontWeight: '700' }}
                          numberOfLines={1}
                        >
                          {prod.nombre}
                        </Text>
                        <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                          Mínimo: {prod.stockMinimo} pz
                        </Text>
                      </View>

                      <View style={{ width: 110 }}>
                        <View style={[styles.badgePill, { borderColor: colors.BzBorder }]}>
                          <Text style={{ color: colors.BzText, fontSize: 11 }}>
                            {prod.categoria}
                          </Text>
                        </View>
                      </View>

                      <Text style={{ width: 110, color: colors.BzMuted, fontSize: 13 }}>
                        {prod.sucursal}
                      </Text>

                      <Text
                        style={{
                          width: 95,
                          color: '#E2C46D',
                          fontSize: 14,
                          fontWeight: '700',
                        }}
                      >
                        ${prod.precio}
                      </Text>

                      <View
                        style={{
                          width: 125,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Pressable
                          onPress={() =>
                            actualizarProducto(prod.id, {
                              stock: Math.max(0, prod.stock - 1),
                            })
                          }
                          style={[styles.qtyBtn, { borderColor: colors.BzBorder }]}
                        >
                          <Text style={{ color: colors.BzText, fontWeight: '700' }}>−</Text>
                        </Pressable>

                        <Text
                          style={{
                            minWidth: 28,
                            textAlign: 'center',
                            fontSize: 13,
                            fontWeight: '700',
                            color: stockBajo ? colors.BzDanger : colors.BzText,
                          }}
                        >
                          {prod.stock}
                        </Text>

                        <Pressable
                          onPress={() =>
                            actualizarProducto(prod.id, { stock: prod.stock + 1 })
                          }
                          style={[styles.qtyBtn, { borderColor: colors.BzBorder }]}
                        >
                          <Text style={{ color: colors.BzText, fontWeight: '700' }}>+</Text>
                        </Pressable>
                      </View>

                      <View style={{ width: 85 }}>
                        <Switch
                          value={prod.activo}
                          onValueChange={(val) =>
                            actualizarProducto(prod.id, { activo: val })
                          }
                          trackColor={{ false: '#333', true: '#E2C46D' }}
                          thumbColor="#FFF"
                        />
                      </View>

                      <View style={{ width: 90, alignItems: 'flex-end' }}>
                        <Pressable
                          onPress={() => confirmarEliminarProducto(prod)}
                          style={styles.deleteBtn}
                        >
                          <Text style={{ color: '#F87171', fontSize: 11, fontWeight: '700' }}>
                            Eliminar
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {/* ==================== PESTAÑA 2: EMPLEADOS ==================== */}
      {tabActiva === 'EMPLEADOS' && (
        <View
          style={[
            styles.panelCard,
            { backgroundColor: colors.BzCard, borderColor: colors.BzBorder },
          ]}
        >
          <View style={styles.panelHeader}>
            <Text style={{ color: colors.BzText, fontSize: 16, fontWeight: '700' }}>
              Base de Datos · Plantilla de Empleados
            </Text>
            <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
              Control de comisiones, sucursales y estatus operativo
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ minWidth: 740, width: '100%' }}>
              <View style={[styles.tableHeader, { borderBottomColor: colors.BzBorder }]}>
                <Text style={[styles.th, { flex: 1.4, color: colors.BzMuted }]}>NOMBRE</Text>
                <Text style={[styles.th, { width: 120, color: colors.BzMuted }]}>ROL</Text>
                <Text style={[styles.th, { width: 115, color: colors.BzMuted }]}>SUCURSAL</Text>
                <Text style={[styles.th, { width: 120, color: colors.BzMuted }]}>TELÉFONO</Text>
                <Text style={[styles.th, { width: 115, color: colors.BzMuted }]}>COMISIÓN %</Text>
                <Text style={[styles.th, { width: 90, textAlign: 'right', color: colors.BzMuted }]}>
                  ACTIVO
                </Text>
              </View>

              {empleadosFiltrados.length === 0 ? (
                <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                  <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }}>
                    Sin empleados registrados en la tabla
                  </Text>
                  <Text style={{ color: colors.BzMuted, fontSize: 12, marginTop: 4 }}>
                    Usa "+ Nuevo empleado" para dar de alta barberos, cajeros o encargados.
                  </Text>
                </View>
              ) : (
                empleadosFiltrados.map((emp, idx) => (
                  <View
                    key={emp.id}
                    style={[
                      styles.tableRow,
                      idx < empleadosFiltrados.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.BzBorder,
                      },
                    ]}
                  >
                    <View style={{ flex: 1.4 }}>
                      <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '700' }}>
                        {emp.nombre}
                      </Text>
                      <Text style={{ color: colors.BzMuted, fontSize: 11 }}>@{emp.usuario}</Text>
                    </View>

                    <View style={{ width: 120 }}>
                      <View
                        style={[
                          styles.badgePill,
                          { borderColor: '#6B5B2E', backgroundColor: '#211D12' },
                        ]}
                      >
                        <Text style={{ color: '#E2C46D', fontSize: 11, fontWeight: '700' }}>
                          {emp.rol}
                        </Text>
                      </View>
                    </View>

                    <Text style={{ width: 115, color: colors.BzText, fontSize: 13 }}>
                      {emp.sucursal}
                    </Text>

                    <Text style={{ width: 120, color: colors.BzMuted, fontSize: 13 }}>
                      {emp.telefono || '—'}
                    </Text>

                    <View
                      style={{
                        width: 115,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Pressable
                        onPress={() =>
                          actualizarEmpleado(emp.id, {
                            comisionPct: Math.max(0, emp.comisionPct - 5),
                          })
                        }
                        style={[styles.qtyBtn, { borderColor: colors.BzBorder }]}
                      >
                        <Text style={{ color: colors.BzText, fontWeight: '700' }}>−</Text>
                      </Pressable>

                      <Text
                        style={{
                          minWidth: 34,
                          textAlign: 'center',
                          color: '#E2C46D',
                          fontWeight: '700',
                          fontSize: 13,
                        }}
                      >
                        {emp.comisionPct}%
                      </Text>

                      <Pressable
                        onPress={() =>
                          actualizarEmpleado(emp.id, {
                            comisionPct: Math.min(100, emp.comisionPct + 5),
                          })
                        }
                        style={[styles.qtyBtn, { borderColor: colors.BzBorder }]}
                      >
                        <Text style={{ color: colors.BzText, fontWeight: '700' }}>+</Text>
                      </Pressable>
                    </View>

                    <View style={{ width: 90, alignItems: 'flex-end' }}>
                      <Switch
                        value={emp.activo}
                        onValueChange={(val) => actualizarEmpleado(emp.id, { activo: val })}
                        trackColor={{ false: '#333', true: '#34A853' }}
                        thumbColor="#FFF"
                      />
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {/* ==================== PESTAÑA 3: EDITOR VISUAL APP CLIENTE ==================== */}
      {tabActiva === 'IMAGENES' && <EditorVisualAppCliente />}

      {/* ==================== MODAL: AGREGAR PRODUCTO ==================== */}
      <Modal
        visible={modalProducto}
        transparent
        animationType="fade"
        onRequestClose={() => setModalProducto(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.BzCard, borderColor: colors.BzBorder },
            ]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.BzText, fontSize: 18, fontWeight: '700' }}>
                Nuevo producto en catálogo
              </Text>
              <Pressable onPress={() => setModalProducto(false)} hitSlop={8}>
                <Text style={{ color: colors.BzMuted, fontSize: 18 }}>✕</Text>
              </Pressable>
            </View>

            <Text style={[styles.labelInput, { color: colors.BzMuted }]}>NOMBRE DEL PRODUCTO</Text>
            <TextInput
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
              placeholder="Ej. Pomada mate fijación alta 100g"
              placeholderTextColor={colors.BzMuted}
              style={[
                styles.modalInput,
                { backgroundColor: colors.BzBg, borderColor: colors.BzBorder, color: colors.BzText },
              ]}
            />

            <Text style={[styles.labelInput, { color: colors.BzMuted }]}>CATEGORÍA</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {CATEGORIAS_PRODUCTO.map((cat) => {
                const act = nuevaCategoria === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setNuevaCategoria(cat)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: act ? '#E2C46D' : colors.BzBg,
                      borderWidth: 1,
                      borderColor: act ? '#E2C46D' : colors.BzBorder,
                    }}
                  >
                    <Text
                      style={{
                        color: act ? '#111' : colors.BzText,
                        fontSize: 12,
                        fontWeight: '600',
                      }}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={[styles.labelInput, { color: colors.BzMuted }]}>SUCURSAL</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {SUCURSALES.map((suc) => {
                const act = nuevaSucursal === suc;
                return (
                  <Pressable
                    key={suc}
                    onPress={() => setNuevaSucursal(suc)}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 10,
                      alignItems: 'center',
                      backgroundColor: act ? '#E2C46D' : colors.BzBg,
                      borderWidth: 1,
                      borderColor: act ? '#E2C46D' : colors.BzBorder,
                    }}
                  >
                    <Text
                      style={{
                        color: act ? '#111' : colors.BzText,
                        fontSize: 12,
                        fontWeight: '700',
                      }}
                    >
                      {suc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.labelInput, { color: colors.BzMuted }]}>PRECIO ($)</Text>
                <TextInput
                  value={nuevoPrecio}
                  onChangeText={setNuevoPrecio}
                  keyboardType="numeric"
                  placeholder="220"
                  placeholderTextColor={colors.BzMuted}
                  style={[
                    styles.modalInput,
                    { backgroundColor: colors.BzBg, borderColor: colors.BzBorder, color: colors.BzText },
                  ]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.labelInput, { color: colors.BzMuted }]}>STOCK INICIAL</Text>
                <TextInput
                  value={nuevoStock}
                  onChangeText={setNuevoStock}
                  keyboardType="numeric"
                  placeholder="10"
                  placeholderTextColor={colors.BzMuted}
                  style={[
                    styles.modalInput,
                    { backgroundColor: colors.BzBg, borderColor: colors.BzBorder, color: colors.BzText },
                  ]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.labelInput, { color: colors.BzMuted }]}>MÍNIMO</Text>
                <TextInput
                  value={nuevoStockMin}
                  onChangeText={setNuevoStockMin}
                  keyboardType="numeric"
                  placeholder="5"
                  placeholderTextColor={colors.BzMuted}
                  style={[
                    styles.modalInput,
                    { backgroundColor: colors.BzBg, borderColor: colors.BzBorder, color: colors.BzText },
                  ]}
                />
              </View>
            </View>

            <Text style={[styles.labelInput, { color: colors.BzMuted }]}>IMAGEN DEL PRODUCTO</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                value={nuevaImgProd}
                onChangeText={setNuevaImgProd}
                placeholder="URL o selecciona desde galería..."
                placeholderTextColor={colors.BzMuted}
                style={[
                  styles.modalInput,
                  {
                    flex: 1,
                    backgroundColor: colors.BzBg,
                    borderColor: colors.BzBorder,
                    color: colors.BzText,
                  },
                ]}
              />
              <Pressable
                onPress={() => seleccionarImagenGaleria((uri) => setNuevaImgProd(uri))}
                style={{
                  backgroundColor: colors.BzCardInner,
                  borderWidth: 1,
                  borderColor: colors.BzBorder,
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: colors.BzText, fontSize: 12, fontWeight: '600' }}>
                  Galería
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={handleGuardarProducto}
              disabled={subiendoImagen}
              style={[styles.primaryGoldBtn, { height: 46, marginTop: 6 }]}
            >
              <Text style={[styles.primaryGoldBtnText, { fontSize: 14 }]}>
                {subiendoImagen ? 'Subiendo y guardando...' : 'Guardar producto en Tienda'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

/* =====================================================================
   Subcomponente Visual: Maqueta Interactiva del Celular + Editor CMS
   ===================================================================== */

function EditorVisualAppCliente() {
  const {
    slidesHero,
    agregarSlideHero,
    actualizarSlideHero,
    eliminarSlideHero,
    imagenesSecciones,
    actualizarImagenSeccion,
    obtenerImagenSeccion,
    imagenesServicios,
    actualizarImagenServicio,
    productos,
    subiendoImagen,
  } = useCatalogoConfig();

  const [pantallaPreview, setPantallaPreview] = useState<'INICIO' | 'AGENDAR' | 'TIENDA'>('INICIO');
  const [slidePreviewIdx, setSlidePreviewIdx] = useState(0);

  const [titulosEdit, setTitulosEdit] = useState<Record<string, string>>({});
  const [urlsEdit, setUrlsEdit] = useState<Record<string, string>>({});

  const [creandoSlide, setCreandoSlide] = useState(false);
  const [nuevoTituloSlide, setNuevoTituloSlide] = useState('');
  const [nuevaUrlSlide, setNuevaUrlSlide] = useState('');

  const [urlsSecciones, setUrlsSecciones] = useState<Record<string, string>>({});
  const [urlsServiciosEdit, setUrlsServiciosEdit] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const notificar = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2600);
  };

  const seleccionarDeGaleria = async (onPicked: (uri: string) => void) => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert(
        'Permiso requerido',
        'Activa el acceso a la galería para subir imágenes o GIFs.',
      );
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      onPicked(res.assets[0].uri);
    }
  };

  const indiceSeguro = slidesHero.length > 0 ? slidePreviewIdx % slidesHero.length : 0;
  const slideActual = slidesHero[indiceSeguro];
  const urlTienda = obtenerImagenSeccion('TIENDA_PORTADA');
  const urlLealtad = obtenerImagenSeccion('LEALTAD_FONDO');

  return (
    <View style={{ gap: 20 }}>
      {feedback && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastText}>✓ {feedback}</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 22, alignItems: 'flex-start' }}>
        {/* COLUMNA 1: MAQUETA GRÁFICA DEL TELÉFONO DEL CLIENTE */}
        <View style={styles.phoneMockup}>
          <View style={{ alignItems: 'center', marginBottom: 10 }}>
            <View style={{ width: 90, height: 16, backgroundColor: '#1C1C1C', borderRadius: 10 }} />
          </View>

          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#161616',
              borderRadius: 12,
              padding: 3,
              marginBottom: 12,
            }}
          >
            {(
              [
                ['INICIO', 'Inicio'],
                ['AGENDAR', 'Servicios'],
                ['TIENDA', 'Tienda'],
              ] as const
            ).map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => setPantallaPreview(key)}
                style={{
                  flex: 1,
                  paddingVertical: 6,
                  borderRadius: 9,
                  backgroundColor: pantallaPreview === key ? '#E2C46D' : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: pantallaPreview === key ? '#111' : '#888',
                    fontSize: 11,
                    fontWeight: '700',
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {pantallaPreview === 'INICIO' && (
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: '#1C1C1C',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '700' }}>JP</Text>
                </View>
                <View
                  style={{
                    backgroundColor: '#1C1C1C',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: '#FFF', fontSize: 10 }}>📍 Sucursal Olivete ▾</Text>
                </View>
                <View style={{ width: 26 }} />
              </View>

              <View
                style={{
                  height: 138,
                  borderRadius: 16,
                  overflow: 'hidden',
                  backgroundColor: '#181818',
                  borderWidth: 1,
                  borderColor: '#2B2B2B',
                }}
              >
                {slideActual ? (
                  <>
                    <Image
                      source={{ uri: slideActual.imagenUrl }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        backgroundColor: 'rgba(12,12,12,0.88)',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderTopRightRadius: 12,
                      }}
                    >
                      <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '600' }}>
                        {slideActual.titulo} ›
                      </Text>
                    </View>
                  </>
                ) : (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#666', fontSize: 11 }}>Sin apartados en animación</Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5 }}>
                {slidesHero.map((s, idx) => (
                  <Pressable
                    key={s.id}
                    onPress={() => setSlidePreviewIdx(idx)}
                    style={{
                      height: 5,
                      width: idx === indiceSeguro ? 16 : 5,
                      borderRadius: 3,
                      backgroundColor: idx === indiceSeguro ? '#FFF' : '#444',
                    }}
                  />
                ))}
              </View>

              <View
                style={{
                  backgroundColor: '#F5F5F5',
                  borderRadius: 14,
                  padding: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View>
                  <Text style={{ color: '#111', fontSize: 11, fontWeight: '700' }}>
                    📅 Agendar nueva cita
                  </Text>
                  <Text style={{ color: '#555', fontSize: 9 }}>
                    Elige servicio, barbero y horario
                  </Text>
                </View>
                <Text style={{ color: '#111', fontWeight: '700' }}>→</Text>
              </View>

              <Text style={{ color: '#888', fontSize: 8, letterSpacing: 1.2, marginTop: 2 }}>
                TIENDA BARBERZONE
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(productos.length > 0
                  ? productos.slice(0, 2)
                  : [
                      { id: '1', nombre: 'Tu producto 1', precio: 220, imagenUrl: '' },
                      { id: '2', nombre: 'Tu producto 2', precio: 185, imagenUrl: '' },
                    ]
                ).map((p) => (
                  <View
                    key={p.id}
                    style={{
                      flex: 1,
                      backgroundColor: '#161616',
                      borderRadius: 12,
                      padding: 6,
                      borderWidth: 1,
                      borderColor: '#262626',
                    }}
                  >
                    <View
                      style={{
                        height: 48,
                        borderRadius: 8,
                        backgroundColor: '#222',
                        overflow: 'hidden',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {p.imagenUrl ? (
                        <Image
                          source={{ uri: p.imagenUrl }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={{ color: '#555', fontSize: 9 }}>Foto</Text>
                      )}
                    </View>
                    <Text
                      style={{ color: '#FFF', fontSize: 9, fontWeight: '600', marginTop: 4 }}
                      numberOfLines={1}
                    >
                      {p.nombre}
                    </Text>
                    <Text style={{ color: '#E2C46D', fontSize: 9, fontWeight: '700' }}>
                      ${p.precio}
                    </Text>
                  </View>
                ))}
              </View>

              {!!urlLealtad && (
                <Image
                  source={{ uri: urlLealtad }}
                  style={{ width: '100%', height: 64, borderRadius: 12, marginTop: 2 }}
                  resizeMode="cover"
                />
              )}
            </View>
          )}

          {pantallaPreview === 'AGENDAR' && (
            <View style={{ gap: 8 }}>
              <Text style={{ color: '#888', fontSize: 9, letterSpacing: 1.2 }}>
                ELIGE TU SERVICIO
              </Text>
              {SERVICIOS_EDITABLES.map((srv) => {
                const foto = imagenesServicios[srv.clave];
                return (
                  <View
                    key={srv.clave}
                    style={{
                      height: 82,
                      borderRadius: 14,
                      overflow: 'hidden',
                      backgroundColor: '#181818',
                      borderWidth: 1,
                      borderColor: '#2C2C2C',
                    }}
                  >
                    {!!foto && (
                      <Image
                        source={{ uri: foto }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    )}
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(10,10,10,0.55)',
                        padding: 10,
                        justifyContent: 'space-between',
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View
                          style={{
                            backgroundColor: 'rgba(0,0,0,0.65)',
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                            borderRadius: 8,
                          }}
                        >
                          <Text style={{ color: '#DDD', fontSize: 8 }}>🕒 {srv.duracion}</Text>
                        </View>
                        <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>
                          {srv.precio}
                        </Text>
                      </View>
                      <View>
                        <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>
                          {srv.clave}
                        </Text>
                        <Text style={{ color: '#CCC', fontSize: 8 }} numberOfLines={1}>
                          {srv.subtitulo}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {pantallaPreview === 'TIENDA' && (
            <View style={{ gap: 10 }}>
              <View
                style={{
                  backgroundColor: '#161616',
                  borderRadius: 14,
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                  borderWidth: 1,
                  borderColor: '#262626',
                }}
              >
                <Text style={{ color: '#777', fontSize: 10 }}>🔍 Buscar productos...</Text>
              </View>

              {!!urlTienda && (
                <Image
                  source={{ uri: urlTienda }}
                  style={{ width: '100%', height: 95, borderRadius: 14 }}
                  resizeMode="cover"
                />
              )}

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {['Todo', 'Cremas', 'Barba', 'Ceras'].map((c, i) => (
                  <View
                    key={c}
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 27,
                      backgroundColor: i === 0 ? '#FFF' : '#181818',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: '#2B2B2B',
                    }}
                  >
                    <Text
                      style={{
                        color: i === 0 ? '#111' : '#AAA',
                        fontSize: 9,
                        fontWeight: '700',
                      }}
                    >
                      {c}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View
            style={{
              marginTop: 14,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: '#1E1E1E',
              flexDirection: 'row',
              justifyContent: 'space-around',
            }}
          >
            <Text
              style={{
                color: pantallaPreview === 'INICIO' ? '#E2C46D' : '#666',
                fontSize: 9,
                fontWeight: '700',
              }}
            >
              Inicio
            </Text>
            <Text
              style={{
                color: pantallaPreview === 'AGENDAR' ? '#E2C46D' : '#666',
                fontSize: 9,
                fontWeight: '700',
              }}
            >
              Agendar
            </Text>
            <Text
              style={{
                color: pantallaPreview === 'TIENDA' ? '#E2C46D' : '#666',
                fontSize: 9,
                fontWeight: '700',
              }}
            >
              Tienda
            </Text>
          </View>
        </View>

        {/* COLUMNA 2: CONTROLES PARA AGREGAR/EDITAR APARTADOS DE LA ANIMACIÓN, SERVICIOS Y BANNERS */}
        <View style={{ flex: 1, minWidth: 320, gap: 18 }}>
          {/* SECCIÓN A: CARRUSEL ANIMADO PRINCIPAL */}
          <View
            style={{
              backgroundColor: '#141414',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#262626',
              padding: 18,
              gap: 14,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <View>
                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>
                  Carrusel Animado Principal ({slidesHero.length} apartados)
                </Text>
                <Text style={{ color: '#999', fontSize: 12, marginTop: 2 }}>
                  Crea todos los banners o GIFs que rotan al abrir la app del cliente.
                </Text>
              </View>

              <Pressable
                onPress={() => setCreandoSlide((v) => !v)}
                style={styles.primaryGoldBtn}
              >
                <Text style={styles.primaryGoldBtnText}>
                  {creandoSlide ? 'Cerrar' : '+ Agregar apartado'}
                </Text>
              </Pressable>
            </View>

            {creandoSlide && (
              <View
                style={{
                  backgroundColor: '#1C1C1C',
                  borderRadius: 14,
                  padding: 14,
                  gap: 10,
                  borderWidth: 1,
                  borderColor: '#E2C46D',
                }}
              >
                <Text style={{ color: '#E2C46D', fontSize: 12, fontWeight: '700' }}>
                  Nuevo apartado en la animación
                </Text>
                <TextInput
                  value={nuevoTituloSlide}
                  onChangeText={setNuevoTituloSlide}
                  placeholder="Título del botón (ej. Cortes Fade, Promo 2x1...)"
                  placeholderTextColor="#777"
                  style={{
                    backgroundColor: '#111',
                    color: '#FFF',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    height: 40,
                    borderWidth: 1,
                    borderColor: '#333',
                  }}
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    value={nuevaUrlSlide}
                    onChangeText={setNuevaUrlSlide}
                    placeholder="Pega enlace de imagen/GIF o sube de galería..."
                    placeholderTextColor="#777"
                    style={{
                      flex: 1,
                      backgroundColor: '#111',
                      color: '#FFF',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      height: 40,
                      borderWidth: 1,
                      borderColor: '#333',
                    }}
                  />
                  <Pressable
                    onPress={() => seleccionarDeGaleria((uri) => setNuevaUrlSlide(uri))}
                    style={{
                      backgroundColor: '#2A2A2A',
                      paddingHorizontal: 12,
                      borderRadius: 10,
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>
                      Galería
                    </Text>
                  </Pressable>
                </View>
                <Pressable
                  onPress={async () => {
                    await agregarSlideHero(nuevoTituloSlide, nuevaUrlSlide);
                    setNuevoTituloSlide('');
                    setNuevaUrlSlide('');
                    setCreandoSlide(false);
                    setSlidePreviewIdx(slidesHero.length);
                    notificar('Nuevo apartado agregado a la animación del cliente');
                  }}
                  style={[styles.primaryGoldBtn, { height: 40 }]}
                >
                  <Text style={styles.primaryGoldBtnText}>
                    {subiendoImagen ? 'Subiendo...' : 'Guardar en animación'}
                  </Text>
                </Pressable>
              </View>
            )}

            {slidesHero.map((slide, idx) => {
              const tituloVal = titulosEdit[slide.id] ?? slide.titulo;
              const urlVal = urlsEdit[slide.id] ?? slide.imagenUrl;
              return (
                <View
                  key={slide.id}
                  style={{
                    backgroundColor: '#1A1A1A',
                    borderRadius: 14,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: idx === indiceSeguro ? '#E2C46D' : '#2A2A2A',
                    gap: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Pressable
                      onPress={() => {
                        setPantallaPreview('INICIO');
                        setSlidePreviewIdx(idx);
                      }}
                    >
                      <Image
                        source={{ uri: urlVal }}
                        style={{
                          width: 84,
                          height: 56,
                          borderRadius: 10,
                          backgroundColor: '#111',
                        }}
                        resizeMode="cover"
                      />
                    </Pressable>
                    <View style={{ flex: 1, gap: 6 }}>
                      <TextInput
                        value={tituloVal}
                        onChangeText={(t) =>
                          setTitulosEdit((prev) => ({ ...prev, [slide.id]: t }))
                        }
                        placeholder="Texto del apartado"
                        placeholderTextColor="#777"
                        style={{
                          backgroundColor: '#111',
                          color: '#FFF',
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          height: 34,
                          fontSize: 12,
                          borderWidth: 1,
                          borderColor: '#2E2E2E',
                        }}
                      />
                      <TextInput
                        value={urlVal}
                        onChangeText={(u) =>
                          setUrlsEdit((prev) => ({ ...prev, [slide.id]: u }))
                        }
                        placeholder="URL imagen o GIF"
                        placeholderTextColor="#777"
                        style={{
                          backgroundColor: '#111',
                          color: '#AAA',
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          height: 32,
                          fontSize: 11,
                          borderWidth: 1,
                          borderColor: '#2E2E2E',
                        }}
                      />
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable
                      onPress={() =>
                        seleccionarDeGaleria(async (uri) => {
                          setUrlsEdit((prev) => ({ ...prev, [slide.id]: uri }));
                          await actualizarSlideHero(slide.id, {
                            titulo: tituloVal,
                            imagenUrl: uri,
                          });
                          setPantallaPreview('INICIO');
                          setSlidePreviewIdx(idx);
                          notificar(`Apartado #${idx + 1} actualizado`);
                        })
                      }
                      style={{
                        flex: 1,
                        backgroundColor: '#262626',
                        height: 34,
                        borderRadius: 9,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '600' }}>
                        Subir galería
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={async () => {
                        await actualizarSlideHero(slide.id, {
                          titulo: tituloVal,
                          imagenUrl: urlVal,
                        });
                        setPantallaPreview('INICIO');
                        setSlidePreviewIdx(idx);
                        notificar(`Apartado #${idx + 1} aplicado en la app`);
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: '#E2C46D',
                        height: 34,
                        borderRadius: 9,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: '#111', fontSize: 11, fontWeight: '700' }}>
                        Aplicar cambio
                      </Text>
                    </Pressable>

                    {slidesHero.length > 1 && (
                      <Pressable
                        onPress={() => eliminarSlideHero(slide.id)}
                        style={{
                          backgroundColor: '#3A1818',
                          paddingHorizontal: 12,
                          height: 34,
                          borderRadius: 9,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: '#F87171', fontSize: 11, fontWeight: '700' }}>
                          Borrar
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* SECCIÓN B: TARJETAS DE SERVICIOS (VISTA AGENDAR CITA) */}
          <View
            style={{
              backgroundColor: '#141414',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#262626',
              padding: 18,
              gap: 14,
            }}
          >
            <View>
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>
                Tarjetas de Servicios (Vista Agendar Cita)
              </Text>
              <Text style={{ color: '#999', fontSize: 12, marginTop: 2 }}>
                Agrega fotos de fondo para Corte de pelo, Arreglo de barba, Corte + Barba y Afeitado de barba.
              </Text>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
              {SERVICIOS_EDITABLES.map((srv) => {
                const urlVal =
                  urlsServiciosEdit[srv.clave] ?? imagenesServicios[srv.clave] ?? '';
                return (
                  <View
                    key={srv.clave}
                    style={{
                      flex: 1,
                      minWidth: 250,
                      backgroundColor: '#1A1A1A',
                      borderRadius: 16,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: '#2A2A2A',
                      gap: 10,
                    }}
                  >
                    <View
                      style={{
                        height: 115,
                        borderRadius: 12,
                        overflow: 'hidden',
                        backgroundColor: '#111',
                      }}
                    >
                      {!!urlVal && (
                        <Image
                          source={{ uri: urlVal }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      )}
                      <View
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(0,0,0,0.52)',
                          padding: 12,
                          justifyContent: 'space-between',
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ color: '#DDD', fontSize: 10 }}>🕒 {srv.duracion}</Text>
                          <Text style={{ color: '#E2C46D', fontSize: 13, fontWeight: '700' }}>
                            {srv.precio}
                          </Text>
                        </View>
                        <View>
                          <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '700' }}>
                            {srv.clave}
                          </Text>
                          <Text style={{ color: '#CCC', fontSize: 10 }} numberOfLines={1}>
                            {srv.subtitulo}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <TextInput
                      value={urlVal}
                      onChangeText={(txt) =>
                        setUrlsServiciosEdit((prev) => ({ ...prev, [srv.clave]: txt }))
                      }
                      placeholder="URL o sube desde galería..."
                      placeholderTextColor="#777"
                      style={{
                        backgroundColor: '#111',
                        color: '#CCC',
                        borderRadius: 10,
                        paddingHorizontal: 10,
                        height: 34,
                        fontSize: 11,
                        borderWidth: 1,
                        borderColor: '#2B2B2B',
                      }}
                    />

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Pressable
                        onPress={() =>
                          seleccionarDeGaleria(async (uri) => {
                            setUrlsServiciosEdit((prev) => ({ ...prev, [srv.clave]: uri }));
                            await actualizarImagenServicio(srv.clave, uri);
                            setPantallaPreview('AGENDAR');
                            notificar(`Imagen de "${srv.clave}" actualizada`);
                          })
                        }
                        style={{
                          flex: 1,
                          backgroundColor: '#262626',
                          height: 34,
                          borderRadius: 9,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '600' }}>
                          Galería
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={async () => {
                          await actualizarImagenServicio(srv.clave, urlVal);
                          setPantallaPreview('AGENDAR');
                          notificar(`Imagen de "${srv.clave}" aplicada`);
                        }}
                        style={{
                          flex: 1,
                          backgroundColor: '#E2C46D',
                          height: 34,
                          borderRadius: 9,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: '#111', fontSize: 11, fontWeight: '700' }}>
                          Aplicar imagen
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* SECCIÓN C: BANNERS FIJOS (TIENDA Y COMUNIDAD) */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
            {imagenesSecciones.map((sec) => {
              const valorInput = urlsSecciones[sec.clave] ?? sec.imagenUrl;
              return (
                <View
                  key={sec.clave}
                  style={{
                    flex: 1,
                    minWidth: 260,
                    backgroundColor: '#141414',
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: '#262626',
                    padding: 14,
                    gap: 10,
                  }}
                >
                  <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>
                    {sec.tituloSeccion}
                  </Text>
                  <Text style={{ color: '#888', fontSize: 11 }}>{sec.descripcion}</Text>
                  <Image
                    source={{ uri: valorInput }}
                    style={{
                      width: '100%',
                      height: 110,
                      borderRadius: 12,
                      backgroundColor: '#111',
                    }}
                    resizeMode="cover"
                  />
                  <TextInput
                    value={valorInput}
                    onChangeText={(txt) =>
                      setUrlsSecciones((prev) => ({ ...prev, [sec.clave]: txt }))
                    }
                    style={{
                      backgroundColor: '#111',
                      color: '#CCC',
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      height: 36,
                      fontSize: 11,
                      borderWidth: 1,
                      borderColor: '#2B2B2B',
                    }}
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable
                      onPress={() =>
                        seleccionarDeGaleria(async (uri) => {
                          setUrlsSecciones((prev) => ({ ...prev, [sec.clave]: uri }));
                          await actualizarImagenSeccion(sec.clave, uri);
                          setPantallaPreview(
                            sec.clave === 'TIENDA_PORTADA' ? 'TIENDA' : 'INICIO',
                          );
                          notificar('Imagen actualizada en la app del cliente');
                        })
                      }
                      style={{
                        flex: 1,
                        backgroundColor: '#262626',
                        height: 36,
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '600' }}>
                        Galería
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={async () => {
                        await actualizarImagenSeccion(sec.clave, valorInput);
                        setPantallaPreview(
                          sec.clave === 'TIENDA_PORTADA' ? 'TIENDA' : 'INICIO',
                        );
                        notificar('Imagen aplicada en la app del cliente');
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: '#E2C46D',
                        height: 36,
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: '#111', fontSize: 11, fontWeight: '700' }}>
                        Aplicar imagen
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toastBanner: {
    backgroundColor: '#17291B',
    borderWidth: 1,
    borderColor: '#34A853',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  toastText: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '700',
  },
  topActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  subTabPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  searchInput: {
    height: 38,
    minWidth: 200,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  primaryGoldBtn: {
    backgroundColor: '#E2C46D',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryGoldBtnText: {
    color: '#0D0D0D',
    fontSize: 12,
    fontWeight: '700',
  },
  panelCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    gap: 10,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 10,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  thumbImg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1E1E1E',
  },
  badgePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: '#2D1515',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#5B2222',
  },
  phoneMockup: {
    width: 320,
    backgroundColor: '#0A0A0A',
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#2A2A2A',
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  labelInput: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  modalInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
});

export default DuenoBaseDatosView;