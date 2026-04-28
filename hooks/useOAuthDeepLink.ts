import { useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/src/shared/stores/authStore';

const BUNDLE_ID = Platform.select({
  ios: 'com.pratikn07.mycuratedhaven',
  android: 'com.pratikn07.mycuratedhaven',
  default: 'com.pratikn07.mycuratedhaven',
});

function isOAuthCallback(url: string): boolean {
  return (
    url.includes('auth/callback') ||
    url.includes('oauth') ||
    url.startsWith(`${BUNDLE_ID}://`) ||
    url.includes('access_token') ||
    url.includes('refresh_token') ||
    url.includes('code=') ||
    url.includes('error=')
  );
}

export function useOAuthDeepLink() {
  const { checkAuthState } = useAuthStore();

  useEffect(() => {
    const handleURL = async (url: string) => {
      if (!isOAuthCallback(url)) return;

      if (url.includes('auth/reset-password') || url.includes('type=recovery')) {
        router.replace('/auth/reset-password');
        return;
      }

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

      try {
        const WebBrowser = await import('expo-web-browser');
        await WebBrowser.dismissBrowser();
      } catch {
        // No browser open to dismiss
      }

      await checkAuthState(url);

      const { isAuthenticated, hasCompletedOnboarding } = useAuthStore.getState();
      if (isAuthenticated) {
        router.replace(hasCompletedOnboarding ? '/(tabs)/chat' : '/onboarding');
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => handleURL(url));
    return () => subscription?.remove();
  }, [checkAuthState]);
}
