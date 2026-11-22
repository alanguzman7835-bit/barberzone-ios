import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  EQUIPO_BARBEROS,
  hoyISO,
  type CitaEquipo,
  type EstadoCita,
  type FichaCliente,
  type OrigenCita,
} from './AgendaTipos';
import { supabase } from './supabase';

export interface LineaPedidoCompartida {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

export interface PedidoApartadoRegistro {
  folio: string;
  clienteNombre: string;
  lineas: LineaPedidoCompartida[];
  total: number;
  sucursal: string;
  creadoEn: string;
  estado: 'PENDIENTE' | 'ENTREGADO';
  entregadoEn?: string;
  codigoVerificado?: string;
}

export interface RegistroPropina {
  id: string;
  barberoId: string;
  barberoNombre: string;
  clienteNombre: string;
  monto: number;
  hora: string;
}

export interface VentaDiaRegistro {
  id: string;
  folio: string;
  hora: string;
  clienteNombre: string;
  barberoNombre?: string;
  conceptos: { nombre: string; tipo: 'Servicio' | 'Producto'; precio: number }[];
  subtotal: number;
  propina: number;
  total: number;
  metodoPago: string;
}

function crearFichaNuevaDesdeCita(cita: CitaEquipo): FichaCliente {
  return {
    clienteId: cita.clienteId,
    nombre: cita.clienteNombre,
    telefono: cita.telefono || 'Sin teléfono',
    visitas: 0,
    sellos: 0,
    notasUltimoCorte: cita.notasTecnicas || '',
    productosFrecuentes: [],
    alertas: [],
    historial: [],
  };
}

export function folioLibre(existentes: string[]): string {
  let folio = '';
  do {
    folio = `BZ-${Math.floor(1000 + Math.random() * 9000)}`;
  } while (existentes.includes(folio));
  return folio;
}

function normalizarCodigoTicket(raw: string): string {
  return raw.trim().toUpperCase().replace(/^#/, '');
}

/* ---------- Conversores BD Supabase <-> App ---------- */

function citaAFilaDB(c: CitaEquipo) {
  return {
    id: c.id,
    folio: c.folio,
    fecha_iso: c.fechaISO,
    hora24: c.hora24,
    minuto: c.minuto,
    hora_texto: c.horaTexto,
    duracion_min: c.duracionMin,
    cliente_id: c.clienteId,
    cliente_nombre: c.clienteNombre,
    telefono: c.telefono,
    servicio: c.servicio,
    precio: c.precio,
    barbero_id: c.barberoId,
    barbero_nombre: c.barberoNombre,
    sucursal: c.sucursal,
    estado: c.estado,
    origen: c.origen,
    notas_cliente: c.notasCliente ?? '',
    notas_tecnicas: c.notasTecnicas ?? '',
    foto_uri: c.fotoUri ?? null,
  };
}

function filaDBCitaAApp(row: any): CitaEquipo {
  return {
    id: row.id,
    folio: row.folio,
    fechaISO: row.fecha_iso,
    hora24: Number(row.hora24),
    minuto: Number(row.minuto),
    horaTexto: row.hora_texto,
    duracionMin: Number(row.duracion_min ?? 40),
    clienteId: row.cliente_id ?? row.id,
    clienteNombre: row.cliente_nombre,
    telefono: row.telefono ?? '',
    servicio: row.servicio,
    precio: Number(row.precio ?? 0),
    barberoId: row.barbero_id,
    barberoNombre: row.barbero_nombre,
    sucursal: row.sucursal ?? 'Olivete',
    estado: row.estado as EstadoCita,
    origen: (row.origen ?? 'RECEPCION') as OrigenCita,
    notasCliente: row.notas_cliente ?? '',
    notasTecnicas: row.notas_tecnicas ?? '',
    fotoUri: row.foto_uri ?? undefined,
  };
}

function pedidoAFilaDB(p: PedidoApartadoRegistro) {
  return {
    folio: p.folio,
    cliente_nombre: p.clienteNombre,
    sucursal: p.sucursal,
    lineas: p.lineas,
    total: p.total,
    estado: p.estado,
    creado_en: p.creadoEn,
    codigo_verificado: p.codigoVerificado ?? null,
    entregado_en: p.entregadoEn ?? null,
  };
}

function filaDBPedidoAApp(row: any): PedidoApartadoRegistro {
  return {
    folio: row.folio,
    clienteNombre: row.cliente_nombre,
    sucursal: row.sucursal ?? 'Olivete',
    lineas: Array.isArray(row.lineas) ? row.lineas : [],
    total: Number(row.total ?? 0),
    estado: row.estado === 'ENTREGADO' ? 'ENTREGADO' : 'PENDIENTE',
    creadoEn: row.creado_en ?? 'Hoy',
    codigoVerificado: row.codigo_verificado ?? undefined,
    entregadoEn: row.entregado_en ?? undefined,
  };
}

function ventaAFilaDB(v: VentaDiaRegistro, citaId?: string, barberoId?: string) {
  return {
    id: v.id,
    folio: v.folio,
    cita_id: citaId ?? null,
    cliente_nombre: v.clienteNombre,
    barbero_id: barberoId ?? null,
    barbero_nombre: v.barberoNombre ?? null,
    sucursal: 'Olivete',
    conceptos: v.conceptos,
    subtotal: v.subtotal,
    propina: v.propina,
    total: v.total,
    metodo_pago: v.metodoPago,
    hora: v.hora,
    fecha_iso: hoyISO(),
  };
}

function filaDBVentaAApp(row: any): VentaDiaRegistro {
  return {
    id: row.id,
    folio: row.folio,
    hora: row.hora,
    clienteNombre: row.cliente_nombre,
    barberoNombre: row.barbero_nombre ?? undefined,
    conceptos: Array.isArray(row.conceptos) ? row.conceptos : [],
    subtotal: Number(row.subtotal ?? 0),
    propina: Number(row.propina ?? 0),
    total: Number(row.total ?? 0),
    metodoPago: row.metodo_pago ?? 'Efectivo',
  };
}

/* ---------- Contexto ---------- */

interface AgendaContextValue {
  citasEquipo: CitaEquipo[];
  fichasClientes: FichaCliente[];
  pedidosApartados: PedidoApartadoRegistro[];
  propinasHoy: RegistroPropina[];
  ventasHoy: VentaDiaRegistro[];
  cargandoBD: boolean;
  agregarCita: (cita: CitaEquipo) => void;
  cambiarEstadoCita: (id: string, estado: EstadoCita) => void;
  actualizarNotasTecnicas: (id: string, texto: string) => void;
  obtenerFichaCliente: (cita: Pick<CitaEquipo, 'clienteId' | 'clienteNombre' | 'telefono' | 'notasTecnicas'>) => FichaCliente;
  guardarNotasFicha: (
    cita: Pick<CitaEquipo, 'clienteId' | 'clienteNombre' | 'telefono'>,
    notasUltimoCorte: string,
    maquinaPreferida?: string,
  ) => void;
  registrarPedidoApartado: (pedido: Omit<PedidoApartadoRegistro, 'estado'>) => void;
  confirmarEntregaPedidoPorCodigo: (
    codigoEscaneado: string,
    folioEsperado?: string,
  ) => { ok: true; pedido: PedidoApartadoRegistro } | { ok: false; motivo: string };
  registrarCobroEnCaja: (params: {
    citaId?: string;
    barberoId?: string;
    barberoNombre?: string;
    clienteNombre: string;
    folio: string;
    conceptos: { nombre: string; tipo: 'Servicio' | 'Producto'; precio: number }[];
    subtotal: number;
    propina: number;
    total: number;
    metodoPago: string;
  }) => void;
}

const AgendaContext = createContext<AgendaContextValue | null>(null);

export const AgendaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cargandoBD, setCargandoBD] = useState(true);
  const [citasEquipo, setCitasEquipo] = useState<CitaEquipo[]>([]);
  const [fichasClientes, setFichasClientes] = useState<FichaCliente[]>([]);
  const [pedidosApartados, setPedidosApartados] = useState<PedidoApartadoRegistro[]>([]);
  const [propinasHoy, setPropinasHoy] = useState<RegistroPropina[]>([]);
  const [ventasHoy, setVentasHoy] = useState<VentaDiaRegistro[]>([]);

