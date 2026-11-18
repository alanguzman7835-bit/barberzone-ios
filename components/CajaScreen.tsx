import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useBzTheme } from '../constants/BzTheme';
import { UsuarioBz } from '../constants/Sesion';
import {
  BotonPrimario,
  BotonSecundario,
  ChipTexto,
  Divisor,
  Etiqueta,
  Fila,
  Segmentado,
  Tarjeta,
  Titulo,
  Volver,
} from './BzFase3Ui';

type SubVista = 'POS' | 'PAGO' | 'TICKET' | 'CORTE' | 'APERTURA';

interface LineaOrden {
  id: number;
  concepto: string;
  detalle: string;
  precio: number;
}

interface Movimiento {
  desc: string;
  monto: string;
  esGasto: boolean;
}

/**
 * Módulo de Caja:
 * Vista 6 POS · 7A Pago · 7B Cobro registrado · 8 Corte de caja · 14 Apertura de turno
 */
export const CajaScreen: React.FC<{ usuario: UsuarioBz }> = ({ usuario }) => {
  const [subVista, setSubVista] = useState<SubVista>('POS');
  const [turnoAbierto, setTurnoAbierto] = useState(true);
  const [fondoInicial, setFondoInicial] = useState(500);

  const [lineas, setLineas] = useState<LineaOrden[]>([
    { id: 1, concepto: 'Corte de cabello', detalle: 'Carlos R.', precio: 180 },
    { id: 2, concepto: 'Arreglo de barba', detalle: 'Carlos R.', precio: 120 },
  ]);
  const [propinaPct, setPropinaPct] = useState(10);
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [efectivoRecibido, setEfectivoRecibido] = useState('500');
  const [ultimoFolio, setUltimoFolio] = useState('OLI-000124');
  const [ultimoTotalCobrado, setUltimoTotalCobrado] = useState(330);

  const [totalEfectivo, setTotalEfectivo] = useState(2450);
  const [totalTarjeta, setTotalTarjeta] = useState(3180);
  const [totalTransferencia, setTotalTransferencia] = useState(640);
  const [totalPropinas, setTotalPropinas] = useState(410);
  const [totalGastos, setTotalGastos] = useState(150);

  const [movimientos, setMovimientos] = useState<Movimiento[]>([
    { desc: '13:20 Compra de insumos', monto: '-$150', esGasto: true },
    { desc: '12:05 Cobro OLI-000121', monto: '+$330', esGasto: false },
    { desc: '11:52 Cobro OLI-000123', monto: '+$330', esGasto: false },
  ]);

  const subtotal = lineas.reduce((a, l) => a + l.precio, 0);
  const propinaMonto = Math.trunc((subtotal * propinaPct) / 100);
  const totalOrden = subtotal + propinaMonto;

  switch (subVista) {
    case 'POS':
      return (
        <VistaPosCobro
          usuario={usuario}
          turnoAbierto={turnoAbierto}
          lineas={lineas}
          propinaPct={propinaPct}
          subtotal={subtotal}
          propinaMonto={propinaMonto}
          total={totalOrden}
          onCambiarPropina={setPropinaPct}
          onAgregarLinea={(concepto, detalle, precio) =>
            setLineas((ls) => [...ls, { id: Math.max(0, ...ls.map((l) => l.id)) + 1, concepto, detalle, precio }])
          }
          onQuitarLinea={(id) => setLineas((ls) => ls.filter((l) => l.id !== id))}
          onIrPago={() => {
            setEfectivoRecibido(String(totalOrden));
            setSubVista('PAGO');
          }}
          onIrCorte={() => setSubVista(turnoAbierto ? 'CORTE' : 'APERTURA')}
        />
      );

    case 'PAGO':
      return (
        <VistaPago
          total={totalOrden}
          metodo={metodoPago}
          recibido={efectivoRecibido}
          onCambiarMetodo={setMetodoPago}
          onCambiarRecibido={setEfectivoRecibido}
          onVolver={() => setSubVista('POS')}
          onConfirmarPago={() => {
            const folio = `OLI-000${124 + Math.floor(Math.random() * 876)}`;
            setUltimoTotalCobrado(totalOrden);
            setUltimoFolio(folio);
            if (metodoPago === 'Efectivo') setTotalEfectivo((v) => v + totalOrden);
            else if (metodoPago === 'Tarjeta') setTotalTarjeta((v) => v + totalOrden);
            else setTotalTransferencia((v) => v + totalOrden);
            setTotalPropinas((v) => v + propinaMonto);
            setMovimientos((m) => [{ desc: `Ahora · Cobro ${folio}`, monto: `+$${totalOrden}`, esGasto: false }, ...m]);
            setSubVista('TICKET');
          }}
        />
      );

    case 'TICKET':
      return (
        <VistaCobroRegistrado
          folio={ultimoFolio}
          subtotal={subtotal}
          propina={propinaMonto}
          metodo={metodoPago}
          total={ultimoTotalCobrado}
          onNuevaVenta={() => {
            setLineas([{ id: 1, concepto: 'Corte de cabello', detalle: 'Carlos R.', precio: 180 }]);
            setPropinaPct(10);
            setSubVista('POS');
          }}
        />
      );

    case 'CORTE':
      return (
        <VistaCorteCaja
          usuario={usuario}
          fondoInicial={fondoInicial}
          efectivo={totalEfectivo}
          tarjeta={totalTarjeta}
          transferencia={totalTransferencia}
          propinas={totalPropinas}
          gastos={totalGastos}
          movimientos={movimientos}
          onAgregarGasto={() => {
            setTotalGastos((v) => v + 100);
            setTotalEfectivo((v) => Math.max(0, v - 100));
            setMovimientos((m) => [{ desc: 'Ahora · Gasto menor caja', monto: '-$100', esGasto: true }, ...m]);
          }}
          onCerrarCaja={() => {
            setTurnoAbierto(false);
            setSubVista('APERTURA');
          }}
          onVolverPos={() => setSubVista('POS')}
        />
      );

    case 'APERTURA':
      return (
        <VistaAperturaTurno
          usuario={usuario}
          onAbrirTurno={(fondo) => {
            setFondoInicial(fondo);
            setTotalEfectivo(fondo);
            setTotalTarjeta(0);
            setTotalTransferencia(0);
            setTotalPropinas(0);
            setTotalGastos(0);
            setMovimientos([]);
            setTurnoAbierto(true);
            setSubVista('POS');
          }}
        />
      );
  }
};

