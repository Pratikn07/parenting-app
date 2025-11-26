import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Keyboard } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { ModernButton } from '@/src/frontend/components/common/ModernButton';
import { THEME } from '@/src/lib/constants';
import { useWizardStore } from '../wizardStore';

export const StepParentName = () => {
  const { updateData, setStep, data } = useWizardStore();
  const [name, setName] = useState(data.parentName || '');

  const handleNext = () => {
    if (!name.trim()) return;
    Keyboard.dismiss();
    updateData({ parentName: name.trim() });
    setStep('intent', 'forward');
  };

  return (
    <Animated.View 
      entering={FadeInRight} 
      exiting={FadeOutLeft}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Hi, I'm Bloom.</Text>
        <Text style={styles.subtitle}>First things first, what should we call you?</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Your Name"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            autoFocus
            onSubmitEditing={handleNext}
            returnKeyType="next"
          />
        </View>
      </View>

      <View style={styles.footer}>
        <ModernButton
          title="Next"
          onPress={handleNext}
          style={[styles.button, !name.trim() && styles.buttonDisabled]}
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 100, // Push content up slightly
  },
  title: {
    fontSize: 32,
    fontFamily: THEME.fonts.header,
    color: THEME.colors.text.primary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.secondary,
    marginBottom: 40,
    lineHeight: 26,
  },
  inputContainer: {
    borderBottomWidth: 2,
    borderBottomColor: THEME.colors.primary,
    paddingBottom: 8,
  },
  input: {
    fontSize: 28,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.text.primary,
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

