import { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';
import { HorariosProvider } from '../constants/HorariosContext';
import { CatalogoConfigProvider } from '../constants/CatalogoConfigContext';
import SplashAnimadoBz from '../components/SplashAnimadoBz';

export default function RootLayout() {
  const [mostrarSplash, setMostrarSplash] = useState(true);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync('#0A0A0A');
  }, []);

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <StatusBar barStyle="light-content" />
      <CatalogoConfigProvider>
        <HorariosProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0A0A0A' },
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