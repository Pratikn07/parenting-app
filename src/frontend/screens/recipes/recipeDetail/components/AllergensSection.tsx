import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';
import { ALLERGEN_LABELS } from '../recipeFormatters';

interface AllergensSectionProps {
  allergens: string[] | undefined;
}

export function AllergensSection({ allergens }: AllergensSectionProps) {
  if (!allergens || allergens.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.allergenHeader}>
        <AlertTriangle size={20} color="#D97706" />
        <Text style={styles.allergenTitle}>Contains Allergens</Text>
      </View>
      <View style={styles.allergenContainer}>
        {allergens.map((allergen, idx) => (
          <View key={idx} style={styles.allergenTag}>
            <Text style={styles.allergenText}>{ALLERGEN_LABELS[allergen] || allergen}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  allergenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  allergenTitle: {
    fontSize: 16,
    fontFamily: THEME.fonts.bodySemiBold,
    color: '#D97706',
  },
  allergenContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergenTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  allergenText: {
    fontSize: 14,
    fontFamily: THEME.fonts.bodyMedium,
    color: '#92400E',
  },
});
