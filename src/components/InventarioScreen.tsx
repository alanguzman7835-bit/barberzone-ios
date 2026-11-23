import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useBzTheme } from '../constants/BzTheme';
import { useCatalogoConfig } from '../constants/CatalogoConfigContext';
import { RolSesion, UsuarioBz } from '../constants/Sesion';
import {
  BotonMini,
  BotonPrimario,
  BotonSecundario,
  BzSheet,
  CampoTexto,
  Chip,
  ChipTexto,
  Divisor,
  Etiqueta,
  Fila,
  Tarjeta,
  Titulo,
} from './BzFase3Ui';

type SubVista = 'STOCK' | 'RECIBIR_QR' | 'TRASPASOS' | 'COMPRAS' | 'CONTEO_MERMAS';

interface ProductoInventario {
  id: string;
  nombre: string;
  sku: string;
  categoria: string;
  sucursal: string;
  imagenUrl: string;
  stockActual: number;
  stockMinimo: number;
  costoUnitario: number;
  precioVenta: number;
  piezasPorCaja: number;
}

interface MovimientoInventario {
  id: number;
  tipo: string;
  detalle: string;
  estado: string;
  fecha: string;
}

/**
 * Módulo de Inventario sincronizado con la Base de Datos / Tienda:
 * - Recepción/Cajero: SOLO lectura de stock, traspasos y entrada obligatoria por escaneo QR de cajas.
 * - Dueño / Encargado: Control total (escanear QR, compras manuales, reabastecimiento rápido y conteo/mermas).
 */
