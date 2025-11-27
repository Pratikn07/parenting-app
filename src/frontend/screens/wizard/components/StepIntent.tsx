import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeInRight, FadeOutLeft, FadeIn } from 'react-native-reanimated';
import { Moon, Baby, Brain, HeartPulse, Activity, MoreHorizontal, ArrowRight, X } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';
import { useWizardStore, WizardData } from '../wizardStore';

const intents: { id: WizardData['intent'], label: string, icon: React.ReactNode }[] = [
  { id: 'sleep', label: 'Sleep', icon: <Moon size={32} color="#818CF8" /> },
  { id: 'feeding', label: 'Feeding', icon: <Baby size={32} color="#F472B6" /> },
  { id: 'behavior', label: 'Behavior', icon: <Activity size={32} color="#FBBF24" /> },
  { id: 'development', label: 'Development', icon: <Brain size={32} color="#34D399" /> },
  { id: 'health', label: 'Health', icon: <HeartPulse size={32} color="#F87171" /> },
  { id: 'other', label: 'Something else', icon: <MoreHorizontal size={32} color="#9CA3AF" /> },
];

export const StepIntent = () => {
  const { updateData, setStep, data } = useWizardStore();
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherText, setOtherText] = useState('');

  const handleSelect = (intent: WizardData['intent']) => {
    if (intent === 'other') {
      setShowOtherInput(true);
      return;
    }
    updateData({ intent, customIntent: undefined });
    setStep('childProfile', 'forward');
  };

  const handleOtherSubmit = () => {
    if (otherText.trim()) {
      updateData({ intent: 'other', customIntent: otherText.trim() });
      setStep('childProfile', 'forward');
    }
  };

  const handleCancelOther = () => {
    setShowOtherInput(false);
    setOtherText('');
  };

  // Show the "other" input view
  if (showOtherInput) {
    return (
      <Animated.View 
        entering={FadeIn} 
        style={styles.container}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.otherContainer}
        >
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelOther}>
            <X size={24} color={THEME.colors.text.secondary} />
          </TouchableOpacity>

          <View style={styles.otherHeader}>
            <Text style={styles.title}>Tell us more</Text>
            <Text style={styles.subtitle}>What's on your mind, {data.parentName}?</Text>
          </View>

          <TextInput
            style={styles.otherInput}
            placeholder="e.g., Potty training, sibling rivalry, screen time..."
            placeholderTextColor={THEME.colors.text.muted}
            value={otherText}
            onChangeText={setOtherText}
            multiline
            autoFocus
            textAlignVertical="top"
          />

          <TouchableOpacity 
            style={[
              styles.submitButton, 
              !otherText.trim() && styles.submitButtonDisabled
            ]}
            onPress={handleOtherSubmit}
            disabled={!otherText.trim()}
          >
            <Text style={styles.submitButtonText}>Continue</Text>
            <ArrowRight size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Animated.View>
    );
  }

  return (
    <Animated.View 
      entering={FadeInRight} 
      exiting={FadeOutLeft}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Nice to meet you, {data.parentName}.</Text>
        <Text style={styles.subtitle}>What's on your mind today?</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.grid}
      >
        {intents.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => handleSelect(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              {item.icon}
            </View>
            <Text style={styles.cardLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  card: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    marginBottom: 16,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 16,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.text.primary,
  },
  // "Something else" input styles
  otherContainer: {
    flex: 1,
    paddingTop: 16,
  },
  cancelButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginLeft: -8,
    marginBottom: 16,
  },
  otherHeader: {
    marginBottom: 24,
  },
  otherInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    fontSize: 18,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.primary,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginTop: 24,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    fontSize: 18,
    fontFamily: THEME.fonts.bodySemiBold,
    color: '#FFFFFF',
  },
});

