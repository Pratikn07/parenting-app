import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, X, Plus } from 'lucide-react-native';
import { router } from 'expo-router';

import { AnalyticsService } from '../../../services';
import { useAuthStore } from '../../../shared/stores/authStore';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

interface Child {
  id: string;
  name: string;
  birthDate: string;
  stage: string;
  ageInMonths?: number;
  feedingPreferences: string[];
}

interface OnboardingData {
  children: Child[];
}

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuthStore();
  const [data, setData] = useState<OnboardingData>({
    children: [],
  });

  const stages = [
    'Newborn (0–3 months)',
    'Infant (3–12 months)',
    'Toddler (1–3 years)',
    'Preschool (3–5 years)',
    'Early School (5–8 years)',
    'Tween (9–13 years)',
  ];

  // Base feeding options for all children
  const baseFeedingOptions = [
    'General nutrition',
    'Picky eating',
    'Allergies / intolerances',
  ];

  // Age-specific feeding options
  const getAgeSpecificOptions = (ageInMonths: number) => {
    if (ageInMonths < 12) {
      return ['Breastfeeding', 'Formula feeding', 'Mixed feeding', 'Starting solids', 'Solids established'];
    } else if (ageInMonths >= 12 && ageInMonths < 36) {
      return ['Portion sizes', 'Iron-rich foods', 'Weaning from bottle'];
    } else if (ageInMonths >= 48 && ageInMonths < 96) {
      return ['Balanced plate', 'Lunchbox ideas'];
    } else if (ageInMonths >= 108 && ageInMonths < 156) {
      return ['Growth spurts', 'Sports & activity fueling'];
    }
    return [];
  };

  const calculateAgeInMonths = (birthDate: string): number => {
    if (!birthDate) return 0;
    try {
      const birth = new Date(birthDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - birth.getTime());
      const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
      return diffMonths;
    } catch {
      return 0;
    }
  };

  React.useEffect(() => {
    AnalyticsService.screen('onboarding');
  }, []);

  const addChild = () => {
    const newChild: Child = {
      id: Date.now().toString(),
      name: '',
      birthDate: '',
      stage: stages[0],
      feedingPreferences: [],
    };
    setData(prev => ({
      ...prev,
      children: [...prev.children, newChild],
    }));
    AnalyticsService.track('onboarding_child_added');
  };

  const updateChild = (id: string, field: keyof Child, value: string | string[]) => {
    setData(prev => ({
      ...prev,
      children: prev.children.map(child => {
        if (child.id === id) {
          const updatedChild = { ...child, [field]: value };
          
          // Auto-calculate age when birth date changes
          if (field === 'birthDate' && typeof value === 'string') {
            updatedChild.ageInMonths = calculateAgeInMonths(value);
          }
          
          return updatedChild;
        }
        return child;
      }),
    }));
  };

  const removeChild = (id: string) => {
    setData(prev => ({
      ...prev,
      children: prev.children.filter(child => child.id !== id),
    }));
    AnalyticsService.track('onboarding_child_removed');
  };

  const toggleFeedingPreference = (childId: string, preference: string) => {
    setData(prev => ({
      ...prev,
      children: prev.children.map(child => {
        if (child.id === childId) {
          const currentPrefs = child.feedingPreferences || [];
          const newPrefs = currentPrefs.includes(preference)
            ? currentPrefs.filter(p => p !== preference)
            : [...currentPrefs, preference];
          return { ...child, feedingPreferences: newPrefs };
        }
        return child;
      }),
    }));
  };

  const handleComplete = () => {
    AnalyticsService.track('onboarding_completed', {
      children_count: data.children.length,
      total_feeding_preferences: data.children.reduce((sum, child) => sum + (child.feedingPreferences?.length || 0), 0),
    });
    completeOnboarding();
    router.replace('/chat');
  };

  const handleSkip = () => {
    AnalyticsService.track('onboarding_skipped');
    completeOnboarding();
    router.replace('/chat');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Who are we helping?</Text>
        <Text style={styles.subtitle}>Tell us about your child(ren).</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {data.children.map((child, index) => (
          <View key={child.id} style={styles.childCard}>
            <View style={styles.childHeader}>
              <Text style={styles.childLabel}>Child {index + 1}</Text>
              {data.children.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeChild(child.id)}
                  style={styles.removeButton}
                  activeOpacity={0.7}
                >
                  <X size={16} color="#6B7280" strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>

            <Input
              label="Name (optional)"
              placeholder="Enter child's name"
              value={child.name}
              onChangeText={(text) => updateChild(child.id, 'name', text)}
            />

            <Input
              label="Birthdate (or Due date)"
              placeholder="MM/DD/YYYY"
              value={child.birthDate}
              onChangeText={(text) => updateChild(child.id, 'birthDate', text)}
              helperText="We'll auto-calculate age in months/years"
            />

            <Text style={styles.inputLabel}>Stage (if no date)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stageScroll}>
              {stages.map((stage) => (
                <TouchableOpacity
                  key={stage}
                  style={[
                    styles.stageChip,
                    child.stage === stage && styles.stageChipSelected,
                  ]}
                  onPress={() => updateChild(child.id, 'stage', stage)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.stageChipText,
                    child.stage === stage && styles.stageChipTextSelected,
                  ]}>
                    {stage}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Feeding Preferences */}
            <Text style={styles.sectionTitle}>Feeding & Nutrition Interests</Text>
            
            {/* Base options for all children */}
            <Text style={styles.optionsSubtitle}>For all ages:</Text>
            <View style={styles.optionsGrid}>
              {baseFeedingOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionChip,
                    child.feedingPreferences?.includes(option) && styles.optionChipSelected,
                  ]}
                  onPress={() => toggleFeedingPreference(child.id, option)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.optionChipText,
                    child.feedingPreferences?.includes(option) && styles.optionChipTextSelected,
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Age-specific options */}
            {child.ageInMonths !== undefined && child.ageInMonths > 0 && (
              <>
                <Text style={styles.optionsSubtitle}>
                  Age-specific ({child.ageInMonths} months):
                </Text>
                <View style={styles.optionsGrid}>
                  {getAgeSpecificOptions(child.ageInMonths).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.optionChip,
                        child.feedingPreferences?.includes(option) && styles.optionChipSelected,
                      ]}
                      onPress={() => toggleFeedingPreference(child.id, option)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.optionChipText,
                        child.feedingPreferences?.includes(option) && styles.optionChipTextSelected,
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Safety note for allergies */}
            {child.feedingPreferences?.includes('Allergies / intolerances') && (
              <View style={styles.safetyNote}>
                <Text style={styles.safetyNoteText}>
                  General guidance only. For known or suspected allergies, follow your clinician's plan.
                </Text>
              </View>
            )}
          </View>
        ))}

        {/* Add Child Button */}
        {data.children.length < 3 && (
          <TouchableOpacity
            style={styles.addChildButton}
            onPress={addChild}
            activeOpacity={0.7}
          >
            <Plus size={20} color="#D4635A" strokeWidth={2} />
            <Text style={styles.addChildText}>Add Child</Text>
          </TouchableOpacity>
        )}

        {/* Empty state */}
        {data.children.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Tap "Add Child" to get started with personalized guidance
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Skip for now"
          onPress={handleSkip}
          variant="ghost"
        />

        <Button
          title="Start Chat"
          onPress={handleComplete}
          variant="primary"
          icon={<ChevronRight size={20} color="#FFFFFF" strokeWidth={2} />}
          iconPosition="right"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF7F3',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  childCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  childHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  childLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  removeButton: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  stageScroll: {
    marginBottom: 16,
  },
  stageChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stageChipSelected: {
    backgroundColor: '#D4635A',
    borderColor: '#D4635A',
  },
  stageChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  stageChipTextSelected: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 12,
  },
  optionsSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  optionChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionChipSelected: {
    backgroundColor: '#D4635A',
    borderColor: '#D4635A',
  },
  optionChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  optionChipTextSelected: {
    color: '#FFFFFF',
  },
  safetyNote: {
    backgroundColor: '#FEF3E2',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  safetyNoteText: {
    fontSize: 12,
    color: '#92400E',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  addChildButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D4635A',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 20,
    gap: 8,
    marginBottom: 20,
  },
  addChildText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4635A',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
});
