import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useBzTheme } from '../constants/BzTheme';
import { RepositorioUsuarios, RolSesion, UsuarioBz } from '../constants/Sesion';
import { CampoContrasenaAnimado } from './Animaciones';
import { BotonPrimario, BotonSecundario, CampoTexto, Etiqueta, Fila, Tarjeta, Volver } from './BzFase3Ui';

const SUCURSALES = ['Olivete', 'Oblatos', 'Av. México'];

/** Selector segmentado genérico (equivale al Selector<T> de Kotlin). */
function Selector<T extends string>({
  opciones,
  seleccionada,
  etiqueta,
  onSeleccion,
}: {
  opciones: T[];
  seleccionada: T;
  etiqueta: (o: T) => string;
  onSeleccion: (o: T) => void;
}) {
  const { colors } = useBzTheme();
  return (
    <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: colors.BzBorder, borderRadius: 10, overflow: 'hidden' }}>
      {opciones.map((o) => {
        const activa = o === seleccionada;
        return (
          <Pressable
            key={o}
            onPress={() => onSeleccion(o)}
            style={{
              flex: 1,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: activa ? colors.BzText : 'transparent',
            }}
          >
            <Text style={{ color: activa ? colors.BzBg : colors.BzMuted, fontSize: 13, fontWeight: activa ? '500' : '400' }}>
              {etiqueta(o)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const CrearUsuarioScreen: React.FC<{ quien: UsuarioBz; onVolver?: () => void }> = ({
  quien,
  onVolver = () => {},
}) => {
  const { colors } = useBzTheme();

  // El Dueño crea Encargado, Recepción y Barbero. El Encargado solo Recepción y Barbero, en su sucursal.
  const rolesPermitidos: RolSesion[] =
    quien.rol === RolSesion.DUENO
      ? [RolSesion.ENCARGADO, RolSesion.RECEPCION, RolSesion.BARBERO]
      : [RolSesion.RECEPCION, RolSesion.BARBERO];
  const puedeElegirSucursal = quien.rol === RolSesion.DUENO;

  const [nombre, setNombre] = useState('');
  const [usuario, setUsuario] = useState('');
  const [rol, setRol] = useState<RolSesion>(RolSesion.BARBERO);
  const [sucursal, setSucursal] = useState(puedeElegirSucursal ? 'Olivete' : quien.sucursal);
  const [pin, setPin] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [comServicios, setComServicios] = useState(''); // TODO: confirmar % de comisión con el dueño
  const [comProductos, setComProductos] = useState('');
  const [activo, setActivo] = useState(true);
  const [intentoGuardar, setIntentoGuardar] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [creado, setCreado] = useState<string | null>(null);

  const errNombre = nombre.trim() === '' ? 'Escribe el nombre completo' : null;
  const errUsuario = usuario.trim() === '' ? 'Elige un usuario' : usuario.length < 3 ? 'Mínimo 3 caracteres' : null;
  const errPin = pin.length !== 4 ? 'El PIN debe tener 4 dígitos' : null;
  const errContrasena = contrasena.length < 8 ? 'Mínimo 8 caracteres' : null;
  const formularioValido = [errNombre, errUsuario, errPin, errContrasena].every((e) => e === null);

  const limpiar = () => {
    setNombre('');
    setUsuario('');
    setPin('');
    setContrasena('');
    setComServicios('');
    setComProductos('');
    setActivo(true);
    setRol(RolSesion.BARBERO);
    setIntentoGuardar(false);
    setErrorServidor(null);
    setCreado(null);
  };

  const guardar = () => {
    setIntentoGuardar(true);
    if (!formularioValido) return;
    const fallo = RepositorioUsuarios.crearPersonal(
      usuario,
      nombre,
      contrasena,
      pin,
      rol,
      sucursal,
      activo,
      comServicios,
      comProductos
    );
    if (fallo === null) {
      setCreado(`${nombre.trim()} · ${rol} · ${sucursal}\nUsuario: ${usuario.trim()}`);
    } else {
      setErrorServidor(fallo);
      setIntentoGuardar(false);
    }
  };

  const descripcionRol =
    rol === RolSesion.ENCARGADO
      ? 'Opera su sucursal: agenda, caja, inventario y equipo.'
      : rol === RolSesion.RECEPCION
      ? 'Agenda, walk-ins, recepción y cobro en caja.'
      : rol === RolSesion.BARBERO
      ? 'Solo ve su agenda, sus servicios y sus comisiones.'
      : '';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.BzBg }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          paddingBottom: 32,
          gap: 16,
          width: '100%',
          maxWidth: 560,
          alignSelf: 'center',
        }}
      >
        <Volver onPress={onVolver} />

        {creado !== null ? (
          <>
            <Text style={{ color: colors.BzText, fontSize: 24, fontWeight: '300' }}>Usuario creado</Text>
            <Tarjeta padding={16} gap={12}>
              <Etiqueta texto="LISTO" size={11} />
              <Text style={{ color: colors.BzText, fontSize: 15 }}>{creado}</Text>
              <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
                Ya puede iniciar sesión con su usuario y su contraseña, o con su PIN rápido.
              </Text>
            </Tarjeta>
            <BotonPrimario texto="Crear otro usuario" semibold={false} onPress={limpiar} />
            <BotonSecundario texto="Listo" height={48} onPress={onVolver} />
          </>
        ) : (
          <>
            <Text style={{ color: colors.BzText, fontSize: 24, fontWeight: '300' }}>Nuevo usuario</Text>
            <Text style={{ color: colors.BzMuted, fontSize: 13 }}>
              Da de alta a una persona del equipo y asígnale su rol y sucursal.
            </Text>

            <Tarjeta padding={16} gap={12}>
              <Etiqueta texto="DATOS" size={11} />
              <CampoTexto
                valor={nombre}
                onCambio={(t) => {
                  setNombre(t);
                  setErrorServidor(null);
                }}
                label="Nombre completo"
                error={intentoGuardar ? errNombre : null}
              />
              <CampoTexto
                valor={usuario}
                onCambio={(t) => {
                  setUsuario(t.replace(/\s/g, '').toLowerCase());
                  setErrorServidor(null);
                }}
                label="Usuario (sin espacios)"
                error={intentoGuardar ? errUsuario : errorServidor}
              />
            </Tarjeta>

            <Tarjeta padding={16} gap={12}>
              <Etiqueta texto="ROL" size={11} />
              <Selector
                opciones={rolesPermitidos}
                seleccionada={rol}
                etiqueta={(r) => r.split('/')[0]}
                onSeleccion={setRol}
              />
              <Text style={{ color: colors.BzMuted, fontSize: 12 }}>{descripcionRol}</Text>

              <Etiqueta texto="SUCURSAL" size={11} />
              {puedeElegirSucursal ? (
                <Selector opciones={SUCURSALES} seleccionada={sucursal} etiqueta={(s) => s} onSeleccion={setSucursal} />
              ) : (
                <>
                  <Text style={{ color: colors.BzText, fontSize: 14 }}>{sucursal}</Text>
                  <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
                    Solo puedes dar de alta personal en tu sucursal.
                  </Text>
                </>
              )}
            </Tarjeta>

            <Tarjeta padding={16} gap={12}>
              <Etiqueta texto="ACCESO" size={11} />
              <CampoTexto
                valor={pin}
                onCambio={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
                label="PIN rápido (4 dígitos)"
                error={intentoGuardar ? errPin : null}
                teclado="number-pad"
                oculto
              />
              <CampoContrasenaAnimado
                value={contrasena}
                onChange={setContrasena}
                placeholder="Contraseña temporal (mínimo 8)"
                mostrarFortaleza
              />
              {intentoGuardar && errContrasena !== null && (
                <Text style={{ color: colors.BzDanger, fontSize: 12 }}>{errContrasena}</Text>
              )}
            </Tarjeta>

            {rol === RolSesion.BARBERO && (
              <Tarjeta padding={16} gap={12}>
                <Etiqueta texto="COMISIONES (%)" size={11} />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <CampoTexto
                      valor={comServicios}
                      onCambio={(t) => setComServicios(t.replace(/\D/g, '').slice(0, 3))}
                      label="Servicios"
                      teclado="number-pad"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <CampoTexto
                      valor={comProductos}
                      onCambio={(t) => setComProductos(t.replace(/\D/g, '').slice(0, 3))}
                      label="Productos"
                      teclado="number-pad"
                    />
                  </View>
                </View>
                <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Valores pendientes de confirmar con el dueño.</Text>
              </Tarjeta>
            )}

            <Tarjeta padding={16} gap={12}>
              <Fila>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ color: colors.BzText, fontSize: 14 }}>Usuario activo</Text>
                  <Text style={{ color: colors.BzMuted, fontSize: 12 }}>Si lo desactivas, no podrá iniciar sesión.</Text>
                </View>
                <Switch
                  value={activo}
                  onValueChange={setActivo}
                  trackColor={{ false: colors.BzBorder, true: colors.BzText }}
                  thumbColor={activo ? colors.BzBg : colors.BzMuted}
                />
              </Fila>
            </Tarjeta>

            <View style={{ height: 4 }} />
            <BotonPrimario texto="Guardar usuario" semibold={false} onPress={guardar} />
            <BotonSecundario texto="Cancelar" height={48} onPress={onVolver} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
