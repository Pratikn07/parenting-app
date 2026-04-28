import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';
import type { Recipe } from '@/src/lib/types/recipes';

interface IngredientsSectionProps {
  ingredients: Recipe['ingredients'];
  servings: number | undefined;
  onIngredientHelp: () => void;
}

export function IngredientsSection({
  ingredients,
  servings,
  onIngredientHelp,
}: IngredientsSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.ingredientsHeader}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        <Text style={styles.servingText}>{servings || 4} servings</Text>
      </View>

      <View style={styles.ingredientsList}>
        {ingredients.map((ing, idx) => (
          <View key={idx} style={styles.ingredientRow}>
            <Text style={styles.ingredientAmount}>{ing.amount}</Text>
            <Text style={styles.ingredientItem}>{ing.item}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.ingredientHelpBtn} onPress={onIngredientHelp}>
        <RefreshCw size={18} color={THEME.colors.primary} />
        <Text style={styles.ingredientHelpText}>Missing an ingredient? Let me help!</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: THEME.fonts.header,
    color: THEME.colors.text.primary,
    marginBottom: 16,
  },
  ingredientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  servingText: {
    paddingHorizontal: 8,
    fontSize: 14,
    fontFamily: THEME.fonts.bodyMedium,
    color: THEME.colors.text.primary,
  },
  ingredientsList: {
    marginBottom: 16,
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.ui.border,
  },
  ingredientItem: {
    fontSize: 16,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.primary,
    flex: 1,
  },
  ingredientAmount: {
    fontSize: 16,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.text.primary,
    marginRight: 16,
    width: 80,
  },
  ingredientHelpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(224, 122, 95, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(224, 122, 95, 0.2)',
    gap: 10,
    marginTop: 8,
  },
  ingredientHelpText: {
    fontSize: 15,
    fontFamily: THEME.fonts.bodyMedium,
    color: THEME.colors.primary,
  },
});
