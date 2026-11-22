import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useBzTheme } from '../constants/BzTheme';
import {
  DIAS_SEMANA,
  DiaSemana,
  HorarioSemanalEmpleado,
  PermisoEmpleado,
  TurnoCodigo,
  useHorarios,
} from '../constants/HorariosContext';
import { RolSesion, UsuarioBz } from '../constants/Sesion';
import {
  BotonMini,
  BotonPrimario,
  BotonSecundario,
  BzSheet,
  CampoTexto,
  ChipTexto,
  Divisor,
  Etiqueta,
  Fila,
  Segmentado,
  Tarjeta,
  Titulo,
} from './BzFase3Ui';

const OPCIONES_TURNO: TurnoCodigo[] = [
  'Matutino (09:00 - 16:00)',
  'Vespertino (14:00 - 21:00)',
  'Completo (10:00 - 20:00)',
  'Descanso',
  'Permiso',
];

const etiquetaCortaTurno = (t: TurnoCodigo): string => {
  if (t.startsWith('Matutino')) return 'Matutino';
  if (t.startsWith('Vespertino')) return 'Vespertino';
  if (t.startsWith('Completo')) return 'Completo';
  if (t === 'Permiso') return 'Permiso';
  return 'Descanso';
};

/**
 * Construye el documento Word (.doc) con la tabla semanal:
 * - Descanso -> Naranja (#FFE5B4)
 * - Permiso  -> Verde   (#D1FAE5)
 */
