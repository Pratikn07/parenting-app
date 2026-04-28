import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScrollView } from 'react-native';
import { chatService, imageService, progressService } from '@/src/services';
import type { Child } from '@/src/lib/database.types';
import { getDevelopmentalStage } from '@/src/lib/dateUtils';
import { Message, WELCOME_MESSAGE } from '../types';

interface GuestData {
  parentName: string;
  mainChallenge: string;
  childAge: string;
}

interface UseChatMessagesParams {
  userId: string | undefined;
  userFirstName: string;
  guestData: GuestData | null | undefined;
  selectedChild: Child | undefined;
  selectedChildId: string | null;
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  reloadSessions: () => Promise<void>;
  isLoadingHistory: boolean;
  setIsLoadingHistory: (loading: boolean) => void;
}

interface UseChatMessagesResult {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  inputText: string;
  setInputText: (text: string) => void;
  isSending: boolean;
  selectedImageUri: string | null;
  isUploadingImage: boolean;
  scrollViewRef: React.RefObject<ScrollView | null>;
  createWelcomeMessage: () => Message;
  scrollToBottom: () => void;
  handleImageSelected: (uri: string) => void;
  handleRemoveImage: () => void;
  sendMessage: () => Promise<void>;
}

export function useChatMessages({
  userId,
  userFirstName,
  guestData,
  selectedChild,
  selectedChildId,
  currentSessionId,
  setCurrentSessionId,
  reloadSessions,
  isLoadingHistory,
  setIsLoadingHistory,
}: UseChatMessagesParams): UseChatMessagesResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const createWelcomeMessage = useCallback(
    (): Message => ({
      id: 'welcome',
      text: WELCOME_MESSAGE,
      isUser: false,
      timestamp: new Date(),
    }),
    []
  );

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const handleImageSelected = useCallback((uri: string) => {
    setSelectedImageUri(uri);
  }, []);

  const handleRemoveImage = useCallback(() => {
    setSelectedImageUri(null);
  }, []);

  // Guest auto-welcome message
  useEffect(() => {
    if (!userId && guestData && messages.length === 0) {
      const initialMessage = `Hi ${guestData.parentName}! I see you're navigating ${guestData.mainChallenge} with a ${guestData.childAge} old. How can I help you start?`;

      setMessages([
        {
          id: 'welcome-guest',
          text: initialMessage,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
      setIsLoadingHistory(false);
    }
  }, [userId, guestData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Personalized welcome when a child is selected and there's no message history
  useEffect(() => {
    if (messages.length === 0 && selectedChild && !isLoadingHistory) {
      const stage = selectedChild.birth_date
        ? getDevelopmentalStage(selectedChild.birth_date)
        : { label: 'Unknown', icon: '❓' };
      const personalizedWelcome = `Hi ${userFirstName}! Ready to tackle ${stage.label.toLowerCase()} life with ${selectedChild.name}? What's on your mind?`;

      setMessages([
        {
          id: 'welcome',
          text: personalizedWelcome,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
  }, [selectedChild, isLoadingHistory, messages.length, userFirstName]);

  const sendMessage = useCallback(async () => {
    if ((!inputText.trim() && !selectedImageUri) || isSending) return;
    if (!userId) {
      alert('Please sign in to chat');
      return;
    }

    const messageText =
      inputText.trim() || (selectedImageUri ? 'What do you see in this image?' : '');
    const imageToSend = selectedImageUri;

    setInputText('');
    setSelectedImageUri(null);
    setIsSending(true);

    let uploadedImageUrl: string | undefined;
    if (imageToSend) {
      setIsUploadingImage(true);
      try {
        const uploadResult = await imageService.uploadImage(
          userId,
          imageToSend,
          currentSessionId || undefined
        );
        if (uploadResult.success && uploadResult.url) {
          uploadedImageUrl = uploadResult.url;
        } else {
          throw new Error(uploadResult.error || 'Image upload failed');
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        setIsSending(false);
        setIsUploadingImage(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            text: 'Failed to upload image. Please try again.',
            isUser: false,
            timestamp: new Date(),
            isError: true,
          },
        ]);
        return;
      }
      setIsUploadingImage(false);
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: messageText,
      isUser: true,
      timestamp: new Date(),
      imageUrl: uploadedImageUrl,
    };

    const typingMessage: Message = {
      id: 'typing',
      text: '',
      isUser: false,
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, typingMessage]);
    scrollToBottom();

    try {
      if (uploadedImageUrl) {
        // Vision messages: non-streaming API
        const result = await chatService.sendMessage(
          userId,
          messageText,
          selectedChildId || undefined,
          currentSessionId || undefined,
          uploadedImageUrl
        );

        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== 'typing');

          if (result.success && result.data) {
            if (result.data.sessionId && result.data.sessionId !== currentSessionId) {
              setCurrentSessionId(result.data.sessionId);
              reloadSessions();
            }

            return [
              ...filtered,
              {
                id: result.data.id,
                text: result.data.response,
                isUser: false,
                timestamp: new Date(result.data.createdAt),
              },
            ];
          }

          return [
            ...filtered,
            {
              id: `error-${Date.now()}`,
              text:
                result.fallbackResponse ||
                "I'm having trouble responding right now. Please try again.",
              isUser: false,
              timestamp: new Date(),
              isError: true,
            },
          ];
        });
      } else {
        // Text-only: streaming via react-native-sse
        const aiMessageId = `ai-${Date.now()}`;
        let hasReceivedContent = false;

        const result = await chatService.sendMessageStreaming(
          userId,
          messageText,
          (partialText) => {
            if (!hasReceivedContent && partialText.length > 0) {
              hasReceivedContent = true;
              setMessages((prev) => {
                const filtered = prev.filter((m) => m.id !== 'typing');
                return [
                  ...filtered,
                  {
                    id: aiMessageId,
                    text: partialText,
                    isUser: false,
                    timestamp: new Date(),
                  },
                ];
              });
            } else if (hasReceivedContent) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMessageId ? { ...m, text: partialText } : m
                )
              );
            }
            scrollToBottom();
          },
          selectedChildId || undefined,
          currentSessionId || undefined,
          undefined
        );

        if (result.success && result.data) {
          if (result.data.sessionId && result.data.sessionId !== currentSessionId) {
            setCurrentSessionId(result.data.sessionId);
          }
          // Always reload after a successful stream so post-stream enriched
          // [PRODUCT_CARD] markers (added server-side after streaming completes)
          // show up in the UI immediately. Without this, cards only appeared
          // when the user reopened the session.
          reloadSessions();
        } else {
          setMessages((prev) => {
            const filtered = prev.filter((m) => m.id !== 'typing');

            if (hasReceivedContent) {
              return prev.map((m) =>
                m.id === aiMessageId
                  ? {
                      ...m,
                      text:
                        result.fallbackResponse ||
                        "I'm having trouble responding right now. Please try again.",
                      isError: true,
                    }
                  : m
              );
            }

            return [
              ...filtered,
              {
                id: `error-${Date.now()}`,
                text:
                  result.fallbackResponse ||
                  "I'm having trouble responding right now. Please try again.",
                isUser: false,
                timestamp: new Date(),
                isError: true,
              },
            ];
          });
        }
      }

      try {
        await progressService.logQuestionAsked(userId, messageText);
      } catch (error) {
        console.error('Error logging question:', error);
      }
    } catch (error) {
      console.error('Error sending message:', error);

      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== 'typing');
        return [
          ...filtered,
          {
            id: `error-${Date.now()}`,
            text: 'Something went wrong. Please try again in a moment.',
            isUser: false,
            timestamp: new Date(),
            isError: true,
          },
        ];
      });
    } finally {
      setIsSending(false);
      scrollToBottom();
    }
  }, [
    inputText,
    selectedImageUri,
    isSending,
    userId,
    currentSessionId,
    selectedChildId,
    setCurrentSessionId,
    reloadSessions,
    scrollToBottom,
  ]);

  return {
    messages,
    setMessages,
    inputText,
    setInputText,
    isSending,
    selectedImageUri,
    isUploadingImage,
    scrollViewRef,
    createWelcomeMessage,
    scrollToBottom,
    handleImageSelected,
    handleRemoveImage,
    sendMessage,
  };
}
