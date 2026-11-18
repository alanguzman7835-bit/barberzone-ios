import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
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

type SubVista = 'SERVICIO_EN_CURSO' | 'COMISIONES';

interface TareaServicio {
  id: number;
  nombre: string;
  precio: number;
  completado: boolean;
}

/**
 * Módulo del Barbero: Servicio en curso (10) · Mis comisiones (11)
 */
export const BarberoPanelScreen: React.FC<{ usuario: UsuarioBz; abrirEnComisiones?: boolean }> = ({
  usuario,
  abrirEnComisiones = false,
}) => {
  const [subVista, setSubVista] = useState<SubVista>(abrirEnComisiones ? 'COMISIONES' : 'SERVICIO_EN_CURSO');

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 10 }}>
        {(
          [
            { titulo: 'Servicio en curso', vista: 'SERVICIO_EN_CURSO' },
            { titulo: 'Mis comisiones', vista: 'COMISIONES' },
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
        <VistaServicioEnCurso onTerminarServicio={() => setSubVista('COMISIONES')} />
      ) : (
        <VistaMisComisiones usuario={usuario} />
      )}
    </View>
  );
};

/* ---------- Vista 10: Servicio en curso ---------- */

const VistaServicioEnCurso: React.FC<{ onTerminarServicio: () => void }> = ({ onTerminarServicio }) => {
  const { colors } = useBzTheme();
  const [segundos, setSegundos] = useState(24 * 60 + 10);
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    if (!activo) return;
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [activo]);

  const [tareas, setTareas] = useState<TareaServicio[]>([
    { id: 1, nombre: 'Corte de cabello', precio: 180, completado: true },
    { id: 2, nombre: 'Arreglo de barba', precio: 120, completado: false },
  ]);

  const extras = [
    { nombre: 'Ceja y bigote', precio: 50 },
    { nombre: 'Mascarilla', precio: 80 },
    { nombre: 'Exfoliación', precio: 90 },
  ];

  const [notas, setNotas] = useState('');
  const [maquina, setMaquina] = useState('#2');
  const [fotos, setFotos] = useState(0);
  const [mensajeFinal, setMensajeFinal] = useState<string | null>(null);

  const progreso = Math.min(1, Math.max(0, segundos / (75 * 60)));
  const pad = (n: number) => String(n).padStart(2, '0');
  const reloj = `${pad(Math.floor(segundos / 3600))}:${pad(Math.floor((segundos % 3600) / 60))}:${pad(segundos % 60)}`;
  const totalTareas = tareas.reduce((a, t) => a + t.precio, 0);

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, gap: 12 }} keyboardShouldPersistTaps="handled">
      <Fila>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: colors.BzCard,
              borderWidth: 1,
              borderColor: colors.BzMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.BzText, fontSize: 12 }}>JP</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.BzText, fontSize: 16, fontWeight: '500' }}>Juan Pérez</Text>
            <Text style={{ color: colors.BzMuted, fontSize: 11 }}>Prefiere fade bajo, sin raya</Text>
          </View>
        </View>
        <Pressable
          onPress={() => setActivo(!activo)}
          style={{ borderRadius: 20, backgroundColor: colors.BzText, paddingHorizontal: 10, paddingVertical: 5 }}
        >
          <Text style={{ color: colors.BzBg, fontSize: 11, fontWeight: '600' }}>{activo ? 'En servicio' : 'Pausado'}</Text>
        </Pressable>
      </Fila>

      <View style={{ alignItems: 'center', paddingVertical: 4 }}>
        <Text style={{ color: colors.BzText, fontSize: 36, fontWeight: '300', fontVariant: ['tabular-nums'] }}>{reloj}</Text>
        <View style={{ height: 6 }} />
        <View style={{ width: '100%', height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: colors.BzBorder }}>
          <View style={{ width: `${progreso * 100}%`, height: 4, backgroundColor: colors.BzText }} />
        </View>
        <View style={{ height: 4 }} />
        <Text style={{ color: colors.BzMuted, fontSize: 11 }}>de 75 min estimados</Text>
      </View>

      <Tarjeta padding={12}>
        {tareas.map((tarea, idx) => (
          <View key={tarea.id} style={{ gap: 8 }}>
            {idx > 0 && <Divisor />}
            <Pressable
              onPress={() =>
                setTareas((ts) => ts.map((t) => (t.id === tarea.id ? { ...t, completado: !t.completado } : t)))
              }
              style={{ paddingVertical: 4 }}
            >
              <Fila>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: tarea.completado ? colors.BzText : colors.BzMuted,
                      backgroundColor: tarea.completado ? colors.BzText : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {tarea.completado && <Text style={{ color: colors.BzBg, fontSize: 11, fontWeight: '700' }}>✓</Text>}
                  </View>
                  <Text style={{ color: colors.BzText, fontSize: 13 }}>{tarea.nombre}</Text>
                </View>
                <Text style={{ color: colors.BzMuted, fontSize: 12 }}>${tarea.precio}</Text>
              </Fila>
            </Pressable>
          </View>
        ))}
      </Tarjeta>

      <Etiqueta texto="+ AGREGAR EXTRA" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {extras.map((e) => {
          const yaAgregado = tareas.some((t) => t.nombre === e.nombre);
          return (
            <ChipTexto
              key={e.nombre}
              texto={`${e.nombre} $${e.precio}`}
              size={11}
              activo={yaAgregado}
              onPress={() => {
                if (!yaAgregado) {
                  setTareas((ts) => [
                    ...ts,
                    { id: Math.max(0, ...ts.map((t) => t.id)) + 1, nombre: e.nombre, precio: e.precio, completado: true },
                  ]);
                }
              }}
            />
          );
        })}
      </ScrollView>

      <Etiqueta texto="NOTAS DEL CORTE" />
      <CampoTexto
        valor={notas}
        onCambio={setNotas}
        placeholder="Escribe una nota técnica para la ficha del cliente…"
        multiline
        fondo="card"
      />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {['#1', '#2', '#3', '#4'].map((n) => (
          <ChipTexto key={n} texto={n} padH={14} negrita activo={maquina === n} onPress={() => setMaquina(n)} />
        ))}
      </View>

      <BotonSecundario
        texto={fotos === 0 ? '◉ Agregar foto del corte' : `◉ ${fotos} foto(s) adjunta(s)`}
        height={44}
        onPress={() => setFotos(fotos + 1)}
      />

      {mensajeFinal && <Text style={{ color: colors.BzSuccess, fontSize: 12 }}>{mensajeFinal}</Text>}

      <BotonPrimario
        texto={`Terminar servicio ($${totalTareas})`}
        onPress={() => {
          setActivo(false);
          setMensajeFinal(`Servicio cerrado y enviado a caja ($${totalTareas}).`);
          onTerminarServicio();
        }}
      />
    </ScrollView>
  );
};

