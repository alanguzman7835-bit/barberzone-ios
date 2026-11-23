import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAgenda } from '../constants/AgendaContext';
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
  Divisor,
  Etiqueta,
  Tarjeta,
} from './BzFase3Ui';
import FichaClienteSheet from './FichaClienteSheet';

type SubVista = 'SERVICIO_EN_CURSO' | 'PRODUCTIVIDAD';

interface TareaServicio {
  id: number;
  nombre: string;
  completado: boolean;
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

export const BarberoPanelScreen: React.FC<{
  usuario: UsuarioBz;
  abrirEnComisiones?: boolean;
}> = ({ usuario, abrirEnComisiones = false }) => {
  const { colors } = useBzTheme();
  const [subVista, setSubVista] = useState<SubVista>(
    abrirEnComisiones ? 'PRODUCTIVIDAD' : 'SERVICIO_EN_CURSO',
  );

  useEffect(() => {
    setSubVista(abrirEnComisiones ? 'PRODUCTIVIDAD' : 'SERVICIO_EN_CURSO');
  }, [abrirEnComisiones]);

  return (
    <View style={{ flex: 1 }}>
      {/* Segmentado superior estilo cápsula con pill dorado */}
      <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 }}>
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.BzCard,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.BzBorder,
            padding: 4,
            maxWidth: 720,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          {(
            [
              { titulo: 'Servicio en silla', vista: 'SERVICIO_EN_CURSO' },
              { titulo: 'Productividad', vista: 'PRODUCTIVIDAD' },
            ] as { titulo: string; vista: SubVista }[]
          ).map((p) => {
            const activo = subVista === p.vista;
            return (
              <Pressable
                key={p.vista}
                onPress={() => setSubVista(p.vista)}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 999,
                  backgroundColor: activo ? '#E2C46D' : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: activo ? '#141416' : colors.BzMuted,
                    fontSize: 13,
                    fontWeight: activo ? '700' : '600',
                  }}
                >
                  {p.titulo}
                </Text>
              </Pressable>
            );
          })}
        </View>
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

