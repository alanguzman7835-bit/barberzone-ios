import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import {
  useAgenda,
  type PedidoApartadoRegistro,
  type VentaDiaRegistro,
} from '../constants/AgendaContext';
import {
  ETIQUETA_ESTADO,
  hoyISO,
  minutosDelDia,
  type CitaEquipo,
} from '../constants/AgendaTipos';
import { useBzTheme } from '../constants/BzTheme';
import { UsuarioBz } from '../constants/Sesion';
import {
  BotonPrimario,
  BotonSecundario,
  BzSheet,
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
type TabCajaPrincipal = 'COBRO' | 'PEDIDOS_TIENDA' | 'HISTORIAL';
type PasoModalAgregar = 'ELEGIR_TIPO' | 'LISTA_SERVICIOS' | 'BUSCAR_PRODUCTO' | 'PREGUNTAR_MAS';

const WHATSAPP_DESTINO = '523334881355';

interface LineaOrden {
  id: number;
  concepto: string;
  detalle: string;
  tipo: 'Servicio' | 'Producto';
  precio: number;
  cantidad: number;
}

interface Movimiento {
  desc: string;
  monto: string;
  esGasto: boolean;
}

interface ProductoCatalogoCaja {
  id: string;
  codigoBarras: string;
  nombre: string;
  desc: string;
  precio: number;
}

interface ServicioCatalogoCaja {
  id: string;
  nombre: string;
  duracion: string;
  precio: number;
}

export interface ClienteEsperaCaja {
  id: string;
  nombre: string;
  telefono: string;
  servicio: string;
  tiempoEstMin: number;
  horaRegistro: string;
  notificado: boolean;
  horaNotificacion?: string;
}

const CATALOGO_SERVICIOS_CAJA: ServicioCatalogoCaja[] = [
  { id: 'srv-1', nombre: 'Corte de pelo', duracion: '40 min', precio: 220 },
  { id: 'srv-2', nombre: 'Arreglo de barba', duracion: '30 min', precio: 160 },
  { id: 'srv-3', nombre: 'Corte + Barba', duracion: '60 min', precio: 340 },
  { id: 'srv-4', nombre: 'Ceja y bigote', duracion: '10 min', precio: 50 },
  { id: 'srv-5', nombre: 'Ritual toalla caliente', duracion: '25 min', precio: 150 },
  { id: 'srv-6', nombre: 'Exfoliación facial negra', duracion: '20 min', precio: 140 },
  { id: 'srv-7', nombre: 'Corte infantil', duracion: '30 min', precio: 180 },
  { id: 'srv-8', nombre: 'Tinte / Matizado de barba', duracion: '35 min', precio: 210 },
];

const CATALOGO_TIENDA_CAJA: ProductoCatalogoCaja[] = [
  { id: 'cr-1', codigoBarras: '7501001', nombre: 'Crema moldeadora mate', desc: '100g · Control natural', precio: 220 },
  { id: 'cr-2', codigoBarras: '7501002', nombre: 'Crema hidratante rizos', desc: '150ml · Definición suave', precio: 240 },
  { id: 'cr-3', codigoBarras: '7501003', nombre: 'Pomada base agua', desc: '100g · Fijación media', precio: 210 },
  { id: 'cr-4', codigoBarras: '7501004', nombre: 'Crema para peinar fibra', desc: '120g · Textura flexible', precio: 230 },
  { id: 'cr-5', codigoBarras: '7501005', nombre: 'Bálsamo crema post-afeitado', desc: '80ml · Calma e hidrata', precio: 195 },
  { id: 'ba-1', codigoBarras: '7501006', nombre: 'Aceite para barba cedro', desc: '30ml · Aroma amaderado', precio: 185 },
  { id: 'ba-2', codigoBarras: '7501007', nombre: 'Bálsamo acondicionador barba', desc: '60g · Domina vello', precio: 205 },
  { id: 'ba-3', codigoBarras: '7501008', nombre: 'Aceite crecimiento romero', desc: '30ml · Fortalece folículo', precio: 250 },
  { id: 'ba-4', codigoBarras: '7501009', nombre: 'Jabón exfoliante de barba', desc: '100g · Limpieza profunda', precio: 160 },
  { id: 'ba-5', codigoBarras: '7501010', nombre: 'Kit aceite + peine madera', desc: 'Cuidado diario completo', precio: 310 },
  { id: 'sh-1', codigoBarras: '7501011', nombre: 'Shampoo menta refrescante', desc: '250ml · Limpieza profunda', precio: 155 },
  { id: 'sh-2', codigoBarras: '7501012', nombre: 'Shampoo carbón activado', desc: '250ml · Detox capilar', precio: 175 },
  { id: 'sh-3', codigoBarras: '7501013', nombre: 'Shampoo anticaída biotina', desc: '300ml · Fortificante', precio: 235 },
  { id: 'sh-4', codigoBarras: '7501014', nombre: 'Shampoo matizador plata', desc: '250ml · Matizador', precio: 225 },
  { id: 'sh-5', codigoBarras: '7501015', nombre: 'Shampoo 2 en 1 diario', desc: '250ml · Cabello y barba', precio: 165 },
  { id: 'ce-1', codigoBarras: '7501016', nombre: 'Cera arcilla ultra fuerte', desc: '100g · Acabado seco', precio: 215 },
  { id: 'ce-2', codigoBarras: '7501017', nombre: 'Cera telaraña textura', desc: '100g · Despeinado flexible', precio: 205 },
  { id: 'to-1', codigoBarras: '7501018', nombre: 'Tónico capilar mentolado', desc: '120ml · Estimula y refresca', precio: 165 },
  { id: 'to-2', codigoBarras: '7501019', nombre: 'Spray sal marina volumen', desc: '150ml · Textura natural', precio: 190 },
  { id: 'ac-1', codigoBarras: '7501020', nombre: 'Cepillo fade cerdas jabalí', desc: 'Limpieza en degradados', precio: 145 },
  { id: 'ac-2', codigoBarras: '7501021', nombre: 'Peine carbono antiestática', desc: 'Corte fino profesional', precio: 110 },
];

export const CajaScreen: React.FC<{ usuario: UsuarioBz }> = ({ usuario }) => {
  const {
    citasEquipo,
    pedidosApartados,
    ventasHoy,
    confirmarEntregaPedidoPorCodigo,
    registrarCobroEnCaja,
  } = useAgenda();
  const hoy = hoyISO();

  const [tabPrincipal, setTabPrincipal] = useState<TabCajaPrincipal>('COBRO');
  const [subVista, setSubVista] = useState<SubVista>('POS');
  const [turnoAbierto, setTurnoAbierto] = useState(true);
  const [fondoInicial, setFondoInicial] = useState(500);

  const clientesEnProceso = useMemo(
    () =>
      citasEquipo
        .filter(
          (c) =>
            c.fechaISO === hoy &&
            (c.estado === 'EN_SERVICIO' || c.estado === 'POR_COBRAR'),
        )
        .sort((a, b) => {
          if (a.estado !== b.estado) return a.estado === 'POR_COBRAR' ? -1 : 1;
          return minutosDelDia(a) - minutosDelDia(b);
        }),
    [citasEquipo, hoy],
  );

  // Clientes en espera que salieron a tomar un café o hacer un mandado
  const [clientesEnEspera, setClientesEnEspera] = useState<ClienteEsperaCaja[]>([
    {
      id: 'esp-1',
      nombre: 'Jovan Morales',
      telefono: '33 1845 9210',
      servicio: 'Corte + Barba',
      tiempoEstMin: 35,
      horaRegistro: '10:40 AM',
      notificado: false,
    },
    {
      id: 'esp-2',
      nombre: 'Marta Domínguez',
      telefono: '33 2910 4432',
      servicio: 'Corte de pelo',
      tiempoEstMin: 40,
      horaRegistro: '10:52 AM',
      notificado: false,
    },
  ]);
  const [modalNuevaEsperaAbierto, setModalNuevaEsperaAbierto] = useState(false);

  // Hook listo para conectar la notificación real (Push / WhatsApp / SMS) cuando se configure
  const onNotificarLugarDisponible = (cliente: ClienteEsperaCaja) => {
    const ahora = new Date();
    const horaStr = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // TODO: Conectar aquí envío de notificación Push / WhatsApp al teléfono: cliente.telefono
    setClientesEnEspera((prev) =>
      prev.map((c) =>
        c.id === cliente.id
          ? { ...c, notificado: true, horaNotificacion: horaStr }
          : c,
      ),
    );
  };

  const eliminarDeEspera = (id: string) => {
    setClientesEnEspera((prev) => prev.filter((c) => c.id !== id));
  };

  // null = Pantalla principal con feeds grandes de todos los clientes
  // string = ID de la cita o 'MOSTRADOR' cuando entras al detalle de un cliente
  const [cuentaAbiertaKey, setCuentaAbiertaKey] = useState<string | null>(null);

  // Guarda las líneas por cliente para que al entrar/salir no se pierda nada
  const [ordenesPorCliente, setOrdenesPorCliente] = useState<Record<string, LineaOrden[]>>({});
  const [propinasPorCliente, setPropinasPorCliente] = useState<Record<string, number>>({});

  // Sincroniza el servicio base de cada cita en su orden si aún no existe
  useEffect(() => {
    setOrdenesPorCliente((prev) => {
      let cambio = false;
      const next = { ...prev };
      clientesEnProceso.forEach((cita) => {
        if (!next[cita.id]) {
          next[cita.id] = [
            {
              id: 1,
              concepto: cita.servicio,
              detalle: `${cita.barberoNombre} · Servicio inicial`,
              tipo: 'Servicio',
              precio: cita.precio,
              cantidad: 1,
            },
          ];
          cambio = true;
        }
      });
      if (!next['MOSTRADOR']) {
        next['MOSTRADOR'] = [];
        cambio = true;
      }
      return cambio ? next : prev;
    });
  }, [clientesEnProceso]);

  const citaSeleccionada = useMemo(
    () =>
      cuentaAbiertaKey && cuentaAbiertaKey !== 'MOSTRADOR'
        ? clientesEnProceso.find((c) => c.id === cuentaAbiertaKey) ?? null
        : null,
    [cuentaAbiertaKey, clientesEnProceso],
  );

  const clienteOrdenNombre = citaSeleccionada ? citaSeleccionada.clienteNombre : 'Cliente mostrador';
  const barberoOrdenId = citaSeleccionada ? citaSeleccionada.barberoId : undefined;
  const barberoOrdenNombre = citaSeleccionada ? citaSeleccionada.barberoNombre : undefined;
  const etiquetaTurnoOrden = citaSeleccionada
    ? `Cita ${citaSeleccionada.horaTexto} · ${ETIQUETA_ESTADO[citaSeleccionada.estado]}`
    : 'Venta directa en mostrador';

  const lineasActuales: LineaOrden[] = cuentaAbiertaKey ? ordenesPorCliente[cuentaAbiertaKey] ?? [] : [];
  const propinaPctActual: number = cuentaAbiertaKey
    ? propinasPorCliente[cuentaAbiertaKey] ?? (cuentaAbiertaKey === 'MOSTRADOR' ? 0 : 10)
    : 10;

  const subtotal = lineasActuales.reduce((acc, l) => acc + l.precio * l.cantidad, 0);
  const propinaMonto = Math.trunc((subtotal * propinaPctActual) / 100);
  const totalOrden = subtotal + propinaMonto;

  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [efectivoRecibido, setEfectivoRecibido] = useState('500');
  const [ultimoFolio, setUltimoFolio] = useState('OLI-000124');
  const [ultimoTotalCobrado, setUltimoTotalCobrado] = useState(242);
  const [ultimasLineasTicket, setUltimasLineasTicket] = useState<LineaOrden[]>([]);
  const [ultimoClienteTicket, setUltimoClienteTicket] = useState('');
  const [ultimoBarberoTicket, setUltimoBarberoTicket] = useState<string | undefined>(undefined);
  const [ultimoSubtotalTicket, setUltimoSubtotalTicket] = useState(0);
  const [ultimaPropinaTicket, setUltimaPropinaTicket] = useState(0);

  const [totalEfectivo, setTotalEfectivo] = useState(2450);
  const [totalTarjeta, setTotalTarjeta] = useState(3180);
  const [totalTransferencia, setTotalTransferencia] = useState(640);
  const [totalPropinas, setTotalPropinas] = useState(410);
  const [totalGastos, setTotalGastos] = useState(150);

  const [movimientos, setMovimientos] = useState<Movimiento[]>([
    { desc: '13:20 Compra de insumos', monto: '-$150', esGasto: true },
    { desc: '11:05 Cobro OLI-000122 · Sergio Vega', monto: '+$610', esGasto: false },
    { desc: '10:45 Cobro OLI-000121 · Juan Pérez', monto: '+$250', esGasto: false },
  ]);

  // Modal guiado: Agregar Producto o Servicio -> Elegir -> Confirmar -> ¿Agregar más?
  const [modalAgregarAbierto, setModalAgregarAbierto] = useState(false);

  const [pedidoEscaneando, setPedidoEscaneando] = useState<PedidoApartadoRegistro | null>(null);
  const [escanerGlobalAbierto, setEscanerGlobalAbierto] = useState(false);

  const pedidosPendientesCount = useMemo(
    () => pedidosApartados.filter((p) => p.estado === 'PENDIENTE').length,
    [pedidosApartados],
  );

  const agregarConceptoACuenta = (
    concepto: string,
    detalle: string,
    tipo: 'Servicio' | 'Producto',
    precioUnitario: number,
    cantidad: number,
  ) => {
    if (!cuentaAbiertaKey) return;
    setOrdenesPorCliente((prev) => {
      const lista = prev[cuentaAbiertaKey] ?? [];
      const nuevoId = Math.max(0, ...lista.map((l) => l.id)) + 1;
      return {
        ...prev,
        [cuentaAbiertaKey]: [
          ...lista,
          {
            id: nuevoId,
            concepto,
            detalle,
            tipo,
            precio: precioUnitario,
            cantidad,
          },
        ],
      };
    });
  };

  const quitarLineaDeCuenta = (lineaId: number) => {
    if (!cuentaAbiertaKey) return;
    setOrdenesPorCliente((prev) => ({
      ...prev,
      [cuentaAbiertaKey]: (prev[cuentaAbiertaKey] ?? []).filter((l) => l.id !== lineaId),
    }));
  };

  const registrarVentaPedidoEnCaja = (pedido: PedidoApartadoRegistro) => {
    setTotalEfectivo((v) => v + pedido.total);
    setMovimientos((m) => [
      {
        desc: `Ahora · Entrega tienda #${pedido.folio} (${pedido.clienteNombre})`,
        monto: `+$${pedido.total}`,
        esGasto: false,
      },
      ...m,
    ]);
  };

  if (subVista === 'PAGO') {
    return (
      <VistaPago
        clienteNombre={clienteOrdenNombre}
        barberoNombre={barberoOrdenNombre}
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
          setUltimasLineasTicket([...lineasActuales]);
          setUltimoClienteTicket(clienteOrdenNombre);
          setUltimoBarberoTicket(barberoOrdenNombre);
          setUltimoSubtotalTicket(subtotal);
          setUltimaPropinaTicket(propinaMonto);

          if (metodoPago === 'Efectivo') setTotalEfectivo((v) => v + totalOrden);
          else if (metodoPago === 'Tarjeta') setTotalTarjeta((v) => v + totalOrden);
          else setTotalTransferencia((v) => v + totalOrden);
          setTotalPropinas((v) => v + propinaMonto);

          setMovimientos((m) => [
            { desc: `Ahora · Cobro ${folio} (${clienteOrdenNombre})`, monto: `+$${totalOrden}`, esGasto: false },
            ...m,
          ]);

          registrarCobroEnCaja({
            citaId: citaSeleccionada?.id,
            barberoId: barberoOrdenId,
            barberoNombre: barberoOrdenNombre,
            clienteNombre: clienteOrdenNombre,
            folio,
            conceptos: lineasActuales.map((l) => ({
              nombre: l.cantidad > 1 ? `${l.cantidad}× ${l.concepto}` : l.concepto,
              tipo: l.tipo,
              precio: l.precio * l.cantidad,
            })),
            subtotal,
            propina: propinaMonto,
            total: totalOrden,
            metodoPago,
          });

          if (cuentaAbiertaKey === 'MOSTRADOR') {
            setOrdenesPorCliente((prev) => ({ ...prev, MOSTRADOR: [] }));
          }

          setSubVista('TICKET');
        }}
      />
    );
  }

  if (subVista === 'TICKET') {
    return (
      <VistaCobroRegistrado
        folio={ultimoFolio}
        sucursal={usuario.sucursal}
        clienteNombre={ultimoClienteTicket}
        barberoNombre={ultimoBarberoTicket}
        lineas={ultimasLineasTicket}
        subtotal={ultimoSubtotalTicket}
        propina={ultimaPropinaTicket}
        metodo={metodoPago}
        total={ultimoTotalCobrado}
        onNuevaVenta={() => {
          setCuentaAbiertaKey(null);
          setSubVista('POS');
        }}
      />
    );
  }

  if (subVista === 'CORTE') {
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
        ventasHoy={ventasHoy}
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
  }

  if (subVista === 'APERTURA') {
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

  return (
    <View style={{ flex: 1 }}>
      {/* Selector superior de 3 pestañas: Cobro POS | Pedidos tienda | Historial día */}
      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 }}>
        <ChipTexto
          texto="Cobro POS"
          size={11}
          centrado
          apagado
          negrita
          padH={4}
          padV={8}
          style={{ flex: 1 }}
          activo={tabPrincipal === 'COBRO'}
          onPress={() => setTabPrincipal('COBRO')}
        />
        <ChipTexto
          texto={
            pedidosPendientesCount > 0
              ? `Tienda (${pedidosPendientesCount})`
              : 'Pedidos tienda'
          }
          size={11}
          centrado
          apagado
          negrita
          padH={4}
          padV={8}
          style={{ flex: 1 }}
          activo={tabPrincipal === 'PEDIDOS_TIENDA'}
          onPress={() => setTabPrincipal('PEDIDOS_TIENDA')}
        />
        <ChipTexto
          texto={`Historial (${ventasHoy.length})`}
          size={11}
          centrado
          apagado
          negrita
          padH={4}
          padV={8}
          style={{ flex: 1 }}
          activo={tabPrincipal === 'HISTORIAL'}
          onPress={() => setTabPrincipal('HISTORIAL')}
        />
      </View>

      {tabPrincipal === 'COBRO' ? (
        cuentaAbiertaKey === null ? (
          /* PANTALLA 1: Feeds grandes de clientes + Lista de espera fuera del local */
          <VistaFeedsClientesCaja
            usuario={usuario}
            turnoAbierto={turnoAbierto}
            clientesEnProceso={clientesEnProceso}
            clientesEnEspera={clientesEnEspera}
            ordenesPorCliente={ordenesPorCliente}
            onEntrarCliente={(key) => setCuentaAbiertaKey(key)}
            onAbrirModalEspera={() => setModalNuevaEsperaAbierto(true)}
            onNotificarEspera={onNotificarLugarDisponible}
            onQuitarEspera={eliminarDeEspera}
            onIrCorte={() => setSubVista(turnoAbierto ? 'CORTE' : 'APERTURA')}
          />
        ) : (
          /* PANTALLA 2: Detalle de cuenta del cliente seleccionado */
          <VistaDetalleClienteCaja
            turnoAbierto={turnoAbierto}
            clienteNombre={clienteOrdenNombre}
            barberoNombre={barberoOrdenNombre}
            etiquetaTurno={etiquetaTurnoOrden}
            lineas={lineasActuales}
            propinaPct={propinaPctActual}
            subtotal={subtotal}
            propinaMonto={propinaMonto}
            total={totalOrden}
            onVolverFeeds={() => setCuentaAbiertaKey(null)}
            onAbrirAgregar={() => setModalAgregarAbierto(true)}
            onCambiarPropina={(pct) => {
              if (!cuentaAbiertaKey) return;
              setPropinasPorCliente((prev) => ({ ...prev, [cuentaAbiertaKey]: pct }));
            }}
            onQuitarLinea={quitarLineaDeCuenta}
            onIrPago={() => {
              setEfectivoRecibido(String(totalOrden));
              setSubVista('PAGO');
            }}
          />
        )
      ) : tabPrincipal === 'PEDIDOS_TIENDA' ? (
        <VistaPedidosTiendaCaja
          pedidos={pedidosApartados}
          turnoAbierto={turnoAbierto}
          onEscanearPedido={(pedido) => setPedidoEscaneando(pedido)}
          onAbrirEscanerGeneral={() => setEscanerGlobalAbierto(true)}
        />
      ) : (
        <VistaHistorialVentasDia
          ventasHoy={ventasHoy}
          onIrCorte={() => setSubVista(turnoAbierto ? 'CORTE' : 'APERTURA')}
        />
      )}

      {/* Modal para registrar cliente en espera que salió a dar una vuelta / café */}
      <BzSheet visible={modalNuevaEsperaAbierto} onDismiss={() => setModalNuevaEsperaAbierto(false)}>
        <RegistrarClienteEsperaSheet
          onGuardar={(nuevo) => {
            setClientesEnEspera((prev) => [...prev, nuevo]);
            setModalNuevaEsperaAbierto(false);
          }}
          onCancelar={() => setModalNuevaEsperaAbierto(false)}
        />
      </BzSheet>

      {/* Modal guiado: Servicio o Producto -> Buscador/Catálogo -> Cantidad -> ¿Agregar más? */}
      <BzSheet visible={modalAgregarAbierto} onDismiss={() => setModalAgregarAbierto(false)}>
        <FlujoAgregarConceptoSheet
          clienteNombre={clienteOrdenNombre}
          barberoNombre={barberoOrdenNombre}
          onConfirmarConcepto={(concepto, detalle, tipo, precioUnitario, cantidad) => {
            agregarConceptoACuenta(concepto, detalle, tipo, precioUnitario, cantidad);
          }}
          onTerminarYVolverCuenta={() => setModalAgregarAbierto(false)}
        />
      </BzSheet>

      {/* Modal cámara para escanear ticket */}
      <BzSheet
        visible={pedidoEscaneando !== null || escanerGlobalAbierto}
        onDismiss={() => {
          setPedidoEscaneando(null);
          setEscanerGlobalAbierto(false);
        }}
      >
        <EscanerCodigoBarrasSheet
          pedidoObjetivo={pedidoEscaneando}
          onValidarCodigo={(codigo) => {
            const res = confirmarEntregaPedidoPorCodigo(codigo, pedidoEscaneando?.folio);
            if (res.ok) {
              registrarVentaPedidoEnCaja(res.pedido);
            }
            return res;
          }}
          onCerrar={() => {
            setPedidoEscaneando(null);
            setEscanerGlobalAbierto(false);
          }}
        />
      </BzSheet>
    </View>
  );
};

