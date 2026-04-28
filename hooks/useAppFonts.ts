import { useEffect } from 'react';
import { useFonts, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export function useAppFonts() {
  const [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  return { fontsLoaded };
}
