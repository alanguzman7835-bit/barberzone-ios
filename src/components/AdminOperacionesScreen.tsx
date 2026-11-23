import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useBzTheme } from '../constants/BzTheme';
import { useCatalogoConfig } from '../constants/CatalogoConfigContext';
import { RolSesion, UsuarioBz } from '../constants/Sesion';
import { CasillasPin, EstadoPin } from './Animaciones';
import {
  BotonPrimario,
  BotonSecundario,
  BzSheet,
  ChipTexto,
  Divisor,
  Etiqueta,
  Fila,
  Tarjeta,
  Titulo,
  Volver,
} from './BzFase3Ui';

type SubVista = 'MENU_MAS' | 'FICHA_CLIENTE' | 'PRENOMINA' | 'BITACORA';

interface RegistroNomina {
  id: string;
  iniciales: string;
  nombre: string;
  servicios: number;
  productos: number;
  propinas: number;
  deducciones: number;
  aprobada: boolean;
}

interface EventoAuditoria {
  hora: string;
  categoria: string;
  descripcion: string;
  autorizo: string;
}

function obtenerIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 0 || !partes[0]) return 'BZ';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
}

/**
 * Administración Operativa: Menú "Más" · Ficha cliente · Pre-nómina · Bitácora · PIN
 */
export const AdminOperacionesScreen: React.FC<{
  usuario: UsuarioBz;
  onIrInventario: () => void;
  onNewUser: () => void;
  onLogout: () => void;
}> = ({ usuario, onIrInventario, onNewUser, onLogout }) => {
  const { empleados } = useCatalogoConfig();
  const [subVista, setSubVista] = useState<SubVista>('MENU_MAS');
  const [mostrarPin, setMostrarPin] = useState(false);
  const [mensajeAut, setMensajeAut] = useState<string | null>(null);
  const [aprobadasIds, setAprobadasIds] = useState<Record<string, boolean>>({});

  // Genera registros de pre-nómina únicamente con los empleados reales (excluyendo al Dueño)
  const nominas: RegistroNomina[] = useMemo(
    () =>
      empleados
        .filter((e) => e.activo && e.rol !== 'Dueño')
        .map((e) => ({
          id: e.id,
          iniciales: obtenerIniciales(e.nombre),
          nombre: e.nombre,
          servicios: 0,
          productos: 0,
          propinas: 0,
          deducciones: 0,
          aprobada: Boolean(aprobadasIds[e.id]),
        })),
    [empleados, aprobadasIds],
  );

  const [bitacora, setBitacora] = useState<EventoAuditoria[]>([]);

  const agregarEvento = (e: EventoAuditoria) => setBitacora((b) => [e, ...b]);

  return (
    <View style={{ flex: 1 }}>
      {subVista === 'MENU_MAS' && (
        <VistaMenuMas
          usuario={usuario}
          mensajeAutorizacion={mensajeAut}
          onFicha={() => setSubVista('FICHA_CLIENTE')}
          onPrenomina={() => setSubVista('PRENOMINA')}
          onBitacora={() => setSubVista('BITACORA')}
          onPin={() => setMostrarPin(true)}
          onIrInventario={onIrInventario}
          onNewUser={onNewUser}
          onLogout={onLogout}
        />
      )}

      {subVista === 'FICHA_CLIENTE' && <VistaFichaCliente onVolver={() => setSubVista('MENU_MAS')} />}

      {subVista === 'PRENOMINA' && (
        <VistaPreNomina
          nominas={nominas}
          onAprobar={(id) => {
            const reg = nominas.find((n) => n.id === id);
            if (reg) {
              setAprobadasIds((prev) => ({ ...prev, [id]: true }));
              agregarEvento({
                hora: 'Ahora',
                categoria: 'Caja',
                descripcion: `Pre-nómina aprobada (${reg.nombre})`,
                autorizo: usuario.nombre,
              });
            }
          }}
          onVolver={() => setSubVista('MENU_MAS')}
        />
      )}

      {subVista === 'BITACORA' && <VistaBitacora eventos={bitacora} onVolver={() => setSubVista('MENU_MAS')} />}

      <BzSheet visible={mostrarPin} onDismiss={() => setMostrarPin(false)}>
        <AutorizacionPinSheet
          usuarioNombre={usuario.nombre}
          pinEsperado={usuario.pin}
          onAutorizado={() => {
            setMostrarPin(false);
            setMensajeAut(`Descuento 10 % autorizado por ${usuario.nombre}.`);
            agregarEvento({
              hora: 'Ahora',
              categoria: 'Descuentos',
              descripcion: 'Descuento 10 % · Orden actual',
              autorizo: `Autorizó ${usuario.nombre}`,
            });
          }}
          onRechazar={() => setMostrarPin(false)}
        />
      </BzSheet>
    </View>
  );
};