/* ============================================================================
 * PANTALLA 1: FEEDS GRANDES DE CLIENTES EN CAJA + LISTA DE ESPERA CON AVISO
 * ========================================================================== */

const VistaFeedsClientesCaja: React.FC<{
  usuario: UsuarioBz;
  turnoAbierto: boolean;
  clientesEnProceso: CitaEquipo[];
  clientesEnEspera: ClienteEsperaCaja[];
  ordenesPorCliente: Record<string, LineaOrden[]>;
  onEntrarCliente: (key: string) => void;
  onAbrirModalEspera: () => void;
  onNotificarEspera: (cliente: ClienteEsperaCaja) => void;
  onQuitarEspera: (id: string) => void;
  onIrCorte: () => void;
}> = ({
  usuario,
  turnoAbierto,
  clientesEnProceso,
  clientesEnEspera,
  ordenesPorCliente,
  onEntrarCliente,
  onAbrirModalEspera,
  onNotificarEspera,
  onQuitarEspera,
  onIrCorte,
}) => {
  const { colors } = useBzTheme();
  const extrasMostrador = ordenesPorCliente['MOSTRADOR'] ?? [];
  const totalMostrador = extrasMostrador.reduce((a, l) => a + l.precio * l.cantidad, 0);

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 14, gap: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Encabezado limpio */}
      <Fila>
        <View style={{ flex: 1 }}>
          <Titulo texto={`Caja · ${usuario.sucursal}`} />
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
            Selecciona un cliente para ver su servicio, agregar productos o cobrar
          </Text>
        </View>
        <Pressable
          onPress={onIrCorte}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.BzBorder,
            backgroundColor: colors.BzCard,
          }}
        >
          <Text style={{ color: colors.BzText, fontSize: 11, fontWeight: '600' }}>
            {turnoAbierto ? 'Corte de caja' : 'Abrir turno'}
          </Text>
        </Pressable>
      </Fila>

      {!turnoAbierto && (
        <Tarjeta padding={14} radius={14} gap={4}>
          <Text style={{ color: colors.BzWarning, fontSize: 13, fontWeight: '700' }}>
            Turno cerrado
          </Text>
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
            Abre el turno en caja para poder registrar cobros.
          </Text>
        </Tarjeta>
      )}

      {/* SECCIÓN 1: CLIENTES EN SILLA / POR COBRAR */}
      <Fila>
        <Etiqueta texto={`CLIENTES EN ATENCIÓN (${clientesEnProceso.length})`} />
        <Pressable
          onPress={() => onEntrarCliente('MOSTRADOR')}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 10,
            backgroundColor: colors.BzCard,
            borderWidth: 1,
            borderColor: colors.BzBorder,
          }}
        >
          <Text style={{ color: '#E2C46D', fontSize: 12, fontWeight: '700' }}>
            + Venta mostrador{extrasMostrador.length > 0 ? ` ($${totalMostrador})` : ''}
          </Text>
        </Pressable>
      </Fila>

      {clientesEnProceso.length === 0 ? (
        <Tarjeta padding={20} radius={16} gap={6}>
          <Text style={{ color: colors.BzText, fontSize: 16, fontWeight: '700' }}>
            No hay clientes en corte en este momento
          </Text>
          <Text style={{ color: colors.BzMuted, fontSize: 13, lineHeight: 19 }}>
            Cuando un barbero inicie un servicio o lo marque como listo para cobrar, aparecerá aquí en grande.
          </Text>
          <View style={{ marginTop: 8 }}>
            <BotonPrimario
              texto="+ Iniciar venta de mostrador"
              height={46}
              onPress={() => onEntrarCliente('MOSTRADOR')}
            />
          </View>
        </Tarjeta>
      ) : (
        <View style={styles.feedsGrid}>
          {clientesEnProceso.map((cita) => {
            const listaCobro = cita.estado === 'POR_COBRAR';
            const lineasCliente = ordenesPorCliente[cita.id] ?? [
              {
                id: 1,
                concepto: cita.servicio,
                detalle: cita.barberoNombre,
                tipo: 'Servicio' as const,
                precio: cita.precio,
                cantidad: 1,
              },
            ];
            const extrasCount = Math.max(0, lineasCliente.length - 1);
            const totalAcumulado = lineasCliente.reduce((acc, l) => acc + l.precio * l.cantidad, 0);
            const iniciales = cita.clienteNombre
              .split(' ')
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase() ?? '')
              .join('');

            return (
              <Pressable
                key={cita.id}
                onPress={() => onEntrarCliente(cita.id)}
                style={({ pressed }) => [
                  styles.feedCardGrande,
                  {
                    backgroundColor: colors.BzCard,
                    borderColor: listaCobro ? colors.BzSuccess : colors.BzBorder,
                    borderWidth: listaCobro ? 1.5 : 1,
                  },
                  pressed && { opacity: 0.92, transform: [{ scale: 0.995 }] },
                ]}
              >
                <Fila>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 20,
                      backgroundColor: colors.BzBg,
                      borderWidth: 1,
                      borderColor: listaCobro ? colors.BzSuccess : colors.BzWarning,
                    }}
                  >
                    <Text
                      style={{
                        color: listaCobro ? colors.BzSuccess : colors.BzWarning,
                        fontSize: 10,
                        fontWeight: '800',
                        letterSpacing: 0.5,
                      }}
                    >
                      {listaCobro ? '● LISTO PARA COBRAR' : '● EN CORTE'}
                    </Text>
                  </View>
                  <Text style={{ color: colors.BzMuted, fontSize: 12, fontWeight: '600' }}>
                    {cita.horaTexto}
                  </Text>
                </Fila>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 }}>
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: colors.BzBg,
                      borderWidth: 1.5,
                      borderColor: '#E2C46D',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#E2C46D', fontSize: 18, fontWeight: '800' }}>
                      {iniciales || 'BZ'}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.BzText, fontSize: 19, fontWeight: '700' }} numberOfLines={1}>
                      {cita.clienteNombre}
                    </Text>
                    <Text style={{ color: colors.BzMuted, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
                      Atiende: <Text style={{ color: '#E2C46D', fontWeight: '700' }}>{cita.barberoNombre}</Text>
                    </Text>
                  </View>
                </View>

                <Divisor />

                <View style={{ gap: 4 }}>
                  <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
                    {cita.servicio}
                  </Text>
                  <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
                    {extrasCount > 0
                      ? `+ ${extrasCount} ${extrasCount === 1 ? 'concepto extra agregado' : 'conceptos extras agregados'}`
                      : 'Sin productos o servicios extras aún'}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 4,
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: colors.BzBorder,
                  }}
                >
                  <View>
                    <Text style={{ color: colors.BzMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 }}>
                      CUENTA ACTUAL
                    </Text>
                    <Text style={{ color: colors.BzText, fontSize: 22, fontWeight: '700' }}>
                      ${totalAcumulado}
                    </Text>
                  </View>

                  <View
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: listaCobro ? '#E2C46D' : colors.BzBg,
                      borderWidth: listaCobro ? 0 : 1,
                      borderColor: colors.BzBorder,
                    }}
                  >
                    <Text
                      style={{
                        color: listaCobro ? '#141416' : colors.BzText,
                        fontSize: 12,
                        fontWeight: '800',
                      }}
                    >
                      Abrir cuenta ›
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <Divisor />

      {/* SECCIÓN 2: CLIENTES EN ESPERA (SALIERON A MANDADO / CAFÉ) CON BOTÓN DE AVISO */}
      <Fila>
        <View style={{ flex: 1 }}>
          <Etiqueta texto={`EN ESPERA DE LUGAR (${clientesEnEspera.length})`} />
          <Text style={{ color: colors.BzMuted, fontSize: 11, marginTop: 2 }}>
            Clientes esperando turno mientras dan una vuelta o toman un café
          </Text>
        </View>

        <Pressable
          onPress={onAbrirModalEspera}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: '#E2C46D',
          }}
        >
          <Text style={{ color: '#141416', fontSize: 12, fontWeight: '800' }}>
            + Anotar en espera
          </Text>
        </Pressable>
      </Fila>

      {clientesEnEspera.length === 0 ? (
        <Tarjeta padding={16} radius={14} gap={4}>
          <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }}>
            No hay clientes en espera fuera del local
          </Text>
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
            Si todos los barberos están ocupados y un cliente sale a hacer un mandado, anótalo aquí para avisarle cuando se desocupe un lugar.
          </Text>
        </Tarjeta>
      ) : (
        <View style={styles.feedsGrid}>
          {clientesEnEspera.map((esp) => (
            <View
              key={esp.id}
              style={[
                styles.feedCardGrande,
                {
                  backgroundColor: colors.BzCard,
                  borderColor: esp.notificado ? colors.BzSuccess : colors.BzBorder,
                  borderWidth: esp.notificado ? 1.5 : 1,
                },
              ]}
            >
              <Fila>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 20,
                    backgroundColor: colors.BzBg,
                    borderWidth: 1,
                    borderColor: esp.notificado ? colors.BzSuccess : '#E2C46D',
                  }}
                >
                  <Text
                    style={{
                      color: esp.notificado ? colors.BzSuccess : '#E2C46D',
                      fontSize: 10,
                      fontWeight: '800',
                    }}
                  >
                    {esp.notificado
                      ? `✓ AVISO ENVIADO (${esp.horaNotificacion})`
                      : `⏳ ESPERA ~${esp.tiempoEstMin} MIN`}
                  </Text>
                </View>
                <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                  Llegó {esp.horaRegistro}
                </Text>
              </Fila>

              <View style={{ gap: 2 }}>
                <Text style={{ color: colors.BzText, fontSize: 18, fontWeight: '700' }}>
                  {esp.nombre}
                </Text>
                <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
                  Tel: {esp.telefono} · Busca: <Text style={{ color: colors.BzText, fontWeight: '600' }}>{esp.servicio}</Text>
                </Text>
              </View>

              {/* Botón listo para conectar las notificaciones de lugar disponible */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <Pressable
                  onPress={() => onNotificarEspera(esp)}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      paddingVertical: 11,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      backgroundColor: esp.notificado ? colors.BzBg : '#E2C46D',
                      borderWidth: esp.notificado ? 1.5 : 0,
                      borderColor: colors.BzSuccess,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text
                    style={{
                      color: esp.notificado ? colors.BzSuccess : '#141416',
                      fontSize: 12,
                      fontWeight: '800',
                    }}
                    numberOfLines={1}
                  >
                    {esp.notificado
                      ? '🔔 Volver a avisar lugar'
                      : '🔔 Avisar lugar disponible'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => onQuitarEspera(esp.id)}
                  style={{
                    paddingVertical: 11,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    backgroundColor: colors.BzBg,
                    borderWidth: 1,
                    borderColor: colors.BzBorder,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: colors.BzText, fontSize: 11, fontWeight: '700' }}>
                    Ya pasó ✓
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

/* ============================================================================
 * SHEET: REGISTRAR CLIENTE EN ESPERA FUERA DEL LOCAL
 * ========================================================================== */

const RegistrarClienteEsperaSheet: React.FC<{
  onGuardar: (cliente: ClienteEsperaCaja) => void;
  onCancelar: () => void;
}> = ({ onGuardar, onCancelar }) => {
  const { colors } = useBzTheme();
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [servicioSel, setServicioSel] = useState('Corte de pelo');
  const [tiempoSel, setTiempoSel] = useState(35);

  const puedeGuardar = nombre.trim().length > 0 && telefono.trim().length >= 7;

  return (
    <>
      <Titulo texto="Anotar cliente en espera" size={20} />
      <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
        Para clientes que salieron a un mandado o café y recibirán aviso cuando haya silla disponible.
      </Text>

      <TextInput
        value={nombre}
        onChangeText={setNombre}
        placeholder="Nombre del cliente (ej. Jovan)"
        placeholderTextColor={colors.BzMuted}
        style={[
          styles.inputCodigo,
          { color: colors.BzText, backgroundColor: colors.BzBg, borderColor: colors.BzBorder, letterSpacing: 0 },
        ]}
      />

      <TextInput
        value={telefono}
        onChangeText={setTelefono}
        placeholder="Teléfono / WhatsApp (10 dígitos)"
        placeholderTextColor={colors.BzMuted}
        keyboardType="phone-pad"
        style={[
          styles.inputCodigo,
          { color: colors.BzText, backgroundColor: colors.BzBg, borderColor: colors.BzBorder, letterSpacing: 0 },
        ]}
      />

      <Etiqueta texto="SERVICIO QUE SOLICITA" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {CATALOGO_SERVICIOS_CAJA.slice(0, 5).map((s) => (
          <ChipTexto
            key={s.id}
            texto={s.nombre}
            size={11}
            padH={12}
            padV={7}
            inactivoBg="bg"
            activo={servicioSel === s.nombre}
            onPress={() => setServicioSel(s.nombre)}
          />
        ))}
      </ScrollView>

      <Etiqueta texto="TIEMPO ESTIMADO DE ESPERA" />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[20, 30, 35, 40, 50].map((min) => (
          <ChipTexto
            key={min}
            texto={`${min} min`}
            size={11}
            padH={4}
            padV={7}
            centrado
            inactivoBg="bg"
            style={{ flex: 1 }}
            activo={tiempoSel === min}
            onPress={() => setTiempoSel(min)}
          />
        ))}
      </View>

      <BotonPrimario
        texto="Guardar en lista de espera"
        height={48}
        disabled={!puedeGuardar}
        onPress={() => {
          const ahora = new Date();
          onGuardar({
            id: `esp-${Date.now()}`,
            nombre: nombre.trim(),
            telefono: telefono.trim(),
            servicio: servicioSel,
            tiempoEstMin: tiempoSel,
            horaRegistro: ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            notificado: false,
          });
        }}
      />
      <BotonSecundario texto="Cancelar" height={44} onPress={onCancelar} />
    </>
  );
};

/* ============================================================================
 * PANTALLA 2: DETALLE DEL CLIENTE + AGREGAR PRODUCTO O SERVICIO
 * ========================================================================== */

const VistaDetalleClienteCaja: React.FC<{
  turnoAbierto: boolean;
  clienteNombre: string;
  barberoNombre?: string;
  etiquetaTurno: string;
  lineas: LineaOrden[];
  propinaPct: number;
  subtotal: number;
  propinaMonto: number;
  total: number;
  onVolverFeeds: () => void;
  onAbrirAgregar: () => void;
  onCambiarPropina: (p: number) => void;
  onQuitarLinea: (id: number) => void;
  onIrPago: () => void;
}> = ({
  turnoAbierto,
  clienteNombre,
  barberoNombre,
  etiquetaTurno,
  lineas,
  propinaPct,
  subtotal,
  propinaMonto,
  total,
  onVolverFeeds,
  onAbrirAgregar,
  onCambiarPropina,
  onQuitarLinea,
  onIrPago,
}) => {
  const { colors } = useBzTheme();
  const puedeCobrar = lineas.length > 0 && turnoAbierto;

  const serviciosCuenta = lineas.filter((l) => l.tipo === 'Servicio');
  const productosCuenta = lineas.filter((l) => l.tipo === 'Producto');

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 14, gap: 14, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <Volver onPress={onVolverFeeds} texto="‹ Volver a clientes en caja" />

      <Tarjeta padding={16} radius={16} gap={6}>
        <Fila>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#E2C46D', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
              CUENTA DEL CLIENTE
            </Text>
            <Titulo texto={clienteNombre} size={24} />
          </View>
          {barberoNombre && (
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
                backgroundColor: colors.BzBg,
                borderWidth: 1,
                borderColor: colors.BzBorder,
              }}
            >
              <Text style={{ color: colors.BzMuted, fontSize: 10 }}>BARBERO</Text>
              <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '700' }}>
                {barberoNombre}
              </Text>
            </View>
          )}
        </Fila>
        <Text style={{ color: colors.BzMuted, fontSize: 12 }}>{etiquetaTurno}</Text>
      </Tarjeta>

      <Pressable
        onPress={onAbrirAgregar}
        style={({ pressed }) => [
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            paddingVertical: 15,
            paddingHorizontal: 18,
            borderRadius: 14,
            backgroundColor: colors.BzCard,
            borderWidth: 1.5,
            borderColor: '#E2C46D',
          },
          pressed && { opacity: 0.88 },
        ]}
      >
        <Text style={{ color: '#E2C46D', fontSize: 18, fontWeight: '800' }}>+</Text>
        <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '700' }}>
          Agregar producto o servicio
        </Text>
      </Pressable>

      <Tarjeta padding={16} radius={16} gap={12}>
        <Fila>
          <Etiqueta texto={`CONCEPTOS EN CUENTA (${lineas.length})`} />
          <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
            {serviciosCuenta.length} serv. · {productosCuenta.length} prod.
          </Text>
        </Fila>

        {lineas.length === 0 ? (
          <Text style={{ color: colors.BzMuted, fontSize: 13, paddingVertical: 8 }}>
            Aún no hay servicios ni productos agregados. Toca "+ Agregar producto o servicio" para empezar.
          </Text>
        ) : (
          lineas.map((item, idx) => (
            <View key={item.id} style={{ gap: 10 }}>
              {idx > 0 && <Divisor />}
              <Fila>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View
                      style={{
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                        borderRadius: 6,
                        backgroundColor: colors.BzBg,
                        borderWidth: 1,
                        borderColor: item.tipo === 'Servicio' ? '#E2C46D' : colors.BzSuccess,
                      }}
                    >
                      <Text
                        style={{
                          color: item.tipo === 'Servicio' ? '#E2C46D' : colors.BzSuccess,
                          fontSize: 9,
                          fontWeight: '800',
                        }}
                      >
                        {item.tipo.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600', flexShrink: 1 }}>
                      {item.cantidad > 1 ? `${item.cantidad} × ` : ''}
                      {item.concepto}
                    </Text>
                  </View>
                  <Text style={{ color: colors.BzMuted, fontSize: 11, marginTop: 3 }}>
                    {item.detalle}
                    {item.cantidad > 1 ? ` ($${item.precio} c/u)` : ''}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '700' }}>
                    ${item.precio * item.cantidad}
                  </Text>
                  <Pressable onPress={() => onQuitarLinea(item.id)} hitSlop={8}>
                    <Text style={{ color: colors.BzDanger, fontSize: 14, fontWeight: '700' }}>✕</Text>
                  </Pressable>
                </View>
              </Fila>
            </View>
          ))
        )}
      </Tarjeta>

      <Tarjeta padding={16} radius={16} gap={10}>
        <Fila>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Subtotal</Text>
          <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }}>${subtotal}</Text>
        </Fila>
        <Fila>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Propina barbero</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[0, 10, 15, 20].map((pct) => (
              <ChipTexto
                key={pct}
                texto={`${pct}%`}
                size={11}
                padH={10}
                padV={5}
                inactivoBg="bg"
                activo={propinaPct === pct}
                onPress={() => onCambiarPropina(pct)}
              />
            ))}
          </View>
        </Fila>
        <Fila>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Monto propina</Text>
          <Text style={{ color: colors.BzSuccess, fontSize: 13, fontWeight: '600' }}>${propinaMonto}</Text>
        </Fila>
        <Divisor />
        <Fila>
          <Text style={{ color: colors.BzText, fontSize: 16, fontWeight: '700' }}>Total a cobrar</Text>
          <Text style={{ color: colors.BzText, fontSize: 28, fontWeight: '700' }}>${total}</Text>
        </Fila>
      </Tarjeta>

      <BotonPrimario
        texto={turnoAbierto ? `Cobrar $${total} y cerrar cuenta` : 'Abre turno para cobrar'}
        height={52}
        disabled={!puedeCobrar}
        onPress={onIrPago}
      />
    </ScrollView>
  );
};

