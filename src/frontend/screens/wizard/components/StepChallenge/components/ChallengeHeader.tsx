import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { THEME } from '@/src/lib/constants';

interface ChallengeHeaderProps {
  title: string;
  subtitle: string;
}

export function ChallengeHeader({ title, subtitle }: ChallengeHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: THEME.fonts.header,
    color: THEME.colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.secondary,
    lineHeight: 24,
  },
});