/* ---------- Vista 6: POS / Cobro ---------- */

const VistaPosCobro: React.FC<{
  usuario: UsuarioBz;
  turnoAbierto: boolean;
  lineas: LineaOrden[];
  propinaPct: number;
  subtotal: number;
  propinaMonto: number;
  total: number;
  onCambiarPropina: (p: number) => void;
  onAgregarLinea: (concepto: string, detalle: string, precio: number) => void;
  onQuitarLinea: (id: number) => void;
  onIrPago: () => void;
  onIrCorte: () => void;
}> = ({ usuario, turnoAbierto, lineas, propinaPct, subtotal, propinaMonto, total, onCambiarPropina, onAgregarLinea, onQuitarLinea, onIrPago, onIrCorte }) => {
  const { colors } = useBzTheme();
  const rapidos = [
    { nombre: 'Pomada mate', tipo: 'Producto', precio: 220 },
    { nombre: 'Aceite barba', tipo: 'Producto', precio: 180 },
    { nombre: 'Shampoo', tipo: 'Producto', precio: 150 },
    { nombre: 'Ceja y bigote', tipo: 'Servicio', precio: 50 },
  ];
  const puedeCobrar = lineas.length > 0 && turnoAbierto;

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 12 }}>
      <Fila>
        <View style={{ flex: 1 }}>
          <Titulo texto={`POS · Caja ${usuario.sucursal}`} />
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Orden de Juan Pérez · Cita 11:30</Text>
        </View>
        <Pressable
          onPress={onIrCorte}
          style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.BzBorder }}
        >
          <Text style={{ color: colors.BzText, fontSize: 11 }}>{turnoAbierto ? 'Corte de caja' : 'Abrir turno'}</Text>
        </Pressable>
      </Fila>

      <Tarjeta>
        <Etiqueta texto="CONCEPTOS EN ORDEN" />
        {lineas.length === 0 ? (
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Agrega un servicio o producto para cobrar.</Text>
        ) : (
          lineas.map((item, idx) => (
            <View key={item.id} style={{ gap: 8 }}>
              {idx > 0 && <Divisor />}
              <Fila>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '500' }}>{item.concepto}</Text>
                  <Text style={{ color: colors.BzMuted, fontSize: 11 }}>{item.detalle}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '600' }}>${item.precio}</Text>
                  <Pressable onPress={() => onQuitarLinea(item.id)} hitSlop={8}>
                    <Text style={{ color: colors.BzMuted, fontSize: 13 }}>✕</Text>
                  </Pressable>
                </View>
              </Fila>
            </View>
          ))
        )}
      </Tarjeta>

      <Etiqueta texto="AGREGAR RÁPIDO" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {rapidos.map((r) => (
          <Pressable
            key={r.nombre}
            onPress={() => onAgregarLinea(r.nombre, r.tipo, r.precio)}
            style={{
              borderRadius: 12,
              backgroundColor: colors.BzCard,
              borderWidth: 1,
              borderColor: colors.BzBorder,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: colors.BzText, fontSize: 12, fontWeight: '500' }}>+ {r.nombre}</Text>
            <Text style={{ color: colors.BzMuted, fontSize: 11 }}>${r.precio}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Tarjeta gap={10}>
        <Fila>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Subtotal</Text>
          <Text style={{ color: colors.BzText, fontSize: 13 }}>${subtotal}</Text>
        </Fila>
        <Fila>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Propina</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[0, 10, 15].map((pct) => (
              <ChipTexto key={pct} texto={`${pct} %`} size={11} padH={10} padV={4} inactivoBg="bg" activo={propinaPct === pct} onPress={() => onCambiarPropina(pct)} />
            ))}
          </View>
        </Fila>
        <Fila>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Monto propina</Text>
          <Text style={{ color: colors.BzText, fontSize: 13 }}>${propinaMonto}</Text>
        </Fila>
        <Divisor />
        <Fila>
          <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '600' }}>Total a cobrar</Text>
          <Text style={{ color: colors.BzText, fontSize: 26, fontWeight: '300' }}>${total}</Text>
        </Fila>
      </Tarjeta>

      <BotonPrimario
        texto={turnoAbierto ? `Cobrar $${total}` : 'Abre turno para cobrar'}
        height={50}
        disabled={!puedeCobrar}
        onPress={onIrPago}
      />
    </ScrollView>
  );
};

