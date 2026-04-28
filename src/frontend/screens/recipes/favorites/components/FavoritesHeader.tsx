import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { THEME } from '@/src/lib/constants';

interface FavoritesHeaderProps {
  onBack: () => void;
}

export function FavoritesHeader({ onBack }: FavoritesHeaderProps) {
  return (
    <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <ArrowLeft size={24} color={THEME.colors.text.primary} />
      </TouchableOpacity>
      <Text style={styles.title}>My Favorites</Text>
      <View style={styles.placeholder} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontFamily: THEME.fonts.header,
    color: THEME.colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
});