/* ============================================================================
 * MODAL GUIADO: ELEGIR SERVICIO O PRODUCTO -> BUSCADOR + CANTIDAD -> ¿MÁS?
 * ========================================================================== */

const FlujoAgregarConceptoSheet: React.FC<{
  clienteNombre: string;
  barberoNombre?: string;
  onConfirmarConcepto: (
    concepto: string,
    detalle: string,
    tipo: 'Servicio' | 'Producto',
    precioUnitario: number,
    cantidad: number,
  ) => void;
  onTerminarYVolverCuenta: () => void;
}> = ({ clienteNombre, barberoNombre, onConfirmarConcepto, onTerminarYVolverCuenta }) => {
  const { colors } = useBzTheme();
  const [paso, setPaso] = useState<PasoModalAgregar>('ELEGIR_TIPO');

  const [busquedaProd, setBusquedaProd] = useState('');
  const [productoSel, setProductoSel] = useState<ProductoCatalogoCaja | null>(null);
  const [cantidadProd, setCantidadProd] = useState(1);
  const [ultimoAgregadoTexto, setUltimoAgregadoTexto] = useState('');

  const productosFiltrados = useMemo(() => {
    const q = busquedaProd.trim().toLowerCase();
    if (!q) return CATALOGO_TIENDA_CAJA;
    return CATALOGO_TIENDA_CAJA.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.codigoBarras.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q),
    );
  }, [busquedaProd]);

  if (paso === 'ELEGIR_TIPO') {
    return (
      <>
        <Titulo texto="¿Qué deseas agregar?" size={22} />
        <Text style={{ color: colors.BzMuted, fontSize: 13 }}>
          Se sumará a la cuenta de <Text style={{ color: colors.BzText, fontWeight: '700' }}>{clienteNombre}</Text>
        </Text>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
          <Pressable
            onPress={() => setPaso('LISTA_SERVICIOS')}
            style={({ pressed }) => [
              {
                flex: 1,
                padding: 18,
                borderRadius: 16,
                backgroundColor: colors.BzBg,
                borderWidth: 1.5,
                borderColor: '#E2C46D',
                alignItems: 'center',
                gap: 8,
              },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={{ fontSize: 28 }}>✂️</Text>
            <Text style={{ color: colors.BzText, fontSize: 16, fontWeight: '800' }}>Servicio</Text>
            <Text style={{ color: colors.BzMuted, fontSize: 11, textAlign: 'center' }}>
              Cortes, barba, ceja, rituales y más
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setProductoSel(null);
              setCantidadProd(1);
              setBusquedaProd('');
              setPaso('BUSCAR_PRODUCTO');
            }}
            style={({ pressed }) => [
              {
                flex: 1,
                padding: 18,
                borderRadius: 16,
                backgroundColor: colors.BzBg,
                borderWidth: 1.5,
                borderColor: colors.BzSuccess,
                alignItems: 'center',
                gap: 8,
              },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={{ fontSize: 28 }}>🧴</Text>
            <Text style={{ color: colors.BzText, fontSize: 16, fontWeight: '800' }}>Producto</Text>
            <Text style={{ color: colors.BzMuted, fontSize: 11, textAlign: 'center' }}>
              Buscar por nombre o código de barras
            </Text>
          </Pressable>
        </View>

        <BotonSecundario texto="Cancelar" height={44} onPress={onTerminarYVolverCuenta} />
      </>
    );
  }

  if (paso === 'LISTA_SERVICIOS') {
    return (
      <>
        <Fila>
          <Pressable onPress={() => setPaso('ELEGIR_TIPO')}>
            <Text style={{ color: '#E2C46D', fontSize: 13, fontWeight: '700' }}>‹ Cambiar tipo</Text>
          </Pressable>
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Servicios disponibles</Text>
        </Fila>

        <Titulo texto="Selecciona un servicio" size={20} />

        <ScrollView style={{ maxHeight: 340 }} contentContainerStyle={{ gap: 8 }}>
          {CATALOGO_SERVICIOS_CAJA.map((srv) => (
            <Pressable
              key={srv.id}
              onPress={() => {
                onConfirmarConcepto(
                  srv.nombre,
                  barberoNombre ? `${barberoNombre} · ${srv.duracion}` : srv.duracion,
                  'Servicio',
                  srv.precio,
                  1,
                );
                setUltimoAgregadoTexto(`${srv.nombre} ($${srv.precio})`);
                setPaso('PREGUNTAR_MAS');
              }}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: colors.BzBg,
                  borderWidth: 1,
                  borderColor: colors.BzBorder,
                },
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '700' }}>
                  {srv.nombre}
                </Text>
                <Text style={{ color: colors.BzMuted, fontSize: 11, marginTop: 2 }}>
                  Duración: {srv.duracion}
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 10,
                  backgroundColor: '#E2C46D',
                }}
              >
                <Text style={{ color: '#141416', fontSize: 13, fontWeight: '800' }}>
                  + ${srv.precio}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <BotonSecundario texto="Volver a la cuenta" height={44} onPress={onTerminarYVolverCuenta} />
      </>
    );
  }

  if (paso === 'BUSCAR_PRODUCTO') {
    return (
      <>
        <Fila>
          <Pressable onPress={() => setPaso('ELEGIR_TIPO')}>
            <Text style={{ color: '#E2C46D', fontSize: 13, fontWeight: '700' }}>‹ Cambiar tipo</Text>
          </Pressable>
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Tienda / Inventario</Text>
        </Fila>

        <Titulo texto="Buscar producto" size={20} />

        <TextInput
          value={busquedaProd}
          onChangeText={(txt) => {
            setBusquedaProd(txt);
            const matchCodigo = CATALOGO_TIENDA_CAJA.find(
              (p) => p.codigoBarras.toLowerCase() === txt.trim().toLowerCase(),
            );
            if (matchCodigo) {
              setProductoSel(matchCodigo);
              setCantidadProd(1);
            }
          }}
          placeholder="Nombre del producto o código de barras (ej. 7501001)..."
          placeholderTextColor={colors.BzMuted}
          autoFocus
          style={[
            styles.inputCodigo,
            {
              color: colors.BzText,
              backgroundColor: colors.BzBg,
              borderColor: '#E2C46D',
              letterSpacing: 0,
              fontWeight: '500',
            },
          ]}
        />

        <ScrollView style={{ maxHeight: productoSel ? 185 : 270 }} contentContainerStyle={{ gap: 8 }}>
          {productosFiltrados.length === 0 ? (
            <Text style={{ color: colors.BzMuted, fontSize: 13, textAlign: 'center', paddingVertical: 16 }}>
              No se encontró ningún producto con "{busquedaProd}".
            </Text>
          ) : (
            productosFiltrados.map((prod) => {
              const elegido = productoSel?.id === prod.id;
              return (
                <Pressable
                  key={prod.id}
                  onPress={() => {
                    setProductoSel(prod);
                    setCantidadProd(1);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: colors.BzBg,
                    borderWidth: elegido ? 1.5 : 1,
                    borderColor: elegido ? '#E2C46D' : colors.BzBorder,
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '700' }}>
                      {prod.nombre}
                    </Text>
                    <Text style={{ color: colors.BzMuted, fontSize: 11, marginTop: 1 }}>
                      Cód: {prod.codigoBarras} · {prod.desc}
                    </Text>
                  </View>
                  <Text style={{ color: '#E2C46D', fontSize: 14, fontWeight: '800' }}>
                    ${prod.precio}
                  </Text>
                </Pressable>
              );
            })
          )}
        </ScrollView>

        {productoSel && (
          <View
            style={{
              padding: 14,
              borderRadius: 14,
              backgroundColor: colors.BzBg,
              borderWidth: 1.5,
              borderColor: '#E2C46D',
              gap: 12,
            }}
          >
            <Fila>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.BzMuted, fontSize: 10, fontWeight: '700' }}>
                  PRODUCTO SELECCIONADO
                </Text>
                <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '700' }}>
                  {productoSel.nombre}
                </Text>
              </View>
              <Text style={{ color: colors.BzSuccess, fontSize: 16, fontWeight: '800' }}>
                ${productoSel.precio * cantidadProd}
              </Text>
            </Fila>

            <Fila>
              <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '600' }}>
                ¿Cuántos desea agregar?
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Pressable
                  onPress={() => setCantidadProd((c) => Math.max(1, c - 1))}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: colors.BzCard,
                    borderWidth: 1,
                    borderColor: colors.BzBorder,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: colors.BzText, fontSize: 18, fontWeight: '700' }}>−</Text>
                </Pressable>

                <Text style={{ color: colors.BzText, fontSize: 18, fontWeight: '800', minWidth: 24, textAlign: 'center' }}>
                  {cantidadProd}
                </Text>

                <Pressable
                  onPress={() => setCantidadProd((c) => c + 1)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: colors.BzCard,
                    borderWidth: 1,
                    borderColor: colors.BzBorder,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: colors.BzText, fontSize: 18, fontWeight: '700' }}>+</Text>
                </Pressable>
              </View>
            </Fila>

            <BotonPrimario
              texto={`Confirmar (${cantidadProd} × $${productoSel.precio})`}
              height={46}
              onPress={() => {
                onConfirmarConcepto(
                  productoSel.nombre,
                  `Cód. ${productoSel.codigoBarras}`,
                  'Producto',
                  productoSel.precio,
                  cantidadProd,
                );
                setUltimoAgregadoTexto(
                  `${cantidadProd} × ${productoSel.nombre} ($${productoSel.precio * cantidadProd})`,
                );
                setPaso('PREGUNTAR_MAS');
              }}
            />
          </View>
        )}

        <BotonSecundario texto="Cancelar" height={42} onPress={onTerminarYVolverCuenta} />
      </>
    );
  }

  return (
    <View style={{ alignItems: 'center', gap: 12, paddingVertical: 8 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.BzBg,
          borderWidth: 1.5,
          borderColor: colors.BzSuccess,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: colors.BzSuccess, fontSize: 24, fontWeight: '800' }}>✓</Text>
      </View>

      <Titulo texto="Agregado a la cuenta" size={20} />
      <Text style={{ color: '#E2C46D', fontSize: 14, fontWeight: '700', textAlign: 'center' }}>
        {ultimoAgregadoTexto}
      </Text>

      <Divisor />

      <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '600', textAlign: 'center' }}>
        ¿Deseas agregar más cosas?
      </Text>

      <View style={{ flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 }}>
        <View style={{ flex: 1 }}>
          <BotonSecundario
            texto="Sí, agregar más"
            height={48}
            onPress={() => {
              setProductoSel(null);
              setCantidadProd(1);
              setBusquedaProd('');
              setPaso('ELEGIR_TIPO');
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <BotonPrimario
            texto="No, volver al corte"
            height={48}
            onPress={onTerminarYVolverCuenta}
          />
        </View>
      </View>
    </View>
  );
};

