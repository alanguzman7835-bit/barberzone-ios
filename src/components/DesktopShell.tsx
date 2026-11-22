import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useBzTheme } from '../constants/BzTheme';
import { useDesktopLayout } from '../hooks/useDesktopLayout';

export type DesktopNavItem = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
};

export type DesktopStaffMember = {
  initials: string;
  name: string;
  online?: boolean;
};

type DesktopShellProps = {
  businessName?: string;
  businessSubtitle?: string;
  navItems: DesktopNavItem[];
  activeKey: string;
  onSelectNav: (key: string) => void;
  topTabs?: string[];
  activeTopTab?: string;
  onSelectTopTab?: (tab: string) => void;
  activeStaff?: DesktopStaffMember[];
  children: React.ReactNode;
};

export function DesktopShell({
  businessName = 'BarberZones',
  businessSubtitle = 'Panel de hoy',
  navItems,
  activeKey,
  onSelectNav,
  topTabs = [],
  activeTopTab,
  onSelectTopTab,
  activeStaff = [],
  children,
}: DesktopShellProps) {
  const { isDesktop } = useDesktopLayout();
  const { colors, dark } = useBzTheme();
  const goldAccent = '#E2C46D';

  if (!isDesktop) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.BzBg }]}>
      {/* Barra lateral izquierda fija estilo dashboard */}
      <View
        style={[
          styles.sidebar,
          {
            backgroundColor: colors.BzCardInner,
            borderRightColor: colors.BzBorder,
          },
        ]}
      >
        {/* Marca arriba */}
        <View style={styles.brandHeader}>
          <View style={[styles.logoBox, { backgroundColor: goldAccent }]}>
            <Text style={styles.logoText}>BZ</Text>
          </View>
          <View style={styles.brandTextWrap}>
            <Text style={[styles.brandName, { color: colors.BzText }]} numberOfLines={1}>
              {businessName}
            </Text>
            <Text style={[styles.brandSub, { color: colors.BzMuted }]} numberOfLines={1}>
              {businessSubtitle}
            </Text>
          </View>
        </View>

        {/* Menú vertical */}
        <View style={styles.navContainer}>
          {navItems.map((item) => {
            const isActive = item.key === activeKey;
            return (
              <Pressable
                key={item.key}
                onPress={() => onSelectNav(item.key)}
                style={({ pressed }) => [
                  styles.navItem,
                  isActive && {
                    backgroundColor: dark ? 'rgba(226, 196, 109, 0.14)' : 'rgba(226, 196, 109, 0.22)',
                    borderColor: 'rgba(226, 196, 109, 0.35)',
                  },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={styles.navItemLeft}>
                  {item.icon ? <View style={styles.navIconWrap}>{item.icon}</View> : null}
                  <Text
                    style={[
                      styles.navLabel,
                      { color: isActive ? (dark ? goldAccent : '#141416') : colors.BzMuted },
                      isActive && styles.navLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>

                {typeof item.badge === 'number' && item.badge > 0 && (
                  <View style={[styles.badge, { backgroundColor: goldAccent }]}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Bloque inferior "Hoy trabajan" */}
        {activeStaff.length > 0 && (
          <View style={[styles.staffSection, { borderTopColor: colors.BzBorder }]}>
            <Text style={[styles.staffTitle, { color: colors.BzMuted }]}>
              Hoy trabajan
            </Text>
            <View style={styles.staffRow}>
              {activeStaff.map((member, index) => (
                <View
                  key={`${member.initials}-${index}`}
                  style={[
                    styles.staffBadge,
                    {
                      backgroundColor: colors.BzCard,
                      borderColor: colors.BzBorder,
                    },
                  ]}
                >
                  <Text style={[styles.staffInitials, { color: colors.BzText }]}>
                    {member.initials}
                  </Text>
                  {member.online !== false && (
                    <View
                      style={[
                        styles.onlineDot,
                        {
                          backgroundColor: colors.BzSuccess,
                          borderColor: colors.BzCardInner,
                        },
                      ]}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Área principal derecha */}
      <ScrollView
        style={styles.mainArea}
        contentContainerStyle={styles.mainContent}
        showsVerticalScrollIndicator={false}
      >
        {topTabs.length > 0 && (
          <View style={styles.topTabsRow}>
            {topTabs.map((tab) => {
              const selected = tab === activeTopTab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => onSelectTopTab?.(tab)}
                  style={[
                    styles.topTabPill,
                    {
                      backgroundColor: selected ? goldAccent : colors.BzCard,
                      borderColor: selected ? goldAccent : colors.BzBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.topTabText,
                      { color: selected ? '#141416' : colors.BzMuted },
                    ]}
                  >
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    minHeight: '100%',
  },
  sidebar: {
    width: 240,
    borderRightWidth: 1,
    paddingVertical: 22,
    paddingHorizontal: 14,
    justifyContent: 'space-between',
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
    marginBottom: 26,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#141416',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  brandTextWrap: {
    flex: 1,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '700',
  },
  brandSub: {
    fontSize: 12,
    marginTop: 1,
  },
  navContainer: {
    flex: 1,
    gap: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navIconWrap: {
    width: 20,
    alignItems: 'center',
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  navLabelActive: {
    fontWeight: '700',
  },
  badge: {
    minWidth: 22,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#141416',
    fontSize: 11,
    fontWeight: '800',
  },
  staffSection: {
    borderTopWidth: 1,
    paddingTop: 14,
    paddingHorizontal: 8,
  },
  staffTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  staffRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  staffBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffInitials: {
    fontSize: 11,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  mainArea: {
    flex: 1,
  },
  mainContent: {
    padding: 26,
    maxWidth: 1380,
    width: '100%',
    alignSelf: 'center',
  },
  topTabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  topTabPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  topTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
});