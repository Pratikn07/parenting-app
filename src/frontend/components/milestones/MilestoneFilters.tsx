import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { THEME } from '../../../lib/constants';
import type { MilestoneType } from '../../../lib/database.types';

interface MilestoneFiltersProps {
  selectedCategory: 'all' | MilestoneType;
  onSelectCategory: (category: 'all' | MilestoneType) => void;
}

const CATEGORIES = [
  { value: 'all', label: 'All', emoji: '📋' },
  { value: 'physical', label: 'Physical', emoji: '💪' },
  { value: 'cognitive', label: 'Cognitive', emoji: '🧠' },
  { value: 'social', label: 'Social', emoji: '👥' },
  { value: 'emotional', label: 'Emotional', emoji: '❤️' },
] as const;

export const MilestoneFilters: React.FC<MilestoneFiltersProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.value;
          
          return (
            <TouchableOpacity
              key={category.value}
              style={[styles.filterPill, isSelected && styles.filterPillActive]}
              onPress={() => onSelectCategory(category.value as typeof selectedCategory)}
              activeOpacity={0.7}
            >
              <Text style={styles.filterEmoji}>{category.emoji}</Text>
              <Text style={[styles.filterLabel, isSelected && styles.filterLabelActive]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  scrollContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  filterEmoji: {
    fontSize: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.text.secondary,
  },
  filterLabelActive: {
    color: '#FFFFFF',
  },
});
