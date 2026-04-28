import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAppFonts } from '@/hooks/useAppFonts';
import { useOTAUpdates } from '@/hooks/useOTAUpdates';
import { useGlobalChildren } from '@/hooks/useGlobalChildren';
import { useOAuthDeepLink } from '@/hooks/useOAuthDeepLink';

export default function RootLayout() {
  const { fontsLoaded } = useAppFonts();
  useFrameworkReady();
  useOTAUpdates();
  useGlobalChildren();
  useOAuthDeepLink();

  if (!fontsLoaded) return null;

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          presentation: 'card',
          animation: 'default',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="article/[id]"
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
