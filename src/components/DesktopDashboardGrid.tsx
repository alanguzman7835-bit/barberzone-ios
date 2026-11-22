import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useDesktopLayout } from '../hooks/useDesktopLayout';

export type KpiCardData = {
  value: string | number;
  label: string;
  accentColor?: string;
};

export type DashboardListItem = {
  id: string;
  initials: string;
  title: string;
  timeOrMeta: string;
  subtitle: string;
  actionLabel?: string;
  actionVariant?: 'primary' | 'secondary';
  onAction?: () => void;
};

type DesktopDashboardGridProps = {
  dateTitle: string;
  summaryText: string;
  kpis: KpiCardData[];
  leftPanelTitle: string;
  leftPanelBadge?: string;
  leftItems: DashboardListItem[];
  rightPanelTitle: string;
  rightPanelBadge?: string;
  rightItems: DashboardListItem[];
};

export function DesktopDashboardGrid({
  dateTitle,
  summaryText,
  kpis,
  leftPanelTitle,
  leftPanelBadge,
  leftItems,
  rightPanelTitle,
  rightPanelBadge,
  rightItems,
}: DesktopDashboardGridProps) {
  const { isDesktop } = useDesktopLayout();

  return (
    <View style={styles.wrapper}>
      {/* Título principal con fecha del día */}
      <View style={styles.header}>
        <Text style={styles.dateTitle}>{dateTitle}</Text>
        <Text style={styles.summaryText}>{summaryText}</Text>
      </View>

      {/* Fila superior: 4 tarjetas KPI */}
      <View style={[styles.kpiRow, !isDesktop && styles.stackColumn]}>
        {kpis.map((kpi, idx) => (
          <View key={idx} style={styles.kpiCard}>
            <Text
              style={[
                styles.kpiValue,
                { color: kpi.accentColor ?? '#F9FAFB' },
              ]}
            >
              {kpi.value}
            </Text>
            <Text style={styles.kpiLabel}>{kpi.label}</Text>
          </View>
        ))}
      </View>

      {/* Fila inferior: 2 paneles divididos */}
      <View style={[styles.panelsRow, !isDesktop && styles.stackColumn]}>
        {/* Panel izquierdo (Próximas citas) */}
        <View style={[styles.panelCard, isDesktop && { flex: 1.25 }]}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>{leftPanelTitle}</Text>
            {leftPanelBadge ? (
              <View style={styles.panelPill}>
                <Text style={styles.panelPillText}>{leftPanelBadge}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.listGap}>
            {leftItems.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.initials}</Text>
                </View>
                <View style={styles.itemInfo}>
                  <View style={styles.itemTopLine}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemMeta}>{item.timeOrMeta}</Text>
                  </View>
                  <Text style={styles.itemSub} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
                {item.actionLabel ? (
                  <Pressable
                    onPress={item.onAction}
                    style={[
                      styles.actionBtn,
                      item.actionVariant === 'secondary'
                        ? styles.actionBtnSecondary
                        : styles.actionBtnPrimary,
                    ]}
                  >
                    <Text
                      style={[
                        styles.actionBtnText,
                        item.actionVariant === 'secondary' && {
                          color: '#FBBF24',
                        },
                      ]}
                    >
                      {item.actionLabel}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        </View>

        {/* Panel derecho (Pendientes / Caja / Mensajes) */}
        <View style={[styles.panelCard, isDesktop && { flex: 1 }]}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>{rightPanelTitle}</Text>
            {rightPanelBadge ? (
              <View style={styles.panelPillWarning}>
                <Text style={styles.panelPillWarningText}>{rightPanelBadge}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.listGap}>
            {rightItems.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.avatarAlt}>
                  <Text style={styles.avatarText}>{item.initials}</Text>
                </View>
                <View style={styles.itemInfo}>
                  <View style={styles.itemTopLine}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemMeta}>{item.timeOrMeta}</Text>
                  </View>
                  <Text style={styles.itemSub} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
                {item.actionLabel ? (
                  <Pressable
                    onPress={item.onAction}
                    style={[styles.actionBtn, styles.actionBtnPrimary]}
                  >
                    <Text style={styles.actionBtnText}>{item.actionLabel}</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: 20,
  },
  header: {
    marginBottom: 4,
  },
  dateTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F9FAFB',
    letterSpacing: -0.5,
  },
  summaryText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stackColumn: {
    flexDirection: 'column',
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#161F33',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  kpiValue: {
    fontSize: 34,
    fontWeight: '800',
  },
  kpiLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 6,
    fontWeight: '500',
  },
  panelsRow: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  panelCard: {
    width: '100%',
    backgroundColor: '#161F33',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  panelPill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  panelPillText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
  },
  panelPillWarning: {
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  panelPillWarningText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
  },
  listGap: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(11, 15, 25, 0.55)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarAlt: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#F9FAFB',
    fontSize: 12,
    fontWeight: '700',
  },
  itemInfo: {
    flex: 1,
  },
  itemTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '700',
  },
  itemMeta: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  itemSub: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
  },
  actionBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  actionBtnPrimary: {
    backgroundColor: '#D97706',
  },
  actionBtnSecondary: {
    backgroundColor: 'rgba(217, 119, 6, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});