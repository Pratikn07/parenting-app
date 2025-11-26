import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Calendar, ChevronDown, X, Check } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { THEME } from '@/src/lib/constants';
import { ModernCard } from './ModernCard';

// =====================================================
// Types
// =====================================================

export type DatePreset = 'today' | 'week' | 'month' | 'all' | 'custom';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DateRangeFilterProps {
  selectedPreset: DatePreset;
  customRange?: DateRange;
  onPresetChange: (preset: DatePreset) => void;
  onCustomRangeChange: (range: DateRange) => void;
}

// =====================================================
// Constants
// =====================================================

const PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: '7 Days' },
  { id: 'month', label: '30 Days' },
  { id: 'all', label: 'All Time' },
];

// =====================================================
// Component
// =====================================================

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  selectedPreset,
  customRange,
  onPresetChange,
  onCustomRangeChange,
}) => {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date>(
    customRange?.startDate || new Date()
  );
  const [tempEndDate, setTempEndDate] = useState<Date>(
    customRange?.endDate || new Date()
  );
  const [pickingStart, setPickingStart] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handlePresetPress = (preset: DatePreset) => {
    if (preset === 'custom') {
      setShowCustomPicker(true);
    } else {
      onPresetChange(preset);
    }
  };

  const handleCustomConfirm = () => {
    // Ensure start is before end
    const start = tempStartDate < tempEndDate ? tempStartDate : tempEndDate;
    const end = tempStartDate < tempEndDate ? tempEndDate : tempStartDate;
    
    onCustomRangeChange({ startDate: start, endDate: end });
    onPresetChange('custom');
    setShowCustomPicker(false);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDisplayText = (): string => {
    if (selectedPreset === 'custom' && customRange) {
      return `${formatDate(customRange.startDate)} - ${formatDate(customRange.endDate)}`;
    }
    const preset = PRESETS.find(p => p.id === selectedPreset);
    return preset?.label || 'Select';
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      if (pickingStart) {
        setTempStartDate(selectedDate);
      } else {
        setTempEndDate(selectedDate);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Preset Chips */}
      <View style={styles.presetsRow}>
        {PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            style={[
              styles.presetChip,
              selectedPreset === preset.id && styles.presetChipActive,
            ]}
            onPress={() => handlePresetPress(preset.id)}
          >
            <Text
              style={[
                styles.presetText,
                selectedPreset === preset.id && styles.presetTextActive,
              ]}
            >
              {preset.label}
            </Text>
          </TouchableOpacity>
        ))}
        
        {/* Custom Button */}
        <TouchableOpacity
          style={[
            styles.customButton,
            selectedPreset === 'custom' && styles.customButtonActive,
          ]}
          onPress={() => setShowCustomPicker(true)}
        >
          <Calendar
            size={16}
            color={selectedPreset === 'custom' ? '#FFFFFF' : THEME.colors.text.secondary}
          />
          <Text
            style={[
              styles.customButtonText,
              selectedPreset === 'custom' && styles.customButtonTextActive,
            ]}
          >
            {selectedPreset === 'custom' ? getDisplayText() : 'Custom'}
          </Text>
          <ChevronDown
            size={14}
            color={selectedPreset === 'custom' ? '#FFFFFF' : THEME.colors.text.secondary}
          />
        </TouchableOpacity>
      </View>

      {/* Custom Date Picker Modal */}
      <Modal
        visible={showCustomPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCustomPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <ModernCard style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date Range</Text>
              <TouchableOpacity
                onPress={() => setShowCustomPicker(false)}
                style={styles.closeButton}
              >
                <X size={24} color={THEME.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Date Selection Buttons */}
            <View style={styles.dateSelectionRow}>
              <TouchableOpacity
                style={[
                  styles.dateSelector,
                  pickingStart && styles.dateSelectorActive,
                ]}
                onPress={() => {
                  setPickingStart(true);
                  setShowDatePicker(true);
                }}
              >
                <Text style={styles.dateSelectorLabel}>Start Date</Text>
                <Text style={[
                  styles.dateSelectorValue,
                  pickingStart && styles.dateSelectorValueActive,
                ]}>
                  {formatDate(tempStartDate)}
                </Text>
              </TouchableOpacity>

              <View style={styles.dateDivider}>
                <Text style={styles.dateDividerText}>→</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.dateSelector,
                  !pickingStart && styles.dateSelectorActive,
                ]}
                onPress={() => {
                  setPickingStart(false);
                  setShowDatePicker(true);
                }}
              >
                <Text style={styles.dateSelectorLabel}>End Date</Text>
                <Text style={[
                  styles.dateSelectorValue,
                  !pickingStart && styles.dateSelectorValueActive,
                ]}>
                  {formatDate(tempEndDate)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Inline Date Picker for iOS / Modal for Android */}
            {Platform.OS === 'ios' ? (
              <View style={styles.iosPickerContainer}>
                <DateTimePicker
                  value={pickingStart ? tempStartDate : tempEndDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  style={styles.iosPicker}
                />
              </View>
            ) : showDatePicker && (
              <DateTimePicker
                value={pickingStart ? tempStartDate : tempEndDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}

            {/* Confirm Button */}
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleCustomConfirm}
            >
              <Check size={20} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>Apply Date Range</Text>
            </TouchableOpacity>
          </ModernCard>
        </View>
      </Modal>
    </View>
  );
};

// =====================================================
// Styles
// =====================================================

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: THEME.colors.ui.white,
    borderWidth: 1,
    borderColor: THEME.colors.ui.border,
  },
  presetChipActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  presetText: {
    fontSize: 13,
    fontWeight: '500',
    color: THEME.colors.text.secondary,
  },
  presetTextActive: {
    color: '#FFFFFF',
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: THEME.colors.ui.white,
    borderWidth: 1,
    borderColor: THEME.colors.ui.border,
    gap: 6,
  },
  customButtonActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  customButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: THEME.colors.text.secondary,
    maxWidth: 140,
  },
  customButtonTextActive: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  dateSelectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateSelector: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: THEME.colors.ui.inputBg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateSelectorActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: `${THEME.colors.primary}10`,
  },
  dateSelectorLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME.colors.text.secondary,
    marginBottom: 4,
  },
  dateSelectorValue: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.text.primary,
  },
  dateSelectorValueActive: {
    color: THEME.colors.primary,
  },
  dateDivider: {
    paddingHorizontal: 12,
  },
  dateDividerText: {
    fontSize: 18,
    color: THEME.colors.text.secondary,
  },
  iosPickerContainer: {
    backgroundColor: THEME.colors.ui.inputBg,
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  iosPicker: {
    height: 180,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default DateRangeFilter;

