import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChefHat } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';

interface ChefTipsSectionProps {
  tips: string[] | undefined;
}

const FALLBACK_TIP = 'Great for batch cooking!';

export function ChefTipsSection({ tips }: ChefTipsSectionProps) {
  const tipsToShow = tips && tips.length > 0 ? tips : [FALLBACK_TIP];

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ChefHat size={20} color={THEME.colors.primary} />
        <Text style={styles.sectionTitle}>Chef's Tips</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tipsScroll}>
        {tipsToShow.map((tip, index) => (
          <View key={index} style={styles.tipCard}>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: THEME.fonts.header,
    color: THEME.colors.text.primary,
    marginBottom: 16,
  },
  tipsScroll: {
    marginLeft: -24,
    paddingLeft: 24,
  },
  tipCard: {
    backgroundColor: '#FFF8F0',
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    width: 200,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  tipText: {
    fontSize: 14,
    fontFamily: THEME.fonts.bodyMedium,
    color: '#E65100',
    lineHeight: 20,
  },
});
