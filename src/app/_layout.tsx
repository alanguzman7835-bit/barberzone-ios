import { useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { HorariosProvider } from '../constants/HorariosContext';
import { CatalogoConfigProvider } from '../constants/CatalogoConfigContext';
import SplashAnimadoBz from '../components/SplashAnimadoBz';

export default function RootLayout() {
  const [mostrarSplash, setMostrarSplash] = useState(true);

  return (
    <CatalogoConfigProvider>
      <HorariosProvider>
        <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
          <Stack screenOptions={{ headerShown: false }} />
          {mostrarSplash && (
            <SplashAnimadoBz onFinish={() => setMostrarSplash(false)} />
          )}
        </View>
      </HorariosProvider>
    </CatalogoConfigProvider>
  );
}