import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoImagePicker from 'expo-image-picker';
import { THEME } from '../../../lib/constants';

interface ImagePickerProps {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (uri: string) => void;
  selectedImage?: string | null;
  onRemoveImage?: () => void;
  isUploading?: boolean;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  visible,
  onClose,
  onImageSelected,
  selectedImage,
  onRemoveImage,
  isUploading = false,
}) => {
  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera permission is needed to take photos');
      return false;
    }
    return true;
  };

  const requestGalleryPermission = async (): Promise<boolean> => {
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Gallery permission is needed to select photos');
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ExpoImagePicker.launchCameraAsync({
      mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
      onClose();
    }
  };

  const handleChooseFromGallery = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.container}>
          <View style={styles.handle} />
          
          <Text style={styles.title}>Add Photo</Text>
          <Text style={styles.subtitle}>
            Share a photo for analysis or context
          </Text>

          {/* Selected Image Preview */}
          {selectedImage && (
            <View style={styles.previewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              {isUploading ? (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color="#FFF" />
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={onRemoveImage}
                >
                  <Ionicons name="close-circle" size={28} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Options */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.option}
              onPress={handleTakePhoto}
            >
              <View style={[styles.optionIcon, { backgroundColor: THEME.colors.primary }]}>
                <Ionicons name="camera" size={28} color="#FFF" />
              </View>
              <Text style={styles.optionText}>Take Photo</Text>
              <Text style={styles.optionSubtext}>Use your camera</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.option}
              onPress={handleChooseFromGallery}
            >
              <View style={[styles.optionIcon, { backgroundColor: THEME.colors.secondary }]}>
                <Ionicons name="images" size={28} color="#FFF" />
              </View>
              <Text style={styles.optionText}>Choose Photo</Text>
              <Text style={styles.optionSubtext}>From your gallery</Text>
            </TouchableOpacity>
          </View>

          {/* Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Photo Tips</Text>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={16} color={THEME.colors.secondary} />
              <Text style={styles.tipText}>Good lighting helps get better analysis</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={16} color={THEME.colors.secondary} />
              <Text style={styles.tipText}>Focus on the area of concern</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="information-circle" size={16} color={THEME.colors.text.secondary} />
              <Text style={styles.tipText}>Photos are not stored permanently</Text>
            </View>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: THEME.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.colors.text.primary,
    textAlign: 'center',
    fontFamily: THEME.fonts.header,
  },
  subtitle: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  previewContainer: {
    position: 'relative',
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  uploadingText: {
    color: '#FFF',
    fontSize: 14,
    marginTop: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 14,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  option: {
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.text.primary,
    marginBottom: 4,
  },
  optionSubtext: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
  },
  tipsContainer: {
    backgroundColor: THEME.colors.ui.inputBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.text.primary,
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  tipText: {
    fontSize: 13,
    color: THEME.colors.text.secondary,
    flex: 1,
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: THEME.colors.text.secondary,
    fontWeight: '500',
  },
});

export default ImagePicker;
