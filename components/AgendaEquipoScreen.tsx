import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BzColors, useBzTheme } from '../constants/BzTheme';
import { RolSesion, UsuarioBz } from '../constants/Sesion';
import {
  BotonPrimario,
  BotonSecundario,
  BzSheet,
  CampoTexto,
  ChipTexto,
  Divisor,
  Etiqueta,
  Fila,
  Segmentado,
  Tarjeta,
  Titulo,
} from './BzFase3Ui';

type EstadoCita = 'PROGRAMADA' | 'CONFIRMADA' | 'LLEGO' | 'EN_SERVICIO' | 'TERMINADA' | 'CANCELADA';

const ETIQUETA_ESTADO: Record<EstadoCita, string> = {
  PROGRAMADA: 'Programada',
  CONFIRMADA: 'Confirmada',
  LLEGO: 'Llegó',
  EN_SERVICIO: 'En servicio',
  TERMINADA: 'Terminada',
  CANCELADA: 'Cancelada',
};

const colorEstado = (e: EstadoCita, c: BzColors): string => {
  switch (e) {
    case 'PROGRAMADA':
      return c.BzText;
    case 'CONFIRMADA':
    case 'LLEGO':
      return c.BzSuccess;
    case 'EN_SERVICIO':
      return c.BzWarning;
    case 'TERMINADA':
      return c.BzMuted;
    case 'CANCELADA':
      return c.BzDanger;
  }
};

interface CitaAgenda {
  id: number;
  hora: string;
  duracionMin: number;
  cliente: string;
  telefono: string;
  servicio: string;
  total: number;
  barbero: string;
  inicialesBarbero: string;
  sucursal: string;
  estado: EstadoCita;
  notas: string;
  esWalkIn: boolean;
}

interface ItemListaEspera {
  id: number;
  cliente: string;
  servicio: string;
  barberoPreferido: string;
  esperaMin: number;
}

/**
 * Vista 2 · Agenda del día + Vista 4 (Walk-in) + Vista 5 (Detalle de cita)
 */
