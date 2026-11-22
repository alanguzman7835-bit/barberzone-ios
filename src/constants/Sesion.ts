import { supabase } from './supabase';

export enum RolSesion {
  DUENO = 'Dueño',
  ENCARGADO = 'Encargado',
  RECEPCION = 'Recepción/Cajero',
  BARBERO = 'Barbero',
  CLIENTE = 'Cliente',
}

export interface UsuarioBz {
  id: string;
  usuario: string;
  nombre: string;
  iniciales: string;
  contrasena: string;
  pin: string;
  rol: RolSesion;
  sucursal: string;
  activo: boolean;
  comisionServicios: string;
  comisionProductos: string;
}

// Caché local sincronizada en tiempo real con la tabla `usuarios` de Supabase
let usuarios: UsuarioBz[] = [];
let sincronizadoInicial = false;

const inicialesDe = (nombre: string): string =>
  nombre.trim().split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

function filaDBUsuarioAApp(row: any): UsuarioBz {
  return {
    id: row.id,
    usuario: row.usuario,
    nombre: row.nombre,
    iniciales: row.iniciales || inicialesDe(row.nombre || 'BZ'),
    contrasena: row.contrasena,
    pin: row.pin ?? '',
    rol: row.rol as RolSesion,
    sucursal: row.sucursal ?? 'Olivete',
    activo: row.activo !== false,
    comisionServicios: row.comision_servicios ?? '',
    comisionProductos: row.comision_productos ?? '',
  };
}

function usuarioAFilaDB(u: UsuarioBz) {
  return {
    id: u.id,
    usuario: u.usuario,
    nombre: u.nombre,
    iniciales: u.iniciales,
    contrasena: u.contrasena,
    pin: u.pin,
    rol: u.rol,
    sucursal: u.sucursal,
    activo: u.activo,
    comision_servicios: u.comisionServicios,
    comision_productos: u.comisionProductos,
  };
}

/** Descarga los usuarios desde Supabase y mantiene la caché actualizada en vivo */
export async function sincronizarUsuariosDesdeSupabase(): Promise<UsuarioBz[]> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('creado_en', { ascending: true });

    if (!error && data) {
      usuarios = data.map(filaDBUsuarioAApp);
      sincronizadoInicial = true;
    }
  } catch (e) {
    console.warn('Error cargando usuarios de Supabase:', e);
  }
  return usuarios;
}

// Arranca la sincronización inicial y escucha altas/ediciones en tiempo real
sincronizarUsuariosDesdeSupabase();

supabase
  .channel('usuarios-realtime')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, (payload) => {
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      const u = filaDBUsuarioAApp(payload.new);
      const idx = usuarios.findIndex((x) => x.id === u.id);
      if (idx >= 0) {
        usuarios[idx] = u;
      } else {
        usuarios.push(u);
      }
    } else if (payload.eventType === 'DELETE' && payload.old?.id) {
      usuarios = usuarios.filter((x) => x.id !== payload.old.id);
    }
  })
  .subscribe();

/** Siguiente id de barbero libre: 'b1', 'b2', 'b3'... */
const siguienteIdBarbero = (): string => {
  const numeros = usuarios
    .map((u) => /^b(\d+)$/.exec(u.id))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => Number(m[1]));
  return `b${Math.max(0, ...numeros) + 1}`;
};

export const RepositorioUsuarios = {
  iniciarSesion(usuario: string, contrasena: string): UsuarioBz | null {
    return (
      usuarios.find(
        (u) =>
          u.activo &&
          u.usuario.toLowerCase() === usuario.trim().toLowerCase() &&
          u.contrasena === contrasena,
      ) || null
    );
  },

  /** Versión asíncrona por si el usuario inicia sesión justo antes de terminar la carga inicial */
  async iniciarSesionAsync(usuario: string, contrasena: string): Promise<UsuarioBz | null> {
    if (!sincronizadoInicial) {
      await sincronizarUsuariosDesdeSupabase();
    }
    const local = this.iniciarSesion(usuario, contrasena);
    if (local) return local;

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .ilike('usuario', usuario.trim())
      .eq('contrasena', contrasena)
      .eq('activo', true)
      .maybeSingle();

    if (!error && data) {
      const u = filaDBUsuarioAApp(data);
      if (!usuarios.some((x) => x.id === u.id)) usuarios.push(u);
      return u;
    }
    return null;
  },

  porUsuario(usuario: string): UsuarioBz | null {
    return usuarios.find((u) => u.usuario.toLowerCase() === usuario.trim().toLowerCase()) || null;
  },

  porId(id: string): UsuarioBz | null {
    return usuarios.find((u) => u.id === id) || null;
  },

  /** Barberos activos (opcionalmente de una sucursal). */
  barberos(sucursal?: string): UsuarioBz[] {
    return usuarios.filter(
      (u) => u.rol === RolSesion.BARBERO && u.activo && (!sucursal || u.sucursal === sucursal),
    );
  },

  crearCuentaCliente(
    nombre: string,
    telefono: string,
    contrasena: string,
  ): { usuario: UsuarioBz | null; error: string | null } {
    const telLimpio = telefono.trim();
    if (usuarios.some((u) => u.usuario === telLimpio)) {
      return { usuario: null, error: 'Ya existe una cuenta con ese teléfono' };
    }
    const nuevo: UsuarioBz = {
      id: `c-${telLimpio}`,
      usuario: telLimpio,
      nombre: nombre.trim(),
      iniciales: inicialesDe(nombre),
      contrasena,
      pin: '',
      rol: RolSesion.CLIENTE,
      sucursal: 'Olivete',
      activo: true,
      comisionServicios: '',
      comisionProductos: '',
    };
    usuarios.push(nuevo);

    // Persiste en Supabase
    supabase.from('usuarios').upsert(usuarioAFilaDB(nuevo)).then(({ error }) => {
      if (error) console.warn('Error guardando cuenta cliente en Supabase:', error.message);
    });

    return { usuario: nuevo, error: null };
  },

  crearPersonal(
    usuario: string,
    nombre: string,
    contrasena: string,
    pin: string,
    rol: RolSesion,
    sucursal: string,
    activo: boolean,
    comisionServicios: string,
    comisionProductos: string,
  ): string | null {
    if (rol === RolSesion.CLIENTE || rol === RolSesion.DUENO) {
      return 'Ese rol no se puede crear desde aquí';
    }
    const usuarioLimpio = usuario.trim().toLowerCase();
    if (usuarios.some((u) => u.usuario.toLowerCase() === usuarioLimpio)) {
      return 'Ese usuario ya existe';
    }
    const nuevo: UsuarioBz = {
      id: rol === RolSesion.BARBERO ? siguienteIdBarbero() : usuarioLimpio,
      usuario: usuarioLimpio,
      nombre: nombre.trim(),
      iniciales: inicialesDe(nombre),
      contrasena,
      pin,
      rol,
      sucursal,
      activo,
      comisionServicios,
      comisionProductos,
    };
    usuarios.push(nuevo);

    // Persiste en Supabase
    supabase.from('usuarios').upsert(usuarioAFilaDB(nuevo)).then(({ error }) => {
      if (error) console.warn('Error guardando personal en Supabase:', error.message);
    });

    return null;
  },
};

export const getUsuariosDemoPorRol = (): UsuarioBz[] => {
  return [...usuarios];
};