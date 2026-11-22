import { Stack } from 'expo-router';
import { HorariosProvider } from '../constants/HorariosContext';

export default function RootLayout() {
  return (
    <HorariosProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </HorariosProvider>
  );
}