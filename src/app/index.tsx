import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';

// Tipos de datos (listos para conectar con tus tablas de Supabase)
type EstadoCita = 'Listo p/ cobrar' | 'En corte' | 'Por atender';

interface CitaItem {
  id: string;
  hora: string;
  cliente: string;
  servicio: string;
  barbero: string;
  estado: EstadoCita;
}

const CITAS_MOCK: CitaItem[] = [
  { id: '1', hora: '10:30', cliente: 'Luis Ortiz', servicio: 'Corte de pelo', barbero: 'Diego M.', estado: 'Listo p/ cobrar' },
  { id: '2', hora: '11:00', cliente: 'Andrés López', servicio: 'Corte + Barba', barbero: 'Carlos R.', estado: 'En corte' },
  { id: '3', hora: '12:00', cliente: 'Pablo Ruiz', servicio: 'Arreglo de barba', barbero: 'Diego M.', estado: 'En corte' },
  { id: '4', hora: '13:00', cliente: 'Hugo Peña', servicio: 'Arreglo de barba', barbero: 'Diego M.', estado: 'Por atender' },
  { id: '5', hora: '14:30', cliente: 'Mario Díaz', servicio: 'Corte de pelo', barbero: 'Carlos R.', estado: 'Por atender' },
  { id: '6', hora: '15:00', cliente: 'Raúl Torres', servicio: 'Corte + Barba', barbero: 'Andrés M.', estado: 'Por atender' },
  { id: '7', hora: '16:00', cliente: 'Beto López', servicio: 'Afeitado', barbero: 'Mateo S.', estado: 'Por atender' },
];

const LISTA_ESPERA_MOCK = [
  { id: '1', cliente: 'Hugo P.', servicio: 'Barba', tiempo: '~15 min' },
  { id: '2', cliente: 'Raúl T.', servicio: 'Cejas', tiempo: '~25 min' },
  { id: '3', cliente: 'Beto L.', servicio: 'Corte', tiempo: '~35 min' },
];

const ALERTAS_STOCK_MOCK = [
  { id: '1', producto: 'Pomada mate 100g', detalle: 'Quedan 4 pz (mín. 8)' },
  { id: '2', producto: 'Shampoo menta 250ml', detalle: 'Quedan 3 pz (mín. 6)' },
  { id: '3', producto: 'Navajas doradas', detalle: 'Quedan 2 pz (mín. 5)' },
];

const PERMISOS_MOCK = [
  { id: '1', empleado: 'Diego M.', horario: 'Sale 17:00', motivo: 'Cita médica personal' },
  { id: '2', empleado: 'Ana M.', horario: 'Mañana 16:00–20:00', motivo: 'Trámite escolar' },
];