export const AgendaEquipoScreen: React.FC<{ usuario: UsuarioBz; onNuevaCita: () => void }> = ({
  usuario,
  onNuevaCita,
}) => {
  const { colors } = useBzTheme();
  const esBarbero = usuario.rol === RolSesion.BARBERO;
  const suc = usuario.sucursal;

  const [citas, setCitas] = useState<CitaAgenda[]>([
    { id: 1, hora: '10:00', duracionMin: 45, cliente: 'Juan Pérez', telefono: '33 1234 5678', servicio: 'Corte de cabello', total: 180, barbero: 'Carlos R.', inicialesBarbero: 'CR', sucursal: suc, estado: 'CONFIRMADA', notas: 'Prefiere fade bajo', esWalkIn: false },
    { id: 2, hora: '10:30', duracionMin: 45, cliente: 'Luis Ortiz', telefono: '33 9876 5432', servicio: 'Corte de cabello', total: 180, barbero: 'Diego M.', inicialesBarbero: 'DM', sucursal: suc, estado: 'CONFIRMADA', notas: '', esWalkIn: false },
    { id: 3, hora: '11:00', duracionMin: 75, cliente: 'Andrés López', telefono: '33 4567 8901', servicio: 'Corte + barba', total: 300, barbero: 'Carlos R.', inicialesBarbero: 'CR', sucursal: suc, estado: 'CONFIRMADA', notas: '', esWalkIn: false },
    { id: 4, hora: '11:00', duracionMin: 30, cliente: 'Pablo Ruiz', telefono: '33 2233 4455', servicio: 'Arreglo de barba', total: 120, barbero: 'Luis S.', inicialesBarbero: 'LS', sucursal: suc, estado: 'CONFIRMADA', notas: '', esWalkIn: false },
    { id: 5, hora: '14:00', duracionMin: 45, cliente: 'Iván Cruz', telefono: '33 6677 8899', servicio: 'Corte de cabello', total: 180, barbero: 'Luis S.', inicialesBarbero: 'LS', sucursal: suc, estado: 'PROGRAMADA', notas: '', esWalkIn: false },
    { id: 6, hora: '14:30', duracionMin: 45, cliente: 'Mario Díaz', telefono: '33 1122 3344', servicio: 'Corte de cabello', total: 180, barbero: 'Carlos R.', inicialesBarbero: 'CR', sucursal: suc, estado: 'PROGRAMADA', notas: '', esWalkIn: false },
    { id: 7, hora: '15:30', duracionMin: 30, cliente: 'Walk-in · Barba', telefono: 'Sin teléfono', servicio: 'Arreglo de barba', total: 120, barbero: 'Diego M.', inicialesBarbero: 'DM', sucursal: suc, estado: 'EN_SERVICIO', notas: '', esWalkIn: true },
  ]);

  const [listaEspera, setListaEspera] = useState<ItemListaEspera[]>([
    { id: 1, cliente: 'Hugo P.', servicio: 'Barba', barberoPreferido: 'Cualquiera', esperaMin: 15 },
    { id: 2, cliente: 'Raúl T.', servicio: 'Ceja', barberoPreferido: 'Carlos R.', esperaMin: 25 },
    { id: 3, cliente: 'Beto L.', servicio: 'Corte', barberoPreferido: 'Cualquiera', esperaMin: 35 },
  ]);

  const barberos = ['Todos', 'Carlos R.', 'Diego M.', 'Luis S.'];
  const [barberoFiltro, setBarberoFiltro] = useState(esBarbero ? usuario.nombre : 'Todos');
  const [vistaSemana, setVistaSemana] = useState(false);
  const [citaSelId, setCitaSelId] = useState<number | null>(null);
  const [mostrarWalkIn, setMostrarWalkIn] = useState(false);

  const citasFiltradas = citas.filter(
    (c) =>
      (barberoFiltro === 'Todos' || c.barbero.startsWith(barberoFiltro.split(' ')[0])) &&
      c.estado !== 'CANCELADA'
  );
  const citaSel = citas.find((c) => c.id === citaSelId) ?? null;

  const asignarEspera = (espera: ItemListaEspera) => {
    setListaEspera((l) => l.filter((x) => x.id !== espera.id));
    setCitas((cs) => [
      ...cs,
      {
        id: Math.max(0, ...cs.map((c) => c.id)) + 1,
        hora: 'Ahora',
        duracionMin: 30,
        cliente: espera.cliente,
        telefono: 'Walk-in',
        servicio: espera.servicio,
        total: 150,
        barbero: espera.barberoPreferido === 'Cualquiera' ? 'Carlos R.' : espera.barberoPreferido,
        inicialesBarbero: 'CR',
        sucursal: suc,
        estado: 'EN_SERVICIO',
        notas: '',
        esWalkIn: true,
      },
    ]);
  };

  const cambiarEstado = (id: number, estado: EstadoCita) =>
    setCitas((cs) => cs.map((c) => (c.id === id ? { ...c, estado } : c)));

  return (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
      <Fila>
        <View>
          <Text style={{ color: colors.BzText, fontSize: 16, fontWeight: '500' }}>‹ Mar 17 nov 2026 ›</Text>
          <Text style={{ color: colors.BzMuted, fontSize: 11 }}>Sucursal: {suc}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {!esBarbero && (
            <Pressable
              onPress={() => setMostrarWalkIn(true)}
              style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.BzBorder }}
            >
              <Text style={{ color: colors.BzText, fontSize: 12 }}>Walk-in</Text>
            </Pressable>
          )}
          <Pressable
            onPress={onNuevaCita}
            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.BzText }}
          >
            <Text style={{ color: colors.BzBg, fontSize: 12, fontWeight: '600' }}>+ Cita</Text>
          </Pressable>
        </View>
      </Fila>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Segmentado
          ajustado
          size={11}
          padV={6}
          opciones={['Día', 'Semana']}
          valor={vistaSemana ? 'Semana' : 'Día'}
          onChange={(v) => setVistaSemana(v === 'Semana')}
        />
        {!esBarbero && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ gap: 6 }}>
            {barberos.map((b) => (
              <ChipTexto key={b} texto={b} size={11} padH={10} apagado activo={barberoFiltro === b} onPress={() => setBarberoFiltro(b)} />
            ))}
          </ScrollView>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
        {citasFiltradas.map((cita) => {
          const colorBorde = cita.esWalkIn ? colors.BzWarning : colorEstado(cita.estado, colors);
          return (
            <Pressable key={cita.id} onPress={() => setCitaSelId(cita.id)}>
              <Tarjeta padding={12} radius={12} gap={0}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 4, height: 42, borderRadius: 2, backgroundColor: colorBorde }} />
                  <View style={{ width: 12 }} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '600' }}>{cita.hora}</Text>
                      <Text style={{ color: colors.BzText, fontSize: 13 }}>· {cita.cliente}</Text>
                    </View>
                    <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                      {cita.servicio} · {cita.barbero} ({cita.duracionMin} min)
                    </Text>
                  </View>
                  <View
                    style={{
                      borderRadius: 20,
                      backgroundColor: colors.BzBg,
                      borderWidth: 1,
                      borderColor: colors.BzBorder,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ color: colorBorde, fontSize: 10 }}>{ETIQUETA_ESTADO[cita.estado]}</Text>
                  </View>
                </View>
              </Tarjeta>
            </Pressable>
          );
        })}

        {listaEspera.length > 0 && !esBarbero && (
          <>
            <View style={{ height: 6 }} />
            <Text style={{ color: colors.BzMuted, fontSize: 11, letterSpacing: 1.5, fontWeight: '600' }}>
              LISTA DE ESPERA ({listaEspera.length})
            </Text>
            {listaEspera.map((espera) => (
              <Tarjeta key={`w_${espera.id}`} padding={12} radius={12} gap={0}>
                <Fila>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.BzWarning }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '500' }}>
                        {espera.cliente} · {espera.servicio}
                      </Text>
                      <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                        Barbero: {espera.barberoPreferido} · ~{espera.esperaMin} min
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => asignarEspera(espera)}
                    style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.BzBorder }}
                  >
                    <Text style={{ color: colors.BzText, fontSize: 11 }}>Asignar</Text>
                  </Pressable>
                </Fila>
              </Tarjeta>
            ))}
          </>
        )}
      </ScrollView>

      {/* Vista 5 · Detalle de cita */}
      <BzSheet visible={citaSel !== null} onDismiss={() => setCitaSelId(null)}>
        {citaSel && (
          <DetalleCitaSheet
            cita={citaSel}
            onAvanzarEstado={(e) => cambiarEstado(citaSel.id, e)}
            onCancelar={() => {
              cambiarEstado(citaSel.id, 'CANCELADA');
              setCitaSelId(null);
            }}
          />
        )}
      </BzSheet>

      {/* Vista 4 · Registrar walk-in */}
      <BzSheet visible={mostrarWalkIn} onDismiss={() => setMostrarWalkIn(false)}>
        <RegistrarWalkInSheet
          posicion={listaEspera.length + 1}
          onAgregar={(nombre, servicio, barbero) => {
            setListaEspera((l) => [
              ...l,
              {
                id: Math.max(0, ...l.map((x) => x.id)) + 1,
                cliente: nombre,
                servicio,
                barberoPreferido: barbero,
                esperaMin: (l.length + 1) * 15,
              },
            ]);
            setMostrarWalkIn(false);
          }}
          onCancelar={() => setMostrarWalkIn(false)}
        />
      </BzSheet>
    </View>
  );
};

