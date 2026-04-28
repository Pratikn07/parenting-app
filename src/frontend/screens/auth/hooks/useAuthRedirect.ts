import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/src/shared/stores/authStore';

export function useAuthRedirect() {
  const { isAuthenticated, hasCompletedOnboarding } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(hasCompletedOnboarding ? '/chat' : '/onboarding');
    }
  }, [isAuthenticated, hasCompletedOnboarding]);

  useEffect(() => {
    const checkAuth = async () => {
      const { checkAuthState } = useAuthStore.getState();
      await checkAuthState();
    };
    checkAuth();
  }, []);
}
