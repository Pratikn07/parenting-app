import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';
import Animated, { 
  useAnimatedStyle, 
  withTiming, 
  withSpring 
} from 'react-native-reanimated';

interface WizardLayoutProps {
  children: React.ReactNode;
  onBack?: () => void;
  progress: number; // 0 to 100
  showBack?: boolean;
}

export const WizardLayout: React.FC<WizardLayoutProps> = ({ 
  children, 
  onBack, 
  progress, 
  showBack = true 
}) => {
  
  const progressStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(`${progress}%`, { damping: 20, stiffness: 100 }),
    };
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {showBack && (
              <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <ChevronLeft size={24} color={THEME.colors.text.primary} />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View style={[styles.progressBarFill, progressStyle]} />
            </View>
          </View>
          
          <View style={styles.headerRight} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {children}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFCF8', // Warm off-white background
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    height: 60,
  },
  headerLeft: {
    width: 40,
  },
  headerRight: {
    width: 40,
  },
  backButton: {
    padding: 4,
  },
  progressContainer: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarBackground: {
    height: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.primary,
    borderRadius: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
});

