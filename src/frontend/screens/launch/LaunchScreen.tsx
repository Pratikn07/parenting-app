import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '@/src/lib/constants';
import { Video, ResizeMode } from 'expo-av';
import { useAuthStore } from '@/src/shared/stores/authStore';
import { AntDesign } from '@expo/vector-icons';


const { width, height } = Dimensions.get('window');

export default function LaunchScreen() {
  const { continueWithGoogle, isLoading } = useAuthStore();

  return (
    <View style={styles.container}>
      {/* Background Layer */}
      <View style={styles.backgroundContainer}>
        <Video
          source={require('../../../../images-videos/nf0Ia3IB59lcuD07BWNYI_output.mp4')}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay
          isMuted={true}
        />
        {/* Dark Overlay for text readability */}
        <View style={styles.overlay} />
      </View>

      <SafeAreaView style={styles.content}>
        <View style={styles.header}>

          <Text style={styles.title}>My Curated Haven</Text>
          <Text style={styles.subtitle}>AI Curated for Family's Growth Journey</Text>
        </View>

        <View style={styles.footer}>
          {/* Google Sign In Button - Polished */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={continueWithGoogle}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            {isLoading ? (
              <ActivityIndicator color="#1F2937" />
            ) : (
              <>
                <AntDesign name="google" size={24} color="#DB4437" style={styles.googleIcon} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Email Login Link */}
          <TouchableOpacity
            onPress={() => router.push('/auth')}
            style={styles.loginLink}
          >
            <Text style={styles.loginText}>
              Or log in with Email
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },


  title: {
    fontSize: 42,
    fontFamily: THEME.fonts.header,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 17,
    fontFamily: THEME.fonts.body,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: '85%',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  footer: {
    gap: 16,
    marginBottom: 40, // Increased bottom margin for balance
    width: '100%',
    alignItems: 'center',
  },
  googleButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    // Added shadow for "pretty" pop
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    color: '#1F2937',
    fontSize: 18,
    fontFamily: THEME.fonts.bodySemiBold,
    fontWeight: '600',
  },
  loginLink: {
    padding: 12,
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: THEME.fonts.body,
    opacity: 0.9,
    textDecorationLine: 'underline', // Added underline for clarity
  },
});