import React, { createContext, useContext, useEffect, useState } from 'react';
import { useCatalogoConfig } from './CatalogoConfigContext';
import { RolSesion } from './Sesion';

export type DiaSemana = 'Lun' | 'Mar' | 'Mié' | 'Jue' | 'Vie' | 'Sáb' | 'Dom';
export const DIAS_SEMANA: DiaSemana[] = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export type TurnoCodigo =
  | 'Matutino (09:00 - 16:00)'
  | 'Vespertino (14:00 - 21:00)'
  | 'Completo (10:00 - 20:00)'
  | 'Descanso'
  | 'Permiso';

export interface HorarioSemanalEmpleado {
  empleadoId: string;
  nombre: string;
  rol: 'BARBERO' | 'CAJERO';
  rolSesion: RolSesion;
  sucursal: string;
  turnos: Record<DiaSemana, TurnoCodigo>;
}

export interface PermisoEmpleado {
  id: string;
  empleadoId: string;
  empleadoNombre: string;
  rolEtiqueta: string;
  sucursal: string;
  fechaTexto: string;
  esHoy: boolean;
  tipo: 'Día completo' | 'Medio turno' | 'Permiso por horas';
  motivo: string;
  estado: 'Aprobado' | 'Pendiente';
}

interface HorariosContextValue {
  semanaEtiqueta: string;
  setSemanaEtiqueta: (s: string) => void;
  horariosBarberos: HorarioSemanalEmpleado[];
  horariosCajeros: HorarioSemanalEmpleado[];
  ultimaActualizacionBarberos: string;
  ultimaActualizacionCajeros: string;
  actualizarTurnoEmpleado: (
    grupo: 'BARBERO' | 'CAJERO',
    empleadoId: string,
    dia: DiaSemana,
    turno: TurnoCodigo,
  ) => void;
  reemplazarHorariosGrupo: (
    grupo: 'BARBERO' | 'CAJERO',
    lista: HorarioSemanalEmpleado[],
    nuevaSemana?: string,
  ) => void;
  registrarIntegranteEnHorarios: (datos: {
    empleadoId?: string;
    nombre: string;
    rol: RolSesion;
    sucursal: string;
  }) => void;
  cambiarRolIntegrante: (empleadoId: string, nuevoRol: RolSesion) => void;
  permisos: PermisoEmpleado[];
  agregarPermiso: (nuevo: Omit<PermisoEmpleado, 'id'>) => void;
  editarPermiso: (id: string, cambios: Partial<Omit<PermisoEmpleado, 'id'>>) => void;
  eliminarPermiso: (id: string) => void;
}

const TURNOS_BASE_DEFAULT: Record<DiaSemana, TurnoCodigo> = {
  Lun: 'Matutino (09:00 - 16:00)',
  Mar: 'Matutino (09:00 - 16:00)',
  Mié: 'Descanso',
  Jue: 'Completo (10:00 - 20:00)',
  Vie: 'Completo (10:00 - 20:00)',
  Sáb: 'Completo (10:00 - 20:00)',
  Dom: 'Matutino (09:00 - 16:00)',
};

const HorariosContext = createContext<HorariosContextValue | null>(null);