/* ---------- Menú "Más" ---------- */

const VistaMenuMas: React.FC<{
  usuario: UsuarioBz;
  mensajeAutorizacion: string | null;
  onFicha: () => void;
  onPrenomina: () => void;
  onBitacora: () => void;
  onPin: () => void;
  onIrInventario: () => void;
  onNewUser: () => void;
  onLogout: () => void;
}> = ({ usuario, mensajeAutorizacion, onFicha, onPrenomina, onBitacora, onPin, onIrInventario, onNewUser, onLogout }) => {
  const { colors } = useBzTheme();
  const opciones = [
    { titulo: 'Clientes y tarjetas de lealtad', sub: 'Consultar fichas y sellos de lealtad', accion: onFicha },
    { titulo: 'Inventario, traspasos y compras', sub: 'Control de stock sucursal', accion: onIrInventario },
    { titulo: 'Pre-nómina quincenal', sub: 'Comisiones y deducciones del equipo', accion: onPrenomina },
    { titulo: 'Bitácora de auditoría', sub: 'Descuentos, precios y caja', accion: onBitacora },
    { titulo: 'Autorizar descuento con PIN', sub: 'Validación rápida de encargado', accion: onPin },
  ];

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingVertical: 16, gap: 14 }}>
      <Fila>
        <View style={{ flex: 1 }}>
          <Titulo texto="Más · Administración" size={22} />
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
            {usuario.nombre} · {usuario.rol} ({usuario.sucursal})
          </Text>
        </View>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.BzCard,
            borderWidth: 1,
            borderColor: colors.BzMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.BzText, fontSize: 14 }}>{usuario.iniciales}</Text>
        </View>
      </Fila>

      {mensajeAutorizacion && (
        <Tarjeta padding={12} radius={12} borderColor={colors.BzSuccess}>
          <Text style={{ color: colors.BzSuccess, fontSize: 12 }}>{mensajeAutorizacion}</Text>
        </Tarjeta>
      )}

      <Tarjeta padding={0} gap={0}>
        {opciones.map((o, idx) => (
          <View key={o.titulo}>
            {idx > 0 && (
              <View style={{ paddingHorizontal: 14 }}>
                <Divisor />
              </View>
            )}
            <Pressable onPress={o.accion} style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
              <Fila>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '500' }}>{o.titulo}</Text>
                  <Text style={{ color: colors.BzMuted, fontSize: 11 }}>{o.sub}</Text>
                </View>
                <Text style={{ color: colors.BzMuted, fontSize: 18 }}>›</Text>
              </Fila>
            </Pressable>
          </View>
        ))}
      </Tarjeta>

      {usuario.rol === RolSesion.DUENO && (
        <BotonPrimario texto="Registrar nuevo usuario (Equipo)" semibold={false} onPress={onNewUser} />
      )}

      <View style={{ flex: 1 }} />

      <BotonSecundario
        texto="Cerrar sesión"
        height={48}
        color={colors.BzDanger}
        borderColor={colors.BzDanger}
        onPress={onLogout}
      />
    </ScrollView>
  );
};

/* ---------- Ficha de cliente ---------- */

