import React, { useEffect, useRef } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';
import type { ChildFormData, StageDef } from '../stages';
import { isExpectingStage } from '../stages';
import { BirthdayPicker } from './BirthdayPicker';
import { StageSelector } from './StageSelector';

interface ChildDetailsFormProps {
  child: ChildFormData;
  stage: StageDef;
  totalChildren: number;
  childIndex: number;
  onUpdate: (updates: Partial<ChildFormData>) => void;
  onRemove: () => void;
  onDateChange: (event: unknown, selectedDate?: Date) => void;
}

const FOCUS_DELAY_MS = 300;

export function ChildDetailsForm({
  child,
  stage,
  totalChildren,
  childIndex,
  onUpdate,
  onRemove,
  onDateChange,
}: ChildDetailsFormProps) {
  const expecting = isExpectingStage(stage);
  const nameInputRef = useRef<TextInput>(null);

  // Auto-focus name input when this card mounts (e.g. switching active child)
  useEffect(() => {
    const timer = setTimeout(() => nameInputRef.current?.focus(), FOCUS_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const showCheckmark = child.name.trim().length > 0;

  return (
    <Animated.View
      key={child.id}
      entering={FadeInRight.duration(300)}
      style={styles.childCard}
    >
      <View style={styles.childHeader}>
        <Text style={styles.childLabel}>
          {totalChildren > 1 ? `Child ${childIndex + 1} Details` : 'Child Details'}
        </Text>
        {totalChildren > 1 && (
          <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
            <Text style={styles.removeButtonText}>Remove</Text>
            <X size={16} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          {expecting ? "Baby's name (optional)" : "Child's name"}
        </Text>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={nameInputRef}
            style={styles.input}
            placeholder={expecting ? 'Not decided yet? Skip!' : 'Enter name'}
            placeholderTextColor="#9CA3AF"
            value={child.name}
            onChangeText={(text) => onUpdate({ name: text })}
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          {showCheckmark && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </View>

      <StageSelector
        selectedIndex={child.selectedIndex}
        onSelect={(index) => onUpdate({ selectedIndex: index })}
      />

      {!expecting && (
        <BirthdayPicker
          value={child.dateOfBirth}
          isPickerOpen={child.showDatePicker}
          onOpenPicker={() => onUpdate({ showDatePicker: true })}
          onClosePicker={() => onUpdate({ showDatePicker: false })}
          onChange={onDateChange}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  childCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginHorizontal: 4,
  },
  childHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: -8,
  },
  childLabel: {
    fontSize: 18,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.primary,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    gap: 4,
  },
  removeButtonText: {
    fontSize: 12,
    fontFamily: THEME.fonts.body,
    color: '#EF4444',
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: THEME.colors.primary,
  },
  input: {
    flex: 1,
    fontSize: 22,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.text.primary,
    paddingVertical: 10,
  },
  checkmark: {
    fontSize: 18,
    color: '#10B981',
    fontWeight: 'bold',
  },
});