  // Carga inicial desde Supabase + suscripción en tiempo real (sin datos demo)
  useEffect(() => {
    let activo = true;

    const sincronizarDesdeSupabase = async () => {
      try {
        // 1. Citas
        const { data: citasDB, error: errCitas } = await supabase
          .from('citas')
          .select('*')
          .order('hora24', { ascending: true });

        if (!errCitas && citasDB && activo) {
          setCitasEquipo(citasDB.map(filaDBCitaAApp));
        }

        // 2. Pedidos apartados
        const { data: pedidosDB, error: errPed } = await supabase
          .from('pedidos_apartados')
          .select('*');

        if (!errPed && pedidosDB && activo) {
          setPedidosApartados(pedidosDB.map(filaDBPedidoAApp));
        }

        // 3. Ventas de hoy
        const { data: ventasDB, error: errVentas } = await supabase
          .from('ventas')
          .select('*')
          .eq('fecha_iso', hoyISO())
          .order('creado_en', { ascending: false });

        if (!errVentas && ventasDB && activo) {
          setVentasHoy(ventasDB.map(filaDBVentaAApp));
        }
      } catch (e) {
        console.warn('Supabase sync aviso:', e);
      } finally {
        if (activo) setCargandoBD(false);
      }
    };

    sincronizarDesdeSupabase();

    // Tiempo real: escucha cambios en citas, pedidos y ventas
    const canal = supabase
      .channel('barberzones-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'citas' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const citaActualizada = filaDBCitaAApp(payload.new);
          setCitasEquipo((prev) => {
            const existe = prev.some((c) => c.id === citaActualizada.id);
            return existe
              ? prev.map((c) => (c.id === citaActualizada.id ? citaActualizada : c))
              : [...prev, citaActualizada];
          });
        } else if (payload.eventType === 'DELETE' && payload.old?.id) {
          setCitasEquipo((prev) => prev.filter((c) => c.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos_apartados' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const ped = filaDBPedidoAApp(payload.new);
          setPedidosApartados((prev) => {
            const existe = prev.some((p) => p.folio === ped.folio);
            return existe ? prev.map((p) => (p.folio === ped.folio ? ped : p)) : [ped, ...prev];
          });
        } else if (payload.eventType === 'DELETE' && payload.old?.folio) {
          setPedidosApartados((prev) => prev.filter((p) => p.folio !== payload.old.folio));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ventas' }, (payload) => {
        const v = filaDBVentaAApp(payload.new);
        setVentasHoy((prev) => (prev.some((x) => x.id === v.id) ? prev : [v, ...prev]));
      })
      .subscribe();

    return () => {
      activo = false;
      supabase.removeChannel(canal);
    };
  }, []);

  const agregarCita = useCallback((cita: CitaEquipo) => {
    setCitasEquipo((prev) => (prev.some((c) => c.id === cita.id) ? prev : [...prev, cita]));

    supabase.from('citas').upsert(citaAFilaDB(cita)).then(({ error }) => {
      if (error) console.warn('Error guardando cita:', error.message);
    });

    setFichasClientes((prev) => {
      const telLimpio = cita.telefono.replace(/\D/g, '');
      const yaExiste = prev.some(
        (f) =>
          f.clienteId === cita.clienteId ||
          (telLimpio.length >= 8 && f.telefono.replace(/\D/g, '') === telLimpio),
      );
      if (yaExiste) return prev;
      return [...prev, crearFichaNuevaDesdeCita(cita)];
    });
  }, []);

  const cambiarEstadoCita = useCallback((id: string, estado: EstadoCita) => {
    setCitasEquipo((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, estado, terminadaEn: estado === 'TERMINADA' ? new Date().toISOString() : c.terminadaEn }
          : c,
      ),
    );

    supabase.from('citas').update({ estado }).eq('id', id).then(({ error }) => {
      if (error) console.warn('Error actualizando estado cita:', error.message);
    });
  }, []);

