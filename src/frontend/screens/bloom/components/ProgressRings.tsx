import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/src/lib/constants';
import Svg, { Circle } from 'react-native-svg';

interface ProgressRingsProps {
  stats: {
    physical: { completed: number; total: number };
    cognitive: { completed: number; total: number };
    social: { completed: number; total: number };
    emotional: { completed: number; total: number };
  } | null;
}

const categories = [
  { key: 'physical', label: 'Physical', color: THEME.colors.milestone.physical },
  { key: 'cognitive', label: 'Cognitive', color: THEME.colors.milestone.cognitive },
  { key: 'social', label: 'Social', color: THEME.colors.milestone.social },
  { key: 'emotional', label: 'Emotional', color: THEME.colors.milestone.emotional },
] as const;

function ProgressRing({ progress, color, size = 60, strokeWidth = 5 }: { progress: number; color: string; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`${color}20`}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={[ringStyles.percentage, { color }]}>
        {Math.round(progress * 100)}%
      </Text>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  percentage: {
    position: 'absolute',
    fontSize: 13,
    fontFamily: THEME.fonts.bodySemiBold,
  },
});

export default function ProgressRings({ stats }: ProgressRingsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Development Progress</Text>
      <View style={styles.ringsRow}>
        {categories.map((cat) => {
          const data = stats?.[cat.key] || { completed: 0, total: 1 };
          const progress = data.total > 0 ? data.completed / data.total : 0;
          return (
            <View key={cat.key} style={styles.ringItem}>
              <ProgressRing progress={progress} color={cat.color} />
              <Text style={styles.ringLabel}>{cat.label}</Text>
              <Text style={styles.ringCount}>{data.completed}/{data.total}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 28,
    backgroundColor: THEME.colors.ui.cardBg,
    borderRadius: THEME.layout.borderRadius.sm,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  ringItem: {
    alignItems: 'center',
  },
  ringLabel: {
    fontSize: 12,
    fontFamily: THEME.fonts.bodyMedium,
    color: THEME.colors.text.primary,
    marginTop: 8,
  },
  ringCount: {
    fontSize: 11,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
});
