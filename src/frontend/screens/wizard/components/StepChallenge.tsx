import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { ModernButton } from '@/src/frontend/components/common/ModernButton';
import { THEME } from '@/src/lib/constants';
import { useWizardStore, WizardData } from '../wizardStore';

const getChallenges = (intent: WizardData['intent'], ageInMonths: number) => {
  // Dynamic challenge generation logic
  const isBaby = ageInMonths < 12;
  const isToddler = ageInMonths >= 12 && ageInMonths < 36;
  
  if (intent === 'sleep') {
    if (isBaby) return ['Frequent waking', 'Short naps', 'Bedtime resistance', 'Transitioning to crib', 'Sleep regression'];
    if (isToddler) return ['Bedtime battles', 'Early waking', 'Nightmares', 'Moving to big bed', 'Skipping naps'];
    return ['Bedtime routine', 'Screen time issues', 'Night waking', 'School schedule'];
  }
  
  if (intent === 'feeding') {
    if (isBaby) return ['Breastfeeding', 'Formula / Bottle', 'Starting solids', 'Allergies', 'Reflux/Colic'];
    if (isToddler) return ['Picky eating', 'Refusing veggies', 'Mealtime tantrums', 'Weaning', 'Snack obsession'];
    return ['Healthy lunches', 'Sugar management', 'Body positivity', 'Hydration'];
  }
  
  if (intent === 'behavior') {
    if (isToddler) return ['Tantrums', 'Biting/Hitting', 'Separation anxiety', 'Sharing', 'Potty training'];
    return ['Listening/Defiance', 'Sibling rivalry', 'Emotional regulation', 'Confidence', 'Social skills'];
  }
  
  // Fallback generic options
  return ['Routine & Schedule', 'Parental burnout', 'Bonding', 'Milestones concerns', 'Just exploring'];
};

export const StepChallenge = () => {
  const { updateData, setStep, data } = useWizardStore();
  const [selected, setSelected] = useState<string | null>(null);
  
  const challenges = getChallenges(data.intent, data.childAgeInMonths || 0);

  const handleNext = () => {
    if (!selected) return;
    updateData({ mainChallenge: selected });
    setStep('reveal', 'forward');
  };

  return (
    <Animated.View 
      entering={FadeInRight} 
      exiting={FadeOutLeft}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>What's the biggest hurdle?</Text>
        <Text style={styles.subtitle}>
          Let's zero in on what matters most for {data.childName || 'your little one'}.
        </Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.optionsContainer}
      >
        {challenges.map((challenge) => (
          <TouchableOpacity
            key={challenge}
            style={[
              styles.option,
              selected === challenge && styles.optionSelected
            ]}
            onPress={() => setSelected(challenge)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.optionText,
              selected === challenge && styles.optionTextSelected
            ]}>{challenge}</Text>
            
            {selected === challenge && (
              <View style={styles.checkCircle}>
                <View style={styles.checkInner} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <ModernButton
          title="Create My Plan"
          onPress={handleNext}
          style={[styles.button, !selected && styles.buttonDisabled]}
          variant="primary"
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
  subtitle: {
    fontSize: 18,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.secondary,
    lineHeight: 24,
  },
  optionsContainer: {
    paddingBottom: 40,
  },
  option: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionSelected: {
    borderColor: THEME.colors.primary,
    backgroundColor: '#FFF5F5', // Very light red/primary tint
  },
  optionText: {
    fontSize: 18,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.primary,
  },
  optionTextSelected: {
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.primary,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: THEME.colors.primary,
  },
  footer: {
    marginBottom: 20,
  },
  button: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

