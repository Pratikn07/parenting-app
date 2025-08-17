import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../src/shared/stores/authStore';

export default function AppEntry() {
  const { isAuthenticated, hasCompletedOnboarding, logout } = useAuthStore();

  useEffect(() => {
    // Check authentication and onboarding status to determine where to navigate
    const timer = setTimeout(() => {
      if (isAuthenticated && hasCompletedOnboarding) {
        // User is authenticated and has completed onboarding - go to chat
        router.replace('/chat');
      } else if (isAuthenticated && !hasCompletedOnboarding) {
        // User is authenticated but hasn't completed onboarding
        router.replace('/onboarding');
      } else {
        // User is not authenticated - show launch screen first
        router.replace('/launch');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, hasCompletedOnboarding, logout]);

  // This component just handles routing, no UI
  return null;
}
