import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Mail, User } from 'lucide-react-native';
import { ModernCard } from '@/src/frontend/components/common/ModernCard';
import { ModernButton } from '@/src/frontend/components/common/ModernButton';
import { useAuthStore } from '@/src/shared/stores/authStore';
import { FEEDING_OPTIONS, STAGES } from '../types';
import { sharedStyles } from '../sharedStyles';

interface AccountViewProps {
  onSave: () => void;
}

export function AccountView({ onSave }: AccountViewProps) {
  const { user } = useAuthStore();
  const [selectedStage, setSelectedStage] = useState('newborn');
  const [selectedFeeding, setSelectedFeeding] = useState('breastfeeding');

  return (
    <ScrollView style={sharedStyles.contentContainer} showsVerticalScrollIndicator={false}>
      <Text style={sharedStyles.viewTitle}>Account</Text>

      <View style={sharedStyles.sectionHeader}>
        <Text style={sharedStyles.sectionTitle}>Personal Information</Text>
      </View>
      <ModernCard style={sharedStyles.card}>
        <View style={styles.inputGroup}>
          <View style={styles.inputIcon}>
            <User size={20} color="#9CA3AF" />
          </View>
          <View style={styles.inputContent}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              defaultValue={user?.name || ''}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>
        <View style={sharedStyles.divider} />
        <View style={styles.inputGroup}>
          <View style={styles.inputIcon}>
            <Mail size={20} color="#9CA3AF" />
          </View>
          <View style={styles.inputContent}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              placeholder="Email"
              defaultValue={user?.email || ''}
              editable={false}
            />
          </View>
        </View>
      </ModernCard>

      <View style={sharedStyles.sectionHeader}>
        <Text style={sharedStyles.sectionTitle}>Parenting Stage</Text>
      </View>
      <View style={styles.chipContainer}>
        {STAGES.map((stage) => (
          <TouchableOpacity
            key={stage.id}
            style={[styles.chip, selectedStage === stage.id && styles.chipActive]}
            onPress={() => setSelectedStage(stage.id)}
          >
            <Text style={[styles.chipText, selectedStage === stage.id && styles.chipTextActive]}>
              {stage.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={sharedStyles.sectionHeader}>
        <Text style={sharedStyles.sectionTitle}>Feeding Preferences</Text>
      </View>
      <View style={styles.chipContainer}>
        {FEEDING_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.chip, selectedFeeding === option.id && styles.chipActive]}
            onPress={() => setSelectedFeeding(option.id)}
          >
            <Text
              style={[styles.chipText, selectedFeeding === option.id && styles.chipTextActive]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ModernButton
        title="Save Changes"
        onPress={onSave}
        variant="primary"
        style={{ marginTop: 24, marginBottom: 40 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  inputIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  input: {
    fontSize: 16,
    color: '#3D405B',
    fontWeight: '500',
    padding: 0,
  },
  disabledInput: {
    color: '#9CA3AF',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#E07A5F',
    borderColor: '#E07A5F',
  },
  chipText: {
    fontSize: 14,
    color: '#3D405B',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFF',
  },
});