/* ---------- Vista 7A: Pago ---------- */

const VistaPago: React.FC<{
  total: number;
  metodo: string;
  recibido: string;
  onCambiarMetodo: (m: string) => void;
  onCambiarRecibido: (v: string) => void;
  onVolver: () => void;
  onConfirmarPago: () => void;
}> = ({ total, metodo, recibido, onCambiarMetodo, onCambiarRecibido, onVolver, onConfirmarPago }) => {
  const { colors } = useBzTheme();
  const montoRecibido = parseInt(recibido, 10) || 0;
  const cambio = Math.max(0, montoRecibido - total);
  const presets = [
    { valor: '200', etq: '$200' },
    { valor: '300', etq: '$300' },
    { valor: '500', etq: '$500' },
    { valor: String(total), etq: 'Exacto' },
  ];

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 14 }}>
      <Volver onPress={onVolver} texto="‹ Volver a la orden" />
      <Titulo texto="Pago" size={22} />
      <Text style={{ color: colors.BzText, fontSize: 36, fontWeight: '300', textAlign: 'center' }}>${total}</Text>

      <Segmentado opciones={['Efectivo', 'Tarjeta', 'Transferencia']} valor={metodo} onChange={onCambiarMetodo} padV={10} />

      {metodo === 'Efectivo' ? (
        <>
          <Tarjeta padding={14} radius={12}>
            <Fila>
              <Text style={{ color: colors.BzMuted, fontSize: 14 }}>Recibido</Text>
              <Text style={{ color: colors.BzText, fontSize: 20, fontWeight: '600' }}>${montoRecibido}</Text>
            </Fila>
          </Tarjeta>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {presets.map((p) => (
              <ChipTexto
                key={p.etq}
                texto={p.etq}
                centrado
                padH={4}
                padV={8}
                style={{ flex: 1 }}
                activo={recibido === p.valor}
                onPress={() => onCambiarRecibido(p.valor)}
              />
            ))}
          </View>

          <Tarjeta padding={14} radius={12}>
            <Fila>
              <Text style={{ color: colors.BzMuted, fontSize: 14 }}>Cambio</Text>
              <Text style={{ color: colors.BzSuccess, fontSize: 20, fontWeight: '600' }}>${cambio}</Text>
            </Fila>
          </Tarjeta>
        </>
      ) : (
        <Tarjeta padding={14} radius={12}>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>
            {metodo === 'Tarjeta'
              ? `Cobra $${total} en la terminal bancaria y confirma.`
              : `Verifica el comprobante de transferencia por $${total}.`}
          </Text>
        </Tarjeta>
      )}

      <View style={{ height: 8 }} />
      <BotonPrimario
        texto="Confirmar pago"
        height={50}
        disabled={metodo === 'Efectivo' && montoRecibido < total}
        onPress={onConfirmarPago}
      />
    </ScrollView>
  );
};

