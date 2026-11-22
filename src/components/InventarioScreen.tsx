import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useBzTheme } from '../constants/BzTheme';
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
  id: number;
  nombre: string;
  sku: string;
  categoria: string;
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
 * Módulo de Inventario:
 * - Recepción/Cajero: SOLO lectura de stock, traspasos y entrada obligatoria por escaneo QR de cajas.
 * - Dueño / Encargado: Control total (escanear QR, compras manuales, reabastecimiento rápido y conteo/mermas).
 */
export const InventarioScreen: React.FC<{ usuario: UsuarioBz }> = ({ usuario }) => {
  const esGerencia = usuario.rol === RolSesion.DUENO || usuario.rol === RolSesion.ENCARGADO;

  const [subVista, setSubVista] = useState<SubVista>('STOCK');
  const [escanerQrAbierto, setEscanerQrAbierto] = useState(false);

  const [productos, setProductos] = useState<ProductoInventario[]>([
    { id: 1, nombre: 'Pomada mate 100g', sku: 'BZ-POM-01', categoria: 'Estilizado', stockActual: 4, stockMinimo: 8, costoUnitario: 95, precioVenta: 220, piezasPorCaja: 12 },
    { id: 2, nombre: 'Aceite barba 30ml', sku: 'BZ-ACE-02', categoria: 'Barba', stockActual: 14, stockMinimo: 6, costoUnitario: 75, precioVenta: 180, piezasPorCaja: 12 },
    { id: 3, nombre: 'Shampoo menta 250ml', sku: 'BZ-SHA-03', categoria: 'Lavado', stockActual: 3, stockMinimo: 6, costoUnitario: 65, precioVenta: 150, piezasPorCaja: 6 },
    { id: 4, nombre: 'Navajas doradas (100 pz)', sku: 'BZ-NAV-04', categoria: 'Insumo', stockActual: 2, stockMinimo: 5, costoUnitario: 110, precioVenta: 0, piezasPorCaja: 10 },
    { id: 5, nombre: 'Cera fuerte 100g', sku: 'BZ-CER-05', categoria: 'Estilizado', stockActual: 11, stockMinimo: 5, costoUnitario: 90, precioVenta: 210, piezasPorCaja: 12 },
    { id: 6, nombre: 'Talco cuello 200g', sku: 'BZ-TAL-06', categoria: 'Insumo', stockActual: 9, stockMinimo: 4, costoUnitario: 45, precioVenta: 0, piezasPorCaja: 8 },
  ]);

  const [historial, setHistorial] = useState<MovimientoInventario[]>([
    { id: 1, tipo: 'Entrada QR', detalle: 'Caja QR BZ-ACE-02 · +12 Aceite barba 30ml', estado: 'Verificado', fecha: 'Hoy · 09:40' },
    { id: 2, tipo: 'Traspaso', detalle: 'Olivete → Centro · 6 Pomada mate', estado: 'En tránsito', fecha: 'Hoy · 11:10' },
    { id: 3, tipo: 'Compra', detalle: 'Proveedor BarberSupply · $2,450', estado: 'Recibida', fecha: 'Ayer · 17:30' },
    { id: 4, tipo: 'Merma', detalle: '1 Shampoo menta (envase roto)', estado: 'Registrada', fecha: '15 nov' },
  ]);

  const agregarMov = (tipo: string, detalle: string, estado: string) =>
    setHistorial((h) => [{ id: Math.max(0, ...h.map((m) => m.id)) + 1, tipo, detalle, estado, fecha: 'Ahora' }, ...h]);

  /**
   * Procesa el código QR de la caja recibida.
   * Formatos aceptados:
   * - "BZ-POM-01:12" (SKU y cantidad exacta de piezas de la caja)
   * - "BZ-POM-01" (SKU solo -> suma las piezasPorCaja configuradas)
   * - JSON {"sku":"BZ-POM-01","piezas":12}
   */
  const procesarQrCajaRecibida = (
    codigoRaw: string,
  ): { ok: true; producto: ProductoInventario; piezasSumadas: number; nuevoStock: number } | { ok: false; motivo: string } => {
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

    const prod = productos.find((p) => p.sku.toUpperCase() === skuLeido);
    if (!prod) {
      return {
        ok: false,
        motivo: `El código "${skuLeido}" no corresponde a ningún producto del catálogo.`,
      };
    }

    const piezasSumadas = piezasLeidas ?? prod.piezasPorCaja;
    const nuevoStock = prod.stockActual + piezasSumadas;

    setProductos((ps) =>
      ps.map((p) => (p.id === prod.id ? { ...p, stockActual: nuevoStock } : p)),
    );

    agregarMov(
      'Entrada QR',
      `Caja QR (${prod.sku}) · +${piezasSumadas} pz ${prod.nombre} · Recibió ${usuario.nombre}`,
      'Verificado',
    );

    return { ok: true, producto: prod, piezasSumadas, nuevoStock };
  };

  // Pestañas según el rol: Recepción NO tiene Compras manuales ni Conteo/Merma
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
      <View style={{ flexGrow: 0 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, gap: 8 }}
        >
          {pestanas.map((p) => (
            <ChipTexto
              key={p.vista}
              texto={p.titulo}
              padH={14}
              padV={8}
              apagado
              negrita
              activo={subVista === p.vista}
              onPress={() => setSubVista(p.vista)}
            />
          ))}
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
            setProductos((ps) => ps.map((p) => (p.id === item.id ? { ...p, stockActual: p.stockActual + 5 } : p)));
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
              setProductos((ps) => ps.map((p) => (p.id === prod.id ? { ...p, stockActual: p.stockActual - cant } : p)));
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
            setProductos((ps) => ps.map((p) => (p.id === prod.id ? { ...p, stockActual: p.stockActual + cant } : p)));
            agregarMov('Compra', `${proveedor} · +${cant} ${prod.nombre} ($${prod.costoUnitario * cant})`, 'Recibida');
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
            setProductos((ps) => ps.map((p) => (p.id === prod.id ? { ...p, stockActual: nuevoStock } : p)));
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
          Cada caja trae su código QR con formato SKU:PIEZAS (ejemplo: BZ-POM-01:12).
        </Text>
        <Divisor />
        {productos.map((p) => (
          <Fila key={p.id}>
            <Text style={{ color: colors.BzText, fontSize: 12, flex: 1 }}>
              {p.nombre}
            </Text>
            <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
              {p.sku} · Caja {p.piezasPorCaja} pz · Disp: {p.stockActual}
            </Text>
          </Fila>
        ))}
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
  ) => { ok: true; producto: ProductoInventario; piezasSumadas: number; nuevoStock: number } | { ok: false; motivo: string };
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

      {/* Opción secundaria por si el QR impreso en la caja viene roto/mojado */}
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
            placeholder="Ej. BZ-POM-01:12"
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

