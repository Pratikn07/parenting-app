import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Camera, Mic, Send, X } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';

interface ChatInputBarProps {
  inputText: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isSending: boolean;
  isRecording: boolean;
  onToggleRecording: () => void;
  onAttachPhoto: () => void;
  selectedImageUri: string | null;
  onRemoveImage: () => void;
  isUploadingImage: boolean;
}

export function ChatInputBar({
  inputText,
  onChangeText,
  onSend,
  isSending,
  isRecording,
  onToggleRecording,
  onAttachPhoto,
  selectedImageUri,
  onRemoveImage,
  isUploadingImage,
}: ChatInputBarProps) {
  const isSendDisabled = (!inputText.trim() && !selectedImageUri) || isSending;

  return (
    <>
      {selectedImageUri && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />
          <TouchableOpacity style={styles.removeImageButton} onPress={onRemoveImage}>
            <X size={16} color="#FFF" strokeWidth={2} />
          </TouchableOpacity>
          {isUploadingImage && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="small" color="#FFF" />
            </View>
          )}
        </View>
      )}

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TouchableOpacity
            style={[styles.attachButton, selectedImageUri && styles.attachButtonActive]}
            onPress={onAttachPhoto}
          >
            <Camera
              size={20}
              color={selectedImageUri ? THEME.colors.primary : '#6B7280'}
              strokeWidth={2}
            />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder={
              selectedImageUri
                ? 'Add a question about this photo...'
                : 'Ask me anything...'
            }
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={onChangeText}
            multiline
            maxLength={500}
            editable={!isSending}
            onSubmitEditing={onSend}
          />

          <View style={styles.inputActions}>
            <TouchableOpacity
              style={[styles.micButton, isRecording && styles.micButtonActive]}
              onPress={onToggleRecording}
            >
              <Mic
                size={20}
                color={isRecording ? '#FFFFFF' : '#6B7280'}
                strokeWidth={2}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sendButton, isSendDisabled && styles.sendButtonDisabled]}
              onPress={onSend}
              disabled={isSendDisabled}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send size={20} color="#FFFFFF" strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  imagePreviewContainer: {
    marginHorizontal: 20,
    marginBottom: 8,
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: THEME.colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FDFCF8',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 56,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  attachButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  attachButtonActive: {
    backgroundColor: 'rgba(224, 122, 95, 0.1)',
    borderRadius: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#3D405B',
    maxHeight: 120,
    minHeight: 24,
    paddingTop: 0,
    paddingVertical: 8,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 4,
  },
  micButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  micButtonActive: {
    backgroundColor: '#E07A5F',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E07A5F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
});
