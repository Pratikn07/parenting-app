import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Linking } from 'react-native';
import { useAuthStore } from '../src/shared/stores/authStore';

export default function DeepLinkTest() {
  const { checkAuthState } = useAuthStore();

  const testDeepLink = async () => {
    const testUrl = 'com.parentingcompass.app://auth/callback?access_token=test&refresh_token=test';
    console.log('Testing deep link:', testUrl);
    
    try {
      const canOpen = await Linking.canOpenURL(testUrl);
      console.log('Can open deep link:', canOpen);
      
      if (canOpen) {
        await Linking.openURL(testUrl);
      } else {
        Alert.alert('Deep Link Test', 'Cannot open deep link - URL scheme not registered');
      }
    } catch (error) {
      console.error('Deep link test error:', error);
      Alert.alert('Deep Link Test', `Error: ${error}`);
    }
  };

  const testAuthCallback = async () => {
    console.log('Testing auth callback manually...');
    const testUrl = 'com.parentingcompass.app://auth/callback?access_token=test123&refresh_token=refresh123';
    await checkAuthState(testUrl);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Deep Link Test</Text>
      
      <TouchableOpacity style={styles.button} onPress={testDeepLink}>
        <Text style={styles.buttonText}>Test Deep Link</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={testAuthCallback}>
        <Text style={styles.buttonText}>Test Auth Callback</Text>
      </TouchableOpacity>
      
      <Text style={styles.info}>
        This screen helps test deep link functionality.
        {'\n\n'}
        Expected URL scheme: com.parentingcompass.app://
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    marginTop: 40,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
