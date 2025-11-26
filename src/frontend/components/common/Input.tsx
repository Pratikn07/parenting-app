import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  KeyboardTypeOptions,
} from 'react-native';
import { THEME } from '@/src/lib/constants';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  editable?: boolean;
  error?: string;
  helperText?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  numberOfLines = 1,
  maxLength,
  editable = true,
  error,
  helperText,
  style,
  inputStyle,
  required = false,
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          error && styles.inputError,
          !editable && styles.inputDisabled,
          inputStyle,
        ]}
        placeholder={placeholder}
        placeholderTextColor={THEME.colors.text.secondary}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        editable={editable}
      />
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      {helperText && !error && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: THEME.fonts.bodyMedium,
    color: THEME.colors.text.primary,
    marginBottom: 8,
  },
  required: {
    color: THEME.colors.status.error,
  },
  input: {
    backgroundColor: THEME.colors.ui.white,
    borderWidth: 1,
    borderColor: THEME.colors.ui.border,
    borderRadius: THEME.layout.borderRadius.sm,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.primary,
    minHeight: 56,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  inputError: {
    borderColor: THEME.colors.status.error,
    backgroundColor: '#FEF2F2',
  },
  inputDisabled: {
    backgroundColor: THEME.colors.ui.inputBg,
    color: THEME.colors.text.secondary,
  },
  errorText: {
    fontSize: 12,
    color: THEME.colors.status.error,
    marginTop: 4,
    fontFamily: THEME.fonts.bodyMedium,
  },
  helperText: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    marginTop: 4,
    fontFamily: THEME.fonts.body,
  },
});
