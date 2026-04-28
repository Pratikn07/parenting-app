import { useRef, useState } from 'react';
import { Animated, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

interface UseScrollFabResult {
  showFab: boolean;
  fabFadeAnim: Animated.Value;
  setTriggerY: (y: number) => void;
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

const TRIGGER_OFFSET_PX = 50;
const FADE_DURATION_MS = 200;

export function useScrollFab(): UseScrollFabResult {
  const [showFab, setShowFab] = useState(false);
  const [triggerY, setTriggerY] = useState(0);
  const fabFadeAnim = useRef(new Animated.Value(0)).current;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const shouldShow = scrollY >= triggerY - TRIGGER_OFFSET_PX;

    if (shouldShow !== showFab) {
      setShowFab(shouldShow);
      Animated.timing(fabFadeAnim, {
        toValue: shouldShow ? 1 : 0,
        duration: FADE_DURATION_MS,
        useNativeDriver: true,
      }).start();
    }
  };

  return { showFab, fabFadeAnim, setTriggerY, handleScroll };
}
