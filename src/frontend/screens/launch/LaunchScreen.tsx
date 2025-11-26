import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ModernButton } from '@/src/frontend/components/common/ModernButton';
import { THEME } from '@/src/lib/constants';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function LaunchScreen() {
  // Placeholder gradient background if video is not available
  const VideoPlaceholder = () => (
    <LinearGradient
      colors={['#E07A5F', '#3D405B']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );

  return (
    <View style={styles.container}>
      {/* Background Layer */}
      <View style={styles.backgroundContainer}>
        {/* Using placeholder gradient for now until video asset is added */}
        <VideoPlaceholder />
        
        {/* 
          Uncomment below when video asset is available
          <Video
            source={require('@/assets/videos/welcome.mp4')}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay
            isMuted={true}
          />
        */}
        
        {/* Dark Overlay for text readability */}
        <View style={styles.overlay} />
      </View>

      <SafeAreaView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>P</Text>
          </View>
          <Text style={styles.title}>Parenting, Simplified.</Text>
          <Text style={styles.subtitle}>Your AI companion for every milestone.</Text>
        </View>

        <View style={styles.footer}>
          <ModernButton
            title="Start My Journey"
            onPress={() => router.push('/onboarding')}
            style={styles.button}
            variant="primary"
            textStyle={styles.buttonText}
          />
          
          <TouchableOpacity 
            onPress={() => router.push('/auth')}
            style={styles.loginLink}
          >
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginTextBold}>Log In</Text>
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
    justifyContent: 'space-between',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  logoText: {
    fontSize: 40,
    fontFamily: THEME.fonts.header,
    color: '#FFFFFF',
  },
  title: {
    fontSize: 36,
    fontFamily: THEME.fonts.header,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: THEME.fonts.body,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 28,
  },
  footer: {
    gap: 24,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    height: 56,
  },
  buttonText: {
    color: '#3D405B',
    fontSize: 18,
    fontWeight: '600',
  },
  loginLink: {
    padding: 8,
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: THEME.fonts.body,
    opacity: 0.9,
  },
  loginTextBold: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
