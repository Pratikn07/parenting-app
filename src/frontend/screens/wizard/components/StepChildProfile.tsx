import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Slider from '@react-native-community/slider';
import { THEME } from '@/src/lib/constants';
import { ModernButton } from '@/src/frontend/components/common/ModernButton';
import { useWizardStore } from '../wizardStore';

const STAGES = [
  { label: 'Newborn', range: '0-3 months', emoji: '👶', color: '#FEF3C7' }, // amber-100
  { label: 'Infant', range: '4-12 months', emoji: '🍼', color: '#DBEAFE' }, // blue-100
  { label: 'Toddler', range: '1-3 years', emoji: '🧸', color: '#FEE2E2' }, // red-100
  { label: 'Preschool', range: '3-5 years', emoji: '🎨', color: '#D1FAE5' }, // green-100
  { label: 'School Age', range: '5+ years', emoji: '🎒', color: '#E0E7FF' }, // indigo-100
];

export const StepChildProfile = () => {
  const { updateData, setStep, data } = useWizardStore();
  const [name, setName] = useState(data.childName || '');
  const [sliderValue, setSliderValue] = useState(0);

  const currentStage = STAGES[Math.floor(sliderValue)];

  const handleNext = () => {
    updateData({ 
      childName: name.trim(),
      childAge: currentStage.range,
      // Store approximate months for logic: 1, 8, 24, 48, 72
      childAgeInMonths: [1, 8, 24, 48, 72][Math.floor(sliderValue)]
    });
    setStep('challenge', 'forward');
  };

  const animatedBgStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(currentStage.color, { duration: 500 }),
    };
  });

  return (
    <Animated.View 
      entering={FadeInRight} 
      exiting={FadeOutLeft}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Who are we helping?</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Name (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Child's Name"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.sliderContainer}>
        <Text style={styles.label}>Age</Text>
        
        <Animated.View style={[styles.stageCard, animatedBgStyle]}>
          <Text style={styles.emoji}>{currentStage.emoji}</Text>
          <View>
            <Text style={styles.stageTitle}>{currentStage.label}</Text>
            <Text style={styles.stageRange}>{currentStage.range}</Text>
          </View>
        </Animated.View>

        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={4.99}
          value={sliderValue}
          onValueChange={setSliderValue}
          minimumTrackTintColor={THEME.colors.primary}
          maximumTrackTintColor="#E5E7EB"
          thumbTintColor={THEME.colors.primary}
        />
        
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelText}>Newborn</Text>
          <Text style={styles.sliderLabelText}>Big Kid</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <ModernButton
          title="Next"
          onPress={handleNext}
          variant="primary"
          style={styles.button}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: THEME.fonts.header,
    color: THEME.colors.text.primary,
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.text.secondary,
    marginBottom: 12,
  },
  input: {
    fontSize: 20,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.primary,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
  },
  sliderContainer: {
    flex: 1,
  },
  stageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
    marginBottom: 32,
  },
  emoji: {
    fontSize: 48,
    marginRight: 20,
  },
  stageTitle: {
    fontSize: 24,
    fontFamily: THEME.fonts.header,
    color: THEME.colors.text.primary,
  },
  stageRange: {
    fontSize: 16,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.secondary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  sliderLabelText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  footer: {
    marginBottom: 20,
  },
  button: {
    width: '100%',
  },
});

