import React from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { THEME } from '@/src/lib/constants';
import { calculateAge, formatDate } from '../stages';

interface BirthdayPickerProps {
  value: Date | null;
  isPickerOpen: boolean;
  onOpenPicker: () => void;
  onClosePicker: () => void;
  onChange: (event: unknown, selectedDate?: Date) => void;
}

const MIN_AGE_YEARS = 12;

function getMinDate(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_AGE_YEARS);
  return d;
}

export function BirthdayPicker({
  value,
  isPickerOpen,
  onOpenPicker,
  onClosePicker,
  onChange,
}: BirthdayPickerProps) {
  return (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.dobContainer}>
      <Text style={styles.inputLabel}>Date of Birth</Text>
      <TouchableOpacity style={styles.dobButton} onPress={onOpenPicker} activeOpacity={0.7}>
        <Text style={[styles.dobButtonText, !value && styles.dobButtonPlaceholder]}>
          {value ? formatDate(value) : 'Select birthday'}
        </Text>
        {value && <Text style={styles.ageText}>{calculateAge(value)}</Text>}
        <Text style={styles.calendarIcon}>📅</Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' && isPickerOpen && (
        <Modal
          transparent
          animationType="slide"
          visible={isPickerOpen}
          onRequestClose={onClosePicker}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={onClosePicker}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select Birthday</Text>
                <TouchableOpacity onPress={onClosePicker}>
                  <Text style={styles.modalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={value || new Date()}
                mode="date"
                display="spinner"
                onChange={onChange}
                maximumDate={new Date()}
                minimumDate={getMinDate()}
              />
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === 'android' && isPickerOpen && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={onChange}
          maximumDate={new Date()}
          minimumDate={getMinDate()}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dobContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dobButtonText: {
    flex: 1,
    fontSize: 16,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.text.primary,
  },
  dobButtonPlaceholder: {
    color: '#9CA3AF',
    fontFamily: THEME.fonts.body,
  },
  ageText: {
    fontSize: 14,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.primary,
    marginRight: 8,
  },
  calendarIcon: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.text.primary,
  },
  modalCancel: {
    fontSize: 16,
    fontFamily: THEME.fonts.body,
    color: '#6B7280',
  },
  modalDone: {
    fontSize: 16,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.primary,
  },
});
