import { Stack } from 'expo-router';
import { HorariosProvider } from '../constants/HorariosContext';
import { CatalogoConfigProvider } from '../constants/CatalogoConfigContext';

export default function RootLayout() {
  return (
    <CatalogoConfigProvider>
      <HorariosProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </HorariosProvider>
    </CatalogoConfigProvider>
  );
}