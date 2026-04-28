import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, Moon, Sun, CloudSun } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/src/lib/constants';

interface ContextualHeroCardProps {
  childName: string;
  childAgeMonths: number | null;
  dailyTip: {
    title: string;
    description: string;
    category: string;
  } | null;
}

export default function ContextualHeroCard({ childName, childAgeMonths, dailyTip }: ContextualHeroCardProps) {
  const timeContext = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { greeting: 'Good morning', icon: Sun, period: 'morning' };
    if (hour < 17) return { greeting: 'Good afternoon', icon: CloudSun, period: 'afternoon' };
    return { greeting: 'Good evening', icon: Moon, period: 'evening' };
  }, []);

  const ageText = childAgeMonths !== null
    ? childAgeMonths < 1 ? 'newborn' : `${childAgeMonths} month${childAgeMonths !== 1 ? 's' : ''}`
    : null;

  const contextualMessage = useMemo(() => {
    if (!dailyTip) {
      if (timeContext.period === 'evening') return `Wind down time — ${childName} had a great day!`;
      if (timeContext.period === 'morning') return `A new day with ${childName} — you've got this!`;
      return `Enjoying the afternoon with ${childName}? Here's a thought.`;
    }
    return dailyTip.description;
  }, [dailyTip, timeContext.period, childName]);

  const TimeIcon = timeContext.icon;

  return (
    <LinearGradient
      colors={['#E8725C', '#F4A68D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Sparkles size={12} color={THEME.colors.primary} strokeWidth={2.5} />
          <Text style={styles.badgeText}>Today's Insight</Text>
        </View>
        <TimeIcon size={20} color="rgba(255,255,255,0.6)" strokeWidth={2} />
      </View>

      <Text style={styles.title}>
        {dailyTip ? dailyTip.title : `${timeContext.greeting} ✨`}
      </Text>

      <Text style={styles.description} numberOfLines={3}>
        {contextualMessage}
      </Text>

      {ageText && (
        <View style={styles.ageChip}>
          <Text style={styles.ageChipText}>
            {childName} · {ageText}
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: THEME.layout.borderRadius.md,
    padding: 24,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: '#E8725C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.primary,
  },
  title: {
    fontSize: 22,
    fontFamily: THEME.fonts.header,
    color: '#FFFFFF',
    marginBottom: 10,
    lineHeight: 28,
  },
  description: {
    fontSize: 15,
    fontFamily: THEME.fonts.body,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
    marginBottom: 16,
  },
  ageChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  ageChipText: {
    fontSize: 12,
    fontFamily: THEME.fonts.bodyMedium,
    color: '#FFFFFF',
  },
});