const construirDocumentoWordHtml = (
  sucursal: string,
  semana: string,
  tituloGrupo: string,
  etiquetaColumna: string,
  lista: HorarioSemanalEmpleado[],
): string => {
  const encabezadosDias = DIAS_SEMANA.map(
    (d) =>
      `<th style="border:1px solid #333;background-color:#1A1A1A;color:#FFFFFF;padding:7px;font-size:11px;">${d}</th>`,
  ).join('');

  const filas = lista
    .map((emp) => {
      const celdasDias = DIAS_SEMANA.map((d) => {
        const turno = emp.turnos[d];
        const esDescanso = turno === 'Descanso';
        const esPermiso = turno === 'Permiso';

        let estiloCelda = 'border:1px solid #999;padding:6px;text-align:center;font-size:11px;';
        if (esDescanso) {
          estiloCelda += 'background-color:#FFE5B4;color:#B45309;font-weight:bold;';
        } else if (esPermiso) {
          estiloCelda += 'background-color:#D1FAE5;color:#065F46;font-weight:bold;';
        }

        return `<td style="${estiloCelda}">${turno}</td>`;
      }).join('');

      return `
        <tr>
          <td style="border:1px solid #999;padding:6px;font-weight:bold;font-size:12px;">${emp.nombre}</td>
          ${celdasDias}
        </tr>
      `;
    })
    .join('');

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <title>${tituloGrupo} · BarberZone</title>
      </head>
      <body style="font-family:Arial,sans-serif;color:#111111;padding:16px;">
        <h1 style="font-size:18px;margin-bottom:4px;">BARBERZONE · SUCURSAL ${sucursal.toUpperCase()}</h1>
        <p style="font-size:12px;color:#555555;margin-top:0;margin-bottom:14px;">${tituloGrupo} · ${semana}</p>

        <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
          <thead>
            <tr>
              <th style="border:1px solid #333;background-color:#1A1A1A;color:#FFFFFF;padding:7px;text-align:left;font-size:11px;">${etiquetaColumna}</th>
              ${encabezadosDias}
            </tr>
          </thead>
          <tbody>
            ${filas}
          </tbody>
        </table>

        <p style="font-size:11px;margin-top:14px;">
          <span style="background-color:#FFE5B4;color:#B45309;padding:2px 6px;font-weight:bold;">Naranja = Descanso</span>
            
          <span style="background-color:#D1FAE5;color:#065F46;padding:2px 6px;font-weight:bold;">Verde = Permiso</span>
        </p>
      </body>
    </html>
  `;
};

export const HorariosYPermisosScreen: React.FC<{
  usuario: UsuarioBz;
  tabInicial?: 'HORARIOS' | 'PERMISOS';
  onVolver?: () => void;
}> = ({ usuario, tabInicial = 'HORARIOS', onVolver }) => {
  const { colors } = useBzTheme();
  const {
    semanaEtiqueta,
    horariosBarberos,
    horariosCajeros,
    ultimaActualizacionBarberos,
    ultimaActualizacionCajeros,
    actualizarTurnoEmpleado,
    reemplazarHorariosGrupo,
    permisos,
    agregarPermiso,
    editarPermiso,
    eliminarPermiso,
  } = useHorarios();

  const esGerencia = usuario.rol === RolSesion.DUENO || usuario.rol === RolSesion.ENCARGADO;
  const esCajero = usuario.rol === RolSesion.RECEPCION;
  const esBarbero = usuario.rol === RolSesion.BARBERO;

  const [vista, setVista] = useState<'HORARIOS' | 'PERMISOS'>(
    esGerencia ? tabInicial : 'HORARIOS',
  );
  const [diaSel, setDiaSel] = useState<DiaSemana>('Lun');
  const [avisoEnvio, setAvisoEnvio] = useState<string | null>(null);

  // Modal único para armar y publicar + mandar a WhatsApp en Word
  const [modalSubirGrupo, setModalSubirGrupo] = useState<'BARBERO' | 'CAJERO' | null>(null);
  const [borradorHorarios, setBorradorHorarios] = useState<HorarioSemanalEmpleado[]>([]);
  const [semanaTexto, setSemanaTexto] = useState(semanaEtiqueta);
  const [diaBorrador, setDiaBorrador] = useState<DiaSemana>('Lun');

  // Modal para crear o editar un permiso
  const [modalPermisoAbierto, setModalPermisoAbierto] = useState(false);
  const [permisoEditandoId, setPermisoEditandoId] = useState<string | null>(null);
  const [empPermisoNombre, setEmpPermisoNombre] = useState('Carlos R.');
  const [empPermisoRol, setEmpPermisoRol] = useState<string>(RolSesion.BARBERO);
  const [fechaPermiso, setFechaPermiso] = useState('Hoy · Todo el día');
  const [esHoyPermiso, setEsHoyPermiso] = useState(true);
  const [tipoPermiso, setTipoPermiso] = useState<PermisoEmpleado['tipo']>('Día completo');
  const [motivoPermiso, setMotivoPermiso] = useState('');
  const [estadoPermiso, setEstadoPermiso] = useState<PermisoEmpleado['estado']>('Aprobado');

  const generarYEnviarWordAutomatico = async (
    grupo: 'BARBERO' | 'CAJERO',
    listaPublicada: HorarioSemanalEmpleado[],
    semanaPublicada: string,
  ) => {
    try {
      const sucursal = usuario.sucursal && usuario.sucursal !== 'Todas' ? usuario.sucursal : 'Olivete';
      const esBarberos = grupo === 'BARBERO';
      const tituloGrupo = esBarberos ? 'Horario Semanal · Barberos' : 'Horario Semanal · Cajeros';
      const etiquetaColumna = esBarberos ? 'Barbero' : 'Cajero(a)';

      const htmlWord = construirDocumentoWordHtml(
        sucursal,
        semanaPublicada,
        tituloGrupo,
        etiquetaColumna,
        listaPublicada,
      );

      const nombreArchivo = `Horario_${esBarberos ? 'Barberos' : 'Cajeros'}_${sucursal}.doc`;
      const rutaArchivo = `${FileSystem.cacheDirectory}${nombreArchivo}`;

      await FileSystem.writeAsStringAsync(rutaArchivo, htmlWord, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const disponible = await Sharing.isAvailableAsync();
      if (disponible) {
        await Sharing.shareAsync(rutaArchivo, {
          mimeType: 'application/msword',
          dialogTitle: `Enviar ${nombreArchivo} por WhatsApp`,
          UTI: 'com.microsoft.word.doc',
        });
      }

      setAvisoEnvio(
        `Horario de ${esBarberos ? 'Barberos' : 'Cajeros'} guardado y listo en Word (${nombreArchivo}).`,
      );
    } catch {
      setAvisoEnvio('Horario guardado en la app (no se pudo abrir el menú de compartir archivo).');
    }
  };

  const abrirSubidaHorario = (grupo: 'BARBERO' | 'CAJERO') => {
    const base = grupo === 'BARBERO' ? horariosBarberos : horariosCajeros;
    setBorradorHorarios(
      base.map((emp) => ({
        ...emp,
        turnos: { ...emp.turnos },
      })),
    );
    setSemanaTexto(semanaEtiqueta);
    setDiaBorrador(diaSel);
    setModalSubirGrupo(grupo);
  };

  const cambiarTurnoBorrador = (empleadoId: string, dia: DiaSemana, turno: TurnoCodigo) => {
    setBorradorHorarios((prev) =>
      prev.map((emp) =>
        emp.empleadoId === empleadoId
          ? { ...emp, turnos: { ...emp.turnos, [dia]: turno } }
          : emp,
      ),
    );
  };

  const confirmarSubidaYEnviarWhatsApp = async () => {
    if (!modalSubirGrupo) return;
    const grupoActual = modalSubirGrupo;
    const semanaFinal = semanaTexto.trim() || semanaEtiqueta;
    const listaFinal = borradorHorarios;

    reemplazarHorariosGrupo(grupoActual, listaFinal, semanaFinal);
    setModalSubirGrupo(null);

    await generarYEnviarWordAutomatico(grupoActual, listaFinal, semanaFinal);
  };

  const abrirNuevoPermiso = () => {
    setPermisoEditandoId(null);
    setEmpPermisoNombre('Carlos R.');
    setEmpPermisoRol(RolSesion.BARBERO);
    setFechaPermiso('Hoy · Todo el día');
    setEsHoyPermiso(true);
    setTipoPermiso('Día completo');
    setMotivoPermiso('');
    setEstadoPermiso('Aprobado');
    setModalPermisoAbierto(true);
  };

  const abrirEditarPermiso = (perm: PermisoEmpleado) => {
    setPermisoEditandoId(perm.id);
    setEmpPermisoNombre(perm.empleadoNombre);
    setEmpPermisoRol(perm.rolEtiqueta);
    setFechaPermiso(perm.fechaTexto);
    setEsHoyPermiso(perm.esHoy);
    setTipoPermiso(perm.tipo);
    setMotivoPermiso(perm.motivo);
    setEstadoPermiso(perm.estado);
    setModalPermisoAbierto(true);
  };

  const guardarPermiso = () => {
    const payload = {
      empleadoId: empPermisoNombre.toLowerCase().replace(/\s+/g, '-'),
      empleadoNombre: empPermisoNombre.trim() || 'Personal',
      rolEtiqueta: empPermisoRol,
      sucursal: usuario.sucursal && usuario.sucursal !== 'Todas' ? usuario.sucursal : 'Olivete',
      fechaTexto: fechaPermiso.trim() || 'Hoy · Todo el día',
      esHoy: esHoyPermiso,
      tipo: tipoPermiso,
      motivo: motivoPermiso.trim() || 'Permiso personal autorizado',
      estado: estadoPermiso,
    };

    if (permisoEditandoId) {
      editarPermiso(permisoEditandoId, payload);
    } else {
      agregarPermiso(payload);
    }
    setModalPermisoAbierto(false);
  };

  const personalSeleccionable: { nombre: string; rol: string }[] = [
    ...horariosBarberos.map((b) => ({ nombre: b.nombre, rol: RolSesion.BARBERO })),
    ...horariosCajeros.map((c) => ({ nombre: c.nombre, rol: RolSesion.RECEPCION })),
  ];

  const colorDeTurno = (turno: TurnoCodigo): string => {
    if (turno === 'Descanso') return colors.BzWarning;
    if (turno === 'Permiso') return colors.BzSuccess;
    return colors.BzText;
  };

  const renderBloqueHorario = (
    tituloGrupo: string,
    grupo: 'BARBERO' | 'CAJERO',
    lista: HorarioSemanalEmpleado[],
    actualizadoTexto: string,
  ) => (
    <Tarjeta padding={14} radius={14} gap={10}>
      <View>
        <Etiqueta texto={tituloGrupo} />
        <Text style={{ color: colors.BzMuted, fontSize: 10 }}>{actualizadoTexto}</Text>
      </View>

      {lista.map((emp, idx) => {
        const turnoDia = emp.turnos[diaSel];
        const diasDescansoSemana = DIAS_SEMANA.filter((d) => emp.turnos[d] === 'Descanso');
        const diasPermisoSemana = DIAS_SEMANA.filter((d) => emp.turnos[d] === 'Permiso');
        const badgeColor = colorDeTurno(turnoDia);

        return (
          <View key={emp.empleadoId} style={{ gap: 8 }}>
            {idx > 0 && <Divisor />}
            <Fila>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ color: colors.BzText, fontSize: 14, fontWeight: '600' }}>
                  {emp.nombre}
                </Text>
                <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                  Descanso: {diasDescansoSemana.length > 0 ? diasDescansoSemana.join(', ') : 'Ninguno'}
                  {diasPermisoSemana.length > 0 ? ` · Permiso: ${diasPermisoSemana.join(', ')}` : ''}
                </Text>
              </View>
              <View
                style={{
                  borderRadius: 10,
                  backgroundColor: colors.BzBg,
                  borderWidth: 1,
                  borderColor: badgeColor,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Text
                  style={{
                    color: badgeColor,
                    fontSize: 11,
                    fontWeight: '600',
                  }}
                >
                  {etiquetaCortaTurno(turnoDia)}
                </Text>
              </View>
            </Fila>

            <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
              {diaSel}: {turnoDia}
            </Text>

            {esGerencia && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {OPCIONES_TURNO.map((op) => (
                  <ChipTexto
                    key={op}
                    texto={etiquetaCortaTurno(op)}
                    size={10}
                    padH={9}
                    padV={4}
                    activo={turnoDia === op}
                    onPress={() => actualizarTurnoEmpleado(grupo, emp.empleadoId, diaSel, op)}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        );
      })}
    </Tarjeta>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.BzBg }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 14, gap: 12, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {onVolver && (
          <Pressable onPress={onVolver}>
            <Text style={{ color: colors.BzMuted, fontSize: 13 }}>‹ Volver</Text>
          </Pressable>
        )}

        <Titulo texto={esGerencia ? 'Horarios y Permisos' : 'Horarios de la semana'} />
        <Text style={{ color: colors.BzMuted, fontSize: 12 }}>{semanaEtiqueta}</Text>

        {esGerencia && (
          <Segmentado
            opciones={['Horarios y Turnos', 'Permisos del personal']}
            valor={vista === 'HORARIOS' ? 'Horarios y Turnos' : 'Permisos del personal'}
            onChange={(v) => setVista(v === 'Horarios y Turnos' ? 'HORARIOS' : 'PERMISOS')}
          />
        )}

        {vista === 'HORARIOS' ? (
          <>
            {/* ÚNICOS dos botones: al subir horario lo guarda en la app y lo manda en Word por WhatsApp */}
            {esGerencia && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <BotonPrimario
                    texto="Subir horario Barberos"
                    height={46}
                    onPress={() => abrirSubidaHorario('BARBERO')}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <BotonSecundario
                    texto="Subir horario Cajeros"
                    height={46}
                    onPress={() => abrirSubidaHorario('CAJERO')}
                  />
                </View>
              </View>
            )}

            {avisoEnvio && (
              <Text style={{ color: colors.BzSuccess, fontSize: 11, textAlign: 'center' }}>
                {avisoEnvio}
              </Text>
            )}

            {/* Selector de día de la semana */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {DIAS_SEMANA.map((d) => (
                <ChipTexto
                  key={d}
                  texto={d}
                  padH={13}
                  padV={7}
                  activo={diaSel === d}
                  onPress={() => setDiaSel(d)}
                />
              ))}
            </ScrollView>

            {/* Barberos ven SOLO horarios de Barberos; Cajeros ven Barberos + Cajeros; Gerencia ve ambos */}
            {(esBarbero || esCajero || esGerencia) &&
              renderBloqueHorario(
                'HORARIO SEMANAL · BARBEROS',
                'BARBERO',
                horariosBarberos,
                ultimaActualizacionBarberos,
              )}

            {(esCajero || esGerencia) &&
              renderBloqueHorario(
                'HORARIO SEMANAL · CAJEROS / RECEPCIÓN',
                'CAJERO',
                horariosCajeros,
                ultimaActualizacionCajeros,
              )}
          </>
        ) : (
          <>
            <BotonPrimario
              texto="+ Registrar permiso o día libre"
              height={46}
              onPress={abrirNuevoPermiso}
            />

            {permisos.length === 0 ? (
              <Tarjeta padding={16}>
                <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
                  No hay permisos registrados actualmente.
                </Text>
              </Tarjeta>
            ) : (
              permisos.map((perm) => (
                <Tarjeta
                  key={perm.id}
                  padding={14}
                  radius={14}
                  gap={8}
                  borderColor={perm.esHoy ? colors.BzWarning : undefined}
                >
                  <Fila>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.BzText, fontSize: 15, fontWeight: '600' }}>
                        {perm.empleadoNombre}
                      </Text>
                      <Text style={{ color: colors.BzMuted, fontSize: 11 }}>
                        {perm.rolEtiqueta} · Sucursal {perm.sucursal}
                      </Text>
                    </View>
                    <View
                      style={{
                        borderRadius: 10,
                        backgroundColor: colors.BzBg,
                        borderWidth: 1,
                        borderColor: perm.esHoy ? colors.BzWarning : colors.BzSuccess,
                        paddingHorizontal: 9,
                        paddingVertical: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: perm.esHoy ? colors.BzWarning : colors.BzSuccess,
                          fontSize: 10,
                          fontWeight: '600',
                        }}
                      >
                        {perm.esHoy ? 'HOY · ' : ''}{perm.estado}
                      </Text>
                    </View>
                  </Fila>

                  <Text style={{ color: colors.BzText, fontSize: 13 }}>
                    {perm.tipo} · {perm.fechaTexto}
                  </Text>
                  <Text style={{ color: colors.BzMuted, fontSize: 12 }}>
                    Motivo: {perm.motivo}
                  </Text>

                  <Divisor />

                  <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                    <BotonMini
                      texto="Editar permiso"
                      size={11}
                      onPress={() => abrirEditarPermiso(perm)}
                    />
                    <Pressable
                      onPress={() => eliminarPermiso(perm.id)}
                      style={{
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: colors.BzDanger,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                      }}
                    >
                      <Text style={{ color: colors.BzDanger, fontSize: 11, fontWeight: '600' }}>
                        Eliminar
                      </Text>
                    </Pressable>
                  </View>
                </Tarjeta>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Sheet único: Armar horario semanal -> Publicar en app + Enviar Word (.doc) a WhatsApp */}
      <BzSheet visible={modalSubirGrupo !== null} onDismiss={() => setModalSubirGrupo(null)}>
        <Titulo
          texto={
            modalSubirGrupo === 'BARBERO'
              ? 'Subir horario · Barberos'
              : 'Subir horario · Cajeros'
          }
          size={19}
        />
        <CampoTexto
          valor={semanaTexto}
          onCambio={setSemanaTexto}
          label="Etiqueta de semana (ej. 23 - 29 Nov)"
          fondo="bg"
        />

        <Etiqueta texto="SELECCIONA EL DÍA A CONFIGURAR" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {DIAS_SEMANA.map((d) => (
            <ChipTexto
              key={d}
              texto={d}
              padH={12}
              padV={6}
              activo={diaBorrador === d}
              onPress={() => setDiaBorrador(d)}
            />
          ))}
        </ScrollView>

        <ScrollView style={{ maxHeight: 260 }} contentContainerStyle={{ gap: 10 }}>
          {borradorHorarios.map((emp) => (
            <Tarjeta key={emp.empleadoId} fondo="bg" padding={12} radius={12} gap={8}>
              <Fila>
                <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '600' }}>
                  {emp.nombre}
                </Text>
                <Text
                  style={{
                    color: colorDeTurno(emp.turnos[diaBorrador]),
                    fontSize: 11,
                    fontWeight: '600',
                  }}
                >
                  {etiquetaCortaTurno(emp.turnos[diaBorrador])}
                </Text>
              </Fila>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {OPCIONES_TURNO.map((op) => (
                  <ChipTexto
                    key={op}
                    texto={etiquetaCortaTurno(op)}
                    size={10}
                    padH={9}
                    padV={5}
                    activo={emp.turnos[diaBorrador] === op}
                    onPress={() => cambiarTurnoBorrador(emp.empleadoId, diaBorrador, op)}
                  />
                ))}
              </ScrollView>
            </Tarjeta>
          ))}
        </ScrollView>

        <BotonPrimario
          texto={
            modalSubirGrupo === 'BARBERO'
              ? 'Subir y enviar Word a Barberos (WhatsApp)'
              : 'Subir y enviar Word a Cajeros (WhatsApp)'
          }
          height={46}
          onPress={confirmarSubidaYEnviarWhatsApp}
        />
        <BotonSecundario texto="Cancelar" height={42} onPress={() => setModalSubirGrupo(null)} />
      </BzSheet>

      {/* Sheet para Registrar o Editar Permiso */}
      <BzSheet visible={modalPermisoAbierto} onDismiss={() => setModalPermisoAbierto(false)}>
        <Titulo
          texto={permisoEditandoId ? 'Editar permiso' : 'Registrar permiso'}
          size={19}
        />

        <Etiqueta texto="1. TRABAJADOR (BARBERO / RECEPCIÓN)" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {personalSeleccionable.map((p) => (
            <ChipTexto
              key={p.nombre}
              texto={`${p.nombre} (${p.rol.split('/')[0]})`}
              size={11}
              padH={10}
              padV={6}
              activo={empPermisoNombre === p.nombre}
              onPress={() => {
                setEmpPermisoNombre(p.nombre);
                setEmpPermisoRol(p.rol);
              }}
            />
          ))}
        </ScrollView>

        <Etiqueta texto="2. TIPO DE PERMISO" />
        <Segmentado
          opciones={['Día completo', 'Medio turno', 'Permiso por horas']}
          valor={tipoPermiso}
          onChange={(v) => setTipoPermiso(v as PermisoEmpleado['tipo'])}
        />

        <CampoTexto
          valor={fechaPermiso}
          onCambio={setFechaPermiso}
          label="Fecha y horario (ej. Hoy · Todo el día)"
          fondo="bg"
        />

        <CampoTexto
          valor={motivoPermiso}
          onCambio={setMotivoPermiso}
          label="Motivo del permiso"
          fondo="bg"
        />

        <Fila>
          <Text style={{ color: colors.BzText, fontSize: 12 }}>Destacar en Inicio como permiso de HOY</Text>
          <ChipTexto
            texto={esHoyPermiso ? 'Sí (Hoy)' : 'Otro día'}
            size={11}
            activo={esHoyPermiso}
            onPress={() => setEsHoyPermiso((v) => !v)}
          />
        </Fila>

        <BotonPrimario
          texto={permisoEditandoId ? 'Guardar cambios del permiso' : 'Guardar permiso'}
          height={46}
          onPress={guardarPermiso}
        />
        <BotonSecundario texto="Cancelar" height={42} onPress={() => setModalPermisoAbierto(false)} />
      </BzSheet>
    </View>
  );
};