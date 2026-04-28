import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';

interface TypingIndicatorProps {
  childName?: string;
}

export function TypingIndicator({ childName }: TypingIndicatorProps) {
  return (
    <View style={styles.typingContainer}>
      <Sparkles size={16} color={THEME.colors.primary} style={styles.typingIcon} />
      <Text style={styles.typingText}>
        {childName ? `Thinking for ${childName}...` : 'Thinking...'}
      </Text>
      <View style={styles.dotsContainer}>
        <View style={styles.typingDot} />
        <View style={[styles.typingDot, styles.typingDotMiddle]} />
        <View style={styles.typingDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  typingIcon: {
    marginRight: 6,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.primary,
    marginHorizontal: 1,
    opacity: 0.6,
  },
  typingDotMiddle: {
    opacity: 0.9,
  },
  typingText: {
    fontSize: 14,
    color: THEME.colors.primary,
    fontWeight: '600',
  },
});
