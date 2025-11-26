import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { ModernButton } from '@/src/frontend/components/common/ModernButton';
import { THEME } from '@/src/lib/constants';
import { useWizardStore, WizardData } from '../wizardStore';
import { useAuthStore } from '@/src/shared/stores/authStore';
import { Shield, Compass, Heart, Star, Sparkles } from 'lucide-react-native';

const LOADING_MESSAGES = [
  "Analyzing your responses...",
  "Connecting with parenting experts...",
  "Finding strategies for your family...",
  "Creating your personalized plan..."
];

const getPersona = (intent: WizardData['intent']) => {
  switch(intent) {
    case 'sleep': return { title: 'The Guardian', icon: <Shield size={48} color="#818CF8" />, color: '#818CF8' };
    case 'development': return { title: 'The Guide', icon: <Compass size={48} color="#34D399" />, color: '#34D399' };
    case 'feeding': return { title: 'The Nurturer', icon: <Heart size={48} color="#F472B6" />, color: '#F472B6' };
    case 'behavior': return { title: 'The Mentor', icon: <Star size={48} color="#FBBF24" />, color: '#FBBF24' };
    default: return { title: 'The Natural', icon: <Sparkles size={48} color="#E07A5F" />, color: '#E07A5F' };
  }
};

export const StepReveal = () => {
  const { data } = useWizardStore();
  const { setGuestData } = useAuthStore();
  const [loadingStep, setLoadingStep] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const persona = getPersona(data.intent);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev >= LOADING_MESSAGES.length - 1) {
          clearInterval(interval);
          setIsReady(true);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);
    
    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    setGuestData(data);
    router.replace('/chat');
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.Text 
          key={loadingStep} 
          entering={FadeIn.duration(500)} 
          exiting={FadeOut.duration(300)}
          style={styles.loadingText}
        >
          {LOADING_MESSAGES[loadingStep]}
        </Animated.Text>
        <View style={styles.dotsContainer}>
          {LOADING_MESSAGES.map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.dot, 
                i === loadingStep && styles.activeDot,
                i < loadingStep && styles.completedDot
              ]} 
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <Animated.View 
      entering={ZoomIn.duration(600)} 
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.preheader}>Your Parenting Profile</Text>
        
        <View style={styles.card}>
          <View style={[styles.iconCircle, { borderColor: persona.color }]}>
            {persona.icon}
          </View>
          
          <Text style={styles.personaTitle}>{persona.title}</Text>
          <Text style={styles.personaSubtitle}>
            You lead with <Text style={{color: persona.color, fontWeight: '700'}}>Love & Logic</Text>
          </Text>

          <View style={styles.divider} />

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Focus</Text>
            <Text style={styles.statValue}>{data.intent?.toUpperCase()}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Challenge</Text>
            <Text style={styles.statValue} numberOfLines={1}>{data.mainChallenge}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Plan</Text>
            <Text style={[styles.statValue, { color: THEME.colors.primary }]}>3-Step Guide Ready</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <ModernButton
          title="Unlock My Plan"
          onPress={handleStart}
          variant="primary"
          style={styles.button}
        />
        <Text style={styles.disclaimer}>
          No account needed to start.
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 20,
    fontFamily: THEME.fonts.header,
    color: THEME.colors.text.primary,
    textAlign: 'center',
    marginBottom: 32,
    height: 60, // Fixed height to prevent jump
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  activeDot: {
    backgroundColor: THEME.colors.primary,
    transform: [{ scale: 1.2 }],
  },
  completedDot: {
    backgroundColor: THEME.colors.primary,
    opacity: 0.5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preheader: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#9CA3AF',
    marginBottom: 16,
    fontWeight: '600',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#FAFAFA',
  },
  personaTitle: {
    fontSize: 32,
    fontFamily: THEME.fonts.header,
    color: THEME.colors.text.primary,
    marginBottom: 8,
  },
  personaSubtitle: {
    fontSize: 16,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.secondary,
    marginBottom: 24,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: THEME.fonts.body,
  },
  statValue: {
    fontSize: 16,
    color: THEME.colors.text.primary,
    fontFamily: THEME.fonts.bodySemiBold,
    maxWidth: '60%',
    textAlign: 'right',
  },
  footer: {
    alignItems: 'center',
  },
  button: {
    width: '100%',
    marginBottom: 16,
    height: 56,
  },
  disclaimer: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});