  const actualizarNotasTecnicas = useCallback((id: string, texto: string) => {
    setCitasEquipo((prev) => prev.map((c) => (c.id === id ? { ...c, notasTecnicas: texto } : c)));

    supabase.from('citas').update({ notas_tecnicas: texto }).eq('id', id).then(({ error }) => {
      if (error) console.warn('Error actualizando notas:', error.message);
    });
  }, []);

  const obtenerFichaCliente = useCallback(
    (cita: Pick<CitaEquipo, 'clienteId' | 'clienteNombre' | 'telefono' | 'notasTecnicas'>): FichaCliente => {
      const telLimpio = cita.telefono.replace(/\D/g, '');
      const encontrada = fichasClientes.find(
        (f) =>
          f.clienteId === cita.clienteId ||
          (telLimpio.length >= 8 && f.telefono.replace(/\D/g, '') === telLimpio),
      );
      if (encontrada) return encontrada;
      return {
        clienteId: cita.clienteId,
        nombre: cita.clienteNombre,
        telefono: cita.telefono || 'Sin teléfono',
        visitas: 0,
        sellos: 0,
        notasUltimoCorte: cita.notasTecnicas || '',
        productosFrecuentes: [],
        alertas: [],
        historial: [],
      };
    },
    [fichasClientes],
  );

