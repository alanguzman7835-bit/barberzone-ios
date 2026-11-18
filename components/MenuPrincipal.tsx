import React, { useEffect, useMemo, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { BzTypography, useBzTheme } from '../constants/BzTheme';
import { RolSesion, UsuarioBz } from '../constants/Sesion';
import { AdminOperacionesScreen } from './AdminOperacionesScreen';
import { AgendaEquipoScreen } from './AgendaEquipoScreen';
import { BarberoPanelScreen } from './BarberoPanelScreen';
import {
    BzAppearanceSheet,
    BzHeader,
    BzNotificacion,
    BzNotificacionesSheet,
    GooeyNavBar,
    GooeyTabItem,
    notificacionesIniciales,
} from './BzUiShell';
import { CajaScreen } from './CajaScreen';
import { CrearUsuarioScreen } from './CrearUsuarioScreen';
import { DuenoPanelScreen } from './DuenoPanelScreen';
import { InventarioScreen } from './InventarioScreen';

type TabPrincipal =
  | 'INICIO'
  | 'AGENDAR'
  | 'CAJA'
  | 'INVENTARIO'
  | 'DUENO_DASH'
  | 'BARBERO_PANEL'
  | 'TIENDA'
  | 'ROL';

/* ---------- Iconos Vectoriales de Barra Inferior ---------- */

const TabIcon: React.FC<{ tab: TabPrincipal; color: string; isMenu?: boolean }> = ({ tab, color, isMenu }) => {
  if (isMenu) {
    return (
      <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
        <Line x1={4} y1={7} x2={20} y2={7} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        <Line x1={4} y1={12} x2={20} y2={12} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        <Line x1={4} y1={17} x2={20} y2={17} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      </Svg>
    );
  }
  switch (tab) {
    case 'INICIO':
      return (
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
          <Path d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H4C3.45 21 3 20.55 3 20V10.5Z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
          <Path d="M9 21V13H15V21" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
        </Svg>
      );
    case 'AGENDAR':
      return (
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={4} width={18} height={17} rx={2.5} stroke={color} strokeWidth={1.6} />
          <Line x1={3} y1={9.5} x2={21} y2={9.5} stroke={color} strokeWidth={1.6} />
          <Line x1={8} y1={2.5} x2={8} y2={5.5} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
          <Line x1={16} y1={2.5} x2={16} y2={5.5} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        </Svg>
      );
    case 'CAJA':
      return (
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
          <Rect x={2.5} y={5.5} width={19} height={13} rx={2.5} stroke={color} strokeWidth={1.6} />
          <Circle cx={12} cy={12} r={2.5} stroke={color} strokeWidth={1.6} />
        </Svg>
      );
    case 'INVENTARIO':
      return (
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
          <Path d="M21 8L12 3L3 8V16L12 21L21 16V8Z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
          <Path d="M3.3 8.2L12 13L20.7 8.2M12 13V21" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
        </Svg>
      );
    case 'DUENO_DASH':
      return (
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
          <Line x1={6} y1={19} x2={6} y2={11} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Line x1={12} y1={19} x2={12} y2={6} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Line x1={18} y1={19} x2={18} y2={14} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    case 'BARBERO_PANEL':
      return (
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
          <Circle cx={6} cy={6} r={3} stroke={color} strokeWidth={1.6} />
          <Circle cx={6} cy={18} r={3} stroke={color} strokeWidth={1.6} />
          <Line x1={20} y1={4} x2={8.12} y2={15.88} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
          <Line x1={14.47} y1={14.48} x2={20} y2={20} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
          <Line x1={8.12} y1={8.12} x2={12} y2={12} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        </Svg>
      );
    case 'TIENDA':
      return (
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
          <Path d="M6 7H18L19 20H5L6 7Z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
          <Path d="M9 7V5C9 3.34 10.34 2 12 2C13.66 2 15 3.34 15 5V7" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        </Svg>
      );
    case 'ROL':
      return (
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={1.6} />
          <Path d="M4.5 20C4.5 15.5 19.5 15.5 19.5 20" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        </Svg>
      );
  }
};

/* ---------- Helpers visuales compartidos ---------- */

const TarjetaSeccion: React.FC<{
  titulo: string;
  accionTexto: string;
  onAccion: () => void;
  children: React.ReactNode;
}> = ({ titulo, accionTexto, onAccion, children }) => {
  const { colors } = useBzTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[BzTypography.label, { color: colors.BzMuted }]}>{titulo}</Text>
        <Pressable onPress={onAccion}>
          <Text style={{ color: colors.BzText, fontSize: 12 }}>{accionTexto}</Text>
        </Pressable>
      </View>
      {children}
    </View>
  );
};