/* ---------- Historial de Ventas del Día ---------- */

const VistaHistorialVentasDia: React.FC<{
  ventasHoy: VentaDiaRegistro[];
  onIrCorte: () => void;
}> = ({ ventasHoy, onIrCorte }) => {
  const { colors } = useBzTheme();
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'Servicio' | 'Producto'>('TODOS');

  const ventasFiltradas = useMemo(() => {
    if (filtroTipo === 'TODOS') return ventasHoy;
    return ventasHoy.filter((v) => v.conceptos.some((c) => c.tipo === filtroTipo));
  }, [ventasHoy, filtroTipo]);

  const resumen = useMemo(() => {
    let totalServicios = 0;
    let totalProductos = 0;
    let totalPropinas = 0;
    let totalGeneral = 0;

    ventasHoy.forEach((v) => {
      totalPropinas += v.propina;
      totalGeneral += v.total;
      v.conceptos.forEach((c) => {
        if (c.tipo === 'Servicio') totalServicios += c.precio;
        else totalProductos += c.precio;
      });
    });

    return { totalServicios, totalProductos, totalPropinas, totalGeneral };
  }, [ventasHoy]);

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 12, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Fila>
        <View style={{ flex: 1 }}>
          <Titulo texto="Historial de ventas del día" />
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
            Servicios cobrados y productos vendidos hoy
          </Text>
        </View>
        <Pressable
          onPress={onIrCorte}
          style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.BzBorder }}
        >
          <Text style={{ color: colors.BzText, fontSize: 11 }}>Corte de caja</Text>
        </Pressable>
      </Fila>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Tarjeta padding={12} radius={12} gap={2} style={{ flex: 1 }}>
          <Text style={{ color: colors.BzMuted, fontSize: 10 }}>SERVICIOS</Text>
          <Text style={{ color: colors.BzText, fontSize: 17, fontWeight: '600' }}>
            ${resumen.totalServicios}
          </Text>
        </Tarjeta>
        <Tarjeta padding={12} radius={12} gap={2} style={{ flex: 1 }}>
          <Text style={{ color: colors.BzMuted, fontSize: 10 }}>PRODUCTOS</Text>
          <Text style={{ color: colors.BzText, fontSize: 17, fontWeight: '600' }}>
            ${resumen.totalProductos}
          </Text>
        </Tarjeta>
        <Tarjeta padding={12} radius={12} gap={2} style={{ flex: 1 }}>
          <Text style={{ color: colors.BzMuted, fontSize: 10 }}>TOTAL DÍA</Text>
          <Text style={{ color: colors.BzSuccess, fontSize: 17, fontWeight: '700' }}>
            ${resumen.totalGeneral}
          </Text>
        </Tarjeta>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {(
          [
            { id: 'TODOS', label: 'Todo' },
            { id: 'Servicio', label: 'Solo servicios' },
            { id: 'Producto', label: 'Con productos' },
          ] as const
        ).map((f) => (
          <ChipTexto
            key={f.id}
            texto={f.label}
            size={11}
            padH={12}
            padV={6}
            activo={filtroTipo === f.id}
            onPress={() => setFiltroTipo(f.id)}
          />
        ))}
      </View>

      <Etiqueta texto={`OPERACIONES COBRADAS (${ventasFiltradas.length})`} />

      {ventasFiltradas.length === 0 ? (
        <Tarjeta padding={16} radius={14} gap={4}>
          <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '500' }}>
            Sin ventas en este filtro
          </Text>
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
            Cada cobro de cita, producto en mostrador o pedido apartado aparecerá aquí al instante.
          </Text>
        </Tarjeta>
      ) : (
        ventasFiltradas.map((venta) => (
          <Tarjeta key={venta.id} padding={14} radius={14} gap={8}>
            <Fila>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }}>
                  {venta.clienteNombre}
                </Text>
                <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                  {venta.hora} · #{venta.folio} · {venta.metodoPago}
                  {venta.barberoNombre ? ` · ${venta.barberoNombre}` : ''}
                </Text>
              </View>
              <Text style={{ color: colors.BzSuccess, fontSize: 16, fontWeight: '700' }}>
                +${venta.total}
              </Text>
            </Fila>

            <Divisor />

            <View style={{ gap: 4 }}>
              {venta.conceptos.map((c, idx) => (
                <Fila key={idx}>
                  <Text style={{ color: colors.BzText, fontSize: 12 }}>
                    [{c.tipo}] {c.nombre}
                  </Text>
                  <Text style={{ color: colors.BzMuted, fontSize: 12 }}>${c.precio}</Text>
                </Fila>
              ))}
              {venta.propina > 0 && (
                <Fila>
                  <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
                    Propina barbero {venta.barberoNombre ? `(${venta.barberoNombre})` : ''}
                  </Text>
                  <Text style={{ color: colors.BzSuccess, fontSize: 12, fontWeight: '600' }}>
                    +${venta.propina}
                  </Text>
                </Fila>
              )}
            </View>
          </Tarjeta>
        ))
      )}
    </ScrollView>
  );
};