const VistaFichaCliente: React.FC<{ onVolver: () => void }> = ({ onVolver }) => {
  const { colors } = useBzTheme();
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 12, alignItems: 'center' }}>
      <View style={{ alignSelf: 'flex-start' }}>
        <Volver onPress={onVolver} />
      </View>

      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.BzCard,
          borderWidth: 1,
          borderColor: colors.BzMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: colors.BzText, fontSize: 20 }}>CL</Text>
      </View>
      <Titulo texto="Clientes registrados" />
      <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Busca o selecciona un cliente desde Agenda o Caja</Text>

      <Tarjeta style={{ width: '100%', alignItems: 'center' }}>
        <View style={{ alignSelf: 'flex-start' }}>
          <Etiqueta texto="PROGRAMA DE LEALTAD" />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {Array.from({ length: 10 }).map((_, idx) => (
            <View
              key={idx}
              style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: colors.BzBg, borderWidth: 1, borderColor: colors.BzBorder }}
            />
          ))}
        </View>
        <Text style={{ color: colors.BzMuted, fontSize: 11 }}>10 visitas acumuladas = 1 servicio de cortesía</Text>
      </Tarjeta>
    </ScrollView>
  );
};

/* ---------- Pre-nómina ---------- */

const VistaPreNomina: React.FC<{
  nominas: RegistroNomina[];
  onAprobar: (id: string) => void;
  onVolver: () => void;
}> = ({ nominas, onAprobar, onVolver }) => {
  const { colors } = useBzTheme();
  const [sel, setSel] = useState(0);

  if (nominas.length === 0) {
    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 12 }}>
        <Volver onPress={onVolver} />
        <Titulo texto="Pre-nómina" size={22} />
        <Tarjeta padding={18} radius={14} gap={6}>
          <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }}>
            Sin empleados registrados
          </Text>
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
            Cuando des de alta barberos o personal en Base de datos, aparecerán aquí automáticamente para calcular su pre-nómina.
          </Text>
        </Tarjeta>
      </ScrollView>
    );
  }

  const actual = nominas[sel] ?? nominas[0];
  const neto = actual.servicios + actual.productos + actual.propinas - actual.deducciones;

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 12 }}>
      <Volver onPress={onVolver} />
      <Titulo texto="Pre-nómina" size={22} />

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
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: actual.aprobada ? colors.BzSuccess : colors.BzWarning }} />
          <Text style={{ color: colors.BzText, fontSize: 11 }}>{actual.aprobada ? 'Aprobada' : 'En revisión'}</Text>
        </View>
        <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Quincena actual</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {nominas.map((b, idx) => (
          <ChipTexto key={b.id} texto={b.nombre} activo={idx === sel} onPress={() => setSel(idx)} />
        ))}
      </ScrollView>

      <Tarjeta>
        <Fila>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Servicios</Text>
          <Text style={{ color: colors.BzText, fontSize: 13 }}>${actual.servicios}</Text>
        </Fila>
        <Fila>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Productos</Text>
          <Text style={{ color: colors.BzText, fontSize: 13 }}>${actual.productos}</Text>
        </Fila>
        <Fila>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Propinas</Text>
          <Text style={{ color: colors.BzText, fontSize: 13 }}>${actual.propinas}</Text>
        </Fila>
        <Fila>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Deducciones</Text>
          <Text style={{ color: colors.BzDanger, fontSize: 13 }}>-${actual.deducciones}</Text>
        </Fila>
        <Divisor />
        <Fila>
          <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '600' }}>Neto a pagar</Text>
          <Text style={{ color: colors.BzText, fontSize: 18, fontWeight: '600' }}>${neto}</Text>
        </Fila>
      </Tarjeta>

      {!actual.aprobada && (
        <BotonPrimario texto={`Aprobar pre-nómina de ${actual.nombre}`} onPress={() => onAprobar(actual.id)} />
      )}
    </ScrollView>
  );
};

/* ---------- Bitácora ---------- */

