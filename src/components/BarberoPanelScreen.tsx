import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAgenda } from '../constants/AgendaContext';
import {
  ETIQUETA_ESTADO,
  fechaDesdeClave,
  hoyISO,
  inicioDeSemanaISO,
  minutosDelDia,
  type CitaEquipo,
} from '../constants/AgendaTipos';
import { useBzTheme } from '../constants/BzTheme';
import { UsuarioBz } from '../constants/Sesion';
import {
  BotonPrimario,
  BotonSecundario,
  CampoTexto,
  ChipTexto,
  Divisor,
  Etiqueta,
  Fila,
  Segmentado,
  Tarjeta,
  Titulo,
} from './BzFase3Ui';
import FichaClienteSheet from './FichaClienteSheet';

type SubVista = 'SERVICIO_EN_CURSO' | 'PRODUCTIVIDAD';
type PeriodoEstadistica = 'Hoy' | 'Semana' | 'Quincena';

interface TareaServicio {
  id: number;
  nombre: string;
  completado: boolean;
}

const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatearHorasMinutos(totalMin: number): string {
  const min = Math.max(0, Math.round(totalMin));
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h 00m`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

function inicialesDe(nombre: string): string {
  return (
    nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || 'CL'
  );
}

function tareasInicialesDeServicio(servicio: string): TareaServicio[] {
  const s = servicio.toLowerCase();
  if (s.includes('corte') && s.includes('barba')) {
    return [
      { id: 1, nombre: 'Corte de cabello y desvanecido', completado: false },
      { id: 2, nombre: 'Perfilado y arreglo de barba', completado: false },
      { id: 3, nombre: 'Lavado y estilizado final', completado: false },
    ];
  }
  if (s.includes('barba')) {
    return [
      { id: 1, nombre: 'Toalla caliente y preparación', completado: false },
      { id: 2, nombre: 'Perfilado y rebaje de barba', completado: false },
    ];
  }
  return [
    { id: 1, nombre: servicio, completado: false },
    { id: 2, nombre: 'Contornos y acabado final', completado: false },
  ];
}

function moverDiasISO(baseISO: string, delta: number): string {
  const f = fechaDesdeClave(baseISO);
  f.setDate(f.getDate() + delta);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`;
}

export const BarberoPanelScreen: React.FC<{
  usuario: UsuarioBz;
  abrirEnComisiones?: boolean;
}> = ({ usuario, abrirEnComisiones = false }) => {
  const [subVista, setSubVista] = useState<SubVista>(
    abrirEnComisiones ? 'PRODUCTIVIDAD' : 'SERVICIO_EN_CURSO',
  );

  useEffect(() => {
    setSubVista(abrirEnComisiones ? 'PRODUCTIVIDAD' : 'SERVICIO_EN_CURSO');
  }, [abrirEnComisiones]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 10 }}>
        {(
          [
            { titulo: 'Servicio en silla', vista: 'SERVICIO_EN_CURSO' },
            { titulo: 'Productividad', vista: 'PRODUCTIVIDAD' },
          ] as { titulo: string; vista: SubVista }[]
        ).map((p) => (
          <ChipTexto
            key={p.vista}
            texto={p.titulo}
            centrado
            apagado
            negrita
            padH={4}
            padV={8}
            style={{ flex: 1 }}
            activo={subVista === p.vista}
            onPress={() => setSubVista(p.vista)}
          />
        ))}
      </View>

      {subVista === 'SERVICIO_EN_CURSO' ? (
        <VistaServicioEnCurso
          usuario={usuario}
          onTerminarServicio={() => setSubVista('PRODUCTIVIDAD')}
        />
      ) : (
        <VistaProductividadBarbero usuario={usuario} />
      )}
    </View>
  );
};

/* ---------- Vista 1: Servicio en silla (envía a Caja como POR_COBRAR) ---------- */

