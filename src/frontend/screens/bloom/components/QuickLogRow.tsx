import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Trophy, StickyNote, Camera, Smile } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { THEME } from '@/src/lib/constants';

interface QuickLogRowProps {
  onLogMilestone: () => void;
  onLogNote: () => void;
  onLogPhoto: () => void;
  onLogMood: () => void;
}

const actions = [
  { id: 'milestone', label: 'Milestone', icon: Trophy, color: THEME.colors.accent },
  { id: 'note', label: 'Note', icon: StickyNote, color: THEME.colors.secondary },
  { id: 'photo', label: 'Photo', icon: Camera, color: THEME.colors.primary },
  { id: 'mood', label: 'Mood', icon: Smile, color: '#6366F1' },
];

export default function QuickLogRow({ onLogMilestone, onLogNote, onLogPhoto, onLogMood }: QuickLogRowProps) {
  const handlers: Record<string, () => void> = {
    milestone: onLogMilestone,
    note: onLogNote,
    photo: onLogPhoto,
    mood: onLogMood,
  };

  const handlePress = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handlers[id]?.();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quick Log</Text>
      <View style={styles.row}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <TouchableOpacity
              key={action.id}
              style={styles.action}
              onPress={() => handlePress(action.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${action.color}15` }]}>
                <Icon size={22} color={action.color} strokeWidth={2} />
              </View>
              <Text style={styles.label}>{action.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  action: {
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontFamily: THEME.fonts.bodyMedium,
    color: THEME.colors.text.primary,
  },
});
