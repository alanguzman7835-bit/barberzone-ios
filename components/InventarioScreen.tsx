import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useBzTheme } from '../constants/BzTheme';
import { UsuarioBz } from '../constants/Sesion';
import {
  BotonMini,
  BotonPrimario,
  Chip,
  ChipTexto,
  Divisor,
  Etiqueta,
  Fila,
  Tarjeta,
  Titulo,
  CampoTexto,
} from './BzFase3Ui';

type SubVista = 'STOCK' | 'TRASPASOS' | 'COMPRAS' | 'CONTEO_MERMAS';

interface ProductoInventario {
  id: number;
  nombre: string;
  sku: string;
  categoria: string;
  stockActual: number;
  stockMinimo: number;
  costoUnitario: number;
  precioVenta: number;
}

interface MovimientoInventario {
  id: number;
  tipo: string;
  detalle: string;
  estado: string;
  fecha: string;
}

/**
 * Módulo de Inventario: Stock (13) · Traspasos (19) · Compras (20) · Conteo y mermas (21)
 */
export const InventarioScreen: React.FC<{ usuario: UsuarioBz }> = ({ usuario }) => {
  const [subVista, setSubVista] = useState<SubVista>('STOCK');

  const [productos, setProductos] = useState<ProductoInventario[]>([
    { id: 1, nombre: 'Pomada mate 100g', sku: 'BZ-POM-01', categoria: 'Estilizado', stockActual: 4, stockMinimo: 8, costoUnitario: 95, precioVenta: 220 },
    { id: 2, nombre: 'Aceite barba 30ml', sku: 'BZ-ACE-02', categoria: 'Barba', stockActual: 14, stockMinimo: 6, costoUnitario: 75, precioVenta: 180 },
    { id: 3, nombre: 'Shampoo menta 250ml', sku: 'BZ-SHA-03', categoria: 'Lavado', stockActual: 3, stockMinimo: 6, costoUnitario: 65, precioVenta: 150 },
    { id: 4, nombre: 'Navajas doradas (100 pz)', sku: 'BZ-NAV-04', categoria: 'Insumo', stockActual: 2, stockMinimo: 5, costoUnitario: 110, precioVenta: 0 },
    { id: 5, nombre: 'Cera fuerte 100g', sku: 'BZ-CER-05', categoria: 'Estilizado', stockActual: 11, stockMinimo: 5, costoUnitario: 90, precioVenta: 210 },
    { id: 6, nombre: 'Talco cuello 200g', sku: 'BZ-TAL-06', categoria: 'Insumo', stockActual: 9, stockMinimo: 4, costoUnitario: 45, precioVenta: 0 },
  ]);

  const [historial, setHistorial] = useState<MovimientoInventario[]>([
    { id: 1, tipo: 'Traspaso', detalle: 'Olivete → Centro · 6 Pomada mate', estado: 'En tránsito', fecha: 'Hoy · 11:10' },
    { id: 2, tipo: 'Compra', detalle: 'Proveedor BarberSupply · $2,450', estado: 'Recibida', fecha: 'Ayer · 17:30' },
    { id: 3, tipo: 'Merma', detalle: '1 Shampoo menta (envase roto)', estado: 'Registrada', fecha: '15 nov' },
  ]);

  const agregarMov = (tipo: string, detalle: string, estado: string) =>
    setHistorial((h) => [{ id: Math.max(0, ...h.map((m) => m.id)) + 1, tipo, detalle, estado, fecha: 'Ahora' }, ...h]);

  const pestanas: { titulo: string; vista: SubVista }[] = [
    { titulo: 'Stock', vista: 'STOCK' },
    { titulo: 'Traspasos', vista: 'TRASPASOS' },
    { titulo: 'Compras', vista: 'COMPRAS' },
    { titulo: 'Conteo / Merma', vista: 'CONTEO_MERMAS' },
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
            <ChipTexto key={p.vista} texto={p.titulo} padH={14} padV={8} apagado negrita activo={subVista === p.vista} onPress={() => setSubVista(p.vista)} />
          ))}
        </ScrollView>
      </View>

      {subVista === 'STOCK' && (
        <VistaStockGeneral
          usuario={usuario}
          productos={productos}
          onReabastecerRapido={(item) =>
            setProductos((ps) => ps.map((p) => (p.id === item.id ? { ...p, stockActual: p.stockActual + 5 } : p)))
          }
          onIrCompras={() => setSubVista('COMPRAS')}
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

      {subVista === 'COMPRAS' && (
        <VistaCompras
          productos={productos}
          movimientos={historial}
          onConfirmar={(prod, proveedor, cant) => {
            setProductos((ps) => ps.map((p) => (p.id === prod.id ? { ...p, stockActual: p.stockActual + cant } : p)));
            agregarMov('Compra', `${proveedor} · +${cant} ${prod.nombre} ($${prod.costoUnitario * cant})`, 'Recibida');
          }}
        />
      )}

      {subVista === 'CONTEO_MERMAS' && (
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
    </View>
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

/* ---------- Vista 13: Existencias ---------- */

const VistaStockGeneral: React.FC<{
  usuario: UsuarioBz;
  productos: ProductoInventario[];
  onReabastecerRapido: (p: ProductoInventario) => void;
  onIrCompras: () => void;
}> = ({ usuario, productos, onReabastecerRapido, onIrCompras }) => {
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
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8, gap: 12 }}>
      <Fila>
        <View style={{ flex: 1 }}>
          <Titulo texto={`Inventario · ${usuario.sucursal}`} />
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>{productos.length} artículos registrados</Text>
        </View>
        <Pressable onPress={onIrCompras} style={{ borderRadius: 10, backgroundColor: colors.BzText, paddingHorizontal: 12, paddingVertical: 7 }}>
          <Text style={{ color: colors.BzBg, fontSize: 12, fontWeight: '600' }}>+ Compra</Text>
        </Pressable>
      </Fila>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <CardMetricaInv titulo="VALOR EN COSTO" valor={`$${valorInventario}`} />
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
                    ? `Costo $${prod.costoUnitario} · Venta $${prod.precioVenta}`
                    : `Costo $${prod.costoUnitario} · Uso interno`}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={{ color: esBajo ? colors.BzWarning : colors.BzText, fontSize: 16, fontWeight: '600' }}>
                  {prod.stockActual} pz
                </Text>
                {esBajo && (
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

/* ---------- Vista 20: Compras ---------- */

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

/* ---------- Vista 21: Conteo físico y mermas ---------- */

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
