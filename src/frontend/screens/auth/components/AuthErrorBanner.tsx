import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { AlertCircle } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';

interface AuthErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function AuthErrorBanner({ message, onDismiss }: AuthErrorBannerProps) {
  return (
    <View style={styles.errorContainer}>
      <AlertCircle size={16} color="#EF4444" />
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity onPress={onDismiss}>
        <AntDesign name="close" size={16} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#EF4444',
    fontFamily: THEME.fonts.body,
  },
});
