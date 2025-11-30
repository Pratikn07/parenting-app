import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Linking, Platform } from 'react-native';
import { router } from 'expo-router';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuthStore } from '@/src/shared/stores/authStore';
import { useFonts, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { checkAuthState, isAuthenticated } = useAuthStore();
  const [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useFrameworkReady();

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    // Handle OAuth URL callbacks - simplified since session polling is used
    const handleURL = async (url: string) => {
      console.log('Received deep link URL:', url);

      // Get the correct bundle ID based on platform
      const bundleId = Platform.select({
        ios: 'com.pratikn07.mycuratedhaven',
        android: 'com.pratikn07.mycuratedhaven',
        default: 'com.pratikn07.mycuratedhaven'
      });

      if (
        url.includes('auth/callback') ||
        url.includes('oauth') ||
        url.startsWith(`${bundleId}://`) ||
        url.includes('access_token') ||
        url.includes('refresh_token') ||
        url.includes('code=') ||
        url.includes('error=')
      ) {
        // Check if this is a password reset link
        if (url.includes('auth/reset-password') || url.includes('type=recovery')) {
          console.log('Password reset link detected, navigating to reset screen...');
          router.replace('/auth/reset-password');
          return;
        }

        console.log('OAuth callback detected (Apple/Google), checking auth state...');

        // Check for OAuth errors
        if (url.includes('error=')) {
          const errorMatch = url.match(/error=([^&]+)/);
          const errorDescMatch = url.match(/error_description=([^&]+)/);
          if (errorMatch) {
            console.error('OAuth error:', decodeURIComponent(errorMatch[1]));
            if (errorDescMatch) {
              console.error('Error description:', decodeURIComponent(errorDescMatch[1]));
            }
            return;
          }
        }

        // Dismiss any open browser windows when OAuth callback is received
        try {
          const WebBrowser = await import('expo-web-browser');
          await WebBrowser.dismissBrowser();
        } catch (error) {
          // Ignore errors if no browser is open
        }

        // Process auth state update
        await checkAuthState(url);

        // Check current state after update
        const { isAuthenticated: authed, hasCompletedOnboarding } = useAuthStore.getState();
        console.log('🔐 OAuth callback auth state:', { authed, hasCompletedOnboarding });

        // Only navigate if we are not already on the correct screen
        // This prevents fighting with index.tsx's initial navigation
        if (authed) {
          if (hasCompletedOnboarding) {
            console.log('📱 OAuth: Navigating to chat');
            router.replace('/chat');
          } else {
            console.log('📝 OAuth: Navigating to onboarding');
            router.replace('/onboarding');
          }
        }
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => handleURL(url));

    // Note: We don't check getInitialURL here anymore because app/index.tsx handles it
    // This prevents a race condition where both components try to handle the initial URL

    return () => subscription?.remove();
  }, [checkAuthState]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          presentation: 'card',
          animation: 'default'
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="resources"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom'
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom'
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