/* ---------- Vista de Pedidos Apartados en Caja ---------- */

const VistaPedidosTiendaCaja: React.FC<{
  pedidos: PedidoApartadoRegistro[];
  turnoAbierto: boolean;
  onEscanearPedido: (pedido: PedidoApartadoRegistro) => void;
  onAbrirEscanerGeneral: () => void;
}> = ({ pedidos, turnoAbierto, onEscanearPedido, onAbrirEscanerGeneral }) => {
  const { colors } = useBzTheme();
  const pendientes = pedidos.filter((p) => p.estado === 'PENDIENTE');
  const entregados = pedidos.filter((p) => p.estado === 'ENTREGADO');

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 12, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Fila>
        <View style={{ flex: 1 }}>
          <Titulo texto="Pedidos apartados" />
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
            Apunta la cámara al código de barras del ticket del cliente para liberar la entrega.
          </Text>
        </View>
      </Fila>

      <BotonPrimario
        texto="📷 Abrir cámara y escanear ticket"
        height={48}
        disabled={!turnoAbierto}
        onPress={onAbrirEscanerGeneral}
      />

      {!turnoAbierto && (
        <Text style={{ color: colors.BzWarning, fontSize: 12 }}>
          Abre el turno en caja para poder cobrar y entregar pedidos.
        </Text>
      )}

      <Etiqueta texto={`PENDIENTES DE RECOGER (${pendientes.length})`} />

      {pendientes.length === 0 ? (
        <Tarjeta padding={16} radius={14} gap={4}>
          <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '500' }}>
            No hay pedidos pendientes
          </Text>
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
            Cuando un cliente aparte productos en la app, aparecerán aquí bloqueados hasta escanear su ticket.
          </Text>
        </Tarjeta>
      ) : (
        pendientes.map((pedido) => (
          <Tarjeta key={pedido.folio} padding={14} radius={14} gap={10}>
            <Fila>
              <View>
                <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '600' }}>
                  {pedido.clienteNombre}
                </Text>
                <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                  Folio #{pedido.folio} · {pedido.creadoEn} · {pedido.sucursal}
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 16,
                  backgroundColor: colors.BzBg,
                  borderWidth: 1,
                  borderColor: colors.BzWarning,
                }}
              >
                <Text style={{ color: colors.BzWarning, fontSize: 10, fontWeight: '600' }}>
                  🔒 Sin escanear
                </Text>
              </View>
            </Fila>

            <Divisor />

            <View style={{ gap: 4 }}>
              {pedido.lineas.map((l) => (
                <Fila key={l.id}>
                  <Text style={{ color: colors.BzText, fontSize: 12 }}>
                    {l.cantidad} × {l.nombre}
                  </Text>
                  <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
                    ${l.precio * l.cantidad}
                  </Text>
                </Fila>
              ))}
            </View>

            <Divisor />

            <Fila>
              <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Total a cobrar en mostrador</Text>
              <Text style={{ color: colors.BzText, fontSize: 18, fontWeight: '600' }}>
                ${pedido.total}
              </Text>
            </Fila>

            <BotonSecundario
              texto="📷 Escanear código de barras para entregar"
              height={44}
              onPress={() => onEscanearPedido(pedido)}
            />
          </Tarjeta>
        ))
      )}

      {entregados.length > 0 && (
        <>
          <View style={{ height: 4 }} />
          <Etiqueta texto={`ENTREGADOS HOY (${entregados.length})`} />
          {entregados.map((p) => (
            <Tarjeta key={p.folio} padding={12} radius={12} gap={6}>
              <Fila>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '600' }}>
                    #{p.folio} · {p.clienteNombre}
                  </Text>
                  <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                    Ticket verificado ({p.codigoVerificado}) · Entregado {p.entregadoEn}
                  </Text>
                </View>
                <Text style={{ color: colors.BzSuccess, fontSize: 13, fontWeight: '600' }}>
                  ✓ ${p.total}
                </Text>
              </Fila>
            </Tarjeta>
          ))}
        </>
      )}
    </ScrollView>
  );
};

