import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { ChatImageBubble } from '@/src/frontend/components/chat/ChatImageBubble';
import {
  ProductCard,
  parseProductCards,
} from '@/src/frontend/components/chat/ProductCard';
import { affiliateService } from '@/src/services';
import type { Message } from '../types';
import { markdownStyles } from '../markdownStyles';
import { TypingIndicator } from './TypingIndicator';

interface MessageBubbleProps {
  message: Message;
  childName?: string;
  userId: string | undefined;
  currentSessionId: string | null;
}

export function MessageBubble({
  message,
  childName,
  userId,
  currentSessionId,
}: MessageBubbleProps) {
  const wrapperStyle = [
    styles.messageWrapper,
    message.isUser
      ? styles.userMessageWrapper
      : message.isSystem
      ? styles.systemMessageWrapper
      : styles.botMessageWrapper,
  ];

  // System message
  if (message.isSystem) {
    return (
      <View style={wrapperStyle}>
        <View style={styles.systemMessage}>
          <Text style={styles.systemMessageText}>{message.text}</Text>
        </View>
      </View>
    );
  }

  // Image message
  if (message.imageUrl) {
    return (
      <View style={wrapperStyle}>
        <ChatImageBubble
          imageUrl={message.imageUrl}
          message={message.text}
          isUser={message.isUser}
          timestamp={message.timestamp}
        />
      </View>
    );
  }

  // Loading state (typing indicator)
  if (message.isLoading) {
    return (
      <View style={wrapperStyle}>
        <View style={[styles.messageBubble, styles.botMessage]}>
          <TypingIndicator childName={childName} />
        </View>
      </View>
    );
  }

  // User text message
  if (message.isUser) {
    return (
      <View style={wrapperStyle}>
        <View style={[styles.messageBubble, styles.userMessage]}>
          <Text style={styles.userMessageText}>{message.text}</Text>
        </View>
      </View>
    );
  }

  // Bot message — may contain product cards
  const { textParts, products } = parseProductCards(message.text);
  const hasProducts = products.length > 0;

  const renderMessageContent = () => {
    if (!hasProducts) {
      return <Markdown style={markdownStyles}>{message.text}</Markdown>;
    }

    return (
      <>
        {textParts.map((part, index) => {
          const productMatch = part.match(/__PRODUCT_(\d+)__/);
          if (productMatch) {
            const productIndex = parseInt(productMatch[1], 10);
            const product = products[productIndex];
            if (product) {
              return (
                <ProductCard
                  key={`product-${index}`}
                  product={product}
                  onPress={() => {
                    if (userId) {
                      affiliateService.trackClick(
                        userId,
                        product.id,
                        currentSessionId || undefined
                      );
                    }
                  }}
                />
              );
            }
          }
          if (part && part.trim()) {
            return (
              <Markdown key={`text-${index}`} style={markdownStyles}>
                {part}
              </Markdown>
            );
          }
          return null;
        })}
      </>
    );
  };

  return (
    <View style={wrapperStyle}>
      <View
        style={[
          styles.messageBubble,
          styles.botMessage,
          message.isError && styles.errorMessage,
        ]}
      >
        {renderMessageContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageWrapper: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  userMessageWrapper: {
    alignSelf: 'flex-end',
  },
  botMessageWrapper: {
    alignSelf: 'flex-start',
  },
  systemMessageWrapper: {
    alignSelf: 'center',
    maxWidth: '100%',
    marginBottom: 12,
  },
  messageBubble: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 22,
  },
  userMessage: {
    backgroundColor: '#E07A5F',
    borderBottomRightRadius: 4,
  },
  botMessage: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  systemMessage: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  systemMessageText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorMessage: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
  },
  userMessageText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
  },
});
