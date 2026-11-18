import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { CampoContrasenaAnimado, CasillasPin, EstadoPin } from '../components/Animaciones';
import { MainAppShell } from '../components/MenuPrincipal';
import { BarberZoneThemeProvider, useBzTheme } from '../constants/BzTheme';
import { RepositorioUsuarios, RolSesion, UsuarioBz, getUsuariosDemoPorRol } from '../constants/Sesion';

type Screen = 'BIENVENIDA' | 'LOGIN' | 'CREAR_CUENTA' | 'PIN' | 'HOME';

/* ---------- Iconos Vectoriales Finos ---------- */

const PersonIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={7.2} r={4.8} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    <Path d="M3.6 22C3.6 13.2 20.4 13.2 20.4 22" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const LockIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x={4.3} y={10.8} width={15.4} height={10.8} rx={3} stroke={color} strokeWidth={1.5} />
    <Path d="M7.7 10.8V7.7C7.7 0.5 16.3 0.5 16.3 7.7V10.8" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const PinIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22.8C1.2 13.2 2.4 1.4 12 1.4C21.6 1.4 22.8 13.2 12 22.8Z" stroke={color} strokeWidth={1.4} />
    <Circle cx={12} cy={9.6} r={3.3} stroke={color} strokeWidth={1.4} />
  </Svg>
);

const KeypadIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    {[0, 1, 2].map((r) =>
      [0, 1, 2].map((c) => <Circle key={`${r}-${c}`} cx={4 + c * 8} cy={4 + r * 8} r={1.8} fill={color} />)
    )}
  </Svg>
);

/* ---------- Componentes Base ---------- */

const LabelWithLines: React.FC<{ text: string }> = ({ text }) => {
  const { colors } = useBzTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.BzMuted, opacity: 0.5 }} />
      <Text style={{ color: colors.BzMuted, fontSize: 10, letterSpacing: 3, marginHorizontal: 12 }}>{text}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.BzMuted, opacity: 0.5 }} />
    </View>
  );
};

const Monogram: React.FC = () => {
  const { colors } = useBzTheme();
  return (
    <View style={{ width: '100%', alignItems: 'center', gap: 14 }}>
      <LabelWithLines text="BARBER ZONE" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Text style={{ color: colors.BzText, fontSize: 60, fontWeight: '200' }}>B</Text>
        <View style={{ width: 1, height: 56, backgroundColor: colors.BzText }} />
        <Text style={{ color: colors.BzText, fontSize: 60, fontWeight: '200' }}>Z</Text>
      </View>
      <LabelWithLines text="CUT, SHAVE & FADE" />
    </View>
  );
};

const PrimaryButton: React.FC<{ text: string; onPress: () => void }> = ({ text, onPress }) => {
  const { colors } = useBzTheme();
  return (
    <Pressable onPress={onPress} style={[styles.primaryBtn, { backgroundColor: colors.BzText }]}>
      <Text style={{ color: colors.BzBg, fontWeight: '500', fontSize: 15 }}>{text}</Text>
    </Pressable>
  );
};

const SecondaryButton: React.FC<{ text: string; onPress: () => void; icon?: React.ReactNode }> = ({
  text,
  onPress,
  icon,
}) => {
  const { colors } = useBzTheme();
  return (
    <Pressable onPress={onPress} style={[styles.secondaryBtn, { borderColor: colors.BzBorder }]}>
      {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
      <Text style={{ color: colors.BzText, fontWeight: icon ? '600' : '400', fontSize: 15 }}>{text}</Text>
    </Pressable>
  );
};

const BzField: React.FC<{
  value: string;
  onChange: (t: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad';
  leading?: React.ReactNode;
}> = ({ value, onChange, placeholder, keyboardType = 'default', leading }) => {
  const { colors } = useBzTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        styles.fieldBox,
        {
          backgroundColor: colors.BzBg,
          borderColor: focused ? colors.BzText : colors.BzBorder,
        },
      ]}
    >
      {leading && <View style={{ marginRight: 10 }}>{leading}</View>}
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.BzMuted}
        keyboardType={keyboardType}
        autoCapitalize="none"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ flex: 1, color: colors.BzText, fontSize: 14, height: '100%' }}
      />
    </View>
  );
};

/* ---------- Pantallas ---------- */