/* ---------- Vista 7B: Cobro Registrado ---------- */

const VistaCobroRegistrado: React.FC<{
  folio: string;
  subtotal: number;
  propina: number;
  metodo: string;
  total: number;
  onNuevaVenta: () => void;
}> = ({ folio, subtotal, propina, metodo, total, onNuevaVenta }) => {
  const { colors } = useBzTheme();
  const [aviso, setAviso] = useState<string | null>(null);

  return (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingVertical: 24, alignItems: 'center', gap: 14 }}>
      <View style={{ height: 12 }} />
      <View
        style={{
          width: 68,
          height: 68,
          borderRadius: 34,
          backgroundColor: colors.BzCard,
          borderWidth: 1.5,
          borderColor: colors.BzSuccess,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: colors.BzSuccess, fontSize: 28 }}>✓</Text>
      </View>
      <Titulo texto="Cobro registrado" size={22} />
      <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Folio {folio} · 17 nov 2026</Text>

      <Tarjeta padding={16} style={{ width: '100%' }}>
        <Fila>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Servicios / Productos</Text>
          <Text style={{ color: colors.BzText, fontSize: 13 }}>${subtotal}</Text>
        </Fila>
        <Fila>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Propina</Text>
          <Text style={{ color: colors.BzText, fontSize: 13 }}>${propina}</Text>
        </Fila>
        <Fila>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Método</Text>
          <Text style={{ color: colors.BzText, fontSize: 13 }}>{metodo}</Text>
        </Fila>
        <Divisor />
        <Fila>
          <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '600' }}>Total</Text>
          <Text style={{ color: colors.BzText, fontSize: 16, fontWeight: '600' }}>${total}</Text>
        </Fila>
      </Tarjeta>

      {aviso && <Text style={{ color: colors.BzSuccess, fontSize: 12 }}>{aviso}</Text>}

      <View style={{ flex: 1 }} />

      <BotonPrimario texto="Enviar ticket por WhatsApp" semibold={false} onPress={() => setAviso('Comprobante enviado por WhatsApp al cliente.')} />
      <BotonSecundario texto="Nueva venta" height={48} onPress={onNuevaVenta} />
    </View>
  );
};

/* ---------- Vista 8: Corte de Caja ---------- */

const CardMetricaCaja: React.FC<{ titulo: string; valor: string }> = ({ titulo, valor }) => {
  const { colors } = useBzTheme();
  return (
    <Tarjeta padding={12} radius={12} gap={4} style={{ flex: 1 }}>
      <Text style={{ color: colors.BzMuted, fontSize: 9, letterSpacing: 1 }}>{titulo}</Text>
      <Text style={{ color: colors.BzText, fontSize: 18, fontWeight: '300' }}>{valor}</Text>
    </Tarjeta>
  );
};

