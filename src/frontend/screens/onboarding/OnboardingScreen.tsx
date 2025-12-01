import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, X, Plus, ChevronLeft, Calendar as CalendarIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../shared/stores/authStore';
import { ScreenBackground } from '../../components/common/ScreenBackground';
import { ModernCard } from '../../components/common/ModernCard';
import { ModernButton } from '../../components/common/ModernButton';
import { THEME } from '../../../lib/constants';

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
  const [showDatePicker, setShowDatePicker] = useState<{ childId: string | null, show: boolean }>({
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
    const match = birthDate.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    let birth: Date | null = null;
    if (match) {
      const month = parseInt(match[1], 10) - 1;
      const day = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      const d = new Date(year, month, day);
      if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
        birth = d;
      }
    } else {
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
  };

  const updateChild = (id: string, field: keyof Child, value: string | string[]) => {
    setData(prev => ({
      ...prev,
      children: prev.children.map(child => {
        if (child.id === id) {
          const updatedChild = { ...child, [field]: value };
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

  // Calendar Functions
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
    setShowDatePicker({ childId: null, show: false });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCalendarState(prev => {
      if (direction === 'prev') {
        if (prev.month === 0) return { month: 11, year: prev.year - 1 };
        return { month: prev.month - 1, year: prev.year };
      } else {
        if (prev.month === 11) return { month: 0, year: prev.year + 1 };
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

  // Dynamic Age-Based Messaging
  const getStageEmoji = (ageInMonths: number): string => {
    if (ageInMonths < 0) return '⚠️';
    if (ageInMonths <= 3) return '👶';
    if (ageInMonths <= 12) return '🍼';
    if (ageInMonths <= 36) return '🧸';
    if (ageInMonths <= 60) return '🎨';
    if (ageInMonths <= 156) return '🧒';
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
    return 'Outside Range';
  };

  const getAgeDisplay = (ageInMonths: number): string => {
    if (ageInMonths < 12) {
      return `${ageInMonths} month${ageInMonths !== 1 ? 's' : ''} old`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const remainingMonths = ageInMonths % 12;
      if (remainingMonths === 0) return `${years} year${years !== 1 ? 's' : ''} old`;
      return `${years}y ${remainingMonths}m old`;
    }
  };

  const getStageMessage = (ageInMonths: number): string => {
    if (ageInMonths < 0) return 'Please enter a valid birthdate.';
    if (ageInMonths > 156) return "Our guidance currently covers 0–13 years.";
    if (ageInMonths <= 3) return "Focus on sleep schedules and bonding.";
    if (ageInMonths <= 6) return "Time for first foods and smiles!";
    if (ageInMonths <= 12) return "Crawling, babbling, and first steps!";
    if (ageInMonths <= 24) return "Language explosion and independence.";
    if (ageInMonths <= 36) return "Curiosity peaks and social skills develop.";
    if (ageInMonths <= 60) return "Preschool readiness and creative play.";
    if (ageInMonths <= 96) return 'Early literacy and healthy habits.';
    return 'Supporting confidence and friendships.';
  };

  const handleComplete = async () => {
    try {
      if (data.children.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const childrenPayload = data.children.map((c) => ({
            user_id: user.id,
            name: c.name || null,
            birth_date: (() => {
              if (!c.birthDate) return null;
              const d = new Date(c.birthDate);
              return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
            })(),
            created_at: new Date().toISOString(),
          }));

          if (childrenPayload.length > 0) {
            await supabase.from('children').insert(childrenPayload);
          }

          await supabase
            .from('profiles')
            .update({ has_completed_onboarding: true })
            .eq('id', user.id);
        }
      }
      completeOnboarding();
      router.replace('/chat');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      completeOnboarding();
      router.replace('/chat');
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/chat');
  };

  return (
    <View style={styles.container}>
      <ScreenBackground />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Who are we helping?</Text>
          <Text style={styles.subtitle}>Tell us about your child(ren).</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {data.children.map((child, index) => (
            <ModernCard key={child.id} style={styles.childCard}>
              <View style={styles.childHeader}>
                <Text style={styles.childLabel}>Child {index + 1}</Text>
                {data.children.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeChild(child.id)}
                    style={styles.removeButton}
                  >
                    <X size={16} color="#3D405B" strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Name (optional)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="Enter child's name"
                    placeholderTextColor="#9CA3AF"
                    value={child.name}
                    onChangeText={(text) => updateChild(child.id, 'name', text)}
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Birthdate (or Due date)</Text>
                <View style={styles.dateRow}>
                  <View style={[styles.inputWrapper, { flex: 1 }]}>
                    <TextInput
                      placeholder="MM/DD/YYYY"
                      placeholderTextColor="#9CA3AF"
                      value={child.birthDate}
                      onChangeText={(text) => updateChild(child.id, 'birthDate', text)}
                      style={styles.input}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.calendarButton}
                    onPress={() => setShowDatePicker({ childId: child.id, show: !showDatePicker.show })}
                  >
                    <CalendarIcon size={20} color="#E07A5F" />
                  </TouchableOpacity>
                </View>

                {showDatePicker.show && showDatePicker.childId === child.id && (
                  <ModernCard style={styles.calendarCard}>
                    {/* Calendar Header */}
                    <View style={styles.calendarHeader}>
                      <TouchableOpacity onPress={() => navigateMonth('prev')}>
                        <ChevronLeft size={20} color="#3D405B" />
                      </TouchableOpacity>
                      <View style={styles.monthYearContainer}>
                        <Text style={styles.monthText}>{months[calendarState.month]}</Text>
                        <View style={styles.yearControls}>
                          <TouchableOpacity onPress={() => navigateYear('prev')}>
                            <ChevronLeft size={14} color="#6B7280" />
                          </TouchableOpacity>
                          <Text style={styles.yearText}>{calendarState.year}</Text>
                          <TouchableOpacity onPress={() => navigateYear('next')}>
                            <ChevronRight size={14} color="#6B7280" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => navigateMonth('next')}>
                        <ChevronRight size={20} color="#3D405B" />
                      </TouchableOpacity>
                    </View>

                    {/* Days Grid */}
                    <View style={styles.calendarGrid}>
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <Text key={day} style={styles.dayLabel}>{day}</Text>
                      ))}
                      {/* Calendar logic */}
                      {(() => {
                        const daysInMonth = getDaysInMonth(calendarState.month, calendarState.year);
                        const firstDay = getFirstDayOfMonth(calendarState.month, calendarState.year);
                        const days = [];
                        for (let i = 0; i < firstDay; i++) days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
                        for (let day = 1; day <= daysInMonth; day++) {
                          const date = new Date(calendarState.year, calendarState.month, day);
                          const isSelected = child.birthDate === date.toLocaleDateString('en-US');
                          days.push(
                            <TouchableOpacity
                              key={day}
                              style={[styles.dayCell, isSelected && styles.daySelected]}
                              onPress={() => handleDateSelect(child.id, day)}
                            >
                              <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
                            </TouchableOpacity>
                          );
                        }
                        return days;
                      })()}
                    </View>
                  </ModernCard>
                )}
              </View>

              {/* Age Insight */}
              {child.birthDate && child.ageInMonths !== undefined && (
                <View style={styles.insightContainer}>
                  <View style={styles.insightHeader}>
                    <Text style={styles.insightEmoji}>{getStageEmoji(child.ageInMonths)}</Text>
                    <View>
                      <Text style={styles.insightTitle}>{getStageTitle(child.ageInMonths)}</Text>
                      <Text style={styles.insightSubtitle}>{getAgeDisplay(child.ageInMonths)}</Text>
                    </View>
                  </View>
                  <Text style={styles.insightMessage}>{getStageMessage(child.ageInMonths)}</Text>
                </View>
              )}

              {/* Feeding Preferences */}
              <Text style={styles.sectionTitle}>Feeding & Nutrition</Text>
              <View style={styles.chipsContainer}>
                {[...baseFeedingOptions, ...getAgeSpecificOptions(child.ageInMonths || 0)].map(option => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => toggleFeedingPreference(child.id, option)}
                    style={[
                      styles.chip,
                      child.feedingPreferences?.includes(option) && styles.chipSelected
                    ]}
                  >
                    <Text style={[
                      styles.chipText,
                      child.feedingPreferences?.includes(option) && styles.chipTextSelected
                    ]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ModernCard>
          ))}

          {data.children.length < 3 && (
            <ModernButton
              title="Add Child"
              onPress={addChild}
              icon={<Plus size={20} color="#E07A5F" />}
              variant="secondary"
              style={styles.addChildButton}
            />
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.footer}>
          <ModernButton
            title="Skip"
            onPress={handleSkip}
            variant="secondary"
            style={{ flex: 1 }}
          />
          <ModernButton
            title="Start Chat"
            onPress={handleComplete}
            variant="primary"
            style={{ flex: 2 }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: THEME.fonts.header,
    color: THEME.colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#3D405B',
    opacity: 0.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  childCard: {
    marginBottom: 24,
  },
  childHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  childLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E07A5F',
  },
  removeButton: {
    padding: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3D405B',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#3D405B',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  calendarButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCard: {
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowOpacity: 0.1,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthYearContainer: {
    alignItems: 'center',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D405B',
  },
  yearControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  yearText: {
    fontSize: 12,
    color: '#6B7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  daySelected: {
    backgroundColor: '#E07A5F',
  },
  dayText: {
    fontSize: 14,
    color: '#3D405B',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  insightContainer: {
    backgroundColor: '#F0FDF4', // Light green background for insight
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  insightEmoji: {
    fontSize: 24,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D405B',
  },
  insightSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  insightMessage: {
    fontSize: 14,
    color: '#3D405B',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D405B',
    marginBottom: 12,
    marginTop: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: '#FFF1F2', // Light red/pink
    borderColor: '#E07A5F',
  },
  chipText: {
    fontSize: 14,
    color: '#3D405B',
  },
  chipTextSelected: {
    color: '#E07A5F',
    fontWeight: '600',
  },
  addChildButton: {
    marginBottom: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 24,
    gap: 16,
  },
});
