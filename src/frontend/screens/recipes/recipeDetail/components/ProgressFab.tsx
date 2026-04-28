import React from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { ChefHat } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';

interface ProgressFabProps {
  visible: boolean;
  fadeAnim: Animated.Value;
  onPress: () => void;
}

export function ProgressFab({ visible, fadeAnim, onPress }: ProgressFabProps) {
  if (!visible) return null;

  return (
    <Animated.View style={[styles.fab, { opacity: fadeAnim }]}>
      <TouchableOpacity style={styles.fabButton} onPress={onPress} activeOpacity={0.8}>
        <ChefHat size={26} color="#FFF" strokeWidth={2} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    zIndex: 999,
  },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
