import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { WizardLayout } from './components/WizardLayout';
import { StepParentName } from './components/StepParentName';
import { StepIntent } from './components/StepIntent';
import { StepChildProfile } from './components/StepChildProfile';
import { StepChallenge } from './components/StepChallenge';
import { StepReveal } from './components/StepReveal';
import { useWizardStore, WizardStep } from './wizardStore';

export default function WizardScreen() {
  const { currentStep, setStep } = useWizardStore();

  const steps: WizardStep[] = ['parentName', 'intent', 'childProfile', 'challenge', 'reveal'];
  const progress = ((steps.indexOf(currentStep) + 1) / steps.length) * 100;

  const handleBack = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1], 'back');
    } else {
      router.back();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'parentName': return <StepParentName />;
      case 'intent': return <StepIntent />;
      case 'childProfile': return <StepChildProfile />;
      case 'challenge': return <StepChallenge />;
      case 'reveal': return <StepReveal />;
      default: return <StepParentName />;
    }
  };

  return (
    <WizardLayout 
      progress={progress} 
      onBack={handleBack}
      showBack={currentStep !== 'reveal'}
    >
      {renderStep()}
    </WizardLayout>
  );
}