const VistaCorteCaja: React.FC<{
  usuario: UsuarioBz;
  fondoInicial: number;
  efectivo: number;
  tarjeta: number;
  transferencia: number;
  propinas: number;
  gastos: number;
  movimientos: Movimiento[];
  onAgregarGasto: () => void;
  onCerrarCaja: () => void;
  onVolverPos: () => void;
}> = ({ usuario, fondoInicial, efectivo, tarjeta, transferencia, propinas, gastos, movimientos, onAgregarGasto, onCerrarCaja, onVolverPos }) => {
  const { colors } = useBzTheme();
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 12 }}>
      <Volver onPress={onVolverPos} texto="‹ Volver al POS" />
      <Titulo texto="Corte de caja" size={22} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            borderRadius: 20,
            backgroundColor: colors.BzCard,
            borderWidth: 1,
            borderColor: colors.BzBorder,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.BzSuccess }} />
          <Text style={{ color: colors.BzText, fontSize: 11 }}>Turno abierto</Text>
        </View>
        <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
          {usuario.nombre} · Fondo ${fondoInicial}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <CardMetricaCaja titulo="EFECTIVO ESPERADO" valor={`$${efectivo}`} />
        <CardMetricaCaja titulo="TARJETA" valor={`$${tarjeta}`} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <CardMetricaCaja titulo="TRANSFERENCIA" valor={`$${transferencia}`} />
        <CardMetricaCaja titulo="PROPINAS" valor={`$${propinas}`} />
      </View>

      <Tarjeta padding={14} radius={12}>
        <Fila>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Gastos del turno</Text>
          <Text style={{ color: colors.BzDanger, fontSize: 14, fontWeight: '600' }}>-${gastos}</Text>
        </Fila>
      </Tarjeta>

      <Etiqueta texto="MOVIMIENTOS RECIENTES" />
      <Tarjeta padding={12} radius={12}>
        {movimientos.map((m, idx) => (
          <View key={idx} style={{ gap: 8 }}>
            {idx > 0 && <Divisor />}
            <Fila>
              <Text style={{ color: colors.BzText, fontSize: 12, flex: 1 }}>{m.desc}</Text>
              <Text style={{ color: m.esGasto ? colors.BzDanger : colors.BzSuccess, fontSize: 12, fontWeight: '500' }}>
                {m.monto}
              </Text>
            </Fila>
          </View>
        ))}
      </Tarjeta>

      <BotonSecundario texto="+ Registrar gasto ($100)" onPress={onAgregarGasto} />
      <BotonPrimario texto="Cerrar caja" onPress={onCerrarCaja} />
    </ScrollView>
  );
};

/* ---------- Vista 14: Apertura de Turno ---------- */

const VistaAperturaTurno: React.FC<{ usuario: UsuarioBz; onAbrirTurno: (fondo: number) => void }> = ({
  usuario,
  onAbrirTurno,
}) => {
  const { colors } = useBzTheme();
  const [fondoSel, setFondoSel] = useState(500);

  return (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingVertical: 20, gap: 14 }}>
      <Titulo texto="Apertura de turno" size={22} />
      <View
        style={{
          alignSelf: 'flex-start',
          borderRadius: 20,
          backgroundColor: colors.BzCard,
          borderWidth: 1,
          borderColor: colors.BzBorder,
          paddingHorizontal: 12,
          paddingVertical: 5,
        }}
      >
        <Text style={{ color: colors.BzWarning, fontSize: 11 }}>Turno cerrado</Text>
      </View>

      <Tarjeta>
        <Fila>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Sucursal</Text>
          <Text style={{ color: colors.BzText, fontSize: 13 }}>{usuario.sucursal}</Text>
        </Fila>
        <Divisor />
        <Fila>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Responsable</Text>
          <Text style={{ color: colors.BzText, fontSize: 13 }}>{usuario.nombre}</Text>
        </Fila>
      </Tarjeta>

      <Etiqueta texto="FONDO INICIAL CONTADO" />
      <Text style={{ color: colors.BzText, fontSize: 32, fontWeight: '300' }}>${fondoSel}</Text>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[300, 500, 1000].map((m) => (
          <ChipTexto key={m} texto={`$${m}`} size={13} padH={4} padV={8} centrado style={{ flex: 1 }} activo={fondoSel === m} onPress={() => setFondoSel(m)} />
        ))}
      </View>

      <View style={{ flex: 1 }} />
      <BotonPrimario texto="Abrir turno" height={50} onPress={() => onAbrirTurno(fondoSel)} />
    </View>
  );
};