const VistaBitacora: React.FC<{ eventos: EventoAuditoria[]; onVolver: () => void }> = ({ eventos, onVolver }) => {
  const { colors } = useBzTheme();
  const [filtro, setFiltro] = useState('Todo');
  const filtrados = filtro === 'Todo' ? eventos : eventos.filter((e) => e.categoria === filtro);

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 12 }}>
      <Volver onPress={onVolver} />
      <Titulo texto="Bitácora de auditoría" size={22} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {['Todo', 'Descuentos', 'Precios', 'Caja'].map((c) => (
          <ChipTexto key={c} texto={c} size={11} activo={filtro === c} onPress={() => setFiltro(c)} />
        ))}
      </ScrollView>

      {filtrados.length === 0 ? (
        <Tarjeta padding={16} radius={12}>
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
            No hay eventos registrados en la bitácora todavía.
          </Text>
        </Tarjeta>
      ) : (
        filtrados.map((ev, idx) => (
          <Tarjeta key={`${ev.hora}-${idx}`} padding={12} radius={12} gap={4}>
            <Fila>
              <Text style={{ color: colors.BzText, fontSize: 12, fontWeight: '600' }}>{ev.hora}</Text>
              <Text style={{ color: colors.BzMuted, fontSize: 11 }}>{ev.autorizo}</Text>
            </Fila>
            <Text style={{ color: colors.BzText, fontSize: 13 }}>{ev.descripcion}</Text>
          </Tarjeta>
        ))
      )}

      <Text style={{ color: colors.BzMuted, fontSize: 11, textAlign: 'center', paddingTop: 6 }}>
        Los eventos no se pueden editar ni borrar
      </Text>
    </ScrollView>
  );
};

/* ---------- Autorización con PIN ---------- */

const AutorizacionPinSheet: React.FC<{
  usuarioNombre: string;
  pinEsperado: string;
  onAutorizado: () => void;
  onRechazar: () => void;
}> = ({ usuarioNombre, pinEsperado, onAutorizado, onRechazar }) => {
  const { colors } = useBzTheme();
  const [pin, setPin] = useState('');
  const [estado, setEstado] = useState<EstadoPin>(EstadoPin.NORMAL);

  useEffect(() => {
    if (estado !== EstadoPin.ERROR) return;
    const t = setTimeout(() => setEstado(EstadoPin.NORMAL), 650);
    return () => clearTimeout(t);
  }, [estado]);

  const filas = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', '⌫'],
  ];

  const presionar = (tecla: string) => {
    if (estado === EstadoPin.EXITO) return;
    if (tecla === '⌫') {
      setPin((p) => p.slice(0, -1));
      setEstado(EstadoPin.NORMAL);
      return;
    }
    if (pin.length >= 4) return;
    const next = pin + tecla;
    setPin(next);
    if (next.length === 4) {
      if (next === pinEsperado) {
        setEstado(EstadoPin.EXITO);
        onAutorizado();
      } else {
        setEstado(EstadoPin.ERROR);
        setPin('');
      }
    }
  };

  return (
    <View style={{ alignItems: 'center', gap: 12 }}>
      <Titulo texto="Autorizar descuento" />

      <Tarjeta fondo="bg" padding={12} radius={12} gap={6} style={{ width: '100%' }}>
        <Fila>
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Autoriza</Text>
          <Text style={{ color: colors.BzText, fontSize: 12 }}>{usuarioNombre}</Text>
        </Fila>
        <Fila>
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Descuento</Text>
          <Text style={{ color: colors.BzText, fontSize: 12, fontWeight: '600' }}>10 %</Text>
        </Fila>
        <Fila>
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Motivo</Text>
          <Text style={{ color: colors.BzText, fontSize: 12 }}>Autorización manual</Text>
        </Fila>
      </Tarjeta>

      <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Ingresa tu PIN de seguridad</Text>
      <CasillasPin pin={pin} estado={estado} />

      <View style={{ width: '100%', gap: 8 }}>
        {filas.map((fila, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
            {fila.map((tecla, j) =>
              tecla === '' ? (
                <View key={j} style={{ flex: 1, height: 44 }} />
              ) : (
                <Pressable
                  key={j}
                  onPress={() => presionar(tecla)}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: colors.BzBg,
                    borderWidth: 1,
                    borderColor: colors.BzBorder,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: colors.BzText, fontSize: 18 }}>{tecla}</Text>
                </Pressable>
              )
            )}
          </View>
        ))}
      </View>

      <BotonSecundario texto="Rechazar" height={44} color={colors.BzDanger} borderColor={colors.BzDanger} onPress={onRechazar} />
    </View>
  );
};