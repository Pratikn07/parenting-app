import React from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { THEME } from '@/src/lib/constants';
import { makeTimeDisplay } from '../recipeFormatters';

interface PreparationSectionProps {
  timeMinutes: number;
  instructions: string[];
  onLayout: (event: LayoutChangeEvent) => void;
}

const PREP_MINUTES_DEFAULT = 15;

export function PreparationSection({
  timeMinutes,
  instructions,
  onLayout,
}: PreparationSectionProps) {
  const cookMinutes = Math.max(0, timeMinutes - PREP_MINUTES_DEFAULT);

  return (
    <View style={styles.section} onLayout={onLayout}>
      <Text style={styles.sectionTitle}>Preparation</Text>
      <View style={styles.metaRow}>
        <View>
          <Text style={styles.prepLabel}>Total Time</Text>
          <Text style={styles.prepValue}>{makeTimeDisplay(timeMinutes)}</Text>
        </View>
        <View style={{ marginLeft: 32 }}>
          <Text style={styles.prepLabel}>Prep Time</Text>
          <Text style={styles.prepValue}>{makeTimeDisplay(PREP_MINUTES_DEFAULT)}</Text>
        </View>
        <View style={{ marginLeft: 32 }}>
          <Text style={styles.prepLabel}>Cook Time</Text>
          <Text style={styles.prepValue}>{makeTimeDisplay(cookMinutes)}</Text>
        </View>
      </View>

      <View style={styles.stepsContainer}>
        {instructions.map((step, idx) => (
          <View key={idx} style={styles.stepRow}>
            <View style={styles.stepNumberContainer}>
              <Text style={styles.stepNumber}>{idx + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
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
  sectionTitle: {
    fontSize: 20,
    fontFamily: THEME.fonts.header,
    color: THEME.colors.text.primary,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  prepLabel: {
    fontSize: 12,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.secondary,
    marginBottom: 4,
  },
  prepValue: {
    fontSize: 16,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.text.primary,
  },
  stepsContainer: {
    marginTop: 16,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  stepNumberContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.colors.ui.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  stepNumber: {
    fontSize: 12,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.primary,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.primary,
  },
});
