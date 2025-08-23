import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, X, Plus, ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '../../../lib/supabase';

// TODO: Import analytics service when available
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
  const [showDatePicker, setShowDatePicker] = useState<{childId: string | null, show: boolean}>({
    childId: null,
    show: false
  });
  const [calendarState, setCalendarState] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear()
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
    // Robust parse for MM/DD/YYYY (also supports M/D/YYYY)
    const match = birthDate.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    let birth: Date | null = null;
    if (match) {
      const month = parseInt(match[1], 10) - 1;
      const day = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      const d = new Date(year, month, day);
      // Validate constructed date
      if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
        birth = d;
      }
    } else {
      // Fallback to Date parser (handles locale-selected values)
      const d = new Date(birthDate);
      if (!isNaN(d.getTime())) birth = d;
    }

    if (!birth) return 0;

    const now = new Date();
    let months = (now.getFullYear() - birth.getFullYear()) * 12;
    months += now.getMonth() - birth.getMonth();
    if (now.getDate() < birth.getDate()) months--;
    if (months < 0) months = 0;
    return months;
  };

  React.useEffect(() => {
    // TODO: Track screen view when analytics is available
    console.log('Onboarding screen viewed');
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
    // TODO: Track event when analytics is available
    console.log('Child added to onboarding');
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
    // TODO: Track event when analytics is available
    console.log('Child removed from onboarding');
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

  // Modern Calendar Functions
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (childId: string, day: number) => {
    const formattedDate = new Date(calendarState.year, calendarState.month, day).toLocaleDateString('en-US');
    updateChild(childId, 'birthDate', formattedDate);
    setShowDatePicker({childId: null, show: false});
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCalendarState(prev => {
      if (direction === 'prev') {
        if (prev.month === 0) {
          return { month: 11, year: prev.year - 1 };
        }
        return { month: prev.month - 1, year: prev.year };
      } else {
        if (prev.month === 11) {
          return { month: 0, year: prev.year + 1 };
        }
        return { month: prev.month + 1, year: prev.year };
      }
    });
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    setCalendarState(prev => ({
      ...prev,
      year: direction === 'prev' ? prev.year - 1 : prev.year + 1
    }));
  };

  // Dynamic Age-Based Messaging Functions
  const getStageEmoji = (ageInMonths: number): string => {
    if (ageInMonths < 0) return '⚠️';
    if (ageInMonths <= 3) return '👶';
    if (ageInMonths <= 12) return '🍼';
    if (ageInMonths <= 36) return '🧸';
    if (ageInMonths <= 60) return '🎨';
    if (ageInMonths <= 156) return '🧒'; // 13y
    return '⚠️';
  };

  const getStageTitle = (ageInMonths: number): string => {
    if (ageInMonths < 0) return 'Invalid Date';
    if (ageInMonths <= 3) return 'Newborn';
    if (ageInMonths <= 12) return 'Infant';
    if (ageInMonths <= 36) return 'Toddler';
    if (ageInMonths <= 60) return 'Preschool';
    if (ageInMonths <= 96) return 'Early School';
    if (ageInMonths <= 156) return 'Tween';
    return 'Outside Supported Range';
  };

  const getAgeDisplay = (ageInMonths: number): string => {
    if (ageInMonths < 12) {
      return `${ageInMonths} month${ageInMonths !== 1 ? 's' : ''} old`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const remainingMonths = ageInMonths % 12;
      if (remainingMonths === 0) {
        return `${years} year${years !== 1 ? 's' : ''} old`;
      }
      return `${years}y ${remainingMonths}m old`;
    }
  };

  const getStageMessage = (ageInMonths: number): string => {
    if (ageInMonths < 0) {
      return 'Please enter a valid birthdate in the past.';
    }
    if (ageInMonths > 156) {
      return "This looks like an older child's date. Our guidance currently covers 0–13 years.";
    }
    if (ageInMonths <= 3) {
      return "Focus on sleep schedules, feeding patterns, and bonding. Every day brings new developments!";
    }
    if (ageInMonths <= 6) {
      return "Time for first foods and exploring textures. Watch for those precious first smiles and giggles!";
    }
    if (ageInMonths <= 12) {
      return "Crawling, babbling, and maybe first steps! This is an exciting time of rapid development.";
    }
    if (ageInMonths <= 24) {
      return "Language explosion and independence emerging. Toddler adventures are just beginning!";
    }
    if (ageInMonths <= 36) {
      return "Curiosity peaks and social skills develop. Perfect time for interactive learning and play.";
    }
    if (ageInMonths <= 60) {
      return "Preschool readiness and creative expression. Learning through play becomes more structured.";
    }
    if (ageInMonths <= 96) {
      return 'Early literacy, routines, and social development—build consistency and healthy habits.';
    }
    return 'Curiosity and independence grow—support confidence, friendships, and problem-solving.';
  };

  const handleComplete = async () => {
    try {
      // TODO: Track event when analytics is available
      console.log('Onboarding completed', {
        children_count: data.children.length,
        total_feeding_preferences: data.children.reduce((sum, child) => sum + (child.feedingPreferences?.length || 0), 0),
      });
      
      // Save children data to database
      if (data.children.length > 0) {
        console.log('💾 Saving children data to database...', data.children);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Upsert children into children table
          const childrenPayload = data.children.map((c) => ({
            user_id: user.id,
            name: c.name || null,
            date_of_birth: (() => {
              if (!c.birthDate) return null;
              const m = c.birthDate.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
              if (m) {
                const month = parseInt(m[1], 10) - 1;
                const day = parseInt(m[2], 10);
                const year = parseInt(m[3], 10);
                const d = new Date(year, month, day);
                if (!isNaN(d.getTime())) return d.toISOString().slice(0,10);
                return null;
              }
              const d = new Date(c.birthDate);
              return isNaN(d.getTime()) ? null : d.toISOString().slice(0,10);
            })(),
            created_at: new Date().toISOString(),
          }));
          if (childrenPayload.length > 0) {
            const { error: childrenError } = await supabase
              .from('children')
              .insert(childrenPayload);
            if (childrenError) {
              console.error('Failed to save children:', childrenError.message);
            }
          }

          // Mark onboarding complete on user profile
          const { error: userError } = await supabase
            .from('users')
            .update({ has_completed_onboarding: true })
            .eq('id', user.id);
          if (userError) {
            console.error('Failed to mark onboarding complete:', userError.message);
          }
        }
      }
      
      completeOnboarding();
      router.replace('/chat');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still proceed even if saving fails
      completeOnboarding();
      router.replace('/chat');
    }
  };

  const handleSkip = () => {
    // TODO: Track event when analytics is available
    console.log('Onboarding skipped');
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

            <View>
              <Text style={styles.inputLabel}>Birthdate (or Due date)</Text>
              <View style={styles.modernDateInputWrapper}>
                <Input
                  placeholder="MM/DD/YYYY or tap calendar"
                  value={child.birthDate}
                  onChangeText={(text) => updateChild(child.id, 'birthDate', text)}
                  style={styles.modernDateInput}
                />
                <TouchableOpacity
                  style={styles.embeddedCalendarIcon}
                  onPress={() => setShowDatePicker({childId: child.id, show: !showDatePicker.show})}
                >
                  <Text style={styles.embeddedCalendarText}>📅</Text>
                </TouchableOpacity>
              </View>
              
              {/* Modern Pure JS Calendar - No Native Dependencies */}
              {showDatePicker.show && showDatePicker.childId === child.id && (
                <View style={styles.modernCalendarCard}>
                  {/* Header */}
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
                      <ChevronLeft size={20} color="#6B7280" />
                    </TouchableOpacity>
                    
                    <View style={styles.monthYearContainer}>
                      <Text style={styles.monthText}>{months[calendarState.month]}</Text>
                      <View style={styles.yearControls}>
                        <TouchableOpacity onPress={() => navigateYear('prev')} style={styles.yearButton}>
                          <ChevronLeft size={14} color="#9CA3AF" />
                        </TouchableOpacity>
                        <Text style={styles.yearText}>{calendarState.year}</Text>
                        <TouchableOpacity onPress={() => navigateYear('next')} style={styles.yearButton}>
                          <ChevronRight size={14} color="#9CA3AF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
                      <ChevronRight size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>

                  {/* Days of Week */}
                  <View style={styles.daysOfWeekContainer}>
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                      <Text key={day} style={styles.dayOfWeekText}>{day}</Text>
                    ))}
                  </View>

                  {/* Calendar Grid */}
                  <View style={styles.calendarGrid}>
                    {(() => {
                      const daysInMonth = getDaysInMonth(calendarState.month, calendarState.year);
                      const firstDay = getFirstDayOfMonth(calendarState.month, calendarState.year);
                      const days = [];
                      
                      // Empty cells for days before first day
                      for (let i = 0; i < firstDay; i++) {
                        days.push(<View key={`empty-${i}`} style={styles.emptyDay} />);
                      }
                      
                      // Days of the month
                      for (let day = 1; day <= daysInMonth; day++) {
                        const date = new Date(calendarState.year, calendarState.month, day);
                        const isToday = date.toDateString() === new Date().toDateString();
                        const isSelected = child.birthDate === date.toLocaleDateString('en-US');
                        const isFuture = date > new Date();
                        
                        days.push(
                          <TouchableOpacity
                            key={day}
                            style={[
                              styles.dayButton,
                              isSelected && styles.dayButtonSelected,
                              isToday && !isSelected && styles.dayButtonToday,
                              isFuture && styles.dayButtonDisabled
                            ]}
                            onPress={() => !isFuture && handleDateSelect(child.id, day)}
                            disabled={isFuture}
                          >
                            <Text style={[
                              styles.dayText,
                              isSelected && styles.dayTextSelected,
                              isToday && !isSelected && styles.dayTextToday,
                              isFuture && styles.dayTextDisabled
                            ]}>
                              {day}
                            </Text>
                          </TouchableOpacity>
                        );
                      }
                      
                      return days;
                    })()}
                  </View>

                  {/* Footer */}
                  <View style={styles.calendarFooter}>
                    <Text style={styles.calendarHint}>💡 You can also type the date manually above</Text>
                    <TouchableOpacity
                      style={styles.calendarCloseButton}
                      onPress={() => setShowDatePicker({childId: null, show: false})}
                    >
                      <Text style={styles.calendarCloseText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              <Text style={styles.helperText}>We'll auto-calculate age in months/years</Text>
            </View>

            {/* Dynamic Age-Based Card */}
            {child.birthDate && child.ageInMonths !== undefined && (
              <View style={styles.ageInsightCard}>
                <View style={styles.ageInsightHeader}>
                  <Text style={styles.ageInsightEmoji}>{getStageEmoji(child.ageInMonths)}</Text>
                  <View style={styles.ageInsightText}>
                    <Text style={styles.ageInsightTitle}>{getStageTitle(child.ageInMonths)}</Text>
                    <Text style={styles.ageInsightAge}>{getAgeDisplay(child.ageInMonths)}</Text>
                  </View>
                </View>
                <Text style={styles.ageInsightMessage}>{getStageMessage(child.ageInMonths)}</Text>
              </View>
            )}

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
          title="Save & Start Chat"
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
  dateInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    minHeight: 48,
    justifyContent: 'center',
  },
  dateInputText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  dateInputTextFilled: {
    color: '#1F2937',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  modernDateInputWrapper: {
    position: 'relative',
  },
  modernDateInput: {
    paddingRight: 48, // Space for embedded icon
  },
  embeddedCalendarIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -12, // Half of icon height for perfect centering
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  embeddedCalendarText: {
    fontSize: 18,
    opacity: 0.6,
  },
  modernCalendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  monthYearContainer: {
    alignItems: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  yearControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  yearButton: {
    padding: 2,
  },
  yearText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    minWidth: 40,
    textAlign: 'center',
  },
  daysOfWeekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dayOfWeekText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    width: 32,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  emptyDay: {
    width: 32,
    height: 32,
    margin: 2,
  },
  dayButton: {
    width: 32,
    height: 32,
    margin: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dayButtonSelected: {
    backgroundColor: '#D4635A',
  },
  dayButtonToday: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D4635A',
  },
  dayButtonDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dayTextToday: {
    color: '#D4635A',
    fontWeight: '600',
  },
  dayTextDisabled: {
    color: '#9CA3AF',
  },
  calendarFooter: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  calendarHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  calendarCloseButton: {
    backgroundColor: '#D4635A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  calendarCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  ageInsightCard: {
    backgroundColor: '#FDF7F3',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#D4635A',
  },
  ageInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ageInsightEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  ageInsightText: {
    flex: 1,
  },
  ageInsightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  ageInsightAge: {
    fontSize: 14,
    color: '#D4635A',
    fontWeight: '500',
  },
  ageInsightMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
