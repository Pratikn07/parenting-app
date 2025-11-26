import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../../lib/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ChatImageBubbleProps {
  imageUrl: string;
  message?: string;
  isUser: boolean;
  timestamp?: Date;
}

export const ChatImageBubble: React.FC<ChatImageBubbleProps> = ({
  imageUrl,
  message,
  isUser,
  timestamp,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <>
      <View style={[
        styles.container,
        isUser ? styles.userContainer : styles.botContainer
      ]}>
        {/* Image */}
        <TouchableOpacity 
          onPress={() => !hasError && setIsFullscreen(true)}
          activeOpacity={0.9}
        >
          <View style={[
            styles.imageContainer,
            isUser ? styles.userImageContainer : styles.botImageContainer
          ]}>
            {isLoading && !hasError && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={THEME.colors.primary} />
              </View>
            )}
            {hasError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="image-outline" size={32} color={THEME.colors.text.secondary} />
                <Text style={styles.errorText}>Image unavailable</Text>
              </View>
            ) : (
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                onLoad={handleImageLoad}
                onError={handleImageError}
                resizeMode="cover"
              />
            )}
            {!isLoading && !hasError && (
              <View style={styles.expandIcon}>
                <Ionicons name="expand" size={16} color="#FFF" />
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Message text if provided */}
        {message && (
          <View style={[
            styles.textContainer,
            isUser ? styles.userTextContainer : styles.botTextContainer
          ]}>
            <Text style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.botMessageText
            ]}>
              {message}
            </Text>
          </View>
        )}

        {/* Timestamp */}
        {timestamp && (
          <Text style={styles.timestamp}>
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>

      {/* Fullscreen Modal */}
      <Modal
        visible={isFullscreen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFullscreen(false)}
      >
        <View style={styles.fullscreenContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setIsFullscreen(false)}
          >
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          <Image
            source={{ uri: imageUrl }}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: '80%',
    marginBottom: 8,
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  botContainer: {
    alignSelf: 'flex-start',
  },
  imageContainer: {
    width: 240,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  userImageContainer: {
    borderBottomRightRadius: 4,
  },
  botImageContainer: {
    borderBottomLeftRadius: 4,
    backgroundColor: THEME.colors.ui.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.ui.inputBg,
  },
  errorContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.ui.inputBg,
  },
  errorText: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    marginTop: 8,
  },
  expandIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
  textContainer: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    maxWidth: 240,
  },
  userTextContainer: {
    backgroundColor: THEME.colors.primary,
    borderBottomRightRadius: 4,
  },
  botTextContainer: {
    backgroundColor: THEME.colors.ui.white,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userMessageText: {
    color: '#FFF',
  },
  botMessageText: {
    color: THEME.colors.text.primary,
  },
  timestamp: {
    fontSize: 11,
    color: THEME.colors.text.secondary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
});

export default ChatImageBubble;
