import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
// TODO: Import analytics service when available

const { width, height } = Dimensions.get('window');

export default function LaunchScreen() {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const fadeOutAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // TODO: Track screen view when analytics is available
    console.log('Launch screen viewed');
    
    // Logo animation sequence
    const logoAnimation = Animated.sequence([
      // Fade in and scale up
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Hold for a moment
      Animated.delay(600),
      // Gentle pulse
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      // Hold again
      Animated.delay(300),
      // Fade out
      Animated.timing(fadeOutAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    logoAnimation.start(() => {
      // Navigate to auth screen after animation completes
      // TODO: Track event when analytics is available
      console.log('Launch completed');
      router.replace('/auth');
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.logoContainer,
          {
            opacity: fadeOutAnim,
            transform: [
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <Animated.View 
          style={[
            styles.logoMark,
            {
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Logo placeholder - replace with actual logo */}
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>MC</Text>
          </View>
          <Text style={styles.appName}>My Curated Haven</Text>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7F3', // Soft blush background
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#D4635A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#D4635A',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  appName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
