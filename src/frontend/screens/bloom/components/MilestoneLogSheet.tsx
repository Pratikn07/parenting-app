import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, CheckCircle, Circle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { THEME } from '@/src/lib/constants';
import { useAuthStore } from '@/src/shared/stores';
import { useChildStore } from '@/src/shared/stores/childStore';
import { milestonesService } from '@/src/services/milestones/MilestonesService';
import type { MilestoneTemplate } from '@/src/lib/database.types';

interface MilestoneLogSheetProps {
  visible: boolean;
  onClose: () => void;
  onLogged: () => void;
}

const categoryColors: Record<string, string> = {
  physical: THEME.colors.milestone.physical,
  cognitive: THEME.colors.milestone.cognitive,
  social: THEME.colors.milestone.social,
  emotional: THEME.colors.milestone.emotional,
};

export default function MilestoneLogSheet({ visible, onClose, onLogged }: MilestoneLogSheetProps) {
  const { user } = useAuthStore();
  const { activeChild } = useChildStore();
  const [milestones, setMilestones] = useState<MilestoneTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [note, setNote] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [isLogging, setIsLogging] = useState(false);

  const categories = ['All', 'Physical', 'Cognitive', 'Social', 'Emotional'];

  useEffect(() => {
    if (!visible || !activeChild) return;

    let cancelled = false;
    (async () => {
      try {
        const relevantMilestones = await milestonesService.getRelevantMilestones(activeChild);
        if (!cancelled) setMilestones(relevantMilestones);
      } catch (err) {
        console.error('Error loading milestones for logging:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, activeChild?.id]);

  const handleLog = async () => {
    if (!selectedMilestone || !user?.id || !activeChild?.id) return;

    setIsLogging(true);
    try {
      await milestonesService.completeMilestone(
        user.id,
        activeChild.id,
        selectedMilestone,
        note || undefined
      );

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelectedMilestone(null);
      setNote('');
      onLogged();
      onClose();
    } catch (err) {
      console.error('Error logging milestone:', err);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLogging(false);
    }
  };

  const handleSelect = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMilestone(selectedMilestone === id ? null : id);
  };

  const filteredMilestones = milestones.filter(
    (m) => selectedCategory === 'All' || m.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Log Milestone</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={22} color={THEME.colors.text.secondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtitle}>
            Select a milestone {activeChild?.name ? `for ${activeChild.name}` : ''}
          </Text>
        </View>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterChip,
                selectedCategory === cat && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === cat && styles.filterChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Milestones List */}
        <ScrollView
          style={styles.listContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {filteredMilestones.map((milestone) => {
            const isSelected = selectedMilestone === milestone.id;
            const color = categoryColors[milestone.category.toLowerCase()] || THEME.colors.primary;

            return (
              <TouchableOpacity
                key={milestone.id}
                style={[styles.milestoneItem, isSelected && styles.milestoneItemSelected]}
                onPress={() => handleSelect(milestone.id)}
                activeOpacity={0.7}
              >
                {isSelected ? (
                  <CheckCircle size={24} color={color} strokeWidth={2} fill={color} />
                ) : (
                  <Circle size={24} color={`${color}60`} strokeWidth={2} />
                )}
                <View style={styles.milestoneInfo}>
                  <Text style={[styles.milestoneTitle, isSelected && { color }]}>
                    {milestone.title}
                  </Text>
                  <Text style={styles.milestoneDesc} numberOfLines={1}>
                    {milestone.description}
                  </Text>
                </View>
                <View style={[styles.categoryDot, { backgroundColor: `${color}30` }]}>
                  <Text style={[styles.categoryDotText, { color }]}>
                    {milestone.category.charAt(0)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {filteredMilestones.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No milestones found for this category</Text>
            </View>
          )}
        </ScrollView>

        {/* Note Input + Log Button */}
        {selectedMilestone && (
          <View style={styles.footer}>
            <TextInput
              style={styles.noteInput}
              placeholder="Add a note (optional)..."
              placeholderTextColor={THEME.colors.text.secondary}
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={200}
            />
            <TouchableOpacity
              style={[styles.logButton, isLogging && styles.logButtonDisabled]}
              onPress={handleLog}
              activeOpacity={0.8}
              disabled={isLogging}
            >
              <CheckCircle size={18} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.logButtonText}>
                {isLogging ? 'Logging...' : 'Log Milestone 🎉'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.ui.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: THEME.fonts.header,
    color: THEME.colors.text.primary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.ui.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.secondary,
    marginTop: 4,
  },
  filterScroll: {
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: THEME.colors.ui.surfaceLow,
  },
  filterChipActive: {
    backgroundColor: THEME.colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontFamily: THEME.fonts.bodyMedium,
    color: THEME.colors.text.secondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: THEME.colors.ui.cardBg,
  },
  milestoneItemSelected: {
    backgroundColor: THEME.colors.ui.surfaceLow,
  },
  milestoneInfo: {
    flex: 1,
    marginLeft: 14,
  },
  milestoneTitle: {
    fontSize: 15,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.text.primary,
  },
  milestoneDesc: {
    fontSize: 13,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  categoryDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryDotText: {
    fontSize: 12,
    fontFamily: THEME.fonts.bodySemiBold,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.secondary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 12,
    backgroundColor: THEME.colors.ui.cardBg,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.ui.surfaceLow,
  },
  noteInput: {
    backgroundColor: THEME.colors.ui.surfaceLow,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.primary,
    marginBottom: 12,
    maxHeight: 80,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.secondary,
    borderRadius: 28,
    paddingVertical: 16,
    gap: 8,
  },
  logButtonDisabled: {
    opacity: 0.6,
  },
  logButtonText: {
    fontSize: 16,
    fontFamily: THEME.fonts.bodySemiBold,
    color: '#FFFFFF',
  },
});