export const InventarioScreen: React.FC<{ usuario: UsuarioBz }> = ({ usuario }) => {
  const { colors } = useBzTheme();
  const { productos: productosDB, actualizarProducto } = useCatalogoConfig();
  const esGerencia = usuario.rol === RolSesion.DUENO || usuario.rol === RolSesion.ENCARGADO;

  const [subVista, setSubVista] = useState<SubVista>('STOCK');
  const [escanerQrAbierto, setEscanerQrAbierto] = useState(false);

  // Mapea directamente los productos reales de la Base de Datos / Tienda (0 si está vacía)
  const productos: ProductoInventario[] = useMemo(
    () =>
      productosDB.map((p, idx) => ({
        id: p.id,
        nombre: p.nombre,
        sku: `BZ-${p.categoria.slice(0, 3).toUpperCase()}-${String(idx + 1).padStart(2, '0')}`,
        categoria: p.categoria,
        sucursal: p.sucursal,
        imagenUrl: p.imagenUrl,
        stockActual: p.stock,
        stockMinimo: p.stockMinimo,
        costoUnitario: Math.round(p.precio * 0.45),
        precioVenta: p.precio,
        piezasPorCaja: 12,
      })),
    [productosDB],
  );

  const [historial, setHistorial] = useState<MovimientoInventario[]>([]);

  const agregarMov = (tipo: string, detalle: string, estado: string) =>
    setHistorial((h) => [
      { id: Math.max(0, ...h.map((m) => m.id)) + 1, tipo, detalle, estado, fecha: 'Ahora' },
      ...h,
    ]);

  /**
   * Procesa el código QR de la caja recibida y suma el stock directo en Supabase.
   */
  const procesarQrCajaRecibida = (
    codigoRaw: string,
  ):
    | { ok: true; producto: ProductoInventario; piezasSumadas: number; nuevoStock: number }
    | { ok: false; motivo: string } => {
    const limpio = codigoRaw.trim();
    if (!limpio) {
      return { ok: false, motivo: 'El código QR está vacío.' };
    }

    let skuLeido = '';
    let piezasLeidas: number | null = null;

    if (limpio.startsWith('{')) {
      try {
        const parsed = JSON.parse(limpio);
        skuLeido = String(parsed.sku ?? parsed.SKU ?? '').trim().toUpperCase();
        const cant = Number(parsed.piezas ?? parsed.cantidad ?? parsed.qty);
        if (Number.isFinite(cant) && cant > 0) piezasLeidas = Math.round(cant);
      } catch {
        return { ok: false, motivo: 'Formato QR no reconocido.' };
      }
    } else if (limpio.includes(':')) {
      const [s, c] = limpio.split(':');
      skuLeido = s.trim().toUpperCase();
      const cant = parseInt(c.trim(), 10);
      if (Number.isFinite(cant) && cant > 0) piezasLeidas = cant;
    } else if (limpio.includes('|')) {
      const [s, c] = limpio.split('|');
      skuLeido = s.trim().toUpperCase();
      const cant = parseInt(c.trim(), 10);
      if (Number.isFinite(cant) && cant > 0) piezasLeidas = cant;
    } else {
      skuLeido = limpio.toUpperCase();
    }

    const prod = productos.find(
      (p) => p.sku.toUpperCase() === skuLeido || p.nombre.toUpperCase() === skuLeido,
    );
    if (!prod) {
      return {
        ok: false,
        motivo: `El código "${skuLeido}" no corresponde a ningún producto registrado.`,
      };
    }

    const piezasSumadas = piezasLeidas ?? prod.piezasPorCaja;
    const nuevoStock = prod.stockActual + piezasSumadas;

    void actualizarProducto(prod.id, { stock: nuevoStock });

    agregarMov(
      'Entrada QR',
      `Caja QR (${prod.sku}) · +${piezasSumadas} pz ${prod.nombre} · Recibió ${usuario.nombre}`,
      'Verificado',
    );

    return { ok: true, producto: prod, piezasSumadas, nuevoStock };
  };

  const pestanas: { titulo: string; vista: SubVista }[] = esGerencia
    ? [
        { titulo: 'Stock', vista: 'STOCK' },
        { titulo: 'Recibir caja QR', vista: 'RECIBIR_QR' },
        { titulo: 'Traspasos', vista: 'TRASPASOS' },
        { titulo: 'Compras', vista: 'COMPRAS' },
        { titulo: 'Conteo / Merma', vista: 'CONTEO_MERMAS' },
      ]
    : [
        { titulo: 'Stock', vista: 'STOCK' },
        { titulo: 'Recibir caja QR', vista: 'RECIBIR_QR' },
        { titulo: 'Traspasos', vista: 'TRASPASOS' },
      ];

  return (
    <View style={{ flex: 1 }}>
      {/* Pestañas superiores estilo cápsula */}
      <View style={{ flexGrow: 0 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8, gap: 8 }}
        >
          {pestanas.map((p) => {
            const activo = subVista === p.vista;
            return (
              <Pressable
                key={p.vista}
                onPress={() => setSubVista(p.vista)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 9,
                  borderRadius: 999,
                  backgroundColor: activo ? '#F3F4F6' : colors.BzCard,
                  borderWidth: 1,
                  borderColor: activo ? '#F3F4F6' : colors.BzBorder,
                }}
              >
                <Text
                  style={{
                    color: activo ? '#0D0D0D' : colors.BzMuted,
                    fontSize: 12.5,
                    fontWeight: activo ? '700' : '600',
                  }}
                >
                  {p.titulo}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {subVista === 'STOCK' && (
        <VistaStockGeneral
          usuario={usuario}
          esGerencia={esGerencia}
          productos={productos}
          onAbrirEscanerQr={() => setEscanerQrAbierto(true)}
          onReabastecerRapido={(item) => {
            if (!esGerencia) return;
            void actualizarProducto(item.id, { stock: item.stockActual + 5 });
            agregarMov('Ajuste rápido', `+5 pz ${item.nombre} (${usuario.nombre})`, 'Aplicado');
          }}
          onIrCompras={() => {
            if (esGerencia) setSubVista('COMPRAS');
          }}
        />
      )}

      {subVista === 'RECIBIR_QR' && (
        <VistaRecepcionQrMercancia
          usuario={usuario}
          productos={productos}
          movimientos={historial}
          onAbrirEscaner={() => setEscanerQrAbierto(true)}
        />
      )}

      {subVista === 'TRASPASOS' && (
        <VistaTraspasos
          usuario={usuario}
          productos={productos}
          movimientos={historial}
          onRegistrar={(prod, destino, cant) => {
            const actual = productos.find((p) => p.id === prod.id);
            if (actual && actual.stockActual >= cant) {
              void actualizarProducto(prod.id, { stock: actual.stockActual - cant });
              agregarMov('Traspaso', `${usuario.sucursal} → ${destino} · ${cant} ${prod.nombre}`, 'En tránsito');
            }
          }}
        />
      )}

      {esGerencia && subVista === 'COMPRAS' && (
        <VistaCompras
          productos={productos}
          movimientos={historial}
          onConfirmar={(prod, proveedor, cant) => {
            void actualizarProducto(prod.id, { stock: prod.stockActual + cant });
            agregarMov(
              'Compra',
              `${proveedor} · +${cant} ${prod.nombre} ($${prod.costoUnitario * cant})`,
              'Recibida',
            );
          }}
        />
      )}

      {esGerencia && subVista === 'CONTEO_MERMAS' && (
        <VistaConteoYMermas
          productos={productos}
          movimientos={historial}
          onAplicarAjuste={(prod, nuevoStock, motivo) => {
            const diff = nuevoStock - prod.stockActual;
            const signo = diff >= 0 ? `+${diff}` : `${diff}`;
            void actualizarProducto(prod.id, { stock: nuevoStock });
            agregarMov('Ajuste / Merma', `${prod.nombre} (${signo} pz) · ${motivo}`, 'Aplicado');
          }}
        />
      )}

      {/* Modal Escáner QR para entrada de cajas de mercancía */}
      <BzSheet visible={escanerQrAbierto} onDismiss={() => setEscanerQrAbierto(false)}>
        <EscanerQrCajaSheet
          productos={productos}
          onProcesarQr={procesarQrCajaRecibida}
          onCerrar={() => setEscanerQrAbierto(false)}
        />
      </BzSheet>
    </View>
  );
};

/* ---------- Vista Existencias (Sincronizada con las fotos de la Tienda) ---------- */

const VistaStockGeneral: React.FC<{
  usuario: UsuarioBz;
  esGerencia: boolean;
  productos: ProductoInventario[];
  onAbrirEscanerQr: () => void;
  onReabastecerRapido: (p: ProductoInventario) => void;
  onIrCompras: () => void;
}> = ({ esGerencia, productos, onAbrirEscanerQr, onReabastecerRapido, onIrCompras }) => {
  const { colors } = useBzTheme();
  const [filtro, setFiltro] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');

  const bajos = productos.filter((p) => p.stockActual <= p.stockMinimo);
  const valorInventario = productos.reduce((a, p) => a + p.stockActual * p.costoUnitario, 0);

  const lista = useMemo(() => {
    const porCategoria =
      filtro === 'Stock bajo'
        ? bajos
        : filtro === 'Venta'
        ? productos.filter((p) => p.precioVenta > 0)
        : filtro === 'Insumos'
        ? productos.filter((p) => p.precioVenta === 0)
        : productos;

    const q = busqueda.trim().toLowerCase();
    if (!q) return porCategoria;
    return porCategoria.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q) ||
        p.sucursal.toLowerCase().includes(q),
    );
  }, [productos, bajos, filtro, busqueda]);

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, gap: 14, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Encabezado: Inventario + botones QR de caja y + Compra */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View>
          <Text style={{ color: colors.BzText, fontSize: 24, fontWeight: '800' }}>
            Inventario
          </Text>
          <Text style={{ color: colors.BzMuted, fontSize: 12.5, marginTop: 2 }}>
            {productos.length} {productos.length === 1 ? 'artículo' : 'artículos'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={onAbrirEscanerQr}
            style={{
              height: 40,
              paddingHorizontal: 14,
              borderRadius: 11,
              backgroundColor: colors.BzCard,
              borderWidth: 1,
              borderColor: colors.BzBorder,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.BzText, fontSize: 12.5, fontWeight: '700' }}>
              QR de caja
            </Text>
          </Pressable>

          {esGerencia && (
            <Pressable
              onPress={onIrCompras}
              style={{
                height: 40,
                paddingHorizontal: 15,
                borderRadius: 11,
                backgroundColor: '#E2C46D',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#141416', fontSize: 12.5, fontWeight: '800' }}>
                + Compra
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* 2 Tarjetas métricas superiores */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.BzCard,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.BzBorder,
            padding: 16,
            gap: 6,
          }}
        >
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
            {esGerencia ? 'Valor en costo' : 'Piezas totales'}
          </Text>
          <Text style={{ color: colors.BzText, fontSize: 24, fontWeight: '800' }}>
            {esGerencia
              ? `$${valorInventario.toLocaleString('en-US')}`
              : `${productos.reduce((a, p) => a + p.stockActual, 0)} pz`}
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            backgroundColor: colors.BzCard,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.BzBorder,
            padding: 16,
            gap: 6,
          }}
        >
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Stock bajo</Text>
          <Text
            style={{
              color: bajos.length > 0 ? '#E2C46D' : colors.BzSuccess,
              fontSize: 24,
              fontWeight: '800',
            }}
          >
            {bajos.length} {bajos.length === 1 ? 'artículo' : 'artículos'}
          </Text>
        </View>
      </View>

      {/* Fila de filtros en cápsula + Buscador */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        {['Todos', 'Stock bajo', 'Venta', 'Insumos'].map((f) => {
          const activo = filtro === f;
          return (
            <Pressable
              key={f}
              onPress={() => setFiltro(f)}
              style={{
                height: 36,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: activo ? '#221E14' : colors.BzCard,
                borderWidth: 1,
                borderColor: activo ? '#E2C46D' : colors.BzBorder,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: activo ? '#E2C46D' : colors.BzMuted,
                  fontSize: 12,
                  fontWeight: activo ? '700' : '600',
                }}
              >
                {f}
              </Text>
            </Pressable>
          );
        })}

        <TextInput
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar producto"
          placeholderTextColor={colors.BzMuted}
          style={{
            flex: 1,
            minWidth: 170,
            height: 36,
            borderRadius: 999,
            backgroundColor: colors.BzCard,
            borderWidth: 1,
            borderColor: colors.BzBorder,
            paddingHorizontal: 14,
            color: colors.BzText,
            fontSize: 12.5,
          }}
        />
      </View>

      {/* Grid de productos con la misma foto de la Tienda */}
      {lista.length === 0 ? (
        <Tarjeta padding={24} radius={14} gap={6}>
          <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '700' }}>
            {productos.length === 0
              ? 'El inventario está vacío (0 artículos)'
              : 'Sin artículos encontrados'}
          </Text>
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
            {productos.length === 0
              ? 'Agrega tus productos en Reportes → Base de datos y App Cliente para verlos aquí con su foto y stock sincronizados.'
              : 'Prueba con otro filtro o limpia la búsqueda.'}
          </Text>
        </Tarjeta>
      ) : (
        <View style={styles.gridProductos}>
          {lista.map((prod) => {
            const esBajo = prod.stockActual <= prod.stockMinimo;
            const etiquetaSecundaria = prod.precioVenta > 0 ? prod.categoria : 'Uso interno';

            return (
              <View
                key={prod.id}
                style={[
                  styles.cardProducto,
                  {
                    backgroundColor: colors.BzCard,
                    borderColor: esBajo ? '#4D4123' : colors.BzBorder,
                  },
                ]}
              >
                {/* Misma foto del producto que en la Tienda */}
                <View
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 12,
                    backgroundColor: colors.BzBg,
                    borderWidth: 1,
                    borderColor: colors.BzBorder,
                    overflow: 'hidden',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {prod.imagenUrl ? (
                    <Image
                      source={{ uri: prod.imagenUrl }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        borderWidth: 1.5,
                        borderColor: colors.BzMuted,
                      }}
                    />
                  )}
                </View>

                {/* Info central: Nombre + Chip categoría + Precio */}
                <View style={{ flex: 1, gap: 6, paddingRight: 6 }}>
                  <Text
                    style={{ color: colors.BzText, fontSize: 14, fontWeight: '700' }}
                    numberOfLines={1}
                  >
                    {prod.nombre}
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View
                      style={{
                        paddingHorizontal: 9,
                        paddingVertical: 3,
                        borderRadius: 999,
                        backgroundColor: colors.BzBg,
                        borderWidth: 1,
                        borderColor: colors.BzBorder,
                      }}
                    >
                      <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                        {etiquetaSecundaria}
                      </Text>
                    </View>

                    {prod.precioVenta > 0 && (
                      <Text style={{ color: colors.BzText, fontSize: 12, fontWeight: '700' }}>
                        ${prod.precioVenta}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Columna derecha: Stock + Mínimo + Botón +5 rápido */}
                <View style={{ alignItems: 'flex-end', justifyContent: 'center', gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 3.5,
                        backgroundColor: esBajo ? '#E2C46D' : colors.BzSuccess,
                      }}
                    />
                    <Text
                      style={{
                        color: esBajo ? '#E2C46D' : colors.BzText,
                        fontSize: 18,
                        fontWeight: '800',
                      }}
                    >
                      {prod.stockActual} pz
                    </Text>
                  </View>

                  {esBajo && (
                    <Text style={{ color: colors.BzMuted, fontSize: 10.5 }}>
                      mín. {prod.stockMinimo}
                    </Text>
                  )}

                  {esGerencia && esBajo && (
                    <Pressable
                      onPress={() => onReabastecerRapido(prod)}
                      style={({ pressed }) => [
                        {
                          marginTop: 2,
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 8,
                          backgroundColor: colors.BzBg,
                          borderWidth: 1,
                          borderColor: colors.BzBorder,
                        },
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <Text style={{ color: colors.BzText, fontSize: 11, fontWeight: '700' }}>
                        +5 rápido
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

/* ---------- Vista Recepción de Mercancía por QR ---------- */

const VistaRecepcionQrMercancia: React.FC<{
  usuario: UsuarioBz;
  productos: ProductoInventario[];
  movimientos: MovimientoInventario[];
  onAbrirEscaner: () => void;
}> = ({ usuario, productos, movimientos, onAbrirEscaner }) => {
  const { colors } = useBzTheme();
  const entradasQr = movimientos.filter((m) => m.tipo === 'Entrada QR');

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8, gap: 12, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Titulo texto="Recepción de cajas por QR" />
      <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
        Escanea el código QR impreso en cada caja que llegue a {usuario.sucursal} para sumar sus piezas al inventario.
      </Text>

      <BotonPrimario
        texto="📷 Escanear QR de caja recibida"
        height={50}
        onPress={onAbrirEscaner}
      />

      <Tarjeta padding={14} radius={14} gap={8}>
        <Etiqueta texto="CÓDIGOS SKU DE REFERENCIA" />
        <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
          Cada caja trae su código QR con formato SKU:PIEZAS (ejemplo: BZ-CRE-01:12).
        </Text>
        <Divisor />
        {productos.length === 0 ? (
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
            No hay productos registrados en el catálogo.
          </Text>
        ) : (
          productos.map((p) => (
            <Fila key={p.id}>
              <Text style={{ color: colors.BzText, fontSize: 12, flex: 1 }}>
                {p.nombre}
              </Text>
              <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                {p.sku} · Caja {p.piezasPorCaja} pz · Disp: {p.stockActual}
              </Text>
            </Fila>
          ))
        )}
      </Tarjeta>

      <Etiqueta texto={`ENTRADAS POR QR REGISTRADAS (${entradasQr.length})`} />
      <ListaMovimientos lista={entradasQr} />
    </ScrollView>
  );
};

/* ---------- Sheet Cámara Escáner QR de Cajas ---------- */

const EscanerQrCajaSheet: React.FC<{
  productos: ProductoInventario[];
  onProcesarQr: (
    codigo: string,
  ) =>
    | { ok: true; producto: ProductoInventario; piezasSumadas: number; nuevoStock: number }
    | { ok: false; motivo: string };
  onCerrar: () => void;
}> = ({ productos, onProcesarQr, onCerrar }) => {
  const { colors } = useBzTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [errorQr, setErrorQr] = useState<string | null>(null);
  const [ultimaCajaConfirmada, setUltimaCajaConfirmada] = useState<{
    producto: ProductoInventario;
    piezasSumadas: number;
    nuevoStock: number;
  } | null>(null);
  const [codigoPrueba, setCodigoPrueba] = useState('');
  const [mostrarPrueba, setMostrarPrueba] = useState(false);
  const bloqueoRef = useRef(false);

  const validarCodigo = (raw: string) => {
    const res = onProcesarQr(raw);
    if (!res.ok) {
      setErrorQr(res.motivo);
      setTimeout(() => {
        bloqueoRef.current = false;
      }, 1400);
      return;
    }
    setErrorQr(null);
    setUltimaCajaConfirmada({
      producto: res.producto,
      piezasSumadas: res.piezasSumadas,
      nuevoStock: res.nuevoStock,
    });
  };

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (bloqueoRef.current || ultimaCajaConfirmada) return;
    const raw = (result?.data ?? '').trim();
    if (!raw) return;
    bloqueoRef.current = true;
    validarCodigo(raw);
  };

  if (ultimaCajaConfirmada) {
    return (
      <>
        <View style={{ alignItems: 'center', gap: 10, paddingVertical: 8 }}>
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: colors.BzBg,
              borderWidth: 1.5,
              borderColor: colors.BzSuccess,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.BzSuccess, fontSize: 26 }}>✓</Text>
          </View>
          <Titulo texto="Caja registrada en inventario" size={20} />
          <Text style={{ color: colors.BzMuted, fontSize: 12, textAlign: 'center' }}>
            Se sumaron +{ultimaCajaConfirmada.piezasSumadas} piezas de {ultimaCajaConfirmada.producto.nombre}.
          </Text>
        </View>

        <Tarjeta fondo="bg" padding={14} radius={12} gap={8}>
          <Fila>
            <Text style={{ color: colors.BzMuted, fontSize: 12 }}>SKU</Text>
            <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '600' }}>
              {ultimaCajaConfirmada.producto.sku}
            </Text>
          </Fila>
          <Divisor />
          <Fila>
            <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Piezas ingresadas</Text>
            <Text style={{ color: colors.BzSuccess, fontSize: 14, fontWeight: '700' }}>
              +{ultimaCajaConfirmada.piezasSumadas} pz
            </Text>
          </Fila>
          <Divisor />
          <Fila>
            <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Stock total disponible</Text>
            <Text style={{ color: colors.BzText, fontSize: 16, fontWeight: '700' }}>
              {ultimaCajaConfirmada.nuevoStock} pz
            </Text>
          </Fila>
        </Tarjeta>

        <BotonPrimario
          texto="Escanear otra caja"
          height={46}
          onPress={() => {
            bloqueoRef.current = false;
            setUltimaCajaConfirmada(null);
            setErrorQr(null);
          }}
        />
        <BotonSecundario texto="Terminar y cerrar" height={44} onPress={onCerrar} />
      </>
    );
  }

  const permisoOtorgado = Boolean(permission?.granted);

  return (
    <>
      <Fila>
        <Titulo texto="Escanear QR de caja" size={20} />
        <Text style={{ color: colors.BzMuted, fontSize: 11 }}>Entrada mercancía</Text>
      </Fila>

      {Platform.OS !== 'web' && permisoOtorgado ? (
        <View
          style={[
            styles.camaraWrapper,
            { borderColor: errorQr ? colors.BzDanger : colors.BzText },
          ]}
        >
          <CameraView
            style={styles.capaCompleta}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'code128', 'code39', 'ean13'],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          />
          <View style={styles.overlayMira}>
            <View style={styles.cuadroQrMira}>
              <View style={[styles.laserLinea, { backgroundColor: colors.BzSuccess }]} />
            </View>
            <View style={styles.etiquetaCamaraPill}>
              <Text style={styles.etiquetaCamaraTxt}>
                Apunta al código QR de la caja
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.visorEscaner,
            { backgroundColor: colors.BzBg, borderColor: errorQr ? colors.BzDanger : colors.BzBorder },
          ]}
        >
          <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
            {Platform.OS === 'web'
              ? 'Cámara disponible en app móvil'
              : 'Permiso de cámara requerido'}
          </Text>
          <Text style={{ color: colors.BzMuted, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
            Activa la cámara para leer el código QR de las cajas recibidas.
          </Text>
          {Platform.OS !== 'web' && (
            <View style={{ width: '100%', marginTop: 12 }}>
              <BotonPrimario
                texto="Activar cámara ahora"
                height={44}
                onPress={() => requestPermission()}
              />
            </View>
          )}
        </View>
      )}

      {errorQr && (
        <View
          style={{
            padding: 10,
            borderRadius: 10,
            backgroundColor: colors.BzBg,
            borderWidth: 1,
            borderColor: colors.BzDanger,
          }}
        >
          <Text style={{ color: colors.BzDanger, fontSize: 12, fontWeight: '500' }}>
            ⚠ {errorQr}
          </Text>
        </View>
      )}

      <Pressable
        onPress={() => setMostrarPrueba((v) => !v)}
        style={{ alignItems: 'center', paddingVertical: 4 }}
      >
        <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
          {mostrarPrueba ? 'Ocultar lectura alternativa ▲' : '¿Etiqueta QR dañada? Seleccionar SKU ▼'}
        </Text>
      </Pressable>

      {mostrarPrueba && (
        <View style={{ gap: 8 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {productos.map((p) => (
              <ChipTexto
                key={p.id}
                texto={`${p.sku}:${p.piezasPorCaja}`}
                size={11}
                padH={10}
                padV={6}
                activo={codigoPrueba === `${p.sku}:${p.piezasPorCaja}`}
                onPress={() => {
                  setCodigoPrueba(`${p.sku}:${p.piezasPorCaja}`);
                  setErrorQr(null);
                }}
              />
            ))}
          </ScrollView>
          <TextInput
            value={codigoPrueba}
            onChangeText={(t) => {
              setCodigoPrueba(t);
              setErrorQr(null);
            }}
            placeholder="Ej. BZ-CRE-01:12"
            placeholderTextColor={colors.BzMuted}
            autoCapitalize="characters"
            style={[
              styles.inputCodigo,
              {
                color: colors.BzText,
                backgroundColor: colors.BzBg,
                borderColor: colors.BzBorder,
              },
            ]}
          />
          <BotonPrimario
            texto="Registrar entrada de caja"
            height={44}
            disabled={!codigoPrueba.trim()}
            onPress={() => validarCodigo(codigoPrueba)}
          />
        </View>
      )}

      <BotonSecundario texto="Cancelar" height={44} onPress={onCerrar} />
    </>
  );
};

/* ---------- Auxiliares ---------- */

const ListaMovimientos: React.FC<{ lista: MovimientoInventario[] }> = ({ lista }) => {
  const { colors } = useBzTheme();
  return (
    <Tarjeta padding={12}>
      {lista.length === 0 ? (
        <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Sin movimientos registrados aún.</Text>
      ) : (
        lista.map((mov, idx) => (
          <View key={mov.id} style={{ gap: 8 }}>
            {idx > 0 && <Divisor />}
            <Fila>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ color: colors.BzText, fontSize: 12 }}>{mov.detalle}</Text>
                <Text style={{ color: colors.BzMuted, fontSize: 10 }}>{mov.fecha}</Text>
              </View>
              <View
                style={{
                  borderRadius: 12,
                  backgroundColor: colors.BzBg,
                  borderWidth: 1,
                  borderColor: colors.BzBorder,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                <Text style={{ color: mov.estado === 'En tránsito' ? colors.BzWarning : colors.BzSuccess, fontSize: 10 }}>
                  {mov.estado}
                </Text>
              </View>
            </Fila>
          </View>
        ))
      )}
    </Tarjeta>
  );
};

const Stepper: React.FC<{ valor: number; onMenos: () => void; onMas: () => void }> = ({ valor, onMenos, onMas }) => {
  const { colors } = useBzTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <BotonMini texto="-" onPress={onMenos} />
      <Text style={{ color: colors.BzText, fontSize: 16, fontWeight: '600' }}>{valor}</Text>
      <BotonMini texto="+" onPress={onMas} />
    </View>
  );
};

const ChipsProducto: React.FC<{
  productos: ProductoInventario[];
  selIdx: number;
  onSel: (i: number) => void;
  sub: (p: ProductoInventario) => string;
}> = ({ productos, selIdx, onSel, sub }) => {
  const { colors } = useBzTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {productos.map((p, idx) => {
        const activo = idx === selIdx;
        return (
          <Chip key={p.id} activo={activo} onPress={() => onSel(idx)} radius={12} padH={12} padV={8}>
            {(fg) => (
              <View>
                <Text style={{ color: fg, fontSize: 12, fontWeight: '500' }}>{p.nombre}</Text>
                <Text style={{ color: activo ? colors.BzBg : colors.BzMuted, opacity: activo ? 0.8 : 1, fontSize: 10 }}>
                  {sub(p)}
                </Text>
              </View>
            )}
          </Chip>
        );
      })}
    </ScrollView>
  );
};

const MensajeOk: React.FC<{ texto: string | null }> = ({ texto }) => {
  const { colors } = useBzTheme();
  return texto ? <Text style={{ color: colors.BzSuccess, fontSize: 12 }}>{texto}</Text> : null;
};

/* ---------- Vista 19: Traspasos ---------- */

const VistaTraspasos: React.FC<{
  usuario: UsuarioBz;
  productos: ProductoInventario[];
  movimientos: MovimientoInventario[];
  onRegistrar: (p: ProductoInventario, destino: string, cant: number) => void;
}> = ({ usuario, productos, movimientos, onRegistrar }) => {
  const { colors } = useBzTheme();
  const destinos = ['Centro', 'Providencia', 'Zapopan'].filter((s) => s !== usuario.sucursal);
  const [destinoSel, setDestinoSel] = useState(destinos[0] ?? 'Centro');
  const [idx, setIdx] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const [mensaje, setMensaje] = useState<string | null>(null);

  if (productos.length === 0) {
    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}>
        <Tarjeta padding={18} radius={14}>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>
            Agrega productos en Base de datos para poder realizar traspasos.
          </Text>
        </Tarjeta>
      </ScrollView>
    );
  }

  const prod = productos[idx] ?? productos[0];
  const valido = prod.stockActual >= cantidad && cantidad > 0;

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8, gap: 12 }}>
      <Titulo texto="Traspasos entre sucursales" />
      <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Origen: Sucursal {usuario.sucursal}</Text>

      <Etiqueta texto="1. SUCURSAL DESTINO" />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {destinos.map((s) => (
          <ChipTexto key={s} texto={s} padH={14} padV={7} activo={destinoSel === s} onPress={() => setDestinoSel(s)} />
        ))}
      </View>

      <Etiqueta texto="2. ARTÍCULO A ENVIAR" />
      <ChipsProducto
        productos={productos}
        selIdx={idx}
        onSel={(i) => {
          setIdx(i);
          setCantidad(1);
        }}
        sub={(p) => `Disp: ${p.stockActual} pz`}
      />

      <Tarjeta padding={14} radius={12}>
        <Fila>
          <Text style={{ color: colors.BzText, fontSize: 13 }}>Cantidad a traspasar</Text>
          <Stepper
            valor={cantidad}
            onMenos={() => cantidad > 1 && setCantidad(cantidad - 1)}
            onMas={() => cantidad < prod.stockActual && setCantidad(cantidad + 1)}
          />
        </Fila>
      </Tarjeta>

      <MensajeOk texto={mensaje} />

      <BotonPrimario
        texto="Enviar traspaso"
        disabled={!valido}
        onPress={() => {
          if (valido) {
            onRegistrar(prod, destinoSel, cantidad);
            setMensaje(`Traspaso registrado: ${cantidad} pz de ${prod.nombre} hacia ${destinoSel}.`);
          }
        }}
      />

      <Etiqueta texto="MOVIMIENTOS RECIENTES" />
      <ListaMovimientos lista={movimientos.filter((m) => m.tipo === 'Traspaso')} />
    </ScrollView>
  );
};

