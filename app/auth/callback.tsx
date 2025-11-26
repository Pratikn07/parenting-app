import React, { useEffect } from 'react';
import { View, ActivityIndicator, Linking } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/shared/stores/authStore';

export default function OAuthCallback() {
  const { checkAuthState } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const url = await Linking.getInitialURL();
        await checkAuthState(url);
      } catch (error) {
        // Nothing to do here; we'll route to launch below
      } finally {
        if (!isMounted) return;
        const { isAuthenticated } = useAuthStore.getState();
        router.replace(isAuthenticated ? '/chat' : '/launch');
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [checkAuthState]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDF7F3' }}>
      <ActivityIndicator size="large" color="#D4635A" />
    </View>
  );
}



