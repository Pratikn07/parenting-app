import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MessageCircle, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { THEME } from '@/src/lib/constants';

export default function EmergencyButton() {
  const router = useRouter();

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tabs)/chat');
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <View style={styles.iconContainer}>
        <MessageCircle size={20} color="#FFFFFF" strokeWidth={2.5} fill="#FFFFFF" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Need help right now?</Text>
        <Text style={styles.subtitle}>Tap to chat with Haven</Text>
      </View>
      <ArrowRight size={18} color="rgba(255,255,255,0.7)" strokeWidth={2} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.layout.borderRadius.md,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 8,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: THEME.fonts.bodySemiBold,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: THEME.fonts.body,
    color: 'rgba(255,255,255,0.8)',
  },
});
