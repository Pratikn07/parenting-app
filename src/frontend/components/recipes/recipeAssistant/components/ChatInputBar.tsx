import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Camera, Send } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';

interface ChatInputBarProps {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  onTakePhoto: () => void;
  isSending: boolean;
}

export function ChatInputBar({
  value,
  onChange,
  onSend,
  onTakePhoto,
  isSending,
}: ChatInputBarProps) {
  const canSend = value.trim().length > 0 && !isSending;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={20}
    >
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.cameraButton} onPress={onTakePhoto}>
          <Camera size={22} color={THEME.colors.primary} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type or take a photo..."
          placeholderTextColor={THEME.colors.text.secondary}
          value={value}
          onChangeText={onChange}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          onPress={onSend}
          disabled={!canSend}
        >
          <Send size={20} color={canSend ? '#FFF' : THEME.colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.ui.border,
    backgroundColor: THEME.colors.background,
  },
  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.ui.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.ui.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: THEME.colors.ui.inputBg,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.primary,
    borderWidth: 1,
    borderColor: THEME.colors.ui.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: THEME.colors.ui.inputBg,
  },
});