const DetalleCitaSheet: React.FC<{
  cita: CitaAgenda;
  onAvanzarEstado: (e: EstadoCita) => void;
  onCancelar: () => void;
}> = ({ cita, onAvanzarEstado, onCancelar }) => {
  const { colors } = useBzTheme();

  let siguiente: { estado: EstadoCita; texto: string } | null = null;
  if (cita.estado === 'PROGRAMADA' || cita.estado === 'CONFIRMADA') siguiente = { estado: 'LLEGO', texto: 'Marcar llegada' };
  else if (cita.estado === 'LLEGO') siguiente = { estado: 'EN_SERVICIO', texto: 'Iniciar servicio' };
  else if (cita.estado === 'EN_SERVICIO') siguiente = { estado: 'TERMINADA', texto: 'Terminar servicio' };

  return (
    <>
      <Fila>
        <Titulo texto="Detalle de cita" />
        <Text style={{ color: colorEstado(cita.estado, colors), fontSize: 12, fontWeight: '600' }}>
          {ETIQUETA_ESTADO[cita.estado]}
        </Text>
      </Fila>

      <Tarjeta fondo="bg" padding={12} radius={12} gap={6}>
        <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '600' }}>{cita.cliente}</Text>
        <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Tel: {cita.telefono}</Text>
        <Divisor />
        <Text style={{ color: colors.BzText, fontSize: 12 }}>
          Horario: {cita.hora} ({cita.duracionMin} min)
        </Text>
        <Text style={{ color: colors.BzText, fontSize: 12 }}>
          Barbero: {cita.barbero} · {cita.sucursal}
        </Text>
        <Text style={{ color: colors.BzText, fontSize: 12 }}>
          Servicio: {cita.servicio} · ${cita.total}
        </Text>
        {cita.notas.length > 0 && <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Notas: {cita.notas}</Text>}
      </Tarjeta>

      {siguiente && <BotonPrimario texto={siguiente.texto} height={46} semibold={false} onPress={() => onAvanzarEstado(siguiente!.estado)} />}
      <BotonSecundario texto="Cancelar cita" height={44} color={colors.BzDanger} borderColor={colors.BzDanger} onPress={onCancelar} />
    </>
  );
};