/* ---------- Vista 1: Servicio en silla ---------- */

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
  const [extrasSel, setExtrasSel] = useState<string[]>([]);
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
      setExtrasSel([]);
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
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 14,
          gap: 14,
          maxWidth: 720,
          width: '100%',
          alignSelf: 'center',
        }}
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
  const todasEtapasListas = tareas.length > 0 && completadas === tareas.length;
  const progresoPct = tareas.length > 0 ? (completadas / tareas.length) * 100 : 0;

  const toggleExtra = (extra: string) => {
    setExtrasSel((prev) =>
      prev.includes(extra) ? prev.filter((e) => e !== extra) : [...prev, extra],
    );
  };

  const finalizarServicioActual = () => {
    if (!todasEtapasListas) return;

    const resumenTecnico = [
      notas.trim(),
      maquina.trim() ? `Máquina/peine: ${maquina.trim()}` : '',
      extrasSel.length > 0 ? `Extras: ${extrasSel.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join(' · ');

    if (resumenTecnico) {
      actualizarNotasTecnicas(citaEnSilla.id, resumenTecnico);
      guardarNotasFicha(citaEnSilla, notas.trim() || resumenTecnico, maquina.trim());
    }

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
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 10,
          gap: 16,
          paddingBottom: 32,
          maxWidth: 720,
          width: '100%',
          alignSelf: 'center',
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta superior del cliente con borde dorado */}
        <View
          style={{
            backgroundColor: colors.BzCard,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#4D4123',
            padding: 16,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
              {/* Miniatura / Avatar cuadrado */}
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 12,
                  backgroundColor: colors.BzBg,
                  borderWidth: 1,
                  borderColor: colors.BzBorder,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    borderWidth: 1.5,
                    borderColor: colors.BzMuted,
                  }}
                />
              </View>

              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: colors.BzText, fontSize: 18, fontWeight: '800' }}>
                  {citaEnSilla.clienteNombre}
                </Text>
                <Text style={{ color: '#E2C46D', fontSize: 13, fontWeight: '700' }}>
                  {citaEnSilla.servicio}
                </Text>
                <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
                  Turno {citaEnSilla.horaTexto} · {citaEnSilla.duracionMin} min
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => setVerFicha(true)}
              style={{
                borderRadius: 10,
                backgroundColor: colors.BzBg,
                borderWidth: 1,
                borderColor: colors.BzBorder,
                paddingHorizontal: 14,
                paddingVertical: 9,
              }}
            >
              <Text style={{ color: colors.BzText, fontSize: 12, fontWeight: '700' }}>
                Pase técnico
              </Text>
            </Pressable>
          </View>

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
              <Text style={{ color: colors.BzMuted, fontSize: 10, letterSpacing: 1 }}>
                INDICACIÓN DEL CLIENTE
              </Text>
              <Text style={{ color: colors.BzText, fontSize: 12, marginTop: 2 }}>
                “{citaEnSilla.notasCliente}”
              </Text>
            </View>
          ) : null}
        </View>

        {/* Etapas + Barra de progreso */}
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.BzText, fontSize: 13.5, fontWeight: '700' }}>
              Etapas
            </Text>
            <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
              {completadas} de {tareas.length}
            </Text>
          </View>

          {/* Barra de progreso */}
          <View
            style={{
              height: 4,
              borderRadius: 999,
              backgroundColor: colors.BzCard,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: '100%',
                width: `${progresoPct}%`,
                backgroundColor: '#E2C46D',
                borderRadius: 999,
              }}
            />
          </View>

          {/* Tarjeta lista de etapas */}
          <View
            style={{
              backgroundColor: colors.BzCard,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.BzBorder,
              overflow: 'hidden',
            }}
          >
            {tareas.map((tarea, idx) => (
              <View key={tarea.id}>
                {idx > 0 && <View style={{ height: 1, backgroundColor: colors.BzBorder }} />}
                <Pressable
                  onPress={() =>
                    setTareas((ts) =>
                      ts.map((t) => (t.id === tarea.id ? { ...t, completado: !t.completado } : t)),
                    )
                  }
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    paddingVertical: 15,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 5,
                        borderWidth: 1.2,
                        borderColor: tarea.completado ? '#E2C46D' : colors.BzBorder,
                        backgroundColor: tarea.completado ? '#E2C46D' : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {tarea.completado && (
                        <Text style={{ color: '#141416', fontSize: 12, fontWeight: '800' }}>✓</Text>
                      )}
                    </View>
                    <Text
                      style={{
                        color: tarea.completado ? colors.BzMuted : colors.BzText,
                        fontSize: 13.5,
                        fontWeight: '600',
                        textDecorationLine: tarea.completado ? 'line-through' : 'none',
                      }}
                    >
                      {tarea.nombre}
                    </Text>
                  </View>

                  <Text
                    style={{
                      color: tarea.completado ? colors.BzSuccess : colors.BzMuted,
                      fontSize: 11.5,
                      fontWeight: tarea.completado ? '700' : '500',
                    }}
                  >
                    {tarea.completado ? 'Listo' : 'Pendiente'}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        {/* Extras: Grid de 5 tarjetas verticales */}
        <View style={{ gap: 10 }}>
          <Text style={{ color: colors.BzText, fontSize: 13.5, fontWeight: '700' }}>
            Extras
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {extrasDisponibles.map((extra) => {
              const activo = extrasSel.includes(extra);
              return (
                <Pressable
                  key={extra}
                  onPress={() => toggleExtra(extra)}
                  style={{
                    flex: 1,
                    minWidth: 112,
                    backgroundColor: activo ? '#221E14' : colors.BzCard,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: activo ? '#E2C46D' : colors.BzBorder,
                    padding: 10,
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: '100%',
                      aspectRatio: 1,
                      borderRadius: 10,
                      backgroundColor: colors.BzBg,
                      borderWidth: 1,
                      borderColor: activo ? '#5C4D24' : colors.BzBorder,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {activo ? (
                      <Text style={{ color: '#E2C46D', fontSize: 16, fontWeight: '800' }}>✓</Text>
                    ) : (
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 3,
                          borderWidth: 1.5,
                          borderColor: colors.BzMuted,
                        }}
                      />
                    )}
                  </View>

                  <Text
                    style={{
                      color: activo ? '#E2C46D' : colors.BzText,
                      fontSize: 11.5,
                      fontWeight: activo ? '700' : '600',
                      textAlign: 'center',
                    }}
                    numberOfLines={1}
                  >
                    {extra}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Notas del corte */}
        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.BzText, fontSize: 13.5, fontWeight: '700' }}>
            Notas del corte
          </Text>
          <TextInput
            value={notas}
            onChangeText={setNotas}
            placeholder="Desvanecido, tijera, contorno o preferencias"
            placeholderTextColor={colors.BzMuted}
            multiline
            textAlignVertical="top"
            style={{
              minHeight: 84,
              borderRadius: 14,
              backgroundColor: colors.BzCard,
              borderWidth: 1,
              borderColor: colors.BzBorder,
              paddingHorizontal: 14,
              paddingVertical: 12,
              color: colors.BzText,
              fontSize: 13,
            }}
          />
        </View>

        {/* Peine / máquina */}
        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.BzText, fontSize: 13.5, fontWeight: '700' }}>
            Peine / máquina
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {['#0.5', '#1', '#1.5', '#2', '#3', 'Tijera'].map((n) => {
              const activo = maquina === n;
              return (
                <Pressable
                  key={n}
                  onPress={() => setMaquina(n)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                    borderRadius: 999,
                    backgroundColor: activo ? '#221E14' : colors.BzCard,
                    borderWidth: 1,
                    borderColor: activo ? '#E2C46D' : colors.BzBorder,
                  }}
                >
                  <Text
                    style={{
                      color: activo ? '#E2C46D' : colors.BzText,
                      fontSize: 12.5,
                      fontWeight: activo ? '700' : '600',
                    }}
                  >
                    {n}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Foto del resultado */}
        <Pressable
          onPress={() => setFotos((f) => f + 1)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.BzCard,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: fotos > 0 ? '#E2C46D' : colors.BzBorder,
            padding: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: colors.BzBg,
                borderWidth: 1,
                borderColor: colors.BzBorder,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: fotos > 0 ? '#E2C46D' : colors.BzMuted, fontSize: 14 }}>◉</Text>
            </View>
            <Text style={{ color: colors.BzText, fontSize: 13.5, fontWeight: '700' }}>
              {fotos === 0 ? 'Foto del resultado' : `Foto del resultado (${fotos})`}
            </Text>
          </View>

          <Text style={{ color: fotos > 0 ? '#E2C46D' : colors.BzMuted, fontSize: 12 }}>
            {fotos === 0 ? 'Opcional' : 'Guardada ✓'}
          </Text>
        </Pressable>

        {/* Botón inferior: Completa las etapas (deshabilitado) -> Finalizar servicio y enviar a caja (dorado) */}
        <Pressable
          disabled={!todasEtapasListas}
          onPress={finalizarServicioActual}
          style={({ pressed }) => [
            {
              height: 52,
              borderRadius: 14,
              backgroundColor: todasEtapasListas ? '#E2C46D' : '#1E1E22',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 2,
            },
            pressed && todasEtapasListas && { opacity: 0.9 },
          ]}
        >
          <Text
            style={{
              color: todasEtapasListas ? '#141416' : colors.BzMuted,
              fontSize: 14.5,
              fontWeight: '800',
            }}
          >
            {todasEtapasListas ? 'Finalizar servicio y enviar a caja' : 'Completa las etapas'}
          </Text>
        </Pressable>
      </ScrollView>
    </>
  );
};

/* ---------- Vista 2: Productividad ---------- */

const VistaProductividadBarbero: React.FC<{ usuario: UsuarioBz }> = ({ usuario }) => {
  const { colors } = useBzTheme();
  const { citasEquipo } = useAgenda();
  const hoy = hoyISO();

  const citasHoy = useMemo(
    () =>
      citasEquipo
        .filter(
          (c) =>
            c.barberoId === usuario.id &&
            c.fechaISO === hoy &&
            c.estado !== 'CANCELADA',
        )
        .sort((a, b) => minutosDelDia(b) - minutosDelDia(a)),
    [citasEquipo, usuario.id, hoy],
  );

  const hechasHoy = useMemo(
    () => citasHoy.filter((c) => c.estado === 'TERMINADA' || c.estado === 'POR_COBRAR'),
    [citasHoy],
  );

  const metricas = useMemo(() => {
    const cantidad = hechasHoy.length;
    const totalMin = hechasHoy.reduce((acc, c) => acc + c.duracionMin, 0);
    const promedioMin = cantidad > 0 ? Math.round(totalMin / cantidad) : 0;
    const generado = hechasHoy.reduce((acc, c) => acc + c.precio, 0);
    return { cantidad, promedioMin, generado };
  }, [hechasHoy]);

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 16,
        paddingBottom: 32,
        maxWidth: 720,
        width: '100%',
        alignSelf: 'center',
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* 3 Tarjetas métricas superiores */}
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
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Servicios hoy</Text>
          <Text style={{ color: colors.BzText, fontSize: 24, fontWeight: '800' }}>
            {metricas.cantidad}
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
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Tiempo promedio</Text>
          <Text style={{ color: colors.BzText, fontSize: 24, fontWeight: '800' }}>
            {metricas.promedioMin} min
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
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Generado</Text>
          <Text style={{ color: colors.BzSuccess, fontSize: 24, fontWeight: '800' }}>
            ${metricas.generado.toLocaleString('en-US')}
          </Text>
        </View>
      </View>

      {/* Sección Hechos hoy */}
      <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '700' }}>
        Hechos hoy
      </Text>

      <View
        style={{
          backgroundColor: colors.BzCard,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.BzBorder,
          overflow: 'hidden',
        }}
      >
        {hechasHoy.length === 0 ? (
          <View style={{ padding: 18 }}>
            <Text style={{ color: colors.BzMuted, fontSize: 13 }}>
              Aún no has finalizado servicios hoy. Cuando termines un corte en silla aparecerá aquí.
            </Text>
          </View>
        ) : (
          hechasHoy.map((cita: CitaEquipo, idx: number) => (
            <View key={cita.id}>
              {idx > 0 && <View style={{ height: 1, backgroundColor: colors.BzBorder }} />}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  gap: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      backgroundColor: colors.BzBg,
                      borderWidth: 1,
                      borderColor: colors.BzBorder,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        borderWidth: 1.5,
                        borderColor: colors.BzMuted,
                      }}
                    />
                  </View>

                  <Text
                    style={{ color: colors.BzText, fontSize: 14, fontWeight: '700', flex: 1 }}
                    numberOfLines={1}
                  >
                    {cita.servicio}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
                    {cita.horaTexto}
                  </Text>
                  <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
                    {cita.duracionMin} min
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default BarberoPanelScreen;