export const HorariosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { empleados } = useCatalogoConfig();
  const [semanaEtiqueta, setSemanaEtiqueta] = useState('Semana actual (Lun - Dom)');
  const [horariosBarberos, setHorariosBarberos] = useState<HorarioSemanalEmpleado[]>([]);
  const [horariosCajeros, setHorariosCajeros] = useState<HorarioSemanalEmpleado[]>([]);
  const [ultimaActualizacionBarberos, setUltimaActualizacionBarberos] = useState('Sin cambios hoy');
  const [ultimaActualizacionCajeros, setUltimaActualizacionCajeros] = useState('Sin cambios hoy');
  const [permisos, setPermisos] = useState<PermisoEmpleado[]>([]);

  // Sincroniza los horarios con los empleados reales activos de la base de datos
  useEffect(() => {
    const activos = empleados.filter((e) => e.activo);
    const barberosBD = activos.filter((e) => e.rol === 'Barbero');
    const cajerosBD = activos.filter((e) => e.rol !== 'Barbero');

    setHorariosBarberos((prev) =>
      barberosBD.map((emp) => {
        const existente = prev.find((p) => p.empleadoId === emp.id);
        return existente
          ? { ...existente, nombre: emp.nombre, sucursal: emp.sucursal }
          : {
              empleadoId: emp.id,
              nombre: emp.nombre,
              rol: 'BARBERO',
              rolSesion: RolSesion.BARBERO,
              sucursal: emp.sucursal || 'Olivete',
              turnos: { ...TURNOS_BASE_DEFAULT },
            };
      }),
    );

    setHorariosCajeros((prev) =>
      cajerosBD.map((emp) => {
        const existente = prev.find((p) => p.empleadoId === emp.id);
        const rolSes = RolSesion.RECEPCION;
        return existente
          ? { ...existente, nombre: emp.nombre, sucursal: emp.sucursal, rolSesion: rolSes }
          : {
              empleadoId: emp.id,
              nombre: emp.nombre,
              rol: 'CAJERO',
              rolSesion: rolSes,
              sucursal: emp.sucursal || 'Olivete',
              turnos: { ...TURNOS_BASE_DEFAULT },
            };
      }),
    );
  }, [empleados]);

  const actualizarTurnoEmpleado = (
    grupo: 'BARBERO' | 'CAJERO',
    empleadoId: string,
    dia: DiaSemana,
    turno: TurnoCodigo,
  ) => {
    const ahora = new Date();
    const hora = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    if (grupo === 'BARBERO') {
      setHorariosBarberos((prev) =>
        prev.map((emp) =>
          emp.empleadoId === empleadoId
            ? { ...emp, turnos: { ...emp.turnos, [dia]: turno } }
            : emp,
        ),
      );
      setUltimaActualizacionBarberos(`Hoy · ${hora}`);
    } else {
      setHorariosCajeros((prev) =>
        prev.map((emp) =>
          emp.empleadoId === empleadoId
            ? { ...emp, turnos: { ...emp.turnos, [dia]: turno } }
            : emp,
        ),
      );
      setUltimaActualizacionCajeros(`Hoy · ${hora}`);
    }
  };

  const reemplazarHorariosGrupo = (
    grupo: 'BARBERO' | 'CAJERO',
    lista: HorarioSemanalEmpleado[],
    nuevaSemana?: string,
  ) => {
    const ahora = new Date();
    const hora = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    if (nuevaSemana) setSemanaEtiqueta(nuevaSemana);
    if (grupo === 'BARBERO') {
      setHorariosBarberos(lista);
      setUltimaActualizacionBarberos(`Subido hoy · ${hora}`);
    } else {
      setHorariosCajeros(lista);
      setUltimaActualizacionCajeros(`Subido hoy · ${hora}`);
    }
  };

  const registrarIntegranteEnHorarios = (datos: {
    empleadoId?: string;
    nombre: string;
    rol: RolSesion;
    sucursal: string;
  }) => {
    const id = datos.empleadoId || `emp-${Date.now()}`;
    const esBarbero = datos.rol === RolSesion.BARBERO;
    const nuevoRegistro: HorarioSemanalEmpleado = {
      empleadoId: id,
      nombre: datos.nombre.trim(),
      rol: esBarbero ? 'BARBERO' : 'CAJERO',
      rolSesion: datos.rol,
      sucursal: datos.sucursal || 'Olivete',
      turnos: { ...TURNOS_BASE_DEFAULT },
    };

    if (esBarbero) {
      setHorariosBarberos((prev) => (prev.some((e) => e.empleadoId === id) ? prev : [...prev, nuevoRegistro]));
    } else {
      setHorariosCajeros((prev) => (prev.some((e) => e.empleadoId === id) ? prev : [...prev, nuevoRegistro]));
    }
  };

  const cambiarRolIntegrante = (empleadoId: string, nuevoRol: RolSesion) => {
    const enBarberos = horariosBarberos.find((e) => e.empleadoId === empleadoId);
    const enCajeros = horariosCajeros.find((e) => e.empleadoId === empleadoId);
    const objetivo = enBarberos || enCajeros;
    if (!objetivo) return;

    const vaABarberos = nuevoRol === RolSesion.BARBERO;
    const actualizado: HorarioSemanalEmpleado = {
      ...objetivo,
      rol: vaABarberos ? 'BARBERO' : 'CAJERO',
      rolSesion: nuevoRol,
    };

    setHorariosBarberos((prev) => prev.filter((e) => e.empleadoId !== empleadoId));
    setHorariosCajeros((prev) => prev.filter((e) => e.empleadoId !== empleadoId));

    if (vaABarberos) {
      setHorariosBarberos((prev) => [...prev, actualizado]);
    } else {
      setHorariosCajeros((prev) => [...prev, actualizado]);
    }
  };

  const agregarPermiso = (nuevo: Omit<PermisoEmpleado, 'id'>) => {
    const id = `perm-${Date.now()}`;
    setPermisos((prev) => [{ id, ...nuevo }, ...prev]);
  };

  const editarPermiso = (id: string, cambios: Partial<Omit<PermisoEmpleado, 'id'>>) => {
    setPermisos((prev) => prev.map((p) => (p.id === id ? { ...p, ...cambios } : p)));
  };

  const eliminarPermiso = (id: string) => {
    setPermisos((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <HorariosContext.Provider
      value={{
        semanaEtiqueta,
        setSemanaEtiqueta,
        horariosBarberos,
        horariosCajeros,
        ultimaActualizacionBarberos,
        ultimaActualizacionCajeros,
        actualizarTurnoEmpleado,
        reemplazarHorariosGrupo,
        registrarIntegranteEnHorarios,
        cambiarRolIntegrante,
        permisos,
        agregarPermiso,
        editarPermiso,
        eliminarPermiso,
      }}
    >
      {children}
    </HorariosContext.Provider>
  );
};

export const useHorarios = (): HorariosContextValue => {
  const ctx = useContext(HorariosContext);
  if (!ctx) {
    throw new Error('useHorarios debe usarse dentro de <HorariosProvider>');
  }
  return ctx;
};