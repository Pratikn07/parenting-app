import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { THEME } from '@/src/lib/constants';
import { STAGES, type StageDef } from '../stages';

interface StageSelectorProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
}

const ROWS_PER_GRID = 2;
const STAGES_PER_ROW = 3;

export function StageSelector({ selectedIndex, onSelect }: StageSelectorProps) {
  const rows: StageDef[][] = [];
  for (let r = 0; r < ROWS_PER_GRID; r++) {
    rows.push(STAGES.slice(r * STAGES_PER_ROW, (r + 1) * STAGES_PER_ROW) as unknown as StageDef[]);
  }

  return (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>Stage</Text>
      {rows.map((rowStages, rowIdx) => (
        <View key={rowIdx} style={styles.stageRow}>
          {rowStages.map((stage, colIdx) => {
            const stageIdx = rowIdx * STAGES_PER_ROW + colIdx;
            const isActive = selectedIndex === stageIdx;
            return (
              <TouchableOpacity
                key={stage.label}
                style={[
                  styles.stageButton,
                  isActive && styles.stageButtonActive,
                  isActive && { backgroundColor: stage.color, borderColor: stage.textColor },
                ]}
                onPress={() => onSelect(stageIdx)}
                activeOpacity={0.7}
              >
                <Text style={styles.stageEmoji}>{stage.emoji}</Text>
                <Text
                  style={[
                    styles.stageLabel,
                    isActive && {
                      color: stage.textColor,
                      fontFamily: THEME.fonts.bodySemiBold,
                    },
                  ]}
                >
                  {stage.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  selectorContainer: {
    gap: 12,
  },
  selectorLabel: {
    fontSize: 13,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  stageButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stageButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stageEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  stageLabel: {
    fontSize: 12,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
  },
});