const RegistrarWalkInSheet: React.FC<{
  posicion: number;
  onAgregar: (nombre: string, servicio: string, barbero: string) => void;
  onCancelar: () => void;
}> = ({ posicion, onAgregar, onCancelar }) => {
  const { colors } = useBzTheme();
  const [nombre, setNombre] = useState('');
  const [servicioSel, setServicioSel] = useState('Corte');
  const [barberoSel, setBarberoSel] = useState('Cualquiera');

  const servicios = ['Corte', 'Barba', 'Corte + barba', 'Ceja'];
  const barberos = ['Cualquiera', 'Carlos R.', 'Diego M.', 'Luis S.'];

  return (
    <>
      <Titulo texto="Registrar walk-in" />
      <CampoTexto valor={nombre} onCambio={setNombre} placeholder="Nombre del cliente" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {servicios.map((s) => (
          <ChipTexto key={s} texto={s} inactivoBg="bg" activo={s === servicioSel} onPress={() => setServicioSel(s)} />
        ))}
      </ScrollView>

      <Etiqueta texto="BARBERO PREFERIDO" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {barberos.map((b) => (
          <ChipTexto key={b} texto={b} inactivoBg="bg" activo={b === barberoSel} onPress={() => setBarberoSel(b)} />
        ))}
      </ScrollView>

      <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
        Espera estimada: ~{posicion * 15} min (Posición {posicion})
      </Text>

      <BotonPrimario
        texto="Agregar a la lista"
        height={46}
        semibold={false}
        onPress={() => {
          if (nombre.trim()) onAgregar(nombre.trim(), servicioSel, barberoSel);
        }}
      />
      <BotonSecundario texto="Cancelar" height={44} onPress={onCancelar} />
    </>
  );
};
