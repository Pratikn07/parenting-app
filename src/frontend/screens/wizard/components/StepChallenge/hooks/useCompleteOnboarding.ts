import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/shared/stores/authStore';
import { useWizardStore, WizardData } from '../../../wizardStore';
import { logger } from '@/src/lib/logger';

interface UseCompleteOnboardingResult {
  isSaving: boolean;
  completeWithChallenge: (challenge: string) => Promise<void>;
}

async function persistOnboarding(data: Partial<WizardData>, challenge: string): Promise<boolean> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;

    if (!userId) {
      logger.log('No authenticated user, saving as guest data only');
      return false;
    }

    logger.log('💾 Saving onboarding data to database...');

    const firstChild = data.children?.[0];

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

    if (data.children && data.children.length > 0) {
      const validChildren = data.children.filter((c) => c.name && c.name.trim());

      if (validChildren.length > 0) {
        const childrenPayload = validChildren.map((child) => ({
          user_id: userId,
          name: child.name,
          birth_date: child.dateOfBirth || null,
        }));

        const { error: childError } = await supabase.from('children').insert(childrenPayload);

        if (childError) {
          console.error('Error creating children:', childError);
        } else {
          logger.log(`✅ Created ${validChildren.length} child record(s)`);
        }
      }
    }

    const responses = [
      { question_key: 'parent_name', answer: { value: data.parentName } },
      { question_key: 'intent', answer: { value: data.intent, custom: data.customIntent } },
      {
        question_key: 'children',
        answer: {
          count: data.children?.length || 0,
          children: data.children?.map((c) => ({
            name: c.name,
            stage: c.stage,
            ageInMonths: c.ageInMonths,
          })),
        },
      },
      { question_key: 'main_challenge', answer: { value: challenge } },
    ];

    const { error: responsesError } = await supabase
      .from('onboarding_responses')
      .insert(responses.map((r) => ({ ...r, user_id: userId })));

    if (responsesError) {
      console.error('Error saving onboarding responses:', responsesError);
    }

    logger.log('✅ Onboarding data saved successfully!');
    return true;
  } catch (error) {
    console.error('Failed to save onboarding data:', error);
    return false;
  }
}

export function useCompleteOnboarding(): UseCompleteOnboardingResult {
  const { updateData, data, reset } = useWizardStore();
  const { setGuestData, completeOnboarding } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);

  const completeWithChallenge = useCallback(
    async (challenge: string) => {
      setIsSaving(true);
      try {
        updateData({ mainChallenge: challenge });
        await persistOnboarding(data, challenge);
        setGuestData({ ...data, mainChallenge: challenge });
        completeOnboarding();
        reset();
        router.replace('/chat');
      } catch (error) {
        console.error('Error completing onboarding:', error);
        Alert.alert('Error', 'Failed to save your preferences. Please try again.');
      } finally {
        setIsSaving(false);
      }
    },
    [data, updateData, setGuestData, completeOnboarding, reset]
  );

  return { isSaving, completeWithChallenge };
}
