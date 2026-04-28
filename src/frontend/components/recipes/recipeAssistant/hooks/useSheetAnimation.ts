import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { SHEET_HEIGHT } from '../constants';

interface UseSheetAnimationParams {
  visible: boolean;
  onClosed?: () => void;
}

export function useSheetAnimation({ visible, onClosed }: UseSheetAnimationParams) {
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 150,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SHEET_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onClosed?.();
      });
    }
  }, [visible, slideAnim, fadeAnim, onClosed]);

  return { slideAnim, fadeAnim };
}