  const guardarNotasFicha = useCallback(
    (
      cita: Pick<CitaEquipo, 'clienteId' | 'clienteNombre' | 'telefono'>,
      notasUltimoCorte: string,
      maquinaPreferida?: string,
    ) => {
      setFichasClientes((prev) => {
        const telLimpio = cita.telefono.replace(/\D/g, '');
        const idx = prev.findIndex(
          (f) =>
            f.clienteId === cita.clienteId ||
            (telLimpio.length >= 8 && f.telefono.replace(/\D/g, '') === telLimpio),
        );
        if (idx >= 0) {
          const copia = [...prev];
          copia[idx] = {
            ...copia[idx],
            notasUltimoCorte,
            maquinaPreferida: maquinaPreferida !== undefined ? maquinaPreferida : copia[idx].maquinaPreferida,
          };
          return copia;
        }
        return [
          ...prev,
          {
            clienteId: cita.clienteId,
            nombre: cita.clienteNombre,
            telefono: cita.telefono || 'Sin teléfono',
            visitas: 0,
            sellos: 0,
            notasUltimoCorte,
            maquinaPreferida,
            productosFrecuentes: [],
            alertas: [],
            historial: [],
          },
        ];
      });
    },
    [],
  );

  const registrarPedidoApartado = useCallback((pedido: Omit<PedidoApartadoRegistro, 'estado'>) => {
    const completo: PedidoApartadoRegistro = { ...pedido, estado: 'PENDIENTE' };
    setPedidosApartados((prev) => {
      if (prev.some((p) => p.folio === pedido.folio)) return prev;
      return [completo, ...prev];
    });

    supabase.from('pedidos_apartados').upsert(pedidoAFilaDB(completo)).then(({ error }) => {
      if (error) console.warn('Error guardando pedido apartado:', error.message);
    });
  }, []);

  const confirmarEntregaPedidoPorCodigo = useCallback(
    (
      codigoEscaneado: string,
      folioEsperado?: string,
    ): { ok: true; pedido: PedidoApartadoRegistro } | { ok: false; motivo: string } => {
      const limpio = normalizarCodigoTicket(codigoEscaneado);
      if (!limpio) {
        return { ok: false, motivo: 'Escanea el código de barras del ticket del cliente antes de entregar.' };
      }

      if (folioEsperado) {
        const esperado = normalizarCodigoTicket(folioEsperado);
        if (limpio !== esperado) {
          return {
            ok: false,
            motivo: `El código escaneado (${limpio}) no coincide con el ticket #${esperado}.`,
          };
        }
      }

      const encontrado = pedidosApartados.find(
        (p) => normalizarCodigoTicket(p.folio) === limpio,
      );

      if (!encontrado) {
        return {
          ok: false,
          motivo: `No existe ningún pedido apartado con el código "${limpio}".`,
        };
      }

      if (encontrado.estado === 'ENTREGADO') {
        return {
          ok: false,
          motivo: `El ticket #${encontrado.folio} ya fue escaneado y entregado anteriormente.`,
        };
      }

      const horaAhora = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      const actualizado: PedidoApartadoRegistro = {
        ...encontrado,
        estado: 'ENTREGADO',
        entregadoEn: horaAhora,
        codigoVerificado: limpio,
      };

      setPedidosApartados((prev) =>
        prev.map((p) => (p.folio === encontrado.folio ? actualizado : p)),
      );

      supabase
        .from('pedidos_apartados')
        .update({
          estado: 'ENTREGADO',
          entregado_en: horaAhora,
          codigo_verificado: limpio,
        })
        .eq('folio', encontrado.folio)
        .then(({ error }) => {
          if (error) console.warn('Error actualizando pedido:', error.message);
        });

      const nuevaVenta: VentaDiaRegistro = {
        id: `v-ped-${encontrado.folio}`,
        folio: encontrado.folio,
        hora: horaAhora,
        clienteNombre: encontrado.clienteNombre,
        conceptos: encontrado.lineas.map((l) => ({
          nombre: `${l.cantidad}× ${l.nombre}`,
          tipo: 'Producto',
          precio: l.precio * l.cantidad,
        })),
        subtotal: encontrado.total,
        propina: 0,
        total: encontrado.total,
        metodoPago: 'Mostrador',
      };

      setVentasHoy((prev) => [nuevaVenta, ...prev]);
      supabase.from('ventas').upsert(ventaAFilaDB(nuevaVenta)).then(({ error }) => {
        if (error) console.warn('Error registrando venta pedido:', error.message);
      });

      return { ok: true, pedido: actualizado };
    },
    [pedidosApartados],
  );