const CardMetricaInv: React.FC<{ titulo: string; valor: string; colorValor?: string }> = ({ titulo, valor, colorValor }) => {
  const { colors } = useBzTheme();
  return (
    <Tarjeta padding={12} radius={12} gap={4} style={{ flex: 1 }}>
      <Text style={{ color: colors.BzMuted, fontSize: 9, letterSpacing: 1 }}>{titulo}</Text>
      <Text style={{ color: colorValor ?? colors.BzText, fontSize: 17, fontWeight: '600' }}>{valor}</Text>
    </Tarjeta>
  );
};

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

/* ---------- Vista 13: Existencias (con control de permisos por rol) ---------- */

const VistaStockGeneral: React.FC<{
  usuario: UsuarioBz;
  esGerencia: boolean;
  productos: ProductoInventario[];
  onAbrirEscanerQr: () => void;
  onReabastecerRapido: (p: ProductoInventario) => void;
  onIrCompras: () => void;
}> = ({ usuario, esGerencia, productos, onAbrirEscanerQr, onReabastecerRapido, onIrCompras }) => {
  const { colors } = useBzTheme();
  const [filtro, setFiltro] = useState('Todos');

  const bajos = productos.filter((p) => p.stockActual <= p.stockMinimo);
  const valorInventario = productos.reduce((a, p) => a + p.stockActual * p.costoUnitario, 0);

  const lista =
    filtro === 'Stock bajo'
      ? bajos
      : filtro === 'Venta'
      ? productos.filter((p) => p.precioVenta > 0)
      : filtro === 'Insumos'
      ? productos.filter((p) => p.precioVenta === 0)
      : productos;

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8, gap: 12, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Fila>
        <View style={{ flex: 1 }}>
          <Titulo texto={`Inventario · ${usuario.sucursal}`} />
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
            {productos.length} artículos · {esGerencia ? 'Control total' : 'Solo lectura y entrada por QR'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Pressable
            onPress={onAbrirEscanerQr}
            style={{ borderRadius: 10, backgroundColor: colors.BzText, paddingHorizontal: 11, paddingVertical: 7 }}
          >
            <Text style={{ color: colors.BzBg, fontSize: 11, fontWeight: '600' }}>📷 QR Caja</Text>
          </Pressable>
          {/* Solo Dueño o Encargado pueden registrar compras/altas manuales */}
          {esGerencia && (
            <Pressable
              onPress={onIrCompras}
              style={{ borderRadius: 10, borderWidth: 1, borderColor: colors.BzBorder, paddingHorizontal: 10, paddingVertical: 7 }}
            >
              <Text style={{ color: colors.BzText, fontSize: 11, fontWeight: '600' }}>+ Compra</Text>
            </Pressable>
          )}
        </View>
      </Fila>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <CardMetricaInv
          titulo={esGerencia ? 'VALOR EN COSTO' : 'PIEZAS TOTALES'}
          valor={
            esGerencia
              ? `$${valorInventario}`
              : `${productos.reduce((a, p) => a + p.stockActual, 0)} pz`
          }
        />
        <CardMetricaInv
          titulo="ALERTAS STOCK BAJO"
          valor={`${bajos.length} ítems`}
          colorValor={bajos.length > 0 ? colors.BzWarning : colors.BzSuccess}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {['Todos', 'Stock bajo', 'Venta', 'Insumos'].map((f) => (
          <ChipTexto key={f} texto={f} size={11} activo={filtro === f} onPress={() => setFiltro(f)} />
        ))}
      </ScrollView>

      {lista.map((prod) => {
        const esBajo = prod.stockActual <= prod.stockMinimo;
        return (
          <Tarjeta key={prod.id} gap={0} borderColor={esBajo ? colors.BzWarning : undefined}>
            <Fila>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: esBajo ? colors.BzWarning : colors.BzSuccess }} />
                  <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '500', flexShrink: 1 }}>{prod.nombre}</Text>
                </View>
                <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                  {prod.sku} · {prod.categoria} · Mín: {prod.stockMinimo} pz
                </Text>
                <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                  {prod.precioVenta > 0
                    ? esGerencia
                      ? `Costo $${prod.costoUnitario} · Venta $${prod.precioVenta}`
                      : `Precio venta: $${prod.precioVenta} · Caja ${prod.piezasPorCaja} pz`
                    : `Insumo interno · Caja ${prod.piezasPorCaja} pz`}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={{ color: esBajo ? colors.BzWarning : colors.BzText, fontSize: 16, fontWeight: '600' }}>
                  {prod.stockActual} pz
                </Text>
                {/* El botón de +5 rápido se oculta completamente para Recepción */}
                {esGerencia && esBajo && (
                  <Pressable
                    onPress={() => onReabastecerRapido(prod)}
                    style={{ borderRadius: 8, backgroundColor: colors.BzBg, borderWidth: 1, borderColor: colors.BzBorder, paddingHorizontal: 8, paddingVertical: 4 }}
                  >
                    <Text style={{ color: colors.BzText, fontSize: 10 }}>+5 rápido</Text>
                  </Pressable>
                )}
              </View>
            </Fila>
          </Tarjeta>
        );
      })}
    </ScrollView>
  );
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
  const [cantidad, setCantidad] = useState(2);
  const [mensaje, setMensaje] = useState<string | null>(null);

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
          <ChipTexto key={lote} texto={`+${lote} pz`} centrado padH={4} padV={8} style={{ flex: 1 }} activo={cantidad === lote} onPress={() => setCantidad(lote)} />
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
  const [conteo, setConteo] = useState(Math.max(0, prod.stockActual - 1));
  const [motivo, setMotivo] = useState('Consumo interno en estación');
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    setConteo(Math.max(0, prod.stockActual - 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prod.id]);

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