const FilaResumen: React.FC<{ titulo: string; subtitulo: string; colorPunto: string }> = ({
  titulo,
  subtitulo,
  colorPunto,
}) => {
  const { colors } = useBzTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 }}>
      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colorPunto }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.BzText, fontSize: 13 }}>{titulo}</Text>
        <Text style={{ color: colors.BzMuted, fontSize: 11 }}>{subtitulo}</Text>
      </View>
    </View>
  );
};

const MiniMetrica: React.FC<{ etiqueta: string; valor: string }> = ({ etiqueta, valor }) => {
  const { colors } = useBzTheme();
  return (
    <View
      style={{
        flex: 1,
        padding: 10,
        borderRadius: 10,
        backgroundColor: colors.BzCardInner,
        borderWidth: 1,
        borderColor: colors.BzBorder,
      }}
    >
      <Text style={{ color: colors.BzMuted, fontSize: 11 }}>{etiqueta}</Text>
      <Text style={[BzTypography.bigNumber, { color: colors.BzText, fontSize: 22 }]}>{valor}</Text>
    </View>
  );
};

const BotonMenuPrimario: React.FC<{ texto: string; onPress: () => void }> = ({ texto, onPress }) => {
  const { colors } = useBzTheme();
  return (
    <Pressable onPress={onPress} style={[styles.btnPrimario, { backgroundColor: colors.BzText }]}>
      <Text style={{ color: colors.BzBg, fontWeight: '500', fontSize: 14 }}>{texto}</Text>
    </Pressable>
  );
};

const BotonMenuSecundario: React.FC<{ texto: string; onPress: () => void }> = ({ texto, onPress }) => {
  const { colors } = useBzTheme();
  return (
    <Pressable onPress={onPress} style={[styles.btnSecundario, { borderColor: colors.BzBorder }]}>
      <Text style={{ color: colors.BzText, fontSize: 14 }}>{texto}</Text>
    </Pressable>
  );
};

/* ---------- 1. Pestaña Inicio ---------- */

