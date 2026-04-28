import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  FadeIn,
  ZoomIn,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { THEME } from '@/src/lib/constants';
import type { StageDef } from '../stages';
import { isExpectingStage } from '../stages';

interface HeroBannerProps {
  stage: StageDef;
  childName: string;
  switchKey: string | number;
}

function buildHeroText(stage: StageDef, childName: string): string {
  const expecting = isExpectingStage(stage);
  const displayName = childName.trim() || (expecting ? 'Baby' : 'Your child');
  return expecting ? `${displayName} is on the way!` : `${displayName} is a ${stage.label}`;
}

export function HeroBanner({ stage, childName, switchKey }: HeroBannerProps) {
  const animatedContainerStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(stage.color, { duration: 400 }),
  }));

  return (
    <Animated.View style={[styles.heroSection, animatedContainerStyle]}>
      <Animated.Text key={switchKey} entering={ZoomIn.duration(300)} style={styles.heroEmoji}>
        {stage.emoji}
      </Animated.Text>

      <Animated.View entering={FadeIn.delay(100)}>
        <Text style={[styles.heroTitle, { color: stage.textColor }]}>
          {buildHeroText(stage, childName)}
        </Text>
        <Text style={[styles.heroSubtitle, { color: stage.textColor, opacity: 0.7 }]}>
          {stage.range}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 28,
    marginBottom: 16,
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: THEME.fonts.header,
    textAlign: 'center',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: THEME.fonts.body,
    textAlign: 'center',
  },
});
