import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Linking, Platform } from 'react-native';
import { router } from 'expo-router';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuthStore } from '@/src/shared/stores/authStore';
import { useChildStore } from '@/src/shared/stores/childStore';
import { chatService } from '@/src/services';
import { useFonts, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { checkAuthState, isAuthenticated, user } = useAuthStore();
  const { setChildren } = useChildStore();
  const [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useFrameworkReady();

  // Check for OTA updates on app startup
  useEffect(() => {
    async function checkForUpdates() {
      if (__DEV__) {
        // Skip update checks in development mode
        return;
      }

      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          console.log('📦 OTA update available, downloading...');
          await Updates.fetchUpdateAsync();
          console.log('✅ OTA update downloaded, will apply on next restart');
          // The update will be applied on the next app restart
        } else {
          console.log('✅ App is up to date');
        }
      } catch (error) {
        console.error('❌ Error checking for updates:', error);
      }
    }

    checkForUpdates();
  }, []);

  // Load children globally when user is authenticated
  useEffect(() => {
    const loadChildren = async () => {
      if (!user?.id) {
        console.log('👶 No user, skipping children load');
        return;
      }

      console.log('👶 [Global] Loading children for user:', user.email);
      try {
        const userChildren = await chatService.getChildren(user.id);
        console.log('👶 [Global] Loaded', userChildren.length, 'children');
        setChildren(userChildren);
      } catch (error) {
        console.error('❌ [Global] Error loading children:', error);
      }
    };

    if (isAuthenticated && user?.id) {
      loadChildren();
    }
  }, [isAuthenticated, user?.id]);

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
            router.replace('/(tabs)/chat');
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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
