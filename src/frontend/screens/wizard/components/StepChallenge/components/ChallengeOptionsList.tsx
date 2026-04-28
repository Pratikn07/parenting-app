import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { THEME } from '@/src/lib/constants';
import type { ChallengeOption } from '../challengeOptions';

interface ChallengeOptionsListProps {
  options: ChallengeOption[];
  selected: string | null;
  onSelect: (challenge: string) => void;
}

export function ChallengeOptionsList({ options, selected, onSelect }: ChallengeOptionsListProps) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.optionsContainer}
    >
      {options.map((item) => {
        const isSelected = selected === item.challenge;
        return (
          <TouchableOpacity
            key={item.challenge}
            style={[styles.option, isSelected && styles.optionSelected]}
            onPress={() => onSelect(item.challenge)}
            activeOpacity={0.7}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionEmoji}>{item.emoji}</Text>
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {item.challenge}
              </Text>
            </View>

            {isSelected && (
              <View style={styles.checkCircle}>
                <View style={styles.checkInner} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  optionsContainer: {
    paddingBottom: 40,
  },
  option: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionSelected: {
    borderColor: THEME.colors.primary,
    backgroundColor: '#FFF5F5',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 14,
  },
  optionText: {
    fontSize: 16,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.primary,
    flex: 1,
  },
  optionTextSelected: {
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.primary,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: THEME.colors.primary,
  },
});
