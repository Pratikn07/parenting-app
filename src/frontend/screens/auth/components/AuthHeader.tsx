import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { THEME } from '@/src/lib/constants';

interface AuthHeaderProps {
  isSignIn: boolean;
  onBack: () => void;
}

export function AuthHeader({ isSignIn, onBack }: AuthHeaderProps) {
  return (
    <>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <AntDesign name="arrowleft" size={24} color="#1F2937" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>{isSignIn ? 'Welcome back' : 'Create account'}</Text>
        <Text style={styles.subtitle}>
          {isSignIn ? 'Enter your details to sign in.' : 'Start your parenting journey today.'}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backButton: {
    marginTop: 16,
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: THEME.fonts.header,
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: THEME.fonts.body,
    color: '#6B7280',
  },
});