/* ---------- Sheet Escáner REAL con CameraView (expo-camera) ---------- */

const EscanerCodigoBarrasSheet: React.FC<{
  pedidoObjetivo: PedidoApartadoRegistro | null;
  onValidarCodigo: (
    codigo: string,
  ) => { ok: true; pedido: PedidoApartadoRegistro } | { ok: false; motivo: string };
  onCerrar: () => void;
}> = ({ pedidoObjetivo, onValidarCodigo, onCerrar }) => {
  const { colors } = useBzTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [codigoManual, setCodigoManual] = useState('');
  const [mostrarManual, setMostrarManual] = useState(false);
  const [errorEscaneo, setErrorEscaneo] = useState<string | null>(null);
  const [pedidoConfirmado, setPedidoConfirmado] = useState<PedidoApartadoRegistro | null>(null);
  const bloqueoLecturaRef = useRef(false);

  const ejecutarValidacion = (valor: string) => {
    const res = onValidarCodigo(valor);
    if (!res.ok) {
      setErrorEscaneo(res.motivo);
      setTimeout(() => {
        bloqueoLecturaRef.current = false;
      }, 1400);
      return;
    }
    setErrorEscaneo(null);
    setPedidoConfirmado(res.pedido);
  };

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (bloqueoLecturaRef.current || pedidoConfirmado) return;
    const raw = (result?.data ?? '').trim();
    if (!raw) return;
    bloqueoLecturaRef.current = true;
    ejecutarValidacion(raw);
  };

  if (pedidoConfirmado) {
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
          <Titulo texto="Ticket verificado · Entregado" size={20} />
          <Text style={{ color: colors.BzMuted, fontSize: 12, textAlign: 'center' }}>
            Código #{pedidoConfirmado.folio} validado correctamente. Cobro de ${pedidoConfirmado.total} registrado en caja.
          </Text>
        </View>

        <Tarjeta fondo="bg" padding={12} radius={12} gap={6}>
          <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }}>
            Cliente: {pedidoConfirmado.clienteNombre}
          </Text>
          {pedidoConfirmado.lineas.map((l) => (
            <Text key={l.id} style={{ color: colors.BzMuted, fontSize: 12 }}>
              • {l.cantidad} × {l.nombre} (${l.precio * l.cantidad})
            </Text>
          ))}
        </Tarjeta>

        <BotonPrimario texto="Listo, cerrar" height={46} onPress={onCerrar} />
      </>
    );
  }

  const permisoOtorgado = Boolean(permission?.granted);

  return (
    <>
      <Fila>
        <Titulo texto="Escáner de ticket" size={20} />
        {pedidoObjetivo && (
          <Text style={{ color: colors.BzMuted, fontSize: 12, fontWeight: '600' }}>
            #{pedidoObjetivo.folio}
          </Text>
        )}
      </Fila>

      {Platform.OS !== 'web' && permisoOtorgado ? (
        <View
          style={[
            styles.camaraWrapper,
            { borderColor: errorEscaneo ? colors.BzDanger : colors.BzText },
          ]}
        >
          <CameraView
            style={styles.capaCompleta}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['code128', 'code39', 'ean13', 'ean8', 'qr', 'upc_a', 'upc_e'],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          />
          <View style={styles.overlayMira}>
            <View style={styles.cuadroMira}>
              <View style={[styles.laserLinea, { backgroundColor: colors.BzDanger }]} />
            </View>
            <View style={styles.etiquetaCamaraPill}>
              <Text style={styles.etiquetaCamaraTxt}>
                {pedidoObjetivo
                  ? `Apunta al código de barras #${pedidoObjetivo.folio}`
                  : 'Apunta al código de barras del ticket'}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.visorEscaner,
            { backgroundColor: colors.BzBg, borderColor: errorEscaneo ? colors.BzDanger : colors.BzBorder },
          ]}
        >
          <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
            {Platform.OS === 'web'
              ? 'Cámara disponible en app móvil'
              : 'Permiso de cámara requerido'}
          </Text>
          <Text style={{ color: colors.BzMuted, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
            Autoriza el acceso a la cámara para apuntar al código de barras del ticket del cliente.
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

      {errorEscaneo && (
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
            ⚠ {errorEscaneo}
          </Text>
        </View>
      )}

      <Pressable
        onPress={() => setMostrarManual((v) => !v)}
        style={{ alignItems: 'center', paddingVertical: 4 }}
      >
        <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
          {mostrarManual ? 'Ocultar captura manual ▲' : '¿Código físico dañado? Ingresar folio ▼'}
        </Text>
      </Pressable>

      {mostrarManual && (
        <View style={{ gap: 8 }}>
          <TextInput
            value={codigoManual}
            onChangeText={(t) => {
              setCodigoManual(t);
              setErrorEscaneo(null);
            }}
            placeholder="Ej. PD-4821"
            placeholderTextColor={colors.BzMuted}
            autoCapitalize="characters"
            style={[
              styles.inputCodigo,
              {
                color: colors.BzText,
                backgroundColor: colors.BzBg,
                borderColor: errorEscaneo ? colors.BzDanger : colors.BzBorder,
              },
            ]}
          />
          <BotonPrimario
            texto="Validar código y entregar pedido"
            height={46}
            disabled={!codigoManual.trim()}
            onPress={() => ejecutarValidacion(codigoManual)}
          />
        </View>
      )}

      <BotonSecundario texto="Cancelar" height={44} onPress={onCerrar} />
    </>
  );
};

/* ---------- Vista Pago ---------- */

const VistaPago: React.FC<{
  clienteNombre: string;
  barberoNombre?: string;
  total: number;
  metodo: string;
  recibido: string;
  onCambiarMetodo: (m: string) => void;
  onCambiarRecibido: (v: string) => void;
  onVolver: () => void;
  onConfirmarPago: () => void;
}> = ({
  clienteNombre,
  barberoNombre,
  total,
  metodo,
  recibido,
  onCambiarMetodo,
  onCambiarRecibido,
  onVolver,
  onConfirmarPago,
}) => {
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
      <Volver onPress={onVolver} texto="‹ Volver a la cuenta" />
      <Titulo texto={`Cobro · ${clienteNombre}`} size={22} />
      {barberoNombre && (
        <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
          Atendido por {barberoNombre} · Al confirmar pasará a TERMINADA
        </Text>
      )}
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
        texto="Confirmar pago y cerrar servicio"
        height={50}
        disabled={metodo === 'Efectivo' && montoRecibido < total}
        onPress={onConfirmarPago}
      />
    </ScrollView>
  );
};

