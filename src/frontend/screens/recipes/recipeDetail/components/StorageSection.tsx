import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Refrigerator } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';

interface StorageSectionProps {
  storage: string | undefined;
}

export function StorageSection({ storage }: StorageSectionProps) {
  if (!storage) return null;

  return (
    <View style={styles.section}>
      <View style={styles.storageContainer}>
        <Refrigerator size={20} color={THEME.colors.secondary} />
        <View style={styles.storageContent}>
          <Text style={styles.storageTitle}>Storage</Text>
          <Text style={styles.storageText}>{storage}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  storageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#86EFAC',
    gap: 12,
  },
  storageContent: {
    flex: 1,
  },
  storageTitle: {
    fontSize: 14,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.secondary,
    marginBottom: 4,
  },
  storageText: {
    fontSize: 14,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.primary,
    lineHeight: 20,
  },
});