const VistaInicioResumen: React.FC<{
  usuario: UsuarioBz;
  citaConfirmada: string | null;
  carritoCount: number;
  onIrAgendar: () => void;
  onIrCaja: () => void;
  onIrInventario: () => void;
  onIrReportesDueno: () => void;
  onIrComisiones: () => void;
  onIrTienda: () => void;
  onIrRol: () => void;
}> = ({
  usuario,
  citaConfirmada,
  carritoCount,
  onIrAgendar,
  onIrCaja,
  onIrInventario,
  onIrReportesDueno,
  onIrComisiones,
  onIrTienda,
  onIrRol,
}) => {
  const { colors } = useBzTheme();
  const esCliente = usuario.rol === RolSesion.CLIENTE;
  const esBarbero = usuario.rol === RolSesion.BARBERO;
  const esDueno = usuario.rol === RolSesion.DUENO;
  const tieneCaja = [RolSesion.DUENO, RolSesion.ENCARGADO, RolSesion.RECEPCION].includes(usuario.rol);

  const [mostrarTema, setMostrarTema] = useState(false);
  const [mostrarNotifs, setMostrarNotifs] = useState(false);
  const [notifs, setNotifs] = useState<BzNotificacion[]>(() => notificacionesIniciales(usuario.rol));

  useEffect(() => {
    setNotifs(notificacionesIniciales(usuario.rol));
    const t = setTimeout(() => {
      setNotifs((prev) => [{ titulo: 'Nueva cita agendada', detalle: 'Juan Pérez · 12:15', color: colors.BzSuccess }, ...prev]);
    }, 5000);
    return () => clearTimeout(t);
  }, [usuario.rol, colors.BzSuccess]);

  return (
    <>
      <BzAppearanceSheet visible={mostrarTema} onDismiss={() => setMostrarTema(false)} />
      <BzNotificacionesSheet
        visible={mostrarNotifs}
        items={notifs}
        onMarcarLeidas={() => setNotifs([])}
        onDismiss={() => setMostrarNotifs(false)}
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 16 }}>
        <BzHeader
          saludo={`Hola, ${usuario.nombre}`}
          rolEtiqueta={usuario.rol}
          notificaciones={notifs.length}
          onRol={onIrRol}
          onCampana={() => setMostrarNotifs(true)}
          onTema={() => setMostrarTema(true)}
        />

        {esDueno && (
          <TarjetaSeccion
            titulo="RESUMEN GLOBAL · 3 SUCURSALES"
            accionTexto="Ver reportes ›"
            onAccion={onIrReportesDueno}
          >
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <MiniMetrica etiqueta="Venta hoy" valor="$16,570" />
              <MiniMetrica etiqueta="Citas totales" valor="46" />
            </View>
          </TarjetaSeccion>
        )}

        <TarjetaSeccion
          titulo={esCliente ? 'TU PRÓXIMA CITA' : `VISTAZO DE AGENDA · ${usuario.sucursal.toUpperCase()}`}
          accionTexto={esCliente ? 'Agendar ›' : 'Ver agenda ›'}
          onAccion={onIrAgendar}
        >
          {esCliente ? (
            citaConfirmada ? (
              <>
                <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '500' }}>{citaConfirmada}</Text>
                <Text style={{ color: colors.BzSuccess, fontSize: 12 }}>
                  Sucursal {usuario.sucursal || 'Olivete'} · Confirmada
                </Text>
              </>
            ) : (
              <>
                <Text style={{ color: colors.BzText, fontSize: 14 }}>No tienes citas programadas</Text>
                <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
                  Elige servicio, barbero y horario en menos de 1 minuto.
                </Text>
                <View style={{ height: 4 }} />
                <BotonMenuPrimario texto="Agendar cita ahora" onPress={onIrAgendar} />
              </>
            )
          ) : (
            <>
              <FilaResumen titulo="10:00 · Juan Pérez" subtitulo="Corte · Carlos R." colorPunto={colors.BzSuccess} />
              <View style={{ height: 1, backgroundColor: colors.BzBorder }} />
              <FilaResumen titulo="11:30 · Andrés López" subtitulo="Corte + barba · Diego M." colorPunto={colors.BzText} />
              <View style={{ height: 1, backgroundColor: colors.BzBorder }} />
              <FilaResumen titulo="Lista de espera" subtitulo="3 clientes en fila" colorPunto={colors.BzWarning} />
            </>
          )}
        </TarjetaSeccion>

        {esCliente ? (
          <TarjetaSeccion titulo="TARJETA DE LEALTAD" accionTexto="7 / 10 sellos" onAccion={onIrRol}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {Array.from({ length: 10 }).map((_, idx) => (
                <View
                  key={idx}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: idx < 7 ? colors.BzText : colors.BzCardInner,
                  }}
                />
              ))}
            </View>
            <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
              Te faltan 3 visitas para tu corte de cortesía.
            </Text>
          </TarjetaSeccion>
        ) : (
          <TarjetaSeccion
            titulo="RESUMEN DEL DÍA"
            accionTexto={esBarbero ? 'Ver comisiones ›' : tieneCaja ? 'Ir a caja ›' : 'Mi rol ›'}
            onAccion={esBarbero ? onIrComisiones : tieneCaja ? onIrCaja : onIrRol}
          >
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <MiniMetrica etiqueta="Citas hoy" valor="12" />
              <MiniMetrica
                etiqueta={esBarbero ? 'Comisiones' : 'Caja turno'}
                valor={esBarbero ? '$1,840' : '$6,270'}
              />
            </View>
          </TarjetaSeccion>
        )}

        {tieneCaja && (
          <TarjetaSeccion titulo="ALERTAS DE INVENTARIO" accionTexto="Ver stock ›" onAccion={onIrInventario}>
            <FilaResumen titulo="Pomada mate 100g" subtitulo="Quedan 4 pz (mínimo 8)" colorPunto={colors.BzWarning} />
            <View style={{ height: 1, backgroundColor: colors.BzBorder }} />
            <FilaResumen titulo="Shampoo menta 250ml" subtitulo="Quedan 3 pz (mínimo 6)" colorPunto={colors.BzWarning} />
          </TarjetaSeccion>
        )}

        {esCliente && (
          <TarjetaSeccion
            titulo="TIENDA BARBERZONE"
            accionTexto={carritoCount > 0 ? `Ver carrito (${carritoCount}) ›` : 'Ir a tienda ›'}
            onAccion={onIrTienda}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {[
                { nombre: 'Pomada mate', precio: '$220' },
                { nombre: 'Aceite barba', precio: '$180' },
                { nombre: 'Shampoo', precio: '$150' },
              ].map((prod) => (
                <Pressable
                  key={prod.nombre}
                  onPress={onIrTienda}
                  style={{
                    width: 128,
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: colors.BzCardInner,
                    borderWidth: 1,
                    borderColor: colors.BzBorder,
                    gap: 4,
                  }}
                >
                  <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '500' }}>{prod.nombre}</Text>
                  <Text style={{ color: colors.BzMuted, fontSize: 12 }}>{prod.precio}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </TarjetaSeccion>
        )}
      </ScrollView>
    </>
  );
};

