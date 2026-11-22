import React, { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useBzTheme } from '../constants/BzTheme';
import { useHorarios } from '../constants/HorariosContext';
import { RolSesion, UsuarioBz } from '../constants/Sesion';
import { useDesktopLayout } from '../hooks/useDesktopLayout';
import {
  BotonMini,
  BotonPrimario,
  BotonSecundario,
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

export const DuenoPanelScreen: React.FC<{
  usuario: UsuarioBz;
  onNewUser: () => void;
  onAbrirHorariosPermisos?: (tab: 'HORARIOS' | 'PERMISOS') => void;
}> = ({ usuario, onNewUser, onAbrirHorariosPermisos }) => {
  const { isDesktop } = useDesktopLayout();
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
          contentContainerStyle={{
            paddingHorizontal: isDesktop ? 0 : 20,
            paddingVertical: 10,
            gap: 8,
          }}
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

      {subVista === 'SUCURSALES_EQUIPO' && (
        <VistaSucursalesYEquipo
          sucursales={SUCURSALES}
          onNewUser={onNewUser}
          onAbrirHorariosPermisos={onAbrirHorariosPermisos}
        />
      )}
    </View>
  );
};

/* ---------- Vista 12: Dashboard ---------- */

const CardKpi: React.FC<{ titulo: string; valor: string; acento?: string }> = ({ titulo, valor, acento }) => {
  const { colors } = useBzTheme();
  return (
    <Tarjeta padding={16} radius={14} gap={4} style={{ flex: 1 }}>
      <Text style={{ color: acento ?? colors.BzText, fontSize: 26, fontWeight: '700' }}>{valor}</Text>
      <Text style={{ color: colors.BzMuted, fontSize: 10, letterSpacing: 1.2 }}>{titulo}</Text>
    </Tarjeta>
  );
};

