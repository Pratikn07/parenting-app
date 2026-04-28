import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { ModernButton } from '@/src/frontend/components/common/ModernButton';
import { useWizardStore } from '../../wizardStore';
import { ChallengeHeader } from './components/ChallengeHeader';
import { ChallengeOptionsList } from './components/ChallengeOptionsList';
import { getChallenges, getSubtitle, getTitle } from './challengeOptions';
import { useCompleteOnboarding } from './hooks/useCompleteOnboarding';

export const StepChallenge = () => {
  const { data } = useWizardStore();
  const [selected, setSelected] = useState<string | null>(null);
  const { isSaving, completeWithChallenge } = useCompleteOnboarding();

  const firstChild = data.children?.[0];
  const intent = data.intent || 'other';
  const stage = firstChild?.stage;

  const challenges = getChallenges(intent, firstChild?.ageInMonths || 0, stage);
  const title = getTitle(intent, stage);
  const subtitle = getSubtitle(intent, data.children, stage);

  const handleNext = async () => {
    if (!selected) return;
    await completeWithChallenge(selected);
  };

  const isDisabled = !selected || isSaving;

  return (
    <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.container}>
      <ChallengeHeader title={title} subtitle={subtitle} />

      <ChallengeOptionsList options={challenges} selected={selected} onSelect={setSelected} />

      <View style={styles.footer}>
        <ModernButton
          title={isSaving ? 'Saving...' : 'Start Chatting'}
          onPress={handleNext}
          style={[styles.button, isDisabled && styles.buttonDisabled]}
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
