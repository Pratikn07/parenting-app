import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bookmark } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';

interface RecipesHeaderProps {
  greeting: string;
  userName: string;
  childName: string;
  onSavedPress: () => void;
}

export function RecipesHeader({
  greeting,
  userName,
  childName,
  onSavedPress,
}: RecipesHeaderProps) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.greeting}>
          {greeting}, {userName}!
        </Text>
        <Text style={styles.subtext}>
          Cooking for <Text style={styles.childName}>{childName}</Text>
        </Text>
      </View>
      <TouchableOpacity style={styles.savedButton} onPress={onSavedPress}>
        <Bookmark size={24} color={THEME.colors.primary} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontFamily: THEME.fonts.header,
    color: THEME.colors.text.primary,
  },
  subtext: {
    fontSize: 16,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.secondary,
  },
  childName: {
    color: THEME.colors.primary,
    fontFamily: THEME.fonts.bodySemiBold,
  },
  savedButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.colors.ui.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.ui.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
});