const VistaDashboardGlobal: React.FC<{ usuario: UsuarioBz; sucursales: SucursalInfo[] }> = ({ usuario, sucursales }) => {
  const { colors } = useBzTheme();
  const { isDesktop } = useDesktopLayout();
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
    <ScrollView contentContainerStyle={{ paddingHorizontal: isDesktop ? 0 : 20, paddingVertical: 8, gap: 16 }}>
      <View
        style={{
          flexDirection: isDesktop ? 'row' : 'column',
          alignItems: isDesktop ? 'center' : 'stretch',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Titulo texto={`Reporte Ejecutivo · ${usuario.nombre}`} />
        <View style={isDesktop ? { width: 280 } : undefined}>
          <Segmentado opciones={['Hoy', 'Semana', 'Mes']} valor={periodo} onChange={setPeriodo} />
        </View>
      </View>

      {/* KPIs horizontales en PC */}
      <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 12 }}>
        <CardKpi
          titulo={`VENTA CONSOLIDADA (${periodo.toUpperCase()})`}
          valor={`$${ventaTotal}`}
          acento={colors.BzSuccess}
        />
        <View style={{ flexDirection: 'row', gap: 12, flex: isDesktop ? 2 : undefined }}>
          <CardKpi titulo="CITAS ATENDIDAS" valor={`${citasTotales}`} />
          <CardKpi titulo="TICKET PROMEDIO" valor={`$${ticketPromedio}`} acento="#E2C46D" />
        </View>
      </View>

      {/* Comparativa y Top Servicios lado a lado en PC */}
      <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16, alignItems: 'flex-start' }}>
        <Tarjeta gap={12} style={isDesktop ? { flex: 1.2 } : undefined}>
          <Etiqueta texto="COMPARATIVA POR SUCURSAL" />
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
                  <View style={{ width: `${ratio * 100}%`, height: 6, borderRadius: 3, backgroundColor: '#E2C46D' }} />
                </View>
              </View>
            );
          })}
        </Tarjeta>

        <Tarjeta gap={10} style={isDesktop ? { flex: 1 } : undefined}>
          <Etiqueta texto="SERVICIOS MÁS SOLICITADOS" />
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
      </View>
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
  const { isDesktop } = useDesktopLayout();

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: isDesktop ? 0 : 20, paddingVertical: 8, gap: 12 }}>
      <Titulo texto="Catálogo de servicios" />
      <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
        Ajusta precios y disponibilidad en todas las sucursales
      </Text>

      <View style={{ flexDirection: isDesktop ? 'row' : 'column', flexWrap: 'wrap', gap: 12 }}>
        {servicios.map((srv) => (
          <Tarjeta key={srv.id} gap={10} style={isDesktop ? { width: '48.8%' } : undefined}>
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
                trackColor={{ false: colors.BzBorder, true: '#E2C46D' }}
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
      </View>
    </ScrollView>
  );
};

/* ---------- Vista 22: Sucursales y equipo ---------- */

const ROLES_CAMBIO: RolSesion[] = [
  RolSesion.BARBERO,
  RolSesion.RECEPCION,
  RolSesion.ENCARGADO,
];

const VistaSucursalesYEquipo: React.FC<{
  sucursales: SucursalInfo[];
  onNewUser: () => void;
  onAbrirHorariosPermisos?: (tab: 'HORARIOS' | 'PERMISOS') => void;
}> = ({ sucursales, onNewUser, onAbrirHorariosPermisos }) => {
  const { colors } = useBzTheme();
  const { isDesktop } = useDesktopLayout();
  const { horariosBarberos, horariosCajeros, cambiarRolIntegrante, permisos } = useHorarios();

  const equipoCompleto = [...horariosBarberos, ...horariosCajeros];

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: isDesktop ? 0 : 20,
        paddingVertical: 8,
        gap: 14,
        paddingBottom: 24,
      }}
    >
      <Titulo texto="Sucursales y equipo" />

      <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16, alignItems: 'flex-start' }}>
        {/* Izquierda: Horarios y Sucursales */}
        <View style={{ flex: 1, gap: 12, width: '100%' }}>
          {onAbrirHorariosPermisos && (
            <Tarjeta padding={14} radius={14} gap={10}>
              <Etiqueta texto="TURNOS, DESCANSOS Y PERMISOS" />
              <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
                Sube horarios por separado para Barberos o Cajeros y envíalos en Word a WhatsApp ({permisos.length} permisos activos).
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <BotonPrimario
                    texto="Horarios y Turnos"
                    height={42}
                    onPress={() => onAbrirHorariosPermisos('HORARIOS')}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <BotonSecundario
                    texto={`Permisos (${permisos.length})`}
                    height={42}
                    onPress={() => onAbrirHorariosPermisos('PERMISOS')}
                  />
                </View>
              </View>
            </Tarjeta>
          )}

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
        </View>

        {/* Derecha: Plantilla y cambio de roles */}
        <View style={{ flex: 1.15, gap: 12, width: '100%' }}>
          <Fila>
            <Etiqueta texto={`PERSONAL REGISTRADO (${equipoCompleto.length})`} />
            <Pressable onPress={onNewUser}>
              <Text style={{ color: '#E2C46D', fontSize: 12, fontWeight: '600' }}>
                + Nuevo Barbero / Cajero ›
              </Text>
            </Pressable>
          </Fila>

          <Tarjeta gap={12}>
            {equipoCompleto.map((m, idx) => (
              <View key={m.empleadoId} style={{ gap: 8 }}>
                {idx > 0 && <Divisor />}
                <Fila>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.BzSuccess }} />
                    <View>
                      <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '600' }}>{m.nombre}</Text>
                      <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                        {m.rolSesion} · Sucursal {m.sucursal}
                      </Text>
                    </View>
                  </View>
                </Fila>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={{ color: colors.BzMuted, fontSize: 10 }}>Cambiar rol:</Text>
                  {ROLES_CAMBIO.map((r) => (
                    <ChipTexto
                      key={r}
                      texto={r.split('/')[0]}
                      size={10}
                      padH={9}
                      padV={4}
                      activo={m.rolSesion === r}
                      onPress={() => cambiarRolIntegrante(m.empleadoId, r)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </Tarjeta>

          <BotonPrimario texto="Registrar nuevo Barbero / Cajero" onPress={onNewUser} />
        </View>
      </View>
    </ScrollView>
  );
};