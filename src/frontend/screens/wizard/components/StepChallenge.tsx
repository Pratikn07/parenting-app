import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { router } from 'expo-router';
import { ModernButton } from '@/src/frontend/components/common/ModernButton';
import { THEME } from '@/src/lib/constants';
import { useWizardStore, WizardData } from '../wizardStore';
import { useAuthStore } from '@/src/shared/stores/authStore';
import { supabase } from '@/src/lib/supabase';

// Intent display names and emojis
const INTENT_INFO: Record<string, { label: string; emoji: string }> = {
  sleep: { label: 'Sleep', emoji: '😴' },
  feeding: { label: 'Feeding & Nutrition', emoji: '🍼' },
  behavior: { label: 'Behavior', emoji: '🧠' },
  development: { label: 'Development', emoji: '📈' },
  health: { label: 'Health & Wellness', emoji: '💚' },
  other: { label: 'Parenting', emoji: '👨‍👩‍👧' },
};

const getChallenges = (intent: WizardData['intent'], ageInMonths: number, stage?: string): { challenge: string; emoji: string }[] => {
  // For expecting parents - pregnancy-specific challenges
  if (stage === 'expecting') {
    if (intent === 'sleep') return [
      { challenge: 'Sleep during pregnancy', emoji: '🛏️' },
      { challenge: 'Preparing baby sleep space', emoji: '🌙' },
      { challenge: 'Sleep schedule planning', emoji: '📅' },
      { challenge: 'Managing fatigue', emoji: '😴' },
    ];
    if (intent === 'feeding') return [
      { challenge: 'Breastfeeding prep', emoji: '🤱' },
      { challenge: 'Formula research', emoji: '🍼' },
      { challenge: 'Nutrition during pregnancy', emoji: '🥗' },
      { challenge: 'Building a feeding plan', emoji: '📋' },
    ];
    if (intent === 'health') return [
      { challenge: 'Prenatal wellness', emoji: '🧘' },
      { challenge: 'Birth plan anxiety', emoji: '📝' },
      { challenge: 'Finding the right doctor', emoji: '👩‍⚕️' },
      { challenge: 'Managing pregnancy symptoms', emoji: '💊' },
    ];
    // Default expecting
    return [
      { challenge: 'Preparing for arrival', emoji: '🏠' },
      { challenge: 'Nursery setup', emoji: '🛏️' },
      { challenge: 'Work-life balance', emoji: '⚖️' },
      { challenge: 'Building confidence', emoji: '💪' },
      { challenge: 'Just exploring', emoji: '🔍' },
    ];
  }

  // Age-based logic
  const isNewborn = stage === 'newborn' || ageInMonths < 4;
  const isInfant = stage === 'infant' || (ageInMonths >= 4 && ageInMonths < 12);
  const isToddler = stage === 'toddler' || (ageInMonths >= 12 && ageInMonths < 36);
  const isPreschool = stage === 'preschool' || (ageInMonths >= 36 && ageInMonths < 60);
  const isSchoolAge = stage === 'school' || ageInMonths >= 60;

  // SLEEP challenges by age
  if (intent === 'sleep') {
    if (isNewborn) return [
      { challenge: 'Day/night confusion', emoji: '🌓' },
      { challenge: 'Frequent night waking', emoji: '🌙' },
      { challenge: 'Short naps', emoji: '⏱️' },
      { challenge: 'Safe sleep setup', emoji: '🛏️' },
      { challenge: 'Sleep deprivation (mine!)', emoji: '😵' },
    ];
    if (isInfant) return [
      { challenge: 'Sleep regression', emoji: '📉' },
      { challenge: 'Transitioning to crib', emoji: '🛏️' },
      { challenge: 'Dropping night feeds', emoji: '🍼' },
      { challenge: 'Nap schedule', emoji: '📅' },
      { challenge: 'Self-soothing', emoji: '🧸' },
    ];
    if (isToddler) return [
      { challenge: 'Bedtime battles', emoji: '⚔️' },
      { challenge: 'Early morning waking', emoji: '🌅' },
      { challenge: 'Nightmares/night terrors', emoji: '👻' },
      { challenge: 'Moving to big bed', emoji: '🛏️' },
      { challenge: 'Dropping the nap', emoji: '😴' },
    ];
    // Preschool & School age
    return [
      { challenge: 'Bedtime routine', emoji: '📖' },
      { challenge: 'Screen time affecting sleep', emoji: '📱' },
      { challenge: 'Night waking', emoji: '🌙' },
      { challenge: 'School schedule adjustment', emoji: '🏫' },
      { challenge: 'Staying in bed', emoji: '🛏️' },
    ];
  }

  // FEEDING challenges by age
  if (intent === 'feeding') {
    if (isNewborn) return [
      { challenge: 'Breastfeeding latch', emoji: '🤱' },
      { challenge: 'Bottle refusal', emoji: '🍼' },
      { challenge: 'Feeding frequency', emoji: '⏰' },
      { challenge: 'Reflux/colic', emoji: '😢' },
      { challenge: 'Pumping & supply', emoji: '🥛' },
    ];
    if (isInfant) return [
      { challenge: 'Starting solids', emoji: '🥄' },
      { challenge: 'Food allergies', emoji: '⚠️' },
      { challenge: 'Weaning', emoji: '🍼' },
      { challenge: 'Texture progression', emoji: '🥕' },
      { challenge: 'Self-feeding mess', emoji: '🙈' },
    ];
    if (isToddler) return [
      { challenge: 'Picky eating', emoji: '🙅' },
      { challenge: 'Mealtime tantrums', emoji: '😤' },
      { challenge: 'Snack obsession', emoji: '🍪' },
      { challenge: 'Refusing vegetables', emoji: '🥦' },
      { challenge: 'Eating independence', emoji: '🍴' },
    ];
    // Preschool & School age
    return [
      { challenge: 'Healthy lunch ideas', emoji: '🥪' },
      { challenge: 'Sugar management', emoji: '🍭' },
      { challenge: 'Eating at school', emoji: '🏫' },
      { challenge: 'Body image talks', emoji: '💪' },
      { challenge: 'Trying new foods', emoji: '🍽️' },
    ];
  }

  // BEHAVIOR challenges by age
  if (intent === 'behavior') {
    if (isNewborn || isInfant) return [
      { challenge: 'Crying & fussiness', emoji: '😢' },
      { challenge: 'Separation anxiety', emoji: '🥺' },
      { challenge: 'Stranger danger phase', emoji: '👀' },
      { challenge: 'Overstimulation', emoji: '😵' },
      { challenge: 'Understanding cues', emoji: '🤔' },
    ];
    if (isToddler) return [
      { challenge: 'Tantrums', emoji: '🌪️' },
      { challenge: 'Biting/hitting', emoji: '😬' },
      { challenge: 'Sharing struggles', emoji: '🧸' },
      { challenge: 'Potty training', emoji: '🚽' },
      { challenge: '"No!" phase', emoji: '🙅' },
    ];
    if (isPreschool) return [
      { challenge: 'Emotional regulation', emoji: '🎭' },
      { challenge: 'Listening skills', emoji: '👂' },
      { challenge: 'Making friends', emoji: '👫' },
      { challenge: 'Following rules', emoji: '📏' },
      { challenge: 'Whining', emoji: '😩' },
    ];
    // School age
    return [
      { challenge: 'Defiance', emoji: '😤' },
      { challenge: 'Sibling rivalry', emoji: '👊' },
      { challenge: 'Confidence building', emoji: '💪' },
      { challenge: 'Homework battles', emoji: '📚' },
      { challenge: 'Screen time limits', emoji: '📱' },
    ];
  }

  // DEVELOPMENT challenges by age
  if (intent === 'development') {
    if (isNewborn || isInfant) return [
      { challenge: 'Milestone tracking', emoji: '📊' },
      { challenge: 'Tummy time', emoji: '👶' },
      { challenge: 'Motor skill development', emoji: '🤸' },
      { challenge: 'Language stimulation', emoji: '🗣️' },
      { challenge: 'Play & engagement', emoji: '🎯' },
    ];
    if (isToddler) return [
      { challenge: 'Speech delay concerns', emoji: '🗣️' },
      { challenge: 'Walking/running', emoji: '🏃' },
      { challenge: 'Learning through play', emoji: '🧩' },
      { challenge: 'Independence skills', emoji: '👍' },
      { challenge: 'Social development', emoji: '👫' },
    ];
    // Preschool & School age
    return [
      { challenge: 'School readiness', emoji: '🏫' },
      { challenge: 'Reading & writing', emoji: '📖' },
      { challenge: 'Focus & attention', emoji: '🎯' },
      { challenge: 'Creative expression', emoji: '🎨' },
      { challenge: 'Problem solving', emoji: '🧠' },
    ];
  }

  // HEALTH challenges by age
  if (intent === 'health') {
    if (isNewborn || isInfant) return [
      { challenge: 'Vaccination schedule', emoji: '💉' },
      { challenge: 'Common illnesses', emoji: '🤒' },
      { challenge: 'Skin care (eczema, rashes)', emoji: '🧴' },
      { challenge: 'Growth concerns', emoji: '📈' },
      { challenge: 'Finding a pediatrician', emoji: '👩‍⚕️' },
    ];
    if (isToddler) return [
      { challenge: 'Frequent colds', emoji: '🤧' },
      { challenge: 'Teething pain', emoji: '🦷' },
      { challenge: 'Active play safety', emoji: '⚠️' },
      { challenge: 'Allergies', emoji: '🌸' },
      { challenge: 'Dental care', emoji: '🪥' },
    ];
    // Preschool & School age
    return [
      { challenge: 'Staying healthy at school', emoji: '🏫' },
      { challenge: 'Mental wellness', emoji: '🧘' },
      { challenge: 'Sports & physical activity', emoji: '⚽' },
      { challenge: 'Vision/hearing checks', emoji: '👁️' },
      { challenge: 'Building immunity', emoji: '💪' },
    ];
  }

  // OTHER / General fallback
  return [
    { challenge: 'Daily routine', emoji: '📅' },
    { challenge: 'Parental burnout', emoji: '😮‍💨' },
    { challenge: 'Work-life balance', emoji: '⚖️' },
    { challenge: 'Partner teamwork', emoji: '🤝' },
    { challenge: 'Just exploring', emoji: '🔍' },
  ];
};