const BienvenidaScreen: React.FC<{ onLogin: () => void; onCrear: () => void }> = ({ onLogin, onCrear }) => {
  const { colors } = useBzTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 24 }}>
      <View style={{ flex: 1, justifyContent: 'center', width: '100%', alignItems: 'center' }}>
        <Monogram />
        <View style={{ height: 48 }} />
        <View style={{ paddingHorizontal: 24, maxWidth: 420, width: '100%', gap: 12 }}>
          <Text style={{ color: colors.BzText, fontSize: 22, fontWeight: '300' }}>Bienvenido</Text>
          <Text style={{ color: colors.BzMuted, fontSize: 13 }}>
            Entra a tu cuenta o crea una para agendar tu cita.
          </Text>
          <View style={{ height: 4 }} />
          <PrimaryButton text="Iniciar sesión" onPress={onLogin} />
          <SecondaryButton text="Crear cuenta" onPress={onCrear} />
        </View>
      </View>
      <Text style={{ color: colors.BzMuted, fontSize: 11, textAlign: 'center', paddingHorizontal: 24 }}>
        ¿Eres parte del equipo? Tu cuenta la crea el Dueño o el Encargado.
      </Text>
    </View>
  );
};

const LoginScreen: React.FC<{
  usuariosDemo: UsuarioBz[];
  onBack: () => void;
  onEnter: (u: UsuarioBz) => void;
  onPin: () => void;
}> = ({ usuariosDemo, onBack, onEnter, onPin }) => {
  const { colors } = useBzTheme();
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
      <Pressable onPress={onBack} style={{ alignSelf: 'flex-start', paddingLeft: 24, paddingTop: 12 }}>
        <Text style={{ color: colors.BzMuted, fontSize: 14 }}>‹ Volver</Text>
      </Pressable>
      <View style={{ height: 20 }} />
      <Monogram />
      <View style={{ height: 24 }} />

      <View
        style={[
          styles.card,
          { backgroundColor: colors.BzCard, borderColor: colors.BzBorder, marginHorizontal: 24, maxWidth: 420, width: '90%' },
        ]}
      >
        <Text style={{ color: colors.BzText, fontSize: 16, fontWeight: '600' }}>Iniciar sesión</Text>
        <BzField
          value={user}
          onChange={(t) => {
            setUser(t);
            setError(null);
          }}
          placeholder="Teléfono o usuario"
          leading={<PersonIcon color={colors.BzMuted} />}
        />
        <CampoContrasenaAnimado
          value={password}
          onChange={(t) => {
            setPassword(t);
            setError(null);
          }}
          placeholder="Contraseña"
          leading={<LockIcon color={colors.BzMuted} />}
        />
        {error && <Text style={{ color: colors.BzDanger, fontSize: 12 }}>{error}</Text>}
        <Text style={{ color: colors.BzMuted, fontSize: 11, alignSelf: 'flex-end' }}>¿Olvidaste tu contraseña?</Text>

        <PrimaryButton
          text="Entrar"
          onPress={() => {
            const u = RepositorioUsuarios.iniciarSesion(user, password);
            if (u) onEnter(u);
            else setError('Usuario o contraseña incorrectos');
          }}
        />
        <Text style={{ color: colors.BzMuted, fontSize: 11, textAlign: 'center' }}>o</Text>
        <SecondaryButton text="Entrar con PIN rápido" onPress={onPin} icon={<KeypadIcon color={colors.BzText} />} />
      </View>

      <View style={{ height: 14 }} />
      <Text style={{ color: colors.BzMuted, fontSize: 9, letterSpacing: 1.5 }}>ACCESO DIRECTO DE PRUEBA POR ROL</Text>
      <View style={{ height: 8 }} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}>
        {usuariosDemo.map((demo) => (
          <Pressable
            key={demo.usuario}
            onPress={() => onEnter(demo)}
            style={{
              backgroundColor: colors.BzCard,
              borderColor: colors.BzBorder,
              borderWidth: 1,
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: colors.BzText, fontSize: 11 }}>{demo.rol.split('/')[0]}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={{ height: 10 }} />
      <Text style={{ color: colors.BzMuted, fontSize: 11, textAlign: 'center', paddingHorizontal: 24 }}>
        Usuarios: dueno, encargado, ana, carlos o 3312345678 · clave: barberzone1
      </Text>

      <View style={{ height: 18 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <PinIcon color={colors.BzMuted} />
        <Text style={{ color: colors.BzMuted, fontSize: 13 }}>Sucursal: Olivete  ⌄</Text>
      </View>
    </ScrollView>
  );
};

const CrearCuentaScreen: React.FC<{ onBack: () => void; onCreada: (u: UsuarioBz) => void }> = ({ onBack, onCreada }) => {
  const { colors } = useBzTheme();
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
      <Pressable onPress={onBack} style={{ alignSelf: 'flex-start', paddingLeft: 24, paddingTop: 12 }}>
        <Text style={{ color: colors.BzMuted, fontSize: 14 }}>‹ Volver</Text>
      </Pressable>
      <View style={{ height: 16 }} />
      <Text style={{ color: colors.BzText, fontSize: 28, fontWeight: '300' }}>B|Z</Text>
      <View style={{ height: 16 }} />

      <View
        style={[
          styles.card,
          { backgroundColor: colors.BzCard, borderColor: colors.BzBorder, marginHorizontal: 24, maxWidth: 420, width: '90%' },
        ]}
      >
        <Text style={{ color: colors.BzText, fontSize: 16, fontWeight: '600' }}>Crear cuenta</Text>
        <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
          Con tu cuenta podrás agendar y consultar tus citas.
        </Text>

        <BzField
          value={nombre}
          onChange={(t) => {
            setNombre(t);
            setError(null);
          }}
          placeholder="Nombre completo"
          leading={<PersonIcon color={colors.BzMuted} />}
        />
        <BzField
          value={telefono}
          onChange={(t) => {
            setTelefono(t.replace(/\D/g, '').slice(0, 10));
            setError(null);
          }}
          placeholder="Teléfono (10 dígitos)"
          keyboardType="phone-pad"
          leading={<KeypadIcon color={colors.BzMuted} />}
        />
        <CampoContrasenaAnimado
          value={contrasena}
          onChange={(t) => {
            setContrasena(t);
            setError(null);
          }}
          placeholder="Contraseña (mínimo 8 caracteres)"
          mostrarFortaleza
          leading={<LockIcon color={colors.BzMuted} />}
        />

        {error && <Text style={{ color: colors.BzDanger, fontSize: 12 }}>{error}</Text>}
        <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
          Al crear tu cuenta aceptas el aviso de privacidad de BarberZone.
        </Text>

        <PrimaryButton
          text="Crear cuenta"
          onPress={() => {
            if (!nombre.trim()) return setError('Escribe tu nombre completo');
            if (telefono.length !== 10) return setError('El teléfono debe tener 10 dígitos');
            if (contrasena.length < 8) return setError('La contraseña debe tener al menos 8 caracteres');
            const { usuario, error: fallo } = RepositorioUsuarios.crearCuentaCliente(nombre, telefono, contrasena);
            if (usuario) onCreada(usuario);
            else setError(fallo);
          }}
        />
      </View>
    </ScrollView>
  );
};

const PinScreen: React.FC<{
  usuario: UsuarioBz;
  usuariosDisponibles: UsuarioBz[];
  onSelectUser: (u: UsuarioBz) => void;
  onSuccess: (u: UsuarioBz) => void;
  onChangeUser: () => void;
}> = ({ usuario, usuariosDisponibles, onSelectUser, onSuccess, onChangeUser }) => {
  const { colors } = useBzTheme();
  const [pin, setPin] = useState('');
  const [estado, setEstado] = useState<EstadoPin>(EstadoPin.NORMAL);
  const [mostrandoSelector, setMostrandoSelector] = useState(false);

  useEffect(() => {
    setPin('');
    setEstado(EstadoPin.NORMAL);
  }, [usuario]);

  useEffect(() => {
    if (estado === EstadoPin.EXITO) {
      const t = setTimeout(() => onSuccess(usuario), 700);
      return () => clearTimeout(t);
    }
    if (estado === EstadoPin.ERROR) {
      const t = setTimeout(() => {
        setPin('');
        setEstado(EstadoPin.NORMAL);
      }, 650);
      return () => clearTimeout(t);
    }
  }, [estado, usuario, onSuccess]);

  const filas = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', '⌫'],
  ];

  return (
    <View style={{ flex: 1, padding: 24, alignItems: 'center' }}>
      <Text style={{ color: colors.BzText, fontSize: 28, fontWeight: '300' }}>B|Z</Text>
      <Text style={{ color: colors.BzMuted, fontSize: 13, marginTop: 4 }}>Sucursal: {usuario.sucursal}</Text>

      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          borderWidth: 1,
          borderColor: colors.BzMuted,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 20,
        }}
      >
        <Text style={{ color: colors.BzText, fontSize: 18 }}>{usuario.iniciales}</Text>
      </View>

      <Text style={{ color: colors.BzText, fontSize: 20, fontWeight: '300', marginTop: 8 }}>{usuario.nombre}</Text>
      <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
        {usuario.rol} · PIN: {usuario.pin || 'N/A'}
      </Text>

      <Text style={{ color: colors.BzText, fontSize: 14, marginTop: 14, marginBottom: 12 }}>Ingresa tu PIN</Text>
      <CasillasPin pin={pin} estado={estado} />
      <Text style={{ color: colors.BzDanger, fontSize: 12, marginTop: 8 }}>
        {estado === EstadoPin.ERROR ? 'PIN incorrecto' : ' '}
      </Text>

      {mostrandoSelector && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 40, marginTop: 6 }} contentContainerStyle={{ gap: 8 }}>
          {usuariosDisponibles.map((c) => {
            const activo = c.nombre === usuario.nombre && c.rol === usuario.rol;
            return (
              <Pressable
                key={c.usuario}
                onPress={() => {
                  onSelectUser(c);
                  setMostrandoSelector(false);
                }}
                style={{
                  backgroundColor: activo ? colors.BzText : colors.BzCard,
                  borderColor: activo ? colors.BzText : colors.BzBorder,
                  borderWidth: 1,
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ color: activo ? colors.BzBg : colors.BzText, fontSize: 11 }}>
                  {c.rol.split('/')[0]} ({c.nombre.split(' ')[0]})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View style={{ flex: 1 }} />

      <View style={{ width: '100%', gap: 10 }}>
        {filas.map((fila, idx) => (
          <View key={idx} style={{ flexDirection: 'row', gap: 10 }}>
            {fila.map((tecla, cIdx) => {
              if (!tecla) return <View key={cIdx} style={{ flex: 1, height: 54 }} />;
              return (
                <Pressable
                  key={cIdx}
                  onPress={() => {
                    if (estado !== EstadoPin.NORMAL) return;
                    if (tecla === '⌫') {
                      setPin((p) => p.slice(0, -1));
                    } else if (pin.length < 4) {
                      const next = pin + tecla;
                      setPin(next);
                      if (next.length === 4) {
                        setEstado(next === usuario.pin ? EstadoPin.EXITO : EstadoPin.ERROR);
                      }
                    }
                  }}
                  style={{
                    flex: 1,
                    height: 54,
                    borderRadius: 10,
                    backgroundColor: colors.BzCard,
                    borderColor: colors.BzBorder,
                    borderWidth: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: colors.BzText, fontSize: 22, fontWeight: '300' }}>{tecla}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
        <Pressable onPress={() => setMostrandoSelector(!mostrandoSelector)} style={{ padding: 8 }}>
          <Text style={{ color: colors.BzText, fontWeight: '500' }}>Cambiar rol PIN</Text>
        </Pressable>
        <Pressable onPress={onChangeUser} style={{ padding: 8 }}>
          <Text style={{ color: colors.BzMuted }}>Volver a login</Text>
        </Pressable>
      </View>
    </View>
  );
};

/* ---------- Contenedor Principal ---------- */

function AppRouter() {
  const { colors } = useBzTheme();
  const [screen, setScreen] = useState<Screen>('BIENVENIDA');
  const [usuarioActual, setUsuarioActual] = useState<UsuarioBz | null>(null);
  const listaUsuariosDemo = useMemo(() => getUsuariosDemoPorRol(), []);
  const [usuarioPin, setUsuarioPin] = useState<UsuarioBz>(
    listaUsuariosDemo.find((u) => u.rol === RolSesion.BARBERO) || listaUsuariosDemo[0]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.BzBg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {screen === 'BIENVENIDA' && (
          <BienvenidaScreen onLogin={() => setScreen('LOGIN')} onCrear={() => setScreen('CREAR_CUENTA')} />
        )}
        {screen === 'LOGIN' && (
          <LoginScreen
            usuariosDemo={listaUsuariosDemo}
            onBack={() => setScreen('BIENVENIDA')}
            onEnter={(u) => {
              setUsuarioActual(u);
              setScreen('HOME');
            }}
            onPin={() => setScreen('PIN')}
          />
        )}
        {screen === 'CREAR_CUENTA' && (
          <CrearCuentaScreen
            onBack={() => setScreen('BIENVENIDA')}
            onCreada={(u) => {
              setUsuarioActual(u);
              setScreen('HOME');
            }}
          />
        )}
        {screen === 'PIN' && (
          <PinScreen
            usuario={usuarioPin}
            usuariosDisponibles={listaUsuariosDemo}
            onSelectUser={setUsuarioPin}
            onSuccess={(u) => {
              setUsuarioActual(u);
              setScreen('HOME');
            }}
            onChangeUser={() => setScreen('LOGIN')}
          />
        )}
        {screen === 'HOME' && usuarioActual && (
          <MainAppShell
            usuario={usuarioActual}
            onLogout={() => {
              setUsuarioActual(null);
              setScreen('BIENVENIDA');
            }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function Index() {
  return (
    <BarberZoneThemeProvider>
      <AppRouter />
    </BarberZoneThemeProvider>
  );
}

const styles = StyleSheet.create({
  primaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
});