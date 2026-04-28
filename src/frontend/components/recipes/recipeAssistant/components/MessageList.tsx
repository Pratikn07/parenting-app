import React, { forwardRef } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { THEME } from '@/src/lib/constants';
import { AssistantMessage } from '../types';

interface MessageListProps {
  messages: AssistantMessage[];
  isLoading: boolean;
}

export const MessageList = forwardRef<ScrollView, MessageListProps>(
  ({ messages, isLoading }, ref) => {
    return (
      <ScrollView
        ref={ref}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[styles.messageBubble, msg.isUser ? styles.userBubble : styles.aiBubble]}
          >
            {msg.imageUrl && (
              <Image source={{ uri: msg.imageUrl }} style={styles.messageImage} />
            )}
            <Text style={[styles.messageText, msg.isUser && styles.userMessageText]}>
              {msg.text}
            </Text>
          </View>
        ))}
        {isLoading && (
          <View style={[styles.messageBubble, styles.aiBubble]}>
            <ActivityIndicator size="small" color={THEME.colors.primary} />
          </View>
        )}
      </ScrollView>
    );
  }
);

MessageList.displayName = 'MessageList';

const styles = StyleSheet.create({
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: THEME.colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: THEME.colors.ui.inputBg,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: THEME.colors.text.primary,
    fontFamily: THEME.fonts.body,
  },
  userMessageText: {
    color: '#FFF',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
  },
});
