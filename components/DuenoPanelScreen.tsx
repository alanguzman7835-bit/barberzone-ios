import React, { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useBzTheme } from '../constants/BzTheme';
import { UsuarioBz } from '../constants/Sesion';
import {
  BotonMini,
  BotonPrimario,
  ChipTexto,
  Divisor,
  Etiqueta,
  Fila,
  Segmentado,
  Tarjeta,
  Titulo,
} from './BzFase3Ui';

type SubVista = 'DASHBOARD' | 'CONFIGURACION' | 'SUCURSALES_EQUIPO';

interface ServicioConfig {
  id: number;
  nombre: string;
  duracionMin: number;
  precio: number;
  comisionBarberoPct: number;
  activo: boolean;
}

interface SucursalInfo {
  nombre: string;
  direccion: string;
  ventasHoy: number;
  citasHoy: number;
  estadoCaja: string;
}

const SUCURSALES: SucursalInfo[] = [
  { nombre: 'Olivete', direccion: 'Av. Olivete #214', ventasHoy: 6270, citasHoy: 18, estadoCaja: 'Abierta' },
  { nombre: 'Centro', direccion: 'Calle Hidalgo #88', ventasHoy: 5410, citasHoy: 15, estadoCaja: 'Abierta' },
  { nombre: 'Providencia', direccion: 'Blvd. Providencia #510', ventasHoy: 4890, citasHoy: 13, estadoCaja: 'Abierta' },
];

/**
 * Panel Ejecutivo del Dueño: Dashboard (12) · Servicios y comisiones (16) · Sucursales y equipo (22)
 */
export const DuenoPanelScreen: React.FC<{ usuario: UsuarioBz; onNewUser: () => void }> = ({ usuario, onNewUser }) => {
  const [subVista, setSubVista] = useState<SubVista>('DASHBOARD');

  const [servicios, setServicios] = useState<ServicioConfig[]>([
    { id: 1, nombre: 'Corte de cabello', duracionMin: 45, precio: 180, comisionBarberoPct: 45, activo: true },
    { id: 2, nombre: 'Arreglo de barba', duracionMin: 30, precio: 120, comisionBarberoPct: 45, activo: true },
    { id: 3, nombre: 'Corte + barba', duracionMin: 75, precio: 280, comisionBarberoPct: 45, activo: true },
    { id: 4, nombre: 'Afeitado tradicional', duracionMin: 30, precio: 150, comisionBarberoPct: 40, activo: true },
    { id: 5, nombre: 'Mascarilla negra', duracionMin: 20, precio: 80, comisionBarberoPct: 35, activo: false },
  ]);

  const pestanas: { titulo: string; vista: SubVista }[] = [
    { titulo: 'Dashboard', vista: 'DASHBOARD' },
    { titulo: 'Precios y Comisiones', vista: 'CONFIGURACION' },
    { titulo: 'Sucursales y Equipo', vista: 'SUCURSALES_EQUIPO' },
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

      {subVista === 'DASHBOARD' && <VistaDashboardGlobal usuario={usuario} sucursales={SUCURSALES} />}

      {subVista === 'CONFIGURACION' && (
        <VistaConfiguracionServicios
          servicios={servicios}
          onActualizarPrecio={(id, delta) =>
            setServicios((ss) => ss.map((s) => (s.id === id ? { ...s, precio: Math.max(50, s.precio + delta) } : s)))
          }
          onToggleActivo={(id, activo) => setServicios((ss) => ss.map((s) => (s.id === id ? { ...s, activo } : s)))}
        />
      )}

      {subVista === 'SUCURSALES_EQUIPO' && <VistaSucursalesYEquipo sucursales={SUCURSALES} onNewUser={onNewUser} />}
    </View>
  );
};

/* ---------- Vista 12: Dashboard ---------- */

