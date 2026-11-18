export enum RolSesion {
  DUENO = 'Dueño',
  ENCARGADO = 'Encargado',
  RECEPCION = 'Recepción/Cajero',
  BARBERO = 'Barbero',
  CLIENTE = 'Cliente',
}

export interface UsuarioBz {
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

const usuarios: UsuarioBz[] = [
  { usuario: 'dueno', nombre: 'Dueño', iniciales: 'DU', contrasena: 'barberzone1', pin: '1111', rol: RolSesion.DUENO, sucursal: 'Todas', activo: true, comisionServicios: '', comisionProductos: '' },
  { usuario: 'encargado', nombre: 'Encargado', iniciales: 'EN', contrasena: 'barberzone1', pin: '2222', rol: RolSesion.ENCARGADO, sucursal: 'Olivete', activo: true, comisionServicios: '', comisionProductos: '' },
  { usuario: 'ana', nombre: 'Ana M.', iniciales: 'AM', contrasena: 'barberzone1', pin: '3333', rol: RolSesion.RECEPCION, sucursal: 'Olivete', activo: true, comisionServicios: '', comisionProductos: '' },
  { usuario: 'carlos', nombre: 'Carlos R.', iniciales: 'CR', contrasena: 'barberzone1', pin: '4444', rol: RolSesion.BARBERO, sucursal: 'Olivete', activo: true, comisionServicios: '', comisionProductos: '' },
];

const inicialesDe = (nombre: string): string =>
  nombre.trim().split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

export const RepositorioUsuarios = {
  iniciarSesion(usuario: string, contrasena: string): UsuarioBz | null {
    return (
      usuarios.find(
        (u) => u.activo && u.usuario.toLowerCase() === usuario.trim().toLowerCase() && u.contrasena === contrasena
      ) || null
    );
  },

  porUsuario(usuario: string): UsuarioBz | null {
    return usuarios.find((u) => u.usuario.toLowerCase() === usuario.trim().toLowerCase()) || null;
  },

  crearCuentaCliente(nombre: string, telefono: string, contrasena: string): { usuario: UsuarioBz | null; error: string | null } {
    if (usuarios.some((u) => u.usuario === telefono)) {
      return { usuario: null, error: 'Ya existe una cuenta con ese teléfono' };
    }
    const nuevo: UsuarioBz = {
      usuario: telefono,
      nombre: nombre.trim(),
      iniciales: inicialesDe(nombre),
      contrasena,
      pin: '',
      rol: RolSesion.CLIENTE,
      sucursal: '',
      activo: true,
      comisionServicios: '',
      comisionProductos: '',
    };
    usuarios.push(nuevo);
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
    comisionProductos: string
  ): string | null {
    if (rol === RolSesion.CLIENTE || rol === RolSesion.DUENO) {
      return 'Ese rol no se puede crear desde aquí';
    }
    if (usuarios.some((u) => u.usuario.toLowerCase() === usuario.trim().toLowerCase())) {
      return 'Ese usuario ya existe';
    }
    usuarios.push({
      usuario: usuario.trim().toLowerCase(),
      nombre: nombre.trim(),
      iniciales: inicialesDe(nombre),
      contrasena,
      pin,
      rol,
      sucursal,
      activo,
      comisionServicios,
      comisionProductos,
    });
    return null;
  },
};

export const getUsuariosDemoPorRol = (): UsuarioBz[] => {
  const equipo = [
    RepositorioUsuarios.iniciarSesion('dueno', 'barberzone1'),
    RepositorioUsuarios.iniciarSesion('encargado', 'barberzone1'),
    RepositorioUsuarios.iniciarSesion('ana', 'barberzone1'),
    RepositorioUsuarios.iniciarSesion('carlos', 'barberzone1'),
  ].filter((u): u is UsuarioBz => u !== null);

  let clienteDemo = RepositorioUsuarios.iniciarSesion('cliente', 'barberzone1');
  if (!clienteDemo) {
    const res = RepositorioUsuarios.crearCuentaCliente('Juan Pérez', '3312345678', 'barberzone1');
    clienteDemo = res.usuario || RepositorioUsuarios.iniciarSesion('3312345678', 'barberzone1');
  }
  return clienteDemo ? [...equipo, clienteDemo] : equipo;
};