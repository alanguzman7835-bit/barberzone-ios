import { useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HorariosProvider } from '../constants/HorariosContext';
import { CatalogoConfigProvider } from '../constants/CatalogoConfigContext';
import SplashAnimadoBz from '../components/SplashAnimadoBz';

export default function RootLayout() {
  const [mostrarSplash, setMostrarSplash] = useState(true);

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
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