import React from 'react';
import { Keyboard, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { ModernButton } from '@/src/frontend/components/common/ModernButton';
import { useWizardStore } from '../../wizardStore';
import { ChildDetailsForm } from './components/ChildDetailsForm';
import { ChildTabs } from './components/ChildTabs';
import { HeroBanner } from './components/HeroBanner';
import { useChildForm } from './hooks/useChildForm';
import { STAGES, toChildData } from './stages';

export const StepChildProfile = () => {
  const { updateData, setStep, data } = useWizardStore();
  const form = useChildForm(data.children);
  const currentStage = STAGES[form.activeChild.selectedIndex];

  const handleNext = () => {
    if (!form.isFormValid) return;
    Keyboard.dismiss();
    updateData({ children: form.children.map(toChildData) });
    setStep('challenge', 'forward');
  };

  return (
    <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.container}>
      <HeroBanner
        stage={currentStage}
        childName={form.activeChild.name}
        switchKey={form.activeChildIndex}
      />

      <ChildTabs
        children={form.children}
        activeIndex={form.activeChildIndex}
        activeStage={currentStage}
        canAddChild={form.canAddChild}
        onSelect={form.setActiveChildIndex}
        onAddChild={form.addChild}
      />

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentSection}
      >
        <ChildDetailsForm
          child={form.activeChild}
          stage={currentStage}
          totalChildren={form.children.length}
          childIndex={form.activeChildIndex}
          onUpdate={form.updateActiveChild}
          onRemove={() => form.removeChild(form.activeChildIndex)}
          onDateChange={form.handleDateChange}
        />
      </ScrollView>

      <View style={styles.footer}>
        <ModernButton
          title="Next"
          onPress={handleNext}
          variant="primary"
          style={[styles.button, !form.isFormValid && styles.buttonDisabled]}
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
  contentSection: {
    paddingBottom: 20,
  },
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
