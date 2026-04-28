import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChefHat, RefreshCw, X } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';
import { AssistantMode } from '../types';

interface SheetHeaderProps {
  mode: AssistantMode;
  onClose: () => void;
}

export function SheetHeader({ mode, onClose }: SheetHeaderProps) {
  const Icon = mode === 'progress' ? ChefHat : RefreshCw;
  const title = mode === 'progress' ? 'Cooking Progress' : 'Ingredient Help';

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Icon size={20} color={THEME.colors.primary} />
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <X size={20} color={THEME.colors.text.secondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.ui.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: THEME.fonts.header,
    color: THEME.colors.text.primary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.ui.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