  const registrarCobroEnCaja = useCallback(
    (params: {
      citaId?: string;
      barberoId?: string;
      barberoNombre?: string;
      clienteNombre: string;
      folio: string;
      conceptos: { nombre: string; tipo: 'Servicio' | 'Producto'; precio: number }[];
      subtotal: number;
      propina: number;
      total: number;
      metodoPago: string;
    }) => {
      const horaAhora = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

      if (params.citaId) {
        setCitasEquipo((prev) =>
          prev.map((c) =>
            c.id === params.citaId
              ? { ...c, estado: 'TERMINADA', terminadaEn: new Date().toISOString() }
              : c,
          ),
        );

        supabase
          .from('citas')
          .update({ estado: 'TERMINADA' })
          .eq('id', params.citaId)
          .then(({ error }) => {
            if (error) console.warn('Error cerrando cita en BD:', error.message);
          });
      }

      if (params.propina > 0 && params.barberoId) {
        const nombreB =
          params.barberoNombre ||
          EQUIPO_BARBEROS.find((b) => b.id === params.barberoId)?.nombre ||
          'Barbero';
        setPropinasHoy((prev) => [
          {
            id: `prop-${Date.now()}`,
            barberoId: params.barberoId!,
            barberoNombre: nombreB,
            clienteNombre: params.clienteNombre,
            monto: params.propina,
            hora: horaAhora,
          },
          ...prev,
        ]);
      }

      const nuevaVenta: VentaDiaRegistro = {
        id: `v-${Date.now()}`,
        folio: params.folio,
        hora: horaAhora,
        clienteNombre: params.clienteNombre,
        barberoNombre: params.barberoNombre,
        conceptos: params.conceptos,
        subtotal: params.subtotal,
        propina: params.propina,
        total: params.total,
        metodoPago: params.metodoPago,
      };

      setVentasHoy((prev) => [nuevaVenta, ...prev]);

      supabase
        .from('ventas')
        .upsert(ventaAFilaDB(nuevaVenta, params.citaId, params.barberoId))
        .then(({ error }) => {
          if (error) console.warn('Error guardando venta en BD:', error.message);
        });
    },
    [],
  );

  const value = useMemo<AgendaContextValue>(
    () => ({
      citasEquipo,
      fichasClientes,
      pedidosApartados,
      propinasHoy,
      ventasHoy,
      cargandoBD,
      agregarCita,
      cambiarEstadoCita,
      actualizarNotasTecnicas,
      obtenerFichaCliente,
      guardarNotasFicha,
      registrarPedidoApartado,
      confirmarEntregaPedidoPorCodigo,
      registrarCobroEnCaja,
    }),
    [
      citasEquipo,
      fichasClientes,
      pedidosApartados,
      propinasHoy,
      ventasHoy,
      cargandoBD,
      agregarCita,
      cambiarEstadoCita,
      actualizarNotasTecnicas,
      obtenerFichaCliente,
      guardarNotasFicha,
      registrarPedidoApartado,
      confirmarEntregaPedidoPorCodigo,
      registrarCobroEnCaja,
    ],
  );

  return <AgendaContext.Provider value={value}>{children}</AgendaContext.Provider>;
};

export function useAgenda(): AgendaContextValue {
  const ctx = useContext(AgendaContext);
  if (!ctx) {
    throw new Error('useAgenda debe usarse dentro de <AgendaProvider>. Revisa que index.tsx lo envuelva.');
  }
  return ctx;
}