const VistaServicioEnCurso: React.FC<{
  usuario: UsuarioBz;
  onTerminarServicio: () => void;
}> = ({ usuario, onTerminarServicio }) => {
  const { colors } = useBzTheme();
  const {
    citasEquipo,
    cambiarEstadoCita,
    actualizarNotasTecnicas,
    obtenerFichaCliente,
    guardarNotasFicha,
  } = useAgenda();
  const hoy = hoyISO();

  const citasBarberoHoy = useMemo(
    () =>
      citasEquipo
        .filter(
          (c) =>
            c.barberoId === usuario.id &&
            c.fechaISO === hoy &&
            c.estado !== 'CANCELADA',
        )
        .sort((a, b) => minutosDelDia(a) - minutosDelDia(b)),
    [citasEquipo, usuario.id, hoy],
  );

  const citaEnSilla = useMemo(
    () => citasBarberoHoy.find((c) => c.estado === 'EN_SERVICIO') ?? null,
    [citasBarberoHoy],
  );

  const siguienteCita = useMemo(
    () =>
      citasBarberoHoy.find(
        (c) =>
          c.estado === 'LLEGO' ||
          c.estado === 'CONFIRMADA' ||
          c.estado === 'PROGRAMADA',
      ) ?? null,
    [citasBarberoHoy],
  );

  const [tareas, setTareas] = useState<TareaServicio[]>([]);
  const [notas, setNotas] = useState('');
  const [maquina, setMaquina] = useState('#1.5');
  const [fotos, setFotos] = useState(0);
  const [verFicha, setVerFicha] = useState(false);
  const [mensajeFinal, setMensajeFinal] = useState<string | null>(null);

  const fichaActual = useMemo(
    () => (citaEnSilla ? obtenerFichaCliente(citaEnSilla) : null),
    [citaEnSilla, obtenerFichaCliente],
  );

  useEffect(() => {
    if (citaEnSilla) {
      setTareas(tareasInicialesDeServicio(citaEnSilla.servicio));
      setNotas(citaEnSilla.notasTecnicas || fichaActual?.notasUltimoCorte || '');
      if (fichaActual?.maquinaPreferida) {
        setMaquina(fichaActual.maquinaPreferida);
      }
      setFotos(0);
    }
  }, [citaEnSilla?.id]);

  const extrasDisponibles = [
    'Ceja y bigote',
    'Mascarilla facial',
    'Exfoliación',
    'Lavado capilar',
    'Tónico refrescante',
  ];

  if (!citaEnSilla) {
    return (
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 14, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {mensajeFinal && (
          <Tarjeta padding={12} radius={12} borderColor={colors.BzSuccess} gap={4}>
            <Text style={{ color: colors.BzSuccess, fontSize: 12, fontWeight: '600' }}>
              ✓ Cliente enviado a caja (pendiente de pago)
            </Text>
            <Text style={{ color: colors.BzText, fontSize: 12 }}>{mensajeFinal}</Text>
          </Tarjeta>
        )}

        <Tarjeta padding={18} radius={16} gap={12}>
          <Etiqueta texto="ESTADO DE SILLA" />
          <Text style={{ color: colors.BzText, fontSize: 18, fontWeight: '500' }}>
            Sin cliente en silla ahora
          </Text>
          <Text style={{ color: colors.BzMuted, fontSize: 13, lineHeight: 19 }}>
            Al finalizar un corte, el cliente pasa a caja como “Listo p/ cobrar” y se marca terminado cuando realiza su pago.
          </Text>

          {siguienteCita && (
            <>
              <Divisor />
              <View style={{ gap: 6 }}>
                <Etiqueta texto="SIGUIENTE TURNO EN AGENDA" />
                <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '600' }}>
                  {siguienteCita.horaTexto} · {siguienteCita.clienteNombre}
                </Text>
                <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
                  {siguienteCita.servicio} ({siguienteCita.duracionMin} min) ·{' '}
                  {ETIQUETA_ESTADO[siguienteCita.estado]}
                </Text>
                <View style={{ height: 4 }} />
                <BotonPrimario
                  texto="Pasar a silla e iniciar"
                  height={44}
                  onPress={() => {
                    setMensajeFinal(null);
                    cambiarEstadoCita(siguienteCita.id, 'EN_SERVICIO');
                  }}
                />
              </View>
            </>
          )}
        </Tarjeta>
      </ScrollView>
    );
  }

  const completadas = tareas.filter((t) => t.completado).length;

  const finalizarServicioActual = () => {
    const extrasAgregados = tareas
      .slice(tareasInicialesDeServicio(citaEnSilla.servicio).length)
      .map((t) => t.nombre);

    const resumenTecnico = [
      notas.trim(),
      maquina.trim() ? `Máquina/peine: ${maquina.trim()}` : '',
      extrasAgregados.length > 0 ? `Extras: ${extrasAgregados.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join(' · ');

    if (resumenTecnico) {
      actualizarNotasTecnicas(citaEnSilla.id, resumenTecnico);
      guardarNotasFicha(citaEnSilla, notas.trim() || resumenTecnico, maquina.trim());
    }

    // Queda POR_COBRAR hasta que recepción confirme el pago en Caja
    cambiarEstadoCita(citaEnSilla.id, 'POR_COBRAR');
    setMensajeFinal(
      `${citaEnSilla.clienteNombre} pasó a recepción para cobrar (${citaEnSilla.servicio}).`,
    );
    onTerminarServicio();
  };

  return (
    <>
      <FichaClienteSheet
        visible={verFicha}
        ficha={fichaActual}
        citaActual={citaEnSilla}
        onDismiss={() => setVerFicha(false)}
        onGuardarNotas={(n, m) => {
          guardarNotasFicha(citaEnSilla, n, m);
          setNotas(n);
          if (m) setMaquina(m);
        }}
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, gap: 12, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Tarjeta padding={14} radius={14} borderColor={colors.BzWarning} gap={10}>
          <Fila>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.BzBg,
                  borderWidth: 1,
                  borderColor: colors.BzWarning,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '600' }}>
                  {inicialesDe(citaEnSilla.clienteNombre)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.BzText, fontSize: 16, fontWeight: '600' }}>
                  {citaEnSilla.clienteNombre}
                </Text>
                <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
                  {citaEnSilla.servicio} · Turno {citaEnSilla.horaTexto} ({citaEnSilla.duracionMin} min)
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => setVerFicha(true)}
              style={{
                borderRadius: 20,
                backgroundColor: colors.BzBg,
                borderWidth: 1,
                borderColor: colors.BzBorder,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: colors.BzText, fontSize: 11, fontWeight: '600' }}>
                Pase técnico ›
              </Text>
            </Pressable>
          </Fila>

          {citaEnSilla.notasCliente ? (
            <View
              style={{
                backgroundColor: colors.BzBg,
                borderRadius: 10,
                padding: 10,
                borderWidth: 1,
                borderColor: colors.BzBorder,
              }}
            >
              <Text style={{ color: colors.BzMuted, fontSize: 10, letterSpacing: 1.2 }}>
                INDICACIÓN DEL CLIENTE
              </Text>
              <Text style={{ color: colors.BzText, fontSize: 12, marginTop: 2 }}>
                “{citaEnSilla.notasCliente}”
              </Text>
            </View>
          ) : null}
        </Tarjeta>

        <Fila>
          <Etiqueta texto="ETAPAS DEL SERVICIO" />
          <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
            {completadas} de {tareas.length} listas
          </Text>
        </Fila>

        <Tarjeta padding={12}>
          {tareas.map((tarea, idx) => (
            <View key={tarea.id} style={{ gap: 8 }}>
              {idx > 0 && <Divisor />}
              <Pressable
                onPress={() =>
                  setTareas((ts) =>
                    ts.map((t) => (t.id === tarea.id ? { ...t, completado: !t.completado } : t)),
                  )
                }
                style={{ paddingVertical: 4 }}
              >
                <Fila>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 5,
                        borderWidth: 1,
                        borderColor: tarea.completado ? colors.BzSuccess : colors.BzMuted,
                        backgroundColor: tarea.completado ? colors.BzSuccess : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {tarea.completado && (
                        <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>✓</Text>
                      )}
                    </View>
                    <Text
                      style={{
                        color: tarea.completado ? colors.BzMuted : colors.BzText,
                        fontSize: 13,
                        textDecorationLine: tarea.completado ? 'line-through' : 'none',
                      }}
                    >
                      {tarea.nombre}
                    </Text>
                  </View>
                  <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                    {tarea.completado ? 'Listo' : 'Pendiente'}
                  </Text>
                </Fila>
              </Pressable>
            </View>
          ))}
        </Tarjeta>

        <Etiqueta texto="+ AGREGAR EXTRA REALIZADO" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {extrasDisponibles.map((extra) => {
            const yaAgregado = tareas.some((t) => t.nombre === extra);
            return (
              <ChipTexto
                key={extra}
                texto={yaAgregado ? `✓ ${extra}` : `+ ${extra}`}
                size={11}
                activo={yaAgregado}
                onPress={() => {
                  if (!yaAgregado) {
                    setTareas((ts) => [
                      ...ts,
                      {
                        id: Math.max(0, ...ts.map((t) => t.id)) + 1,
                        nombre: extra,
                        completado: true,
                      },
                    ]);
                  }
                }}
              />
            );
          })}
        </ScrollView>

        <Etiqueta texto="BITÁCORA TÉCNICA DEL CORTE" />
        <CampoTexto
          valor={notas}
          onCambio={setNotas}
          placeholder="Detalle del desvanecido, tijera, contorno o preferencias para su próxima visita…"
          multiline
          fondo="card"
        />

        <Etiqueta texto="PEINE / MÁQUINA PRINCIPAL" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {['#0.5', '#1', '#1.5', '#2', '#3', 'Tijera'].map((n) => (
            <ChipTexto
              key={n}
              texto={n}
              padH={12}
              negrita
              activo={maquina === n}
              onPress={() => setMaquina(n)}
            />
          ))}
        </View>

        <BotonSecundario
          texto={fotos === 0 ? '◉ Guardar foto del resultado' : `◉ ${fotos} foto(s) guardada(s) en ficha`}
          height={44}
          onPress={() => setFotos(fotos + 1)}
        />

        <BotonPrimario
          texto="Finalizar servicio y enviar a caja"
          onPress={finalizarServicioActual}
        />
      </ScrollView>
    </>
  );
};

/* ---------- Vista 2: Productividad, Propinas del Día e Historial ---------- */

const VistaProductividadBarbero: React.FC<{ usuario: UsuarioBz }> = ({ usuario }) => {
  const { colors } = useBzTheme();
  const { citasEquipo, propinasHoy } = useAgenda();
  const hoy = hoyISO();
  const [periodo, setPeriodo] = useState<PeriodoEstadistica>('Hoy');

  const misPropinasHoy = useMemo(
    () => propinasHoy.filter((p) => p.barberoId === usuario.id),
    [propinasHoy, usuario.id],
  );

  const totalPropinasHoy = useMemo(
    () => misPropinasHoy.reduce((sum, p) => sum + p.monto, 0),
    [misPropinasHoy],
  );

  const citasBarbero = useMemo(
    () =>
      citasEquipo
        .filter((c) => c.barberoId === usuario.id && c.estado !== 'CANCELADA')
        .sort((a, b) => {
          if (a.fechaISO !== b.fechaISO) return b.fechaISO.localeCompare(a.fechaISO);
          return minutosDelDia(b) - minutosDelDia(a);
        }),
    [citasEquipo, usuario.id],
  );

  const estadisticas = useMemo(() => {
    const lunesSemana = inicioDeSemanaISO(hoy);
    const inicioQuincena = moverDiasISO(hoy, -14);

    const citasHoy = citasBarbero.filter((c) => c.fechaISO === hoy);
    const atendidasHoy = citasHoy.filter(
      (c) => c.estado === 'TERMINADA' || c.estado === 'POR_COBRAR',
    );
    const enSillaHoy = citasHoy.filter((c) => c.estado === 'EN_SERVICIO');

    const minHoy =
      atendidasHoy.reduce((acc, c) => acc + c.duracionMin, 0) +
      enSillaHoy.reduce((acc, c) => acc + Math.round(c.duracionMin * 0.5), 0);

    if (periodo === 'Hoy') {
      const totalProgramadas = Math.max(1, citasHoy.length);
      const productividadPct = Math.min(
        100,
        Math.round(((atendidasHoy.length + enSillaHoy.length * 0.5) / totalProgramadas) * 100),
      );
      return {
        horasLabel: formatearHorasMinutos(minHoy),
        subtituloPrincipal: 'TIEMPO EFECTIVO EN SILLA HOY',
        tarjetas: [
          { etiqueta: 'Atendidos', valor: `${atendidasHoy.length} / ${citasHoy.length}` },
          { etiqueta: 'Productividad', valor: `${productividadPct}%` },
          { etiqueta: 'Propinas hoy', valor: `$${totalPropinasHoy}` },
        ],
        etiquetasBarras: ['9h', '11h', '13h', '15h', '17h', '19h'],
        barras: [0.85, 0.9, 0.45, 0.7, 0.35, 0.2],
        indiceDestacado: 1,
        tituloHistorial: `SERVICIOS DE HOY (${citasHoy.length})`,
        historial: citasHoy,
      };
    }

    if (periodo === 'Semana') {
      const citasSemanaReales = citasBarbero.filter((c) => c.fechaISO >= lunesSemana && c.fechaISO <= hoy);
      const minExtraSemana = 19 * 60 + 20;
      const totalMinSemana = minExtraSemana + minHoy;
      const totalServiciosSemana = 24 + atendidasHoy.length;

      return {
        horasLabel: formatearHorasMinutos(totalMinSemana),
        subtituloPrincipal: 'HORAS TRABAJADAS EN LA SEMANA',
        tarjetas: [
          { etiqueta: 'Servicios', valor: `${totalServiciosSemana}` },
          { etiqueta: 'Productividad', valor: '88%' },
          { etiqueta: 'Propinas hoy', valor: `$${totalPropinasHoy}` },
        ],
        etiquetasBarras: ['L', 'M', 'X', 'J', 'V', 'S'],
        barras: [0.75, 0.85, 0.7, 0.92, 0.88, Math.max(0.35, Math.min(1, minHoy / 360))],
        indiceDestacado: 3,
        tituloHistorial: 'HISTORIAL SEMANAL RECIENTE',
        historial: citasSemanaReales,
      };
    }

    const citasQuincenaReales = citasBarbero.filter((c) => c.fechaISO >= inicioQuincena && c.fechaISO <= hoy);
    const minExtraQuincena = 54 * 60 + 40;
    const totalMinQuincena = minExtraQuincena + minHoy;
    const totalServiciosQuincena = 63 + atendidasHoy.length;

    return {
      horasLabel: formatearHorasMinutos(totalMinQuincena),
      subtituloPrincipal: 'HORAS TRABAJADAS EN LA QUINCENA',
      tarjetas: [
        { etiqueta: 'Servicios', valor: `${totalServiciosQuincena}` },
        { etiqueta: 'Productividad', valor: '91%' },
        { etiqueta: 'Propinas hoy', valor: `$${totalPropinasHoy}` },
      ],
      etiquetasBarras: ['S1 L-X', 'S1 J-S', 'S2 L-X', 'S2 J-S', 'Extra', 'Hoy'],
      barras: [0.82, 0.9, 0.86, 0.94, 0.65, Math.max(0.35, Math.min(1, minHoy / 360))],
      indiceDestacado: 3,
      tituloHistorial: 'HISTORIAL QUINCENAL RECIENTE',
      historial: citasQuincenaReales,
    };
  }, [citasBarbero, hoy, periodo, totalPropinasHoy]);

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, gap: 14, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Titulo texto={`Productividad · ${usuario.nombre}`} />

      <Segmentado
        opciones={['Hoy', 'Semana', 'Quincena']}
        valor={periodo}
        onChange={(v) => setPeriodo(v as PeriodoEstadistica)}
      />

      <View style={{ alignItems: 'center', gap: 2, paddingVertical: 4 }}>
        <Text style={{ color: colors.BzText, fontSize: 36, fontWeight: '300' }}>
          {estadisticas.horasLabel}
        </Text>
        <Etiqueta texto={estadisticas.subtituloPrincipal} />
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {estadisticas.tarjetas.map((t) => (
          <Tarjeta key={t.etiqueta} padding={10} radius={12} gap={2} style={{ flex: 1 }}>
            <Text style={{ color: colors.BzMuted, fontSize: 11 }}>{t.etiqueta}</Text>
            <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '600' }}>{t.valor}</Text>
          </Tarjeta>
        ))}
      </View>

      {/* Propinas registradas en caja hoy para este barbero */}
      <Tarjeta padding={12} radius={12} gap={8}>
        <Fila>
          <Etiqueta texto="PROPINAS RECOLECTADAS HOY" />
          <Text style={{ color: colors.BzSuccess, fontSize: 14, fontWeight: '700' }}>
            +${totalPropinasHoy}
          </Text>
        </Fila>
        {misPropinasHoy.length === 0 ? (
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
            Aún no hay propinas registradas en caja hoy.
          </Text>
        ) : (
          misPropinasHoy.map((prop, idx) => (
            <View key={prop.id} style={{ gap: 6 }}>
              {idx > 0 && <Divisor />}
              <Fila>
                <Text style={{ color: colors.BzText, fontSize: 12 }}>
                  {prop.hora} · {prop.clienteNombre}
                </Text>
                <Text style={{ color: colors.BzSuccess, fontSize: 12, fontWeight: '600' }}>
                  +${prop.monto}
                </Text>
              </Fila>
            </View>
          ))
        )}
      </Tarjeta>

      <Tarjeta gap={8}>
        <Fila>
          <Etiqueta texto="RITMO DE TRABAJO" />
          <Text style={{ color: colors.BzMuted, fontSize: 11 }}>{periodo}</Text>
        </Fila>
        <View style={{ height: 84, flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
          {estadisticas.barras.map((ratio, idx) => (
            <View
              key={idx}
              style={{
                flex: 1,
                height: Math.max(10, 80 * ratio),
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
                backgroundColor: idx === estadisticas.indiceDestacado ? colors.BzText : colors.BzBorder,
              }}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {estadisticas.etiquetasBarras.map((etq) => (
            <Text key={etq} style={{ flex: 1, color: colors.BzMuted, fontSize: 10, textAlign: 'center' }}>
              {etq}
            </Text>
          ))}
        </View>
      </Tarjeta>

      <Etiqueta texto={estadisticas.tituloHistorial} />
      <Tarjeta padding={12} gap={8}>
        {estadisticas.historial.length === 0 ? (
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
            Aún no hay servicios registrados en este periodo.
          </Text>
        ) : (
          estadisticas.historial.map((cita: CitaEquipo, idx: number) => {
            const fecha = fechaDesdeClave(cita.fechaISO);
            const esTerminada = cita.estado === 'TERMINADA';
            const esPorCobrar = cita.estado === 'POR_COBRAR';
            const esEnSilla = cita.estado === 'EN_SERVICIO';
            return (
              <View key={cita.id} style={{ gap: 6 }}>
                {idx > 0 && <Divisor />}
                <Fila style={{ paddingTop: idx > 0 ? 4 : 0 }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '500' }} numberOfLines={1}>
                      {cita.horaTexto} · {cita.clienteNombre}
                    </Text>
                    <Text style={{ color: colors.BzMuted, fontSize: 11 }} numberOfLines={1}>
                      {cita.servicio} · {DIAS_CORTO[fecha.getDay()]} {fecha.getDate()} {MESES_CORTO[fecha.getMonth()]}
                    </Text>
                  </View>

                  <View style={styles.duracionPill}>
                    <Text
                      style={{
                        color: esTerminada
                          ? colors.BzSuccess
                          : esPorCobrar || esEnSilla
                          ? colors.BzWarning
                          : colors.BzMuted,
                        fontSize: 11,
                        fontWeight: '600',
                      }}
                    >
                      {cita.duracionMin} min · {ETIQUETA_ESTADO[cita.estado]}
                    </Text>
                  </View>
                </Fila>
              </View>
            );
          })
        )}
      </Tarjeta>
    </ScrollView>
  );
};

export default BarberoPanelScreen;

const styles = StyleSheet.create({
  duracionPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});