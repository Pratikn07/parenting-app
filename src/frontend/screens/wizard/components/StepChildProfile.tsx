import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Keyboard, Dimensions, Platform, Modal, ScrollView } from 'react-native';
import Animated, {
  FadeInRight,
  FadeOutLeft,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  ZoomIn,
  FadeInDown,
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { THEME } from '@/src/lib/constants';
import { ModernButton } from '@/src/frontend/components/common/ModernButton';
import { useWizardStore, ChildData } from '../wizardStore';
import { Plus, X, User } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STAGES = [
  { label: 'Expecting', range: 'Baby on the way', emoji: '🤰', color: '#FCE7F3', textColor: '#9D174D', months: 0, stage: 'expecting' },
  { label: 'Newborn', range: '0-3 months', emoji: '👶', color: '#FEF3C7', textColor: '#92400E', months: 1, stage: 'newborn' },
  { label: 'Infant', range: '4-12 months', emoji: '🍼', color: '#DBEAFE', textColor: '#1E40AF', months: 8, stage: 'infant' },
  { label: 'Toddler', range: '1-3 years', emoji: '🧸', color: '#FEE2E2', textColor: '#991B1B', months: 24, stage: 'toddler' },
  { label: 'Preschool', range: '3-5 years', emoji: '🎨', color: '#D1FAE5', textColor: '#065F46', months: 48, stage: 'preschool' },
  { label: 'School Age', range: '5+ years', emoji: '🎒', color: '#E0E7FF', textColor: '#3730A3', months: 72, stage: 'school' },
] as const;

interface ChildFormData {
  id: string;
  name: string;
  selectedIndex: number;
  dateOfBirth: Date | null;
  showDatePicker: boolean;
}

export const StepChildProfile = () => {
  const { updateData, setStep, data } = useWizardStore();

  // Initialize with one child by default, or load from existing data
  const [children, setChildren] = useState<ChildFormData[]>(() => {
    if (data.children && data.children.length > 0) {
      return data.children.map((child, index) => ({
        id: `child-${index}`,
        name: child.name || '',
        selectedIndex: STAGES.findIndex(s => s.stage === child.stage) || 1,
        dateOfBirth: child.dateOfBirth ? new Date(child.dateOfBirth) : null,
        showDatePicker: false,
      }));
    }
    return [{
      id: 'child-0',
      name: '',
      selectedIndex: 1, // Default to Newborn
      dateOfBirth: null,
      showDatePicker: false,
    }];
  });

  const [activeChildIndex, setActiveChildIndex] = useState(0);
  const nameInputRef = useRef<TextInput>(null);

  // Ensure active index is valid
  useEffect(() => {
    if (activeChildIndex >= children.length) {
      setActiveChildIndex(Math.max(0, children.length - 1));
    }
  }, [children.length]);

  const activeChild = children[activeChildIndex] || children[0];
  const currentStage = STAGES[activeChild.selectedIndex];
  const isExpecting = currentStage.stage === 'expecting';

  // Auto-focus on name input when switching children
  useEffect(() => {
    const timer = setTimeout(() => {
      nameInputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, [activeChildIndex]);

  // Calculate age from DOB
  const calculateAge = (dob: Date) => {
    const today = new Date();
    const months = (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0) {
      return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''} old`;
    } else if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''} old`;
    } else {
      return `${years}y ${remainingMonths}mo old`;
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const updateChild = (index: number, updates: Partial<ChildFormData>) => {
    setChildren(prev => prev.map((child, i) =>
      i === index ? { ...child, ...updates } : child
    ));
  };

  const addChild = () => {
    if (children.length < 2) {
      const newChild: ChildFormData = {
        id: `child-${children.length}`,
        name: '',
        selectedIndex: 1,
        dateOfBirth: null,
        showDatePicker: false,
      };
      setChildren([...children, newChild]);
      setActiveChildIndex(children.length); // Switch to new child
    }
  };

  const removeChild = (index: number) => {
    if (children.length > 1) {
      const newChildren = children.filter((_, i) => i !== index);
      setChildren(newChildren);
      // Adjust active index if needed
      if (activeChildIndex >= newChildren.length) {
        setActiveChildIndex(Math.max(0, newChildren.length - 1));
      } else if (activeChildIndex === index) {
        setActiveChildIndex(Math.max(0, index - 1));
      }
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      updateChild(activeChildIndex, { showDatePicker: false });
    }
    if (selectedDate) {
      updateChild(activeChildIndex, { dateOfBirth: selectedDate });
    }
  };

  // Validation
  const isChildValid = (child: ChildFormData) => {
    const stage = STAGES[child.selectedIndex];
    const isExpecting = stage.stage === 'expecting';
    const isNameValid = isExpecting || child.name.trim().length > 0;
    const isDobValid = isExpecting || child.dateOfBirth !== null;
    return isNameValid && isDobValid;
  };

  const isFormValid = children.every(isChildValid);

  const handleNext = () => {
    if (!isFormValid) return;
    Keyboard.dismiss();

    // Convert to ChildData format
    const childrenData: ChildData[] = children.map(child => {
      const stage = STAGES[child.selectedIndex];
      let ageInMonths = stage.months;

      if (child.dateOfBirth && stage.stage !== 'expecting') {
        const today = new Date();
        ageInMonths = (today.getFullYear() - child.dateOfBirth.getFullYear()) * 12 +
          (today.getMonth() - child.dateOfBirth.getMonth());
      }

      return {
        name: child.name.trim() || (stage.stage === 'expecting' ? 'Baby' : ''),
        age: stage.range,
        ageInMonths,
        stage: stage.stage as any,
        dateOfBirth: child.dateOfBirth ? child.dateOfBirth.toISOString().split('T')[0] : undefined,
      };
    });

    updateData({ children: childrenData });
    setStep('challenge', 'forward');
  };

  // Animated background color
  const animatedContainerStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(currentStage.color, { duration: 400 }),
  }));

  // Dynamic hero text
  const getHeroText = () => {
    const displayName = activeChild.name.trim() || (isExpecting ? 'Baby' : 'Your child');
    if (isExpecting) {
      return `${displayName} is on the way!`;
    }
    return `${displayName} is a ${currentStage.label}`;
  };

  return (
    <Animated.View
      entering={FadeInRight}
      exiting={FadeOutLeft}
      style={styles.container}
    >
      {/* Hero Section */}
      <Animated.View style={[styles.heroSection, animatedContainerStyle]}>
        <Animated.Text
          key={activeChildIndex} // Re-animate on child switch
          entering={ZoomIn.duration(300)}
          style={styles.heroEmoji}
        >
          {currentStage.emoji}
        </Animated.Text>

        <Animated.View entering={FadeIn.delay(100)}>
          <Text style={[styles.heroTitle, { color: currentStage.textColor }]}>
            {getHeroText()}
          </Text>
          <Text style={[styles.heroSubtitle, { color: currentStage.textColor, opacity: 0.7 }]}>
            {currentStage.range}
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Child Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {children.map((child, index) => {
            const isActive = index === activeChildIndex;
            return (
              <TouchableOpacity
                key={child.id}
                style={[
                  styles.tab,
                  isActive && styles.tabActive,
                  isActive && { borderColor: currentStage.textColor, backgroundColor: currentStage.color }
                ]}
                onPress={() => setActiveChildIndex(index)}
                activeOpacity={0.7}
              >
                <User size={16} color={isActive ? currentStage.textColor : '#6B7280'} />
                <Text style={[
                  styles.tabText,
                  isActive && { color: currentStage.textColor, fontFamily: THEME.fonts.bodySemiBold }
                ]}>
                  {child.name || `Child ${index + 1}`}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Add Child Tab */}
          {children.length < 2 && (
            <TouchableOpacity
              style={styles.addTab}
              onPress={addChild}
              activeOpacity={0.7}
            >
              <Plus size={18} color={THEME.colors.primary} />
              <Text style={styles.addTabText}>Add Child</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentSection}
      >
        {/* Active Child Form */}
        <Animated.View
          key={activeChild.id}
          entering={FadeInRight.duration(300)}
          style={styles.childCard}
        >
          {/* Child Header */}
          <View style={styles.childHeader}>
            <Text style={styles.childLabel}>
              {children.length > 1 ? `Child ${activeChildIndex + 1} Details` : 'Child Details'}
            </Text>
            {children.length > 1 && (
              <TouchableOpacity
                onPress={() => removeChild(activeChildIndex)}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
                <X size={16} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {isExpecting ? "Baby's name (optional)" : "Child's name"}
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                ref={nameInputRef}
                style={styles.input}
                placeholder={isExpecting ? "Not decided yet? Skip!" : "Enter name"}
                placeholderTextColor="#9CA3AF"
                value={activeChild.name}
                onChangeText={(text) => updateChild(activeChildIndex, { name: text })}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
              {((isExpecting || activeChild.name.trim().length > 0) && activeChild.name.trim().length > 0) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
          </View>

          {/* Stage Selector */}
          <View style={styles.selectorContainer}>
            <Text style={styles.selectorLabel}>Stage</Text>

            {/* Row 1 */}
            <View style={styles.stageRow}>
              {STAGES.slice(0, 3).map((stage, stageIdx) => (
                <TouchableOpacity
                  key={stage.label}
                  style={[
                    styles.stageButton,
                    activeChild.selectedIndex === stageIdx && styles.stageButtonActive,
                    activeChild.selectedIndex === stageIdx && { backgroundColor: stage.color, borderColor: stage.textColor },
                  ]}
                  onPress={() => updateChild(activeChildIndex, { selectedIndex: stageIdx })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stageEmoji}>{stage.emoji}</Text>
                  <Text style={[
                    styles.stageLabel,
                    activeChild.selectedIndex === stageIdx && { color: stage.textColor, fontFamily: THEME.fonts.bodySemiBold },
                  ]}>
                    {stage.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Row 2 */}
            <View style={styles.stageRow}>
              {STAGES.slice(3, 6).map((stage, stageIdx) => {
                const actualIndex = stageIdx + 3;
                return (
                  <TouchableOpacity
                    key={stage.label}
                    style={[
                      styles.stageButton,
                      activeChild.selectedIndex === actualIndex && styles.stageButtonActive,
                      activeChild.selectedIndex === actualIndex && { backgroundColor: stage.color, borderColor: stage.textColor },
                    ]}
                    onPress={() => updateChild(activeChildIndex, { selectedIndex: actualIndex })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stageEmoji}>{stage.emoji}</Text>
                    <Text style={[
                      styles.stageLabel,
                      activeChild.selectedIndex === actualIndex && { color: stage.textColor, fontFamily: THEME.fonts.bodySemiBold },
                    ]}>
                      {stage.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Date of Birth - Only for non-expecting */}
          {!isExpecting && (
            <Animated.View
              entering={FadeInDown.duration(300)}
              style={styles.dobContainer}
            >
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <TouchableOpacity
                style={styles.dobButton}
                onPress={() => updateChild(activeChildIndex, { showDatePicker: true })}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dobButtonText,
                  !activeChild.dateOfBirth && styles.dobButtonPlaceholder
                ]}>
                  {activeChild.dateOfBirth ? formatDate(activeChild.dateOfBirth) : 'Select birthday'}
                </Text>
                {activeChild.dateOfBirth && (
                  <Text style={styles.ageText}>{calculateAge(activeChild.dateOfBirth)}</Text>
                )}
                <Text style={styles.calendarIcon}>📅</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Date Picker Modal for iOS */}
      {Platform.OS === 'ios' && activeChild.showDatePicker && (
        <Modal
          transparent
          animationType="slide"
          visible={activeChild.showDatePicker}
          onRequestClose={() => updateChild(activeChildIndex, { showDatePicker: false })}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => updateChild(activeChildIndex, { showDatePicker: false })}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select Birthday</Text>
                <TouchableOpacity onPress={() => updateChild(activeChildIndex, { showDatePicker: false })}>
                  <Text style={styles.modalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={activeChild.dateOfBirth || new Date()}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 12))}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Date Picker for Android */}
      {Platform.OS === 'android' && activeChild.showDatePicker && (
        <DateTimePicker
          value={activeChild.dateOfBirth || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 12))}
        />
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <ModernButton
          title="Next"
          onPress={handleNext}
          variant="primary"
          style={[styles.button, !isFormValid && styles.buttonDisabled]}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  // Hero Section
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 28,
    marginBottom: 16,
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: THEME.fonts.header,
    textAlign: 'center',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: THEME.fonts.body,
    textAlign: 'center',
  },
  // Tabs
  tabsContainer: {
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  tabsContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  tabActive: {
    borderWidth: 1,
  },
  tabText: {
    fontSize: 14,
    fontFamily: THEME.fonts.body,
    color: '#6B7280',
  },
  addTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    borderStyle: 'dashed',
    gap: 6,
  },
  addTabText: {
    fontSize: 14,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.primary,
  },
  // Content Section
  contentSection: {
    paddingBottom: 20,
  },
  childCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginHorizontal: 4,
  },
  childHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: -8,
  },
  childLabel: {
    fontSize: 18,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.primary,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    gap: 4,
  },
  removeButtonText: {
    fontSize: 12,
    fontFamily: THEME.fonts.body,
    color: '#EF4444',
  },
  // Input
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: THEME.colors.primary,
  },
  input: {
    flex: 1,
    fontSize: 22,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.text.primary,
    paddingVertical: 10,
  },
  checkmark: {
    fontSize: 18,
    color: '#10B981',
    fontWeight: 'bold',
  },
  // Stage Selector
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
  // Date of Birth
  dobContainer: {
    gap: 8,
  },
  dobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dobButtonText: {
    flex: 1,
    fontSize: 16,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.text.primary,
  },
  dobButtonPlaceholder: {
    color: '#9CA3AF',
    fontFamily: THEME.fonts.body,
  },
  ageText: {
    fontSize: 14,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.primary,
    marginRight: 8,
  },
  calendarIcon: {
    fontSize: 20,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.text.primary,
  },
  modalCancel: {
    fontSize: 16,
    fontFamily: THEME.fonts.body,
    color: '#6B7280',
  },
  modalDone: {
    fontSize: 16,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.primary,
  },
  // Footer
  footer: {
    paddingTop: 16,
  },
  button: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