/* ---------- Vista 11: Mis comisiones ---------- */

const VistaMisComisiones: React.FC<{ usuario: UsuarioBz }> = ({ usuario }) => {
  const { colors } = useBzTheme();
  const [periodo, setPeriodo] = useState('Semana');

  const datos: Record<string, { total: string; desglose: [string, string][]; barras: number[] }> = {
    Hoy: {
      total: '$324',
      desglose: [['Servicios', '$252'], ['Productos', '$22'], ['Propinas', '$50']],
      barras: [0.85, 0.2, 0.2, 0.2, 0.2, 0.2],
    },
    Quincena: {
      total: '$3,920',
      desglose: [['Servicios', '$3,040'], ['Productos', '$380'], ['Propinas', '$500']],
      barras: [0.6, 0.75, 0.55, 0.9, 0.7, 0.8],
    },
    Semana: {
      total: '$1,840',
      desglose: [['Servicios', '$1,420'], ['Productos', '$180'], ['Propinas', '$240']],
      barras: [0.5, 0.7, 0.4, 0.9, 0.15, 0.15],
    },
  };
  const d = datos[periodo];

  const serviciosHoy: [string, string][] = [
    ['10:00 Juan Pérez · Corte', '+$81'],
    ['11:30 Andrés López · Barba', '+$54'],
    ['12:15 Mario Díaz · Corte', '+$81'],
    ['14:00 Iván Cruz · Corte + barba', '+$108'],
  ];

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, gap: 14 }}>
      <Titulo texto={`Mis comisiones · ${usuario.nombre}`} />

      <Segmentado opciones={['Hoy', 'Semana', 'Quincena']} valor={periodo} onChange={setPeriodo} />

      <View style={{ alignItems: 'center', gap: 2 }}>
        <Text style={{ color: colors.BzText, fontSize: 36, fontWeight: '300' }}>{d.total}</Text>
        <Etiqueta texto={`COMISIONES DE ${periodo.toUpperCase()}`} />
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {d.desglose.map(([etq, monto]) => (
          <Tarjeta key={etq} padding={10} radius={12} gap={2} style={{ flex: 1 }}>
            <Text style={{ color: colors.BzMuted, fontSize: 11 }}>{etq}</Text>
            <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }}>{monto}</Text>
          </Tarjeta>
        ))}
      </View>

      <Tarjeta>
        <View style={{ height: 84, flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
          {d.barras.map((ratio, idx) => (
            <View
              key={idx}
              style={{
                flex: 1,
                height: 80 * ratio,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
                backgroundColor: idx === 3 ? colors.BzText : '#3A3A40',
              }}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {['L', 'M', 'X', 'J', 'V', 'S'].map((dia) => (
            <Text key={dia} style={{ flex: 1, color: colors.BzMuted, fontSize: 10, textAlign: 'center' }}>
              {dia}
            </Text>
          ))}
        </View>
      </Tarjeta>

      <Etiqueta texto="SERVICIOS DE HOY" />
      <Tarjeta padding={12}>
        {serviciosHoy.map(([desc, com], idx) => (
          <View key={desc} style={{ gap: 8 }}>
            {idx > 0 && <Divisor />}
            <Fila>
              <Text style={{ color: colors.BzText, fontSize: 12, flex: 1 }}>{desc}</Text>
              <Text style={{ color: colors.BzSuccess, fontSize: 12, fontWeight: '600' }}>{com}</Text>
            </Fila>
          </View>
        ))}
      </Tarjeta>
    </ScrollView>
  );
};
