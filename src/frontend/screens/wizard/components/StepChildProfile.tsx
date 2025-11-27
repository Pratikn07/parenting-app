import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Keyboard, Dimensions, Platform, Modal } from 'react-native';
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
import { useWizardStore } from '../wizardStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STAGES = [
  { label: 'Expecting', range: 'Baby on the way', emoji: '🤰', color: '#FCE7F3', textColor: '#9D174D', months: 0, stage: 'expecting' },
  { label: 'Newborn', range: '0-3 months', emoji: '👶', color: '#FEF3C7', textColor: '#92400E', months: 1, stage: 'newborn' },
  { label: 'Infant', range: '4-12 months', emoji: '🍼', color: '#DBEAFE', textColor: '#1E40AF', months: 8, stage: 'infant' },
  { label: 'Toddler', range: '1-3 years', emoji: '🧸', color: '#FEE2E2', textColor: '#991B1B', months: 24, stage: 'toddler' },
  { label: 'Preschool', range: '3-5 years', emoji: '🎨', color: '#D1FAE5', textColor: '#065F46', months: 48, stage: 'preschool' },
  { label: 'School Age', range: '5+ years', emoji: '🎒', color: '#E0E7FF', textColor: '#3730A3', months: 72, stage: 'school' },
];

export const StepChildProfile = () => {
  const { updateData, setStep, data } = useWizardStore();
  const [name, setName] = useState(data.childName || '');
  const [selectedIndex, setSelectedIndex] = useState(1); // Default to Newborn (index 1)
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const currentStage = STAGES[selectedIndex];
  const isExpecting = currentStage.stage === 'expecting';
  
  // Name is optional for expecting parents
  const isNameValid = isExpecting || name.trim().length > 0;
  const displayName = name.trim() || (isExpecting ? 'Baby' : 'Your child');

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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const handleNext = () => {
    if (!isNameValid) return;
    Keyboard.dismiss();
    
    // Calculate age in months from DOB if provided
    let ageInMonths = currentStage.months;
    if (dateOfBirth && !isExpecting) {
      const today = new Date();
      ageInMonths = (today.getFullYear() - dateOfBirth.getFullYear()) * 12 + 
                    (today.getMonth() - dateOfBirth.getMonth());
    }
    
    updateData({ 
      childName: name.trim() || (isExpecting ? 'Baby' : ''),
      childAge: currentStage.range,
      childAgeInMonths: ageInMonths,
      childStage: currentStage.stage,
      childDateOfBirth: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : undefined,
    });
    setStep('challenge', 'forward');
  };

  // Animated background color
  const animatedContainerStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(currentStage.color, { duration: 400 }),
  }));

  // Dynamic hero text based on stage
  const getHeroText = () => {
    if (isExpecting) {
      if (name.trim()) {
        return `${name.trim()} is on the way!`;
      }
      return "Your baby is on the way!";
    }
    return `${displayName} is a ${currentStage.label}`;
  };

  return (
    <Animated.View 
      entering={FadeInRight} 
      exiting={FadeOutLeft}
      style={styles.container}
    >
      {/* Hero Section with Large Emoji */}
      <Animated.View style={[styles.heroSection, animatedContainerStyle]}>
        <Animated.Text 
          key={selectedIndex}
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

      {/* Content Section - Name + Stage together */}
      <View style={styles.contentSection}>
        {/* Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>
            {isExpecting ? "Baby's name (optional)" : "Child's name"}
          </Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder={isExpecting ? "Not decided yet? Skip!" : "Enter name"}
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            {(isNameValid && name.trim().length > 0) && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </View>
        </View>

        {/* Stage Selector - 2 rows of 3 */}
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>Stage</Text>
          
          {/* Row 1: Expecting, Newborn, Infant */}
          <View style={styles.stageRow}>
            {STAGES.slice(0, 3).map((stage, index) => (
              <TouchableOpacity
                key={stage.label}
                style={[
                  styles.stageButton,
                  selectedIndex === index && styles.stageButtonActive,
                  selectedIndex === index && { backgroundColor: stage.color, borderColor: stage.textColor },
                ]}
                onPress={() => setSelectedIndex(index)}
                activeOpacity={0.7}
              >
                <Text style={styles.stageEmoji}>{stage.emoji}</Text>
                <Text style={[
                  styles.stageLabel,
                  selectedIndex === index && { color: stage.textColor, fontFamily: THEME.fonts.bodySemiBold },
                ]}>
                  {stage.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Row 2: Toddler, Preschool, School Age */}
          <View style={styles.stageRow}>
            {STAGES.slice(3, 6).map((stage, index) => {
              const actualIndex = index + 3;
              return (
                <TouchableOpacity
                  key={stage.label}
                  style={[
                    styles.stageButton,
                    selectedIndex === actualIndex && styles.stageButtonActive,
                    selectedIndex === actualIndex && { backgroundColor: stage.color, borderColor: stage.textColor },
                  ]}
                  onPress={() => setSelectedIndex(actualIndex)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stageEmoji}>{stage.emoji}</Text>
                  <Text style={[
                    styles.stageLabel,
                    selectedIndex === actualIndex && { color: stage.textColor, fontFamily: THEME.fonts.bodySemiBold },
                  ]}>
                    {stage.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Date of Birth Picker - Only show for non-expecting */}
        {!isExpecting && (
          <Animated.View 
            entering={FadeInDown.duration(300)}
            style={styles.dobContainer}
          >
            <Text style={styles.inputLabel}>Date of Birth (optional)</Text>
            <TouchableOpacity 
              style={styles.dobButton}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dobButtonText,
                !dateOfBirth && styles.dobButtonPlaceholder
              ]}>
                {dateOfBirth ? formatDate(dateOfBirth) : 'Select birthday'}
              </Text>
              {dateOfBirth && (
                <Text style={styles.ageText}>{calculateAge(dateOfBirth)}</Text>
              )}
              <Text style={styles.calendarIcon}>📅</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Date Picker Modal for iOS */}
      {Platform.OS === 'ios' && showDatePicker && (
        <Modal
          transparent
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select Birthday</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={dateOfBirth || new Date()}
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
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={dateOfBirth || new Date()}
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
          style={[styles.button, !isNameValid && styles.buttonDisabled]}
          disabled={!isNameValid}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Hero Section
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 28,
    marginBottom: 24,
  },
  heroEmoji: {
    fontSize: 72,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: THEME.fonts.header,
    textAlign: 'center',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: THEME.fonts.body,
    textAlign: 'center',
  },
  // Content Section
  contentSection: {
    flex: 1,
    gap: 28,
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
