import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MessageCircle, Trophy, Utensils } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';

interface WeeklyStatsProps {
  milestonesLogged: number;
  chatConversations: number;
  recipesSaved: number;
}

export default function WeeklyStats({ milestonesLogged, chatConversations, recipesSaved }: WeeklyStatsProps) {
  const stats = [
    { label: 'Milestones', value: milestonesLogged, icon: Trophy, color: THEME.colors.accent },
    { label: 'Chats', value: chatConversations, icon: MessageCircle, color: THEME.colors.primary },
    { label: 'Recipes', value: recipesSaved, icon: Utensils, color: THEME.colors.secondary },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>This Week</Text>
      <View style={styles.row}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <View key={stat.label} style={styles.statCard}>
              <Icon size={18} color={stat.color} strokeWidth={2} />
              <Text style={[styles.value, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.label}>{stat.label}</Text>
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
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: THEME.colors.ui.cardBg,
    borderRadius: THEME.layout.borderRadius.sm,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  value: {
    fontSize: 24,
    fontFamily: THEME.fonts.header,
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.secondary,
    marginTop: 4,
  },
});
