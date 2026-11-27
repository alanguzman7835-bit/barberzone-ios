import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';
import { BarberZoneThemeProvider, useBzTheme } from '../constants/BzTheme';
import { HorariosProvider } from '../constants/HorariosContext';
import { CatalogoConfigProvider } from '../constants/CatalogoConfigContext';
import SplashAnimadoBz from '../components/SplashAnimadoBz';

function Raiz() {
  const { colors } = useBzTheme();
  const [mostrarSplash, setMostrarSplash] = useState(true);

  // Pinta la capa nativa de atrás con el color vivo del tema
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.BzBg);
  }, [colors.BzBg]);

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.BzBg }}>
      <CatalogoConfigProvider>
        <HorariosProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.BzBg },
              autoHideHomeIndicator: true,
            }}
          />
          {mostrarSplash && (
            <SplashAnimadoBz onFinish={() => setMostrarSplash(false)} />
          )}
        </HorariosProvider>
      </CatalogoConfigProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <BarberZoneThemeProvider>
      <Raiz />
    </BarberZoneThemeProvider>
  );
}