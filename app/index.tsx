import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../src/shared/stores/authStore';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function AppEntry() {
  const { isAuthenticated, hasCompletedOnboarding, isLoading, checkAuthState } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('App initializing...');
        // Check authentication state on app startup
        await checkAuthState();
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, [checkAuthState]);

  useEffect(() => {
    // Only navigate after initialization is complete
    if (!isInitializing && !isLoading) {
      const timer = setTimeout(() => {
        console.log('🚀 Navigation decision:', { 
          isAuthenticated, 
          hasCompletedOnboarding, 
          isInitializing, 
          isLoading 
        });
        
        if (isAuthenticated && hasCompletedOnboarding) {
          // User is authenticated and has completed onboarding - go to chat
          console.log('📱 Navigating to chat (authenticated + onboarded)');
          router.replace('/chat');
        } else if (isAuthenticated && !hasCompletedOnboarding) {
          // User is authenticated but hasn't completed onboarding
          console.log('📝 Navigating to onboarding (authenticated but not onboarded)');
          router.replace('/onboarding');
        } else {
          // User is not authenticated - show launch screen first
          console.log('🚪 Navigating to launch (not authenticated)');
          router.replace('/launch');
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, hasCompletedOnboarding, isInitializing, isLoading]);

  // Show loading screen while initializing
  if (isInitializing || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4635A" />
        <Text style={styles.loadingText}>Initializing...</Text>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});
