import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CheckCircle, Circle, ChevronRight } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';
import type { MilestoneTemplate, UserMilestoneProgress } from '@/src/lib/database.types';

interface MilestoneSpotlightProps {
  milestones: MilestoneTemplate[];
  progress: Map<string, UserMilestoneProgress>;
  onViewAll: () => void;
}

export default function MilestoneSpotlight({ milestones, progress, onViewAll }: MilestoneSpotlightProps) {
  // Get next 3 upcoming (incomplete) milestones
  const upcoming = milestones
    .filter((m) => !progress.get(m.id)?.is_completed)
    .slice(0, 3);

  // Get recently completed milestones
  const achieved = milestones
    .filter((m) => progress.get(m.id)?.is_completed)
    .slice(0, 2);

  if (milestones.length === 0) {
    return null;
  }

  const getCategoryColor = (category: string) => {
    const key = category.toLowerCase() as keyof typeof THEME.colors.milestone;
    return THEME.colors.milestone[key] || THEME.colors.primary;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Milestone Spotlight</Text>
        <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <ChevronRight size={14} color={THEME.colors.primary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Recently achieved */}
      {achieved.length > 0 && (
        <View style={styles.achievedSection}>
          {achieved.map((milestone) => (
            <View key={milestone.id} style={styles.achievedCard}>
              <CheckCircle size={20} color={THEME.colors.secondary} strokeWidth={2} fill={THEME.colors.secondary} />
              <View style={styles.milestoneText}>
                <Text style={styles.achievedTitle}>{milestone.title}</Text>
                <Text style={styles.achievedCategory}>{milestone.category}</Text>
              </View>
              <Text style={styles.achievedBadge}>Done ✨</Text>
            </View>
          ))}
        </View>
      )}

      {/* Upcoming milestones */}
      {upcoming.length > 0 && (
        <View style={styles.upcomingSection}>
          <Text style={styles.upcomingLabel}>Coming Up</Text>
          {upcoming.map((milestone, index) => (
            <View key={milestone.id} style={styles.upcomingCard}>
              <View style={styles.timelineIndicator}>
                <Circle size={16} color={getCategoryColor(milestone.category)} strokeWidth={2} />
                {index < upcoming.length - 1 && (
                  <View style={[styles.timelineLine, { backgroundColor: `${getCategoryColor(milestone.category)}30` }]} />
                )}
              </View>
              <View style={styles.milestoneContent}>
                <Text style={styles.upcomingTitle}>{milestone.title}</Text>
                <Text style={styles.upcomingDescription} numberOfLines={1}>
                  {milestone.description}
                </Text>
                <View style={[styles.categoryChip, { backgroundColor: `${getCategoryColor(milestone.category)}15` }]}>
                  <Text style={[styles.categoryChipText, { color: getCategoryColor(milestone.category) }]}>
                    {milestone.category}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.primary,
  },
  achievedSection: {
    gap: 8,
    marginBottom: 16,
  },
  achievedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${THEME.colors.secondary}08`,
    borderRadius: 12,
    padding: 14,
  },
  milestoneText: {
    flex: 1,
    marginLeft: 12,
  },
  achievedTitle: {
    fontSize: 15,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.text.primary,
  },
  achievedCategory: {
    fontSize: 12,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  achievedBadge: {
    fontSize: 12,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.secondary,
  },
  upcomingSection: {
    gap: 0,
  },
  upcomingLabel: {
    fontSize: 12,
    fontFamily: THEME.fonts.bodyMedium,
    color: THEME.colors.text.secondary,
    marginBottom: 12,
  },
  upcomingCard: {
    flexDirection: 'row',
    minHeight: 70,
  },
  timelineIndicator: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
    paddingTop: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    borderRadius: 1,
  },
  milestoneContent: {
    flex: 1,
    paddingBottom: 16,
  },
  upcomingTitle: {
    fontSize: 15,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.text.primary,
    marginBottom: 4,
  },
  upcomingDescription: {
    fontSize: 13,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.secondary,
    marginBottom: 8,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryChipText: {
    fontSize: 11,
    fontFamily: THEME.fonts.bodySemiBold,
  },
});