const CardKpi: React.FC<{ titulo: string; valor: string }> = ({ titulo, valor }) => {
  const { colors } = useBzTheme();
  return (
    <Tarjeta padding={12} radius={12} gap={4} style={{ flex: 1 }}>
      <Text style={{ color: colors.BzMuted, fontSize: 9, letterSpacing: 1 }}>{titulo}</Text>
      <Text style={{ color: colors.BzText, fontSize: 18, fontWeight: '600' }}>{valor}</Text>
    </Tarjeta>
  );
};

const VistaDashboardGlobal: React.FC<{ usuario: UsuarioBz; sucursales: SucursalInfo[] }> = ({ usuario, sucursales }) => {
  const { colors } = useBzTheme();
  const [periodo, setPeriodo] = useState('Hoy');

  const mult = periodo === 'Semana' ? 6 : periodo === 'Mes' ? 24 : 1;
  const ventaTotal = sucursales.reduce((a, s) => a + s.ventasHoy, 0) * mult;
  const citasTotales = sucursales.reduce((a, s) => a + s.citasHoy, 0) * mult;
  const ticketPromedio = citasTotales > 0 ? Math.trunc(ventaTotal / citasTotales) : 0;
  const maxVenta = Math.max(1, ...sucursales.map((s) => s.ventasHoy * mult));

  const top = [
    { titulo: '1. Corte de cabello', sub: '52 % de ingresos', total: `$${8620 * mult}` },
    { titulo: '2. Corte + barba', sub: '31 % de ingresos', total: `$${5140 * mult}` },
    { titulo: '3. Arreglo de barba', sub: '17 % de ingresos', total: `$${2810 * mult}` },
  ];

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8, gap: 14 }}>
      <Titulo texto={`Reporte Ejecutivo · ${usuario.nombre}`} />

      <Segmentado opciones={['Hoy', 'Semana', 'Mes']} valor={periodo} onChange={setPeriodo} />

      <Tarjeta padding={16} gap={4} style={{ alignItems: 'center' }}>
        <Etiqueta texto={`VENTA CONSOLIDADA (${periodo.toUpperCase()})`} />
        <Text style={{ color: colors.BzText, fontSize: 34, fontWeight: '300' }}>${ventaTotal}</Text>
        <Text style={{ color: colors.BzSuccess, fontSize: 12 }}>+14.2 % vs periodo anterior</Text>
      </Tarjeta>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <CardKpi titulo="CITAS ATENDIDAS" valor={`${citasTotales}`} />
        <CardKpi titulo="TICKET PROMEDIO" valor={`$${ticketPromedio}`} />
      </View>

      <Etiqueta texto="COMPARATIVA POR SUCURSAL" />
      <Tarjeta gap={12}>
        {sucursales.map((suc) => {
          const monto = suc.ventasHoy * mult;
          const ratio = Math.min(1, Math.max(0.1, monto / maxVenta));
          return (
            <View key={suc.nombre} style={{ gap: 4 }}>
              <Fila>
                <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '500' }}>{suc.nombre}</Text>
                <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
                  ${monto} · {suc.citasHoy * mult} citas
                </Text>
              </Fila>
              <View style={{ height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: colors.BzBg }}>
                <View style={{ width: `${ratio * 100}%`, height: 6, borderRadius: 3, backgroundColor: colors.BzText }} />
              </View>
            </View>
          );
        })}
      </Tarjeta>

      <Etiqueta texto="SERVICIOS MÁS SOLICITADOS" />
      <Tarjeta>
        {top.map((t, idx) => (
          <View key={t.titulo} style={{ gap: 8 }}>
            {idx > 0 && <Divisor />}
            <Fila>
              <View>
                <Text style={{ color: colors.BzText, fontSize: 13 }}>{t.titulo}</Text>
                <Text style={{ color: colors.BzMuted, fontSize: 11 }}>{t.sub}</Text>
              </View>
              <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '600' }}>{t.total}</Text>
            </Fila>
          </View>
        ))}
      </Tarjeta>
    </ScrollView>
  );
};

/* ---------- Vista 16: Servicios y comisiones ---------- */

