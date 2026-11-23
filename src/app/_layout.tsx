import { Stack } from 'expo-router';
import { HorariosProvider } from '../constants/HorariosContext';
import { CatalogoConfigProvider } from '../constants/CatalogoConfigContext';

export default function RootLayout() {
  return (
    <HorariosProvider>
      <CatalogoConfigProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </CatalogoConfigProvider>
    </HorariosProvider>
  );
}