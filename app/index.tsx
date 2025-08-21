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
        // TODO: Initialize app state if needed
        console.log('App initializing...');
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    // Only navigate after initialization is complete
    if (!isInitializing && !isLoading) {
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