/* ---------- Vista 20: Compras (Exclusivo Dueño / Encargado) ---------- */

const VistaCompras: React.FC<{
  productos: ProductoInventario[];
  movimientos: MovimientoInventario[];
  onConfirmar: (p: ProductoInventario, proveedor: string, cant: number) => void;
}> = ({ productos, movimientos, onConfirmar }) => {
  const { colors } = useBzTheme();
  const proveedores = ['BarberSupply MX', 'Distribuidora Elegante', 'Cosmética Profesional'];
  const [proveedorSel, setProveedorSel] = useState(proveedores[0]);
  const [idx, setIdx] = useState(0);
  const [cantidad, setCantidad] = useState(10);
  const [mensaje, setMensaje] = useState<string | null>(null);

  if (productos.length === 0) {
    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}>
        <Tarjeta padding={18} radius={14}>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>
            Registra primero tus productos en Base de datos para cargar compras.
          </Text>
        </Tarjeta>
      </ScrollView>
    );
  }

  const prod = productos[idx] ?? productos[0];
  const totalEstimado = prod.costoUnitario * cantidad;

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8, gap: 12 }}>
      <Titulo texto="Compras a proveedores" />

      <Etiqueta texto="1. PROVEEDOR" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {proveedores.map((p) => (
          <ChipTexto key={p} texto={p} padV={7} activo={proveedorSel === p} onPress={() => setProveedorSel(p)} />
        ))}
      </ScrollView>

      <Etiqueta texto="2. PRODUCTO / INSUMO" />
      <ChipsProducto productos={productos} selIdx={idx} onSel={setIdx} sub={(p) => `Costo: $${p.costoUnitario}`} />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[5, 10, 20, 50].map((lote) => (
          <ChipTexto
            key={lote}
            texto={`+${lote} pz`}
            centrado
            padH={4}
            padV={8}
            style={{ flex: 1 }}
            activo={cantidad === lote}
            onPress={() => setCantidad(lote)}
          />
        ))}
      </View>

      <Tarjeta padding={14} radius={12}>
        <Fila>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Total factura compra</Text>
          <Text style={{ color: colors.BzText, fontSize: 20, fontWeight: '600' }}>${totalEstimado}</Text>
        </Fila>
      </Tarjeta>

      <MensajeOk texto={mensaje} />

      <BotonPrimario
        texto="Registrar entrada de compra"
        onPress={() => {
          onConfirmar(prod, proveedorSel, cantidad);
          setMensaje(`Entrada registrada: +${cantidad} pz de ${prod.nombre}.`);
        }}
      />

      <Etiqueta texto="COMPRAS RECIENTES" />
      <ListaMovimientos lista={movimientos.filter((m) => m.tipo === 'Compra')} />
    </ScrollView>
  );
};