const VistaConfiguracionServicios: React.FC<{
  servicios: ServicioConfig[];
  onActualizarPrecio: (id: number, delta: number) => void;
  onToggleActivo: (id: number, activo: boolean) => void;
}> = ({ servicios, onActualizarPrecio, onToggleActivo }) => {
  const { colors } = useBzTheme();
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8, gap: 12 }}>
      <Titulo texto="Catálogo de servicios" />
      <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Ajusta precios y disponibilidad en todas las sucursales</Text>

      {servicios.map((srv) => (
        <Tarjeta key={srv.id} gap={10}>
          <Fila>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '500' }}>{srv.nombre}</Text>
              <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                {srv.duracionMin} min · Comisión barbero: {srv.comisionBarberoPct}%
              </Text>
            </View>
            <Switch
              value={srv.activo}
              onValueChange={(v) => onToggleActivo(srv.id, v)}
              trackColor={{ false: colors.BzBorder, true: colors.BzText }}
              thumbColor={colors.BzBg}
            />
          </Fila>
          <Divisor />
          <Fila>
            <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Precio al público</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <BotonMini texto="-$10" size={11} onPress={() => onActualizarPrecio(srv.id, -10)} />
              <Text style={{ color: colors.BzText, fontSize: 16, fontWeight: '600' }}>${srv.precio}</Text>
              <BotonMini texto="+$10" size={11} onPress={() => onActualizarPrecio(srv.id, 10)} />
            </View>
          </Fila>
        </Tarjeta>
      ))}
    </ScrollView>
  );
};

/* ---------- Vista 22: Sucursales y equipo ---------- */

const VistaSucursalesYEquipo: React.FC<{ sucursales: SucursalInfo[]; onNewUser: () => void }> = ({
  sucursales,
  onNewUser,
}) => {
  const { colors } = useBzTheme();
  const equipo = [
    { nombre: 'Luis G.', rolSuc: 'Encargado · Olivete', estado: 'Activo' },
    { nombre: 'Ana M.', rolSuc: 'Recepción / Caja · Olivete', estado: 'En turno' },
    { nombre: 'Carlos R.', rolSuc: 'Barbero · Olivete', estado: 'En silla' },
    { nombre: 'Diego M.', rolSuc: 'Barbero · Centro', estado: 'Disponible' },
  ];

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8, gap: 12 }}>
      <Titulo texto="Sucursales y equipo" />

      <Etiqueta texto={`SUCURSALES ACTIVAS (${sucursales.length})`} />
      {sucursales.map((suc) => (
        <Tarjeta key={suc.nombre} gap={0}>
          <Fila>
            <View>
              <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '500' }}>{suc.nombre}</Text>
              <Text style={{ color: colors.BzMuted, fontSize: 11 }}>{suc.direccion}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }}>${suc.ventasHoy}</Text>
              <Text style={{ color: colors.BzSuccess, fontSize: 11 }}>{suc.estadoCaja}</Text>
            </View>
          </Fila>
        </Tarjeta>
      ))}

      <Fila>
        <Etiqueta texto="PERSONAL REGISTRADO" />
        <Pressable onPress={onNewUser}>
          <Text style={{ color: colors.BzText, fontSize: 12 }}>+ Nuevo usuario ›</Text>
        </Pressable>
      </Fila>

      <Tarjeta gap={10}>
        {equipo.map((m, idx) => (
          <View key={m.nombre} style={{ gap: 10 }}>
            {idx > 0 && <Divisor />}
            <Fila>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.BzSuccess }} />
                <View>
                  <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '500' }}>{m.nombre}</Text>
                  <Text style={{ color: colors.BzMuted, fontSize: 11 }}>{m.rolSuc}</Text>
                </View>
              </View>
              <Text style={{ color: colors.BzMuted, fontSize: 11 }}>{m.estado}</Text>
            </Fila>
          </View>
        ))}
      </Tarjeta>

      <BotonPrimario texto="Dar de alta nuevo integrante" onPress={onNewUser} />
    </ScrollView>
  );
};
