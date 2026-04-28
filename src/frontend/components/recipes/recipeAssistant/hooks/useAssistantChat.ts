import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { chatService } from '@/src/services/chat/ChatService';
import { useAuthStore } from '@/src/shared/stores/authStore';
import { useChildStore } from '@/src/shared/stores/childStore';
import type { Recipe } from '@/src/lib/types/recipes';
import { AssistantMessage, AssistantMode } from '../types';
import { stripMarkdown } from '../utils';

interface UseAssistantChatParams {
  visible: boolean;
  recipe: Recipe;
  mode: AssistantMode;
}

interface UseAssistantChatResult {
  messages: AssistantMessage[];
  isLoading: boolean;
  scrollViewRef: React.RefObject<ScrollView | null>;
  sendText: (text: string) => Promise<void>;
  sendPhoto: () => Promise<void>;
  reset: () => void;
}

function buildGreeting(recipeTitle: string, mode: AssistantMode): AssistantMessage {
  return {
    id: 'greeting',
    text:
      mode === 'progress'
        ? `How's your cooking going? 📸 Share a photo of what you're making and I'll help you out!`
        : `Making ${recipeTitle}? 🍳 Tap an ingredient below or tell me what you're missing!`,
    isUser: false,
  };
}

export function useAssistantChat({
  visible,
  recipe,
  mode,
}: UseAssistantChatParams): UseAssistantChatResult {
  const { user } = useAuthStore();
  const { activeChild } = useChildStore();

  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && messages.length === 0) {
      setMessages([buildGreeting(recipe.title, mode)]);
    }
  }, [visible, recipe.title, mode, messages.length]);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const reset = useCallback(() => {
    setMessages([]);
    setSessionId(undefined);
  }, []);

  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !user?.id || isLoading) return;

      const userMessage: AssistantMessage = {
        id: Date.now().toString(),
        text: trimmed,
        isUser: true,
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      const contextMessage = `[Recipe Context: Making "${recipe.title}" - Ingredients: ${recipe.ingredients
        .map((i) => i.item)
        .join(', ')}]\n\nUser: ${trimmed}`;

      try {
        const result = await chatService.sendMessage(
          user.id,
          contextMessage,
          activeChild?.id,
          sessionId,
          undefined,
          'recipe',
          mode
        );

        if (result.success && result.data) {
          if (result.data.sessionId) setSessionId(result.data.sessionId);

          const aiMessage: AssistantMessage = {
            id: result.data.id,
            text: stripMarkdown(result.data.response),
            isUser: false,
          };
          setMessages((prev) => [...prev, aiMessage]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `${Date.now()}-error`,
              text: result.fallbackResponse || "I'm having trouble responding. Please try again.",
              isUser: false,
            },
          ]);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        setIsLoading(false);
        scrollToEnd();
      }
    },
    [user?.id, activeChild?.id, sessionId, recipe, mode, isLoading, scrollToEnd]
  );

  const sendPhoto = useCallback(async () => {
    if (!user?.id) return;
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const pickerResult = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });
    if (pickerResult.canceled || !pickerResult.assets[0]) return;

    const { uri: imageUri, base64: imageBase64 } = pickerResult.assets[0];

    const userMessage: AssistantMessage = {
      id: Date.now().toString(),
      text: "Here's what I have in my kitchen:",
      isUser: true,
      imageUrl: imageUri,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const contextMessage = `[Recipe Context: Making "${recipe.title}"]\n\nUser shared a photo of their available ingredients. Identify what's in the photo and suggest substitutes for the recipe ingredients.`;

    try {
      const chatResult = await chatService.sendMessage(
        user.id,
        contextMessage,
        activeChild?.id,
        sessionId,
        imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : undefined,
        'recipe',
        mode
      );

      if (chatResult.success && chatResult.data) {
        if (chatResult.data.sessionId) setSessionId(chatResult.data.sessionId);

        const aiMessage: AssistantMessage = {
          id: chatResult.data.id,
          text: stripMarkdown(chatResult.data.response),
          isUser: false,
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error with image:', error);
    } finally {
      setIsLoading(false);
      scrollToEnd();
    }
  }, [user?.id, activeChild?.id, sessionId, recipe.title, mode, scrollToEnd]);

  return {
    messages,
    isLoading,
    scrollViewRef,
    sendText,
    sendPhoto,
    reset,
  };
}