/* ---------- 2. Pestaña Agendar / Nueva Cita ---------- */

const VistaAgendar: React.FC<{
  usuario: UsuarioBz;
  citaActual: string | null;
  onVolverAgenda?: () => void;
  onConfirmarCita: (resumen: string) => void;
}> = ({ usuario, citaActual, onVolverAgenda, onConfirmarCita }) => {
  const { colors } = useBzTheme();
  const servicios = [
    { nombre: 'Corte de cabello', duracion: '45 min', precio: 180 },
    { nombre: 'Arreglo de barba', duracion: '30 min', precio: 120 },
    { nombre: 'Corte + barba', duracion: '75 min', precio: 280 },
    { nombre: 'Afeitado tradicional', duracion: '30 min', precio: 150 },
  ];
  const barberos = ['Carlos R.', 'Diego M.', 'Luis S.', 'Cualquiera'];
  const horarios = ['10:45', '11:30', '12:15', '15:00', '16:30'];

  const [servicioSel, setServicioSel] = useState(0);
  const [barberoSel, setBarberoSel] = useState(barberos[0]);
  const [horaSel, setHoraSel] = useState('11:30');

  const elegido = servicios[servicioSel];

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 14 }}>
      {onVolverAgenda && (
        <Pressable onPress={onVolverAgenda}>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>‹ Volver a agenda</Text>
        </Pressable>
      )}

      <Text style={[BzTypography.title, { color: colors.BzText, fontSize: 22 }]}>
        {usuario.rol === RolSesion.CLIENTE ? 'Agendar cita' : 'Nueva cita'}
      </Text>
      <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
        Sucursal {usuario.sucursal || 'Olivete'} · Hoy
      </Text>

      {citaActual && (
        <View
          style={{
            padding: 12,
            borderRadius: 12,
            backgroundColor: colors.BzCard,
            borderWidth: 1,
            borderColor: colors.BzSuccess,
          }}
        >
          <Text style={{ color: colors.BzSuccess, fontSize: 11, fontWeight: '600' }}>Última cita registrada</Text>
          <Text style={{ color: colors.BzText, fontSize: 13 }}>{citaActual}</Text>
        </View>
      )}

      <Text style={[BzTypography.label, { color: colors.BzMuted }]}>1. SERVICIO</Text>
      {servicios.map((srv, idx) => {
        const activo = idx === servicioSel;
        return (
          <Pressable
            key={srv.nombre}
            onPress={() => setServicioSel(idx)}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 14,
              borderRadius: 12,
              backgroundColor: colors.BzCard,
              borderWidth: 1,
              borderColor: activo ? colors.BzText : colors.BzBorder,
            }}
          >
            <View>
              <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: activo ? '600' : '400' }}>
                {srv.nombre}
              </Text>
              <Text style={{ color: colors.BzMuted, fontSize: 12 }}>{srv.duracion}</Text>
            </View>
            <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '500' }}>${srv.precio}</Text>
          </Pressable>
        );
      })}

      <Text style={[BzTypography.label, { color: colors.BzMuted }]}>2. BARBERO</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {barberos.map((b) => {
          const activo = b === barberoSel;
          return (
            <Pressable
              key={b}
              onPress={() => setBarberoSel(b)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: activo ? colors.BzText : colors.BzCard,
                borderWidth: 1,
                borderColor: activo ? colors.BzText : colors.BzBorder,
              }}
            >
              <Text style={{ color: activo ? colors.BzBg : colors.BzText, fontSize: 12, fontWeight: activo ? '600' : '400' }}>
                {b}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[BzTypography.label, { color: colors.BzMuted }]}>3. HORARIO DISPONIBLE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {horarios.map((h) => {
          const activo = h === horaSel;
          return (
            <Pressable
              key={h}
              onPress={() => setHoraSel(h)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: activo ? colors.BzText : colors.BzCard,
                borderWidth: 1,
                borderColor: activo ? colors.BzText : colors.BzBorder,
              }}
            >
              <Text style={{ color: activo ? colors.BzBg : colors.BzText, fontSize: 12, fontWeight: activo ? '600' : '400' }}>
                {h}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={{ color: colors.BzMuted, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
        Total estimado: ${elegido.precio} · {elegido.duracion}
      </Text>
      <BotonMenuPrimario
        texto="Confirmar cita"
        onPress={() => onConfirmarCita(`${elegido.nombre} · ${horaSel} con ${barberoSel} ($${elegido.precio})`)}
      />
    </ScrollView>
  );
};

/* ---------- 3. Pestaña Tienda ---------- */

const VistaTienda: React.FC<{
  carritoCount: number;
  onAgregarProducto: () => void;
  onLimpiarCarrito: () => void;
}> = ({ carritoCount, onAgregarProducto, onLimpiarCarrito }) => {
  const { colors } = useBzTheme();
  const [mensajePedido, setMensajePedido] = useState<string | null>(null);

  const productos = [
    { nombre: 'Pomada mate · 100g', desc: 'Fijación alta sin brillo', precio: '$220' },
    { nombre: 'Aceite para barba · 30ml', desc: 'Hidratación y aroma amaderado', precio: '$180' },
    { nombre: 'Shampoo diario · 250ml', desc: 'Limpieza profunda con menta', precio: '$150' },
    { nombre: 'Cera fuerte · 100g', desc: 'Control todo el día', precio: '$210' },
    { nombre: 'Tónico capilar · 120ml', desc: 'Refrescante post-corte', precio: '$165' },
  ];

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={[BzTypography.title, { color: colors.BzText, fontSize: 22 }]}>Tienda BarberZone</Text>
          <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Recoge en sucursal o agrega a tu cita</Text>
        </View>
        {carritoCount > 0 && (
          <View style={{ backgroundColor: colors.BzText, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Text style={{ color: colors.BzBg, fontSize: 11, fontWeight: '600' }}>{carritoCount} en bolsa</Text>
          </View>
        )}
      </View>

      {mensajePedido && (
        <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.BzCard, borderWidth: 1, borderColor: colors.BzSuccess }}>
          <Text style={{ color: colors.BzSuccess, fontSize: 12 }}>{mensajePedido}</Text>
        </View>
      )}

      {productos.map((p) => (
        <View
          key={p.nombre}
          style={[
            styles.card,
            { backgroundColor: colors.BzCard, borderColor: colors.BzBorder, flexDirection: 'row', alignItems: 'center' },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '500' }}>{p.nombre}</Text>
            <Text style={{ color: colors.BzMuted, fontSize: 12 }}>{p.desc}</Text>
            <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600', marginTop: 4 }}>{p.precio}</Text>
          </View>
          <Pressable
            onPress={() => {
              setMensajePedido(null);
              onAgregarProducto();
            }}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.BzBorder,
            }}
          >
            <Text style={{ color: colors.BzText, fontSize: 12 }}>+ Agregar</Text>
          </Pressable>
        </View>
      ))}

      {carritoCount > 0 && (
        <BotonMenuPrimario
          texto={`Apartar ${carritoCount} producto(s) en sucursal`}
          onPress={() => {
            setMensajePedido(`Pedido apartado (${carritoCount} artículos). Pasa a caja en sucursal Olivete.`);
            onLimpiarCarrito();
          }}
        />
      )}
    </ScrollView>
  );
};

/* ---------- 4. Pestaña Rol y Perfil de Usuario ---------- */

const VistaRolUsuario: React.FC<{
  usuario: UsuarioBz;
  onLogout: () => void;
}> = ({ usuario, onLogout }) => {
  const { colors } = useBzTheme();
  const [mostrarTema, setMostrarTema] = useState(false);

  const descripcionPermisos: Record<RolSesion, string> = {
    [RolSesion.DUENO]: 'Acceso total: agenda, caja, inventario, reportes globales y alta de personal.',
    [RolSesion.ENCARGADO]: `Opera su sucursal (${usuario.sucursal}): agenda, caja, inventario y autorizaciones.`,
    [RolSesion.RECEPCION]: 'Agenda citas, registra walk-ins y realiza cobros en caja.',
    [RolSesion.BARBERO]: 'Consulta su agenda del día, registra notas de corte y revisa sus comisiones.',
    [RolSesion.CLIENTE]: 'Agenda y consulta sus citas, acumula sellos de lealtad y aparta productos.',
  };

  return (
    <>
      <BzAppearanceSheet visible={mostrarTema} onDismiss={() => setMostrarTema(false)} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingVertical: 16, alignItems: 'center', gap: 14 }}>
        <View style={{ height: 8 }} />
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.BzCard,
            borderWidth: 1,
            borderColor: colors.BzMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.BzText, fontSize: 22, fontWeight: '300' }}>{usuario.iniciales}</Text>
        </View>

        <Text style={[BzTypography.title, { color: colors.BzText, fontSize: 20 }]}>{usuario.nombre}</Text>

        <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: colors.BzCard, borderWidth: 1, borderColor: colors.BzBorder }}>
          <Text style={{ color: colors.BzText, fontSize: 12 }}>Rol: {usuario.rol}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder, width: '100%' }]}>
          <Text style={[BzTypography.label, { color: colors.BzMuted }]}>PERMISOS Y ACCESOS DEL ROL</Text>
          <Text style={{ color: colors.BzText, fontSize: 13 }}>{descripcionPermisos[usuario.rol]}</Text>
        </View>

        <BotonMenuSecundario texto="Apariencia (claro / oscuro)" onPress={() => setMostrarTema(true)} />

        <View style={{ flex: 1 }} />
        <BotonMenuSecundario texto="Cerrar sesión" onPress={onLogout} />
      </ScrollView>
    </>
  );
};