export default function InicioCajeraScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;
  const [activeTab, setActiveTab] = useState<'inicio' | 'agenda' | 'caja' | 'stock' | 'recepcion'>('inicio');

  const getDotColor = (estado: EstadoCita) => {
    if (estado === 'Listo p/ cobrar') return '#34A853';
    return '#E5A93C';
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={[styles.layout, !isDesktop && { flexDirection: 'column' }]}>
        {/* SIDEBAR IZQUIERDO (Desktop / Tablet) */}
        {isDesktop && (
          <View style={styles.sidebar}>
            <View>
              {/* Header Marca */}
              <View style={styles.brandRow}>
                <View style={styles.logoBadge}>
                  <Text style={styles.logoText}>BZ</Text>
                </View>
                <View>
                  <Text style={styles.brandTitle}>BarberZones</Text>
                  <Text style={styles.brandSub}>Recepción/Cajero ·</Text>
                  <Text style={styles.brandSub}>Olivete</Text>
                </View>
              </View>

              {/* Menú Lateral */}
              <View style={styles.navGroup}>
                <TouchableOpacity
                  style={[styles.navItem, activeTab === 'inicio' && styles.navItemActive]}
                  onPress={() => setActiveTab('inicio')}
                >
                  <Text style={[styles.navText, activeTab === 'inicio' && styles.navTextActive]}>
                    ⌂  Inicio
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => router.push('/agenda' as any)}
                >
                  <Text style={styles.navText}>📅  Agenda</Text>
                  <View style={styles.badgeGold}>
                    <Text style={styles.badgeGoldText}>8</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => router.push('/caja' as any)}
                >
                  <Text style={styles.navText}>💵  Caja</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => router.push('/stock' as any)}
                >
                  <Text style={styles.navText}>📦  Stock</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => router.push('/recepcion' as any)}
                >
                  <Text style={styles.navText}>👤  Recepción</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer Sidebar: Hoy trabajan */}
            <View style={styles.sidebarFooter}>
              <Text style={styles.footerLabel}>Hoy trabajan</Text>
              <View style={styles.avatarsRow}>
                {['CR', 'DM', 'AM', 'MS'].map((ini) => (
                  <View key={ini} style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{ini}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* CONTENIDO PRINCIPAL */}
        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainContent}>
          {/* Header Superior */}
          <View style={styles.topHeader}>
            <View>
              <Text style={styles.dateTitle}>Sábado 21 de noviembre</Text>
              <Text style={styles.welcomeSub}>
                Hola, Ana M. · Recepción/Cajero · Sucursal Olivete
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerBtn}>
                <Text style={styles.headerBtnText}>Avisos (2)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn}>
                <Text style={styles.headerBtnText}>Tema</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 4 TARJETAS KPI */}
          <View style={[styles.kpiGrid, !isDesktop && { flexWrap: 'wrap' }]}>
            <View style={[styles.kpiCard, !isDesktop && { minWidth: '47%' }]}>
              <Text style={[styles.kpiValue, { color: '#F3F4F6' }]}>10</Text>
              <Text style={styles.kpiLabel}>CITAS HOY</Text>
              <Text style={styles.kpiFoot}>4 por atender · 3 terminadas</Text>
            </View>

            <View style={[styles.kpiCard, !isDesktop && { minWidth: '47%' }]}>
              <Text style={[styles.kpiValue, { color: '#34A853' }]}>$6,270</Text>
              <Text style={styles.kpiLabel}>CAJA DEL TURNO</Text>
              <Text style={styles.kpiFoot}>Turno abierto desde 10:00</Text>
            </View>

            <View style={[styles.kpiCard, !isDesktop && { minWidth: '47%' }]}>
              <Text style={[styles.kpiValue, { color: '#E5A93C' }]}>3</Text>
              <Text style={styles.kpiLabel}>POR COBRAR</Text>
              <Text style={styles.kpiFoot}>1 listo · 2 en corte</Text>
            </View>

            <View style={[styles.kpiCard, !isDesktop && { minWidth: '47%' }]}>
              <Text style={[styles.kpiValue, { color: '#EA4335' }]}>3</Text>
              <Text style={styles.kpiLabel}>ALERTAS DE STOCK</Text>
              <Text style={styles.kpiFoot}>Pomada, shampoo, navajas</Text>
            </View>
          </View>

          {/* GRID INFERIOR (Columna Izquierda 65% + Columna Derecha 35%) */}
          <View style={[styles.bottomGrid, !isDesktop && { flexDirection: 'column' }]}>
            {/* PANEL IZQUIERDO: AHORA Y PRÓXIMAS */}
            <View style={[styles.panelCard, isDesktop && { flex: 1.85 }]}>
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>AHORA Y PRÓXIMAS · OLIVETE</Text>
                <TouchableOpacity onPress={() => router.push('/agenda' as any)}>
                  <Text style={styles.panelLink}>Abrir agenda ›</Text>
                </TouchableOpacity>
              </View>

              {CITAS_MOCK.map((cita, idx) => (
                <View
                  key={cita.id}
                  style={[
                    styles.citaRow,
                    idx === CITAS_MOCK.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={styles.citaLeft}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getDotColor(cita.estado) },
                      ]}
                    />
                    <View>
                      <Text style={styles.citaMainText}>
                        {cita.hora} · {cita.cliente}
                      </Text>
                      <Text style={styles.citaSubText}>
                        {cita.servicio} · {cita.barbero}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.statusPill,
                      cita.estado === 'Listo p/ cobrar' && styles.statusPillReady,
                    ]}
                    onPress={() => {
                      if (cita.estado === 'Listo p/ cobrar') {
                        router.push('/caja' as any);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        cita.estado === 'Listo p/ cobrar' && { color: '#E5E7EB' },
                      ]}
                    >
                      {cita.estado}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* COLUMNA DERECHA: 3 TARJETAS */}
            <View style={[styles.rightColumn, isDesktop && { flex: 1 }]}>
              {/* 1. LISTA DE ESPERA */}
              <View style={styles.panelCard}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelTitle}>LISTA DE ESPERA (3)</Text>
                  <TouchableOpacity>
                    <Text style={styles.panelLink}>Asignar ›</Text>
                  </TouchableOpacity>
                </View>

                {LISTA_ESPERA_MOCK.map((item) => (
                  <View key={item.id} style={styles.miniRow}>
                    <View style={[styles.statusDot, { backgroundColor: '#E5A93C' }]} />
                    <View>
                      <Text style={styles.miniTitle}>
                        {item.cliente} · {item.servicio}
                      </Text>
                      <Text style={styles.miniSub}>{item.tiempo}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* 2. ALERTAS DE INVENTARIO */}
              <View style={styles.panelCard}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelTitle}>ALERTAS DE INVENTARIO</Text>
                  <TouchableOpacity onPress={() => router.push('/stock' as any)}>
                    <Text style={styles.panelLink}>Ver stock ›</Text>
                  </TouchableOpacity>
                </View>

                {ALERTAS_STOCK_MOCK.map((item) => (
                  <View key={item.id} style={styles.miniRow}>
                    <View style={[styles.statusDot, { backgroundColor: '#E5A93C' }]} />
                    <View>
                      <Text style={styles.miniTitle}>{item.producto}</Text>
                      <Text style={styles.miniSub}>{item.detalle}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* 3. PERMISOS DE HOY */}
              <View style={styles.panelCard}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelTitle}>PERMISOS DE HOY</Text>
                  <TouchableOpacity>
                    <Text style={styles.panelLink}>Ver horarios ›</Text>
                  </TouchableOpacity>
                </View>

                {PERMISOS_MOCK.map((item) => (
                  <View key={item.id} style={styles.miniRow}>
                    <View style={[styles.statusDot, { backgroundColor: '#E5A93C' }]} />
                    <View>
                      <Text style={styles.miniTitle}>
                        {item.empleado} · {item.horario}
                      </Text>
                      <Text style={styles.miniSub}>{item.motivo}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 225,
    backgroundColor: '#111111',
    borderRightWidth: 1,
    borderRightColor: '#222222',
    padding: 16,
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#D4A853',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#111111',
    fontWeight: '800',
    fontSize: 13,
  },
  brandTitle: {
    color: '#F3F4F6',
    fontWeight: '700',
    fontSize: 14,
  },
  brandSub: {
    color: '#9CA3AF',
    fontSize: 11,
    lineHeight: 14,
  },
  navGroup: {
    gap: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: '#262014',
    borderWidth: 1,
    borderColor: '#5C4922',
  },
  navText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  navTextActive: {
    color: '#E5B95C',
    fontWeight: '600',
  },
  badgeGold: {
    backgroundColor: '#E5B95C',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  badgeGoldText: {
    color: '#111111',
    fontSize: 11,
    fontWeight: '700',
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: '#222222',
    paddingTop: 14,
  },
  footerLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    marginBottom: 8,
  },
  avatarsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#D1D5DB',
    fontSize: 10,
    fontWeight: '700',
  },
  mainScroll: {
    flex: 1,
  },
  mainContent: {
    padding: 24,
    gap: 18,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  dateTitle: {
    color: '#F9FAFB',
    fontSize: 26,
    fontWeight: '700',
  },
  welcomeSub: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  headerBtnText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600',
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 14,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#242424',
    borderRadius: 12,
    padding: 16,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  kpiLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  kpiFoot: {
    color: '#D1D5DB',
    fontSize: 12,
  },
  bottomGrid: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  rightColumn: {
    gap: 14,
  },
  panelCard: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#242424',
    borderRadius: 12,
    padding: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  panelTitle: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  panelLink: {
    color: '#E5A93C',
    fontSize: 12,
    fontWeight: '600',
  },
  citaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  citaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  citaMainText: {
    color: '#F3F4F6',
    fontSize: 13,
    fontWeight: '600',
  },
  citaSubText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 1,
  },
  statusPill: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2E2E2E',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  statusPillReady: {
    backgroundColor: '#232323',
    borderColor: '#3B3B3B',
  },
  statusPillText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '500',
  },
  miniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 11,
  },
  miniTitle: {
    color: '#F3F4F6',
    fontSize: 13,
    fontWeight: '600',
  },
  miniSub: {
    color: '#9CA3AF',
    fontSize: 12,
  },
});