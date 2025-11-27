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
        
        // Wait for auth state to be fully processed before navigating
        setTimeout(async () => {
          await checkAuthState(url);
          // Small delay to ensure state is propagated
          await new Promise(resolve => setTimeout(resolve, 100));
          const { isAuthenticated: authed, hasCompletedOnboarding } = useAuthStore.getState();
          console.log('🔐 OAuth callback auth state:', { authed, hasCompletedOnboarding });
          if (authed) {
            if (hasCompletedOnboarding) {
              console.log('📱 OAuth: Navigating to chat');
              router.replace('/chat');
            } else {
              console.log('📝 OAuth: Navigating to onboarding');
              router.replace('/onboarding');
            }
          }
        }, 500);
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => handleURL(url));

    Linking.getInitialURL().then((url) => {
      if (url) handleURL(url);
    });

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
