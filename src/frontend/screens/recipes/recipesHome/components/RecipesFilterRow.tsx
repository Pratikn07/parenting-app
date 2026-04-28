import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SlidersHorizontal } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';
import CuisineFilter from '@/src/frontend/components/recipes/CuisineFilter';
import type { FilterOption } from '../constants';

interface RecipesFilterRowProps {
  mealOptions: FilterOption[];
  selectedMeal: string;
  onSelectMeal: (id: string) => void;
  hasCuisineFilter: boolean;
  onPressFilter: () => void;
}

export function RecipesFilterRow({
  mealOptions,
  selectedMeal,
  onSelectMeal,
  hasCuisineFilter,
  onPressFilter,
}: RecipesFilterRowProps) {
  return (
    <View style={styles.filterRow}>
      <TouchableOpacity
        style={[styles.filterButton, hasCuisineFilter && styles.filterButtonActive]}
        onPress={onPressFilter}
      >
        <SlidersHorizontal
          size={20}
          color={hasCuisineFilter ? THEME.colors.ui.white : THEME.colors.text.primary}
        />
        {hasCuisineFilter && <View style={styles.badge} />}
      </TouchableOpacity>

      <View style={styles.verticalDivider} />

      <View style={styles.pillsContainer}>
        <CuisineFilter
          options={mealOptions}
          selectedId={selectedMeal}
          onSelect={onSelectMeal}
          containerStyle={{ marginBottom: 0 }}
          contentContainerStyle={{ paddingHorizontal: 0, paddingRight: 24 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    paddingHorizontal: 24,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: THEME.colors.ui.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: THEME.colors.ui.border,
    marginHorizontal: 12,
  },
  pillsContainer: {
    flex: 1,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.colors.secondary,
    borderWidth: 2,
    borderColor: THEME.colors.background,
  },
});
