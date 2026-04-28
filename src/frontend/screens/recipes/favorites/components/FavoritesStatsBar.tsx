import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { THEME } from '@/src/lib/constants';

interface FavoritesStatsBarProps {
  visibleCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function FavoritesStatsBar({
  visibleCount,
  totalCount,
  hasActiveFilters,
  onClearFilters,
}: FavoritesStatsBarProps) {
  return (
    <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.statsBar}>
      <Text style={styles.recipeCount}>
        {visibleCount} of {totalCount} {totalCount === 1 ? 'recipe' : 'recipes'}
      </Text>
      {hasActiveFilters && (
        <TouchableOpacity onPress={onClearFilters} style={styles.clearFiltersButton}>
          <X size={14} color={THEME.colors.primary} />
          <Text style={styles.clearFiltersText}>Clear filters</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  recipeCount: {
    fontSize: 14,
    fontFamily: THEME.fonts.bodyMedium,
    color: THEME.colors.text.secondary,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearFiltersText: {
    fontSize: 13,
    fontFamily: THEME.fonts.bodyMedium,
    color: THEME.colors.primary,
  },
});
