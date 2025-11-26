import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { Moon, Baby, Brain, HeartPulse, Activity, MoreHorizontal } from 'lucide-react-native';
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

  const handleSelect = (intent: WizardData['intent']) => {
    updateData({ intent });
    setStep('childProfile', 'forward');
  };

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
});