/* ---------- Vista 21: Conteo físico y mermas (Exclusivo Dueño / Encargado) ---------- */

const VistaConteoYMermas: React.FC<{
  productos: ProductoInventario[];
  movimientos: MovimientoInventario[];
  onAplicarAjuste: (p: ProductoInventario, nuevoStock: number, motivo: string) => void;
}> = ({ productos, movimientos, onAplicarAjuste }) => {
  const { colors } = useBzTheme();
  const [idx, setIdx] = useState(0);
  const prod = productos[idx] ?? productos[0];
  const [conteo, setConteo] = useState(prod ? Math.max(0, prod.stockActual - 1) : 0);
  const [motivo, setMotivo] = useState('Consumo interno en estación');
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    if (prod) {
      setConteo(Math.max(0, prod.stockActual - 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prod?.id]);

  if (!prod) {
    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}>
        <Tarjeta padding={18} radius={14}>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>
            No hay productos en inventario para realizar conteo físico.
          </Text>
        </Tarjeta>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8, gap: 12 }} keyboardShouldPersistTaps="handled">
      <Titulo texto="Conteo físico y mermas" />

      <ChipsProducto productos={productos} selIdx={idx} onSel={setIdx} sub={(p) => `Sistema: ${p.stockActual} pz`} />

      <Tarjeta padding={14} radius={12} gap={10}>
        <Fila>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Stock en sistema</Text>
          <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }}>{prod.stockActual} pz</Text>
        </Fila>
        <Divisor />
        <Fila>
          <Text style={{ color: colors.BzText, fontSize: 13 }}>Conteo físico real</Text>
          <Stepper valor={conteo} onMenos={() => conteo > 0 && setConteo(conteo - 1)} onMas={() => setConteo(conteo + 1)} />
        </Fila>
      </Tarjeta>

      <CampoTexto valor={motivo} onCambio={setMotivo} label="Motivo del ajuste o merma" fondo="card" />

      <MensajeOk texto={mensaje} />

      <BotonPrimario
        texto="Aplicar ajuste de inventario"
        onPress={() => {
          onAplicarAjuste(prod, conteo, motivo.trim() ? motivo : 'Ajuste de conteo');
          setMensaje(`Inventario actualizado a ${conteo} pz.`);
        }}
      />

      <Etiqueta texto="BITÁCORA DE AJUSTES Y MERMAS" />
      <ListaMovimientos lista={movimientos.filter((m) => m.tipo.includes('Merma') || m.tipo.includes('Ajuste'))} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  gridProductos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardProducto: {
    flex: 1,
    minWidth: 310,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  camaraWrapper: {
    height: 230,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  capaCompleta: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  overlayMira: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  cuadroQrMira: {
    width: 145,
    height: 145,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  laserLinea: {
    width: '88%',
    height: 2,
    opacity: 0.9,
  },
  etiquetaCamaraPill: {
    marginTop: 12,
    backgroundColor: 'rgba(0,0,0,0.68)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  etiquetaCamaraTxt: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  visorEscaner: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 18,
    alignItems: 'center',
  },
  inputCodigo: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
});