/* ---------- Vista Cobro Registrado + WhatsApp ---------- */

const VistaCobroRegistrado: React.FC<{
  folio: string;
  sucursal: string;
  clienteNombre: string;
  barberoNombre?: string;
  lineas: LineaOrden[];
  subtotal: number;
  propina: number;
  metodo: string;
  total: number;
  onNuevaVenta: () => void;
}> = ({ folio, sucursal, clienteNombre, barberoNombre, lineas, subtotal, propina, metodo, total, onNuevaVenta }) => {
  const { colors } = useBzTheme();
  const [aviso, setAviso] = useState<string | null>(null);

  const enviarPorWhatsApp = async () => {
    const detalleLineas =
      lineas.length > 0
        ? lineas
            .map((l) => `• ${l.cantidad > 1 ? `${l.cantidad}× ` : ''}${l.concepto} ($${l.precio * l.cantidad})`)
            .join('\n')
        : '• Servicio / Producto en sucursal';

    const mensaje = [
      `*TICKET DE COMPRA · BARBERZONE ${sucursal.toUpperCase()}*`,
      `Folio: *${folio}*`,
      `Cliente: ${clienteNombre}`,
      barberoNombre ? `Barbero: ${barberoNombre}` : null,
      ``,
      `*Detalle:*`,
      detalleLineas,
      ``,
      `Subtotal: $${subtotal}`,
      `Propina: $${propina}`,
      `Método de pago: ${metodo}`,
      `*TOTAL PAGADO: $${total}*`,
      ``,
      `¡Gracias por tu preferencia!`,
    ]
      .filter((linea) => linea !== null)
      .join('\n');

    const url = `https://wa.me/${WHATSAPP_DESTINO}?text=${encodeURIComponent(mensaje)}`;
    try {
      await Linking.openURL(url);
      setAviso('Abriendo WhatsApp al 33 3488 1355 con el ticket listo…');
    } catch {
      setAviso('No se pudo abrir WhatsApp en este dispositivo.');
    }
  };

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
      <Titulo texto="Servicio terminado y cobrado" size={22} />
      <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
        Folio {folio} · {clienteNombre}
      </Text>

      <Tarjeta padding={16} style={{ width: '100%' }}>
        <Fila>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Servicios / Productos</Text>
          <Text style={{ color: colors.BzText, fontSize: 13 }}>${subtotal}</Text>
        </Fila>
        <Fila>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>
            Propina {barberoNombre ? `(${barberoNombre})` : ''}
          </Text>
          <Text style={{ color: colors.BzSuccess, fontSize: 13, fontWeight: '600' }}>${propina}</Text>
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

      {aviso && <Text style={{ color: colors.BzSuccess, fontSize: 12, textAlign: 'center' }}>{aviso}</Text>}

      <View style={{ flex: 1 }} />

      <BotonPrimario
        texto="Enviar ticket por WhatsApp"
        semibold={false}
        onPress={enviarPorWhatsApp}
      />
      <BotonSecundario texto="Volver a clientes en caja" height={48} onPress={onNuevaVenta} />
    </View>
  );
};

