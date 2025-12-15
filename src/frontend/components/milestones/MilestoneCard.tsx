import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle, Circle } from 'lucide-react-native';
import { THEME } from '../../../lib/constants';
import type { MilestoneTemplate, UserMilestoneProgress } from '../../../lib/database.types';

interface MilestoneCardProps {
  milestone: MilestoneTemplate;
  progress?: UserMilestoneProgress;
  onToggle: (milestoneId: string, completed: boolean) => void;
}

const CATEGORY_COLORS = {
  physical: '#3B82F6',
  cognitive: '#8B5CF6',
  social: '#10B981',
  emotional: '#F59E0B',
};

export const MilestoneCard: React.FC<MilestoneCardProps> = ({
  milestone,
  progress,
  onToggle,
}) => {
  const isCompleted = progress?.is_completed || false;
  const categoryColor = CATEGORY_COLORS[milestone.category as keyof typeof CATEGORY_COLORS];

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <TouchableOpacity
      style={[styles.container, isCompleted && styles.containerCompleted]}
      onPress={() => onToggle(milestone.id, !isCompleted)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={[styles.categoryIndicator, {backgroundColor: categoryColor}]} />
        
        <View style={styles.textContent}>
          <View style={styles.header}>
            <Text style={[styles.title, isCompleted && styles.titleCompleted]}>
              {milestone.title}
            </Text>
            {isCompleted ? (
              <CheckCircle size={24} color={THEME.colors.secondary} strokeWidth={2} />
            ) : (
              <Circle size={24} color="#D1D5DB" strokeWidth={2} />
            )}
          </View>
          
          {milestone.description && (
            <Text style={styles.description}>{milestone.description}</Text>
          )}
          
          <View style={styles.footer}>
            <Text style={styles.ageRange}>
              {milestone.age_min_months}-{milestone.age_max_months} months
            </Text>
            {isCompleted && progress?.completed_at && (
              <Text style={styles.completedDate}>
                ✓ {formatDate(progress.completed_at)}
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  containerCompleted: {
    backgroundColor: '#F9FAFB',
  },
  content: {
    flexDirection: 'row',
  },
  categoryIndicator: {
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  textContent: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.text.primary,
    marginRight: 12,
  },
  titleCompleted: {
    color: THEME.colors.text.secondary,
  },
  description: {
    fontSize: 14,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ageRange: {
    fontSize: 12,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.secondary,
  },
  completedDate: {
    fontSize: 12,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.secondary,
  },
});
