import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Clock, Flame } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';
import type { Recipe } from '@/src/lib/types/recipes';
import { getRecipeTag } from '../recipeFormatters';

interface RecipeMetaSectionProps {
  recipe: Recipe;
}

export function RecipeMetaSection({ recipe }: RecipeMetaSectionProps) {
  const tag = getRecipeTag(recipe);

  return (
    <>
      <View style={styles.headerSection}>
        <Text style={styles.title}>{recipe.title}</Text>
        {tag && (
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        )}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock size={16} color={THEME.colors.text.secondary} />
            <Text style={styles.metaText}>{recipe.timeMinutes} min</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaText}>👍 {Math.floor(recipe.rating * 20)}%</Text>
          </View>
          {recipe.calories && (
            <>
              <View style={styles.verticalDivider} />
              <View style={styles.metaItem}>
                <Flame size={16} color={THEME.colors.text.secondary} />
                <Text style={styles.metaText}>{recipe.calories} kcal</Text>
              </View>
            </>
          )}
        </View>
      </View>

      <Text style={styles.description}>{recipe.description}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: THEME.fonts.header,
    color: THEME.colors.text.primary,
    marginBottom: 8,
    lineHeight: 34,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: THEME.colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  tagText: {
    fontSize: 13,
    fontFamily: THEME.fonts.bodyMedium,
    color: THEME.colors.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    fontFamily: THEME.fonts.bodyMedium,
    color: THEME.colors.text.primary,
  },
  verticalDivider: {
    width: 1,
    height: 14,
    backgroundColor: THEME.colors.ui.border,
    marginHorizontal: 16,
  },
  description: {
    fontSize: 16,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.secondary,
    lineHeight: 24,
    marginBottom: 32,
  },
});