/* ---------- Corte de Caja ---------- */

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
  ventasHoy: VentaDiaRegistro[];
  onAgregarGasto: () => void;
  onCerrarCaja: () => void;
  onVolverPos: () => void;
}> = ({
  usuario,
  fondoInicial,
  efectivo,
  tarjeta,
  transferencia,
  propinas,
  gastos,
  movimientos,
  ventasHoy,
  onAgregarGasto,
  onCerrarCaja,
  onVolverPos,
}) => {
  const { colors } = useBzTheme();
  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 12, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Volver onPress={onVolverPos} texto="‹ Volver a Caja" />
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

      <Etiqueta texto={`VENTAS COBRADAS HOY (${ventasHoy.length})`} />
      <Tarjeta padding={12} radius={12} gap={10}>
        {ventasHoy.map((venta, idx) => (
          <View key={venta.id} style={{ gap: 6 }}>
            {idx > 0 && <Divisor />}
            <Fila>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '600' }}>
                  {venta.hora} · {venta.clienteNombre}
                </Text>
                <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                  #{venta.folio} · {venta.metodoPago}
                  {venta.barberoNombre ? ` · ${venta.barberoNombre}` : ''}
                </Text>
              </View>
              <Text style={{ color: colors.BzSuccess, fontSize: 14, fontWeight: '700' }}>
                +${venta.total}
              </Text>
            </Fila>
            {venta.conceptos.map((c, cIdx) => (
              <Text key={cIdx} style={{ color: colors.BzMuted, fontSize: 11, paddingLeft: 6 }}>
                • [{c.tipo}] {c.nombre} (${c.precio})
              </Text>
            ))}
          </View>
        ))}
      </Tarjeta>

      <Tarjeta padding={14} radius={12}>
        <Fila>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Gastos del turno</Text>
          <Text style={{ color: colors.BzDanger, fontSize: 14, fontWeight: '600' }}>-${gastos}</Text>
        </Fila>
      </Tarjeta>

      <Etiqueta texto="MOVIMIENTOS DE CAJA" />
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

/* ---------- Apertura de Turno ---------- */

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

const styles = StyleSheet.create({
  feedsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  feedCardGrande: {
    flexGrow: 1,
    flexBasis: 300,
    padding: 18,
    borderRadius: 18,
    gap: 12,
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
  cuadroMira: {
    width: '82%',
    height: 110,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  laserLinea: {
    width: '90%',
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
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
});