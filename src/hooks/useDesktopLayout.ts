import { Platform, useWindowDimensions } from 'react-native';

export function useDesktopLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 900;
  return { isDesktop, width };
}