import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { THEME } from '@/src/lib/constants';
import type { Recipe } from '@/src/lib/types/recipes';
import { MAX_INGREDIENT_CHIPS } from '../constants';

interface IngredientChipsRowProps {
  ingredients: Recipe['ingredients'];
  selected: string[];
  onToggle: (ingredient: string) => void;
}

export function IngredientChipsRow({ ingredients, selected, onToggle }: IngredientChipsRowProps) {
  return (
    <View style={styles.chipsContainer}>
      {ingredients.slice(0, MAX_INGREDIENT_CHIPS).map((ing, idx) => {
        const isSelected = selected.includes(ing.item);
        return (
          <TouchableOpacity
            key={idx}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onToggle(ing.item)}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {ing.item}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.ui.border,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: THEME.colors.ui.inputBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.colors.ui.border,
  },
  chipText: {
    fontSize: 14,
    color: THEME.colors.text.primary,
    fontFamily: THEME.fonts.bodyMedium,
  },
  chipSelected: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
});
