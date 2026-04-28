import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { THEME } from '@/src/lib/constants';
import { MEAL_FILTERS, MealFilter } from '../constants';

interface MealFilterChipsProps {
  active: MealFilter;
  onChange: (filter: MealFilter) => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function MealFilterChips({ active, onChange }: MealFilterChipsProps) {
  return (
    <Animated.View entering={FadeInDown.delay(150).springify()}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsContainer}
      >
        {MEAL_FILTERS.map((filter, index) => {
          const isActive = active === filter.id;
          return (
            <AnimatedTouchable
              key={filter.id}
              entering={FadeInRight.delay(index * 50)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => onChange(filter.id)}
            >
              <Text style={styles.filterChipEmoji}>{filter.emoji}</Text>
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {filter.label}
              </Text>
            </AnimatedTouchable>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  filterChipsContainer: {
    paddingHorizontal: 24,
    gap: 8,
    paddingVertical: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.ui.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: THEME.colors.ui.border,
  },
  filterChipActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  filterChipEmoji: {
    fontSize: 14,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: THEME.fonts.bodyMedium,
    color: THEME.colors.text.secondary,
  },
  filterChipTextActive: {
    color: THEME.colors.ui.white,
  },
});
