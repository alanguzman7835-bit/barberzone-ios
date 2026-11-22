import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { StatusBar } from 'react-native';

const KEY_DARK = 'bz_prefs_dark';

export const BzStatusColors = {
  BzSuccess: '#2E9E5B',
  BzWarning: '#E8A317',
  BzDanger: '#E5484D',
  BzDestructive: '#C62828',
};

export interface BzColors {
  BzBg: string;
  BzCard: string;
  BzCardInner: string;
  BzBorder: string;
  BzText: string;
  BzMuted: string;
  BzSuccess: string;
  BzWarning: string;
  BzDanger: string;
  BzDestructive: string;
}

export const BzTypography = {
  title: { fontSize: 28, lineHeight: 34, fontWeight: '300' as const },
  bigNumber: { fontSize: 28, fontWeight: '300' as const, fontVariant: ['tabular-nums' as const] },
  label: { fontSize: 10, fontWeight: '500' as const, letterSpacing: 1.8, textTransform: 'uppercase' as const },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
};

interface ThemeContextType {
  dark: boolean;
  setDark: (val: boolean) => void;
  colors: BzColors;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const BarberZoneThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dark, setDarkState] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(KEY_DARK).then((val) => {
      if (val !== null) setDarkState(val === 'true');
    });
  }, []);

  const setDark = (value: boolean) => {
    setDarkState(value);
    AsyncStorage.setItem(KEY_DARK, String(value));
  };

  const colors: BzColors = {
    BzBg: dark ? '#0E0E10' : '#FAF8F3',
    BzCard: dark ? '#1A1A1D' : '#FFFFFF',
    BzCardInner: dark ? '#121214' : '#F4F2EC',
    BzBorder: dark ? '#2A2A2F' : '#E4DFD2',
    BzText: dark ? '#F5F2EA' : '#141416',
    BzMuted: dark ? '#9B9BA3' : '#6B6B73',
    ...BzStatusColors,
  };

  return (
    <ThemeContext.Provider value={{ dark, setDark, colors }}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      {children}
    </ThemeContext.Provider>
  );
};

export const useBzTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useBzTheme debe usarse dentro de BarberZoneThemeProvider');
  return ctx;
};