/* ---------- Contenedor Principal MainAppShell ---------- */

export const MainAppShell: React.FC<{
  usuario: UsuarioBz;
  onLogout: () => void;
}> = ({ usuario, onLogout }) => {
  const { colors } = useBzTheme();
  const [tabActual, setTabActual] = useState<TabPrincipal>('INICIO');
  const [carritoCount, setCarritoCount] = useState(0);
  const [citaConfirmada, setCitaConfirmada] = useState<string | null>(null);
  const [creandoNuevaCitaEquipo, setCreandoNuevaCitaEquipo] = useState(false);
  const [creandoUsuario, setCreandoUsuario] = useState(false);
  const [abrirComisiones, setAbrirComisiones] = useState(false);

  const tabsDisponibles = useMemo<TabPrincipal[]>(() => {
    switch (usuario.rol) {
      case RolSesion.CLIENTE:
        return ['INICIO', 'AGENDAR', 'TIENDA', 'ROL'];
      case RolSesion.BARBERO:
        return ['INICIO', 'AGENDAR', 'BARBERO_PANEL', 'ROL'];
      case RolSesion.DUENO:
        return ['INICIO', 'DUENO_DASH', 'CAJA', 'INVENTARIO', 'ROL'];
      default:
        return ['INICIO', 'AGENDAR', 'CAJA', 'INVENTARIO', 'ROL'];
    }
  }, [usuario.rol]);

  const esAdmin = usuario.rol === RolSesion.DUENO || usuario.rol === RolSesion.ENCARGADO;

  const tituloTab: Record<TabPrincipal, string> = {
    INICIO: 'Inicio',
    AGENDAR: usuario.rol !== RolSesion.CLIENTE ? 'Agenda' : 'Agendar',
    CAJA: 'Caja',
    INVENTARIO: 'Stock',
    DUENO_DASH: 'Reportes',
    BARBERO_PANEL: 'Servicio',
    TIENDA: carritoCount > 0 ? `Tienda (${carritoCount})` : 'Tienda',
    ROL: esAdmin ? 'Más' : usuario.rol.split('/')[0],
  };

  const gooeyItems: GooeyTabItem[] = tabsDisponibles.map((tab) => ({
    id: tab,
    etiqueta: tituloTab[tab],
    renderIcon: (color) => <TabIcon tab={tab} color={color} isMenu={tab === 'ROL' && esAdmin} />,
  }));

  const indiceActual = Math.max(0, tabsDisponibles.indexOf(tabActual));

  const renderContenido = () => {
    // Crear usuario se muestra sobre la pestaña activa; al volver, la pestaña sigue igual
    if (creandoUsuario) {
      return <CrearUsuarioScreen quien={usuario} onVolver={() => setCreandoUsuario(false)} />;
    }

    switch (tabActual) {
      case 'INICIO':
        return (
          <VistaInicioResumen
            usuario={usuario}
            citaConfirmada={citaConfirmada}
            carritoCount={carritoCount}
            onIrAgendar={() => {
              setCreandoNuevaCitaEquipo(false);
              setTabActual('AGENDAR');
            }}
            onIrCaja={() => tabsDisponibles.includes('CAJA') && setTabActual('CAJA')}
            onIrInventario={() => tabsDisponibles.includes('INVENTARIO') && setTabActual('INVENTARIO')}
            onIrReportesDueno={() => tabsDisponibles.includes('DUENO_DASH') && setTabActual('DUENO_DASH')}
            onIrComisiones={() => {
              setAbrirComisiones(true);
              setTabActual('BARBERO_PANEL');
            }}
            onIrTienda={() => setTabActual('TIENDA')}
            onIrRol={() => setTabActual('ROL')}
          />
        );

      case 'AGENDAR':
        return usuario.rol !== RolSesion.CLIENTE && !creandoNuevaCitaEquipo ? (
          <AgendaEquipoScreen
            usuario={usuario}
            onNuevaCita={() => setCreandoNuevaCitaEquipo(true)}
          />
        ) : (
          <VistaAgendar
            usuario={usuario}
            citaActual={citaConfirmada}
            onVolverAgenda={
              usuario.rol !== RolSesion.CLIENTE ? () => setCreandoNuevaCitaEquipo(false) : undefined
            }
            onConfirmarCita={(resumen) => {
              setCitaConfirmada(resumen);
              setCreandoNuevaCitaEquipo(false);
              if (usuario.rol === RolSesion.CLIENTE) setTabActual('INICIO');
            }}
          />
        );

      case 'CAJA':
        return <CajaScreen usuario={usuario} />;

      case 'INVENTARIO':
        return <InventarioScreen usuario={usuario} />;

      case 'DUENO_DASH':
        return <DuenoPanelScreen usuario={usuario} onNewUser={() => setCreandoUsuario(true)} />;

      case 'BARBERO_PANEL':
        return <BarberoPanelScreen usuario={usuario} abrirEnComisiones={abrirComisiones} />;

      case 'TIENDA':
        return (
          <VistaTienda
            carritoCount={carritoCount}
            onAgregarProducto={() => setCarritoCount((c) => c + 1)}
            onLimpiarCarrito={() => setCarritoCount(0)}
          />
        );

      case 'ROL':
        return esAdmin ? (
          <AdminOperacionesScreen
            usuario={usuario}
            onIrInventario={() => setTabActual('INVENTARIO')}
            onNewUser={() => setCreandoUsuario(true)}
            onLogout={onLogout}
          />
        ) : (
          <VistaRolUsuario usuario={usuario} onLogout={onLogout} />
        );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.BzBg }}>
      <View style={{ flex: 1 }}>{renderContenido()}</View>

      <View style={{ backgroundColor: colors.BzBg, paddingHorizontal: 10, paddingVertical: 10 }}>
        <GooeyNavBar
          items={gooeyItems}
          selectedIndex={indiceActual}
          onSelect={(idx) => {
            setCreandoNuevaCitaEquipo(false);
            setCreandoUsuario(false);
            setAbrirComisiones(false);
            setTabActual(tabsDisponibles[idx]);
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  btnPrimario: {
    width: '100%',
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecundario: {
    width: '100%',
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});