// Get contextual title based on intent
const getTitle = (intent: WizardData['intent'], stage?: string) => {
  if (stage === 'expecting') {
    return "What's on your mind?";
  }

  const intentInfo = INTENT_INFO[intent || 'other'];
  return `${intentInfo.emoji} ${intentInfo.label} Challenge`;
};

// Helper to get display name for children
const getChildrenDisplayName = (children?: any[]) => {
  if (!children || children.length === 0) return 'your little one';
  if (children.length === 1) return children[0].name || 'your little one';
  const names = children.filter(c => c.name).map(c => c.name);
  if (names.length === 0) return 'your little ones';
  if (names.length === 1) return names[0];
  return `${names[0]} and ${names[1]}`;
};

// Get contextual subtitle
const getSubtitle = (intent: WizardData['intent'], children?: any[], stage?: string) => {
  const name = getChildrenDisplayName(children);

  if (stage === 'expecting') {
    return `Let's prepare for ${name}'s arrival together.`;
  }

  switch (intent) {
    case 'sleep':
      return `Let's tackle ${name}'s sleep together.`;
    case 'feeding':
      return `Let's make mealtimes easier for ${name}.`;
    case 'behavior':
      return `Let's understand ${name}'s behavior better.`;
    case 'development':
      return `Let's support ${name}'s growth journey.`;
    case 'health':
      return `Let's keep ${name} healthy & happy.`;
    default:
      return `What matters most for ${name} right now?`;
  }
};

export const StepChallenge = () => {
  const { updateData, data, reset } = useWizardStore();
  const { setGuestData, completeOnboarding } = useAuthStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Use first child for determining challenges and stage
  const firstChild = data.children?.[0];
  const intent = data.intent || 'other'; // Default to 'other' if somehow undefined
  const challenges = getChallenges(intent, firstChild?.ageInMonths || 0, firstChild?.stage);
  const title = getTitle(intent, firstChild?.stage);
  const subtitle = getSubtitle(intent, data.children, firstChild?.stage);

  const saveOnboardingData = async (challenge: string) => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      if (!userId) {
        console.log('No authenticated user, saving as guest data only');
        return false;
      }

      console.log('💾 Saving onboarding data to database...');

      // 1. Update user profile with onboarding data
      const { error: userError } = await supabase
        .from('profiles')
        .update({
          name: data.parentName,
          parenting_stage: firstChild?.stage || 'newborn',
          primary_focus: data.intent,
          primary_challenge: challenge,
          has_completed_onboarding: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (userError) {
        console.error('Error updating user:', userError);
        throw userError;
      }

      // 2. Create child records (bulk insert, skip expecting parents without names)
      if (data.children && data.children.length > 0) {
        const validChildren = data.children.filter(c => c.name && c.name.trim());

        if (validChildren.length > 0) {
          const childrenPayload = validChildren.map(child => ({
            user_id: userId,
            name: child.name,
            birth_date: child.dateOfBirth || null,
          }));

          const { error: childError } = await supabase
            .from('children')
            .insert(childrenPayload);

          if (childError) {
            console.error('Error creating children:', childError);
          } else {
            console.log(`✅ Created ${validChildren.length} child record(s)`);
          }
        }
      }

      // 3. Save onboarding responses for analytics
      const responses = [
        { question_key: 'parent_name', answer: { value: data.parentName } },
        { question_key: 'intent', answer: { value: data.intent, custom: data.customIntent } },
        {
          question_key: 'children',
          answer: {
            count: data.children?.length || 0,
            children: data.children?.map(c => ({
              name: c.name,
              stage: c.stage,
              ageInMonths: c.ageInMonths
            }))
          }
        },
        { question_key: 'main_challenge', answer: { value: challenge } },
      ];

      const { error: responsesError } = await supabase
        .from('onboarding_responses')
        .insert(responses.map(r => ({ ...r, user_id: userId })));

      if (responsesError) {
        console.error('Error saving onboarding responses:', responsesError);
      }

      console.log('✅ Onboarding data saved successfully!');
      return true;
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      return false;
    }
  };

  const handleNext = async () => {
    if (!selected) return;

    setIsSaving(true);

    try {
      // Update local state
      updateData({ mainChallenge: selected });

      // Save to database
      await saveOnboardingData(selected);

      // Save to local state for immediate use in chat
      setGuestData({ ...data, mainChallenge: selected });
      completeOnboarding();

      // Reset wizard state
      reset();

      // Navigate directly to chat
      router.replace('/chat');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to save your preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Animated.View
      entering={FadeInRight}
      exiting={FadeOutLeft}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.optionsContainer}
      >
        {challenges.map((item) => (
          <TouchableOpacity
            key={item.challenge}
            style={[
              styles.option,
              selected === item.challenge && styles.optionSelected
            ]}
            onPress={() => setSelected(item.challenge)}
            activeOpacity={0.7}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionEmoji}>{item.emoji}</Text>
              <Text style={[
                styles.optionText,
                selected === item.challenge && styles.optionTextSelected
              ]}>{item.challenge}</Text>
            </View>

            {selected === item.challenge && (
              <View style={styles.checkCircle}>
                <View style={styles.checkInner} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <ModernButton
          title={isSaving ? "Saving..." : "Start Chatting"}
          onPress={handleNext}
          style={[styles.button, (!selected || isSaving) && styles.buttonDisabled]}
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
    paddingVertical: 16,
    paddingHorizontal: 18,
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
    backgroundColor: '#FFF5F5',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 14,
  },
  optionText: {
    fontSize: 16,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.primary,
    flex: 1,
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

