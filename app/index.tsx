import React, { useEffect, useState, useRef } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../src/shared/stores/authStore';
import { View, StyleSheet, Linking, ActivityIndicator } from 'react-native';

export default function AppEntry() {
  const { isAuthenticated, hasCompletedOnboarding, isLoading, checkAuthState } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const hasNavigated = useRef(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('App initializing...');

        // Check for initial URL (deep link)
        const url = await Linking.getInitialURL();

        if (url && (
          url.includes('access_token') ||
          url.includes('code=') ||
          url.includes('oauth')
        )) {
          console.log('🔗 Initial URL detected with OAuth params:', url);
          // If we have an OAuth URL, check auth state with it immediately
          await checkAuthState(url);
        } else {
          // Normal startup check
          await checkAuthState();
        }
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, [checkAuthState]);

  useEffect(() => {
    // Only navigate after initialization is complete and only once
    if (!isInitializing && !isLoading && !hasNavigated.current) {
      // Mark as navigated immediately to prevent double navigation
      hasNavigated.current = true;

      console.log('🚀 Navigation decision:', {
        isAuthenticated,
        hasCompletedOnboarding,
        isInitializing,
        isLoading
      });

      if (isAuthenticated && hasCompletedOnboarding) {
        // User is authenticated and has completed onboarding - go to chat tab
        console.log('📱 Navigating to chat tab (authenticated + onboarded)');
        router.replace('/(tabs)/chat');
      } else if (isAuthenticated && !hasCompletedOnboarding) {
        // User is authenticated but hasn't completed onboarding
        console.log('📝 Navigating to onboarding (authenticated but not onboarded)');
        router.replace('/onboarding');
      } else {
        // User is not authenticated - show launch screen first
        console.log('🚪 Navigating to launch (not authenticated)');
        router.replace('/launch');
      }
    }
  }, [isAuthenticated, hasCompletedOnboarding, isInitializing, isLoading]);

  // Show loading screen while initializing
  if (isInitializing || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4635A" />
      </View>
    );
  }

  // This component just handles routing, no UI after loading
  return null;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDF7F3',
  },
});
