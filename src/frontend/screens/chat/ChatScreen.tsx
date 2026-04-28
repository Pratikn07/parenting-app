import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useNavigation } from 'expo-router';

import { ScreenBackground } from '@/src/frontend/components/common/ScreenBackground';
import { ChildSelector } from '@/src/frontend/components/chat/ChildSelector';
import { ChatSidebar } from '@/src/frontend/components/chat/ChatSidebar';
import { ImagePicker } from '@/src/frontend/components/chat/ImagePicker';

import { useAuthStore } from '@/src/shared/stores/authStore';
import { useChildStore } from '@/src/shared/stores/childStore';
import { THEME } from '@/src/lib/constants';
import { getDevelopmentalStage } from '@/src/lib/dateUtils';
import { logger } from '@/src/lib/logger';

import { ChatHeader } from './components/ChatHeader';
import { ChatInputBar } from './components/ChatInputBar';
import { MessageBubble } from './components/MessageBubble';
import { useChatMessages } from './hooks/useChatMessages';
import { useChatSessions } from './hooks/useChatSessions';

export default function ChatScreen() {
  const { user, guestData } = useAuthStore();
  const navigation = useNavigation();
  const { children, setActiveChild } = useChildStore();

  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Lifted state — shared by both hooks to avoid circular deps
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Ref for loadSessions — set by sessions hook, called by messages hook
  // (sendMessage is user-triggered so the ref is always populated by the time it fires)
  const loadSessionsRef = useRef<() => Promise<void>>(async () => {});

  const selectedChild = children.find((c) => c.id === selectedChildId);
  const userFirstName = user?.name?.split(' ')[0] || 'there';

  // Auto-select first child on initial load and sync to global store
  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      const firstChildId = children[0].id;
      setSelectedChildId(firstChildId);
      setActiveChild(firstChildId);
    }
  }, [children, selectedChildId, setActiveChild]);

  // Hide tab bar while sidebar is open
  useEffect(() => {
    try {
      navigation.setOptions({
        tabBarStyle: { display: isSidebarVisible ? 'none' : 'flex' },
      });
    } catch (error) {
      logger.log('Navigation setOptions error:', error);
    }

    return () => {
      try {
        navigation.setOptions({ tabBarStyle: { display: 'flex' } });
      } catch {
        // silent cleanup error
      }
    };
  }, [isSidebarVisible, navigation]);

  const messages = useChatMessages({
    userId: user?.id,
    userFirstName,
    guestData,
    selectedChild,
    selectedChildId,
    currentSessionId,
    setCurrentSessionId,
    reloadSessions: () => loadSessionsRef.current(),
    isLoadingHistory,
    setIsLoadingHistory,
  });

  const sessionsHook = useChatSessions({
    userId: user?.id,
    hasGuestData: !!guestData,
    childCount: children.length,
    currentSessionId,
    setCurrentSessionId,
    setIsLoadingHistory,
    createWelcomeMessage: messages.createWelcomeMessage,
    setMessages: messages.setMessages,
    clearSelectedImage: messages.handleRemoveImage,
  });

  // Keep loadSessionsRef pointing at the latest loadSessions from the sessions hook
  useEffect(() => {
    loadSessionsRef.current = sessionsHook.loadSessions;
  }, [sessionsHook.loadSessions]);

  const handleChildSelect = (childId: string) => {
    if (childId === selectedChildId) return;

    setSelectedChildId(childId);
    setActiveChild(childId);
    const newChild = children.find((c) => c.id === childId);

    if (newChild) {
      const stage = newChild.birth_date
        ? getDevelopmentalStage(newChild.birth_date)
        : { label: 'Unknown', icon: '❓' };
      messages.setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          text: `✨ Switched context to ${newChild.name}. Asking about ${stage.label.toLowerCase()} sleep, feeding, and milestones.`,
          isUser: false,
          timestamp: new Date(),
          isSystem: true,
        },
      ]);
    }
  };

  const handleNewChatFromSidebar = () => {
    sessionsHook.handleNewChat();
    setIsSidebarVisible(false);
  };

  const handleProfilePress = () => {
    setIsSidebarVisible(false);
    setTimeout(() => router.push('/settings'), 300);
  };

  if (isLoadingHistory) {
    return (
      <View style={styles.container}>
        <ScreenBackground />
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text style={styles.loadingText}>Loading your conversation...</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenBackground />

      <SafeAreaView style={styles.safeArea}>
        <ChatHeader
          userName={user?.name}
          onMenuPress={() => setIsSidebarVisible(true)}
          onNewChat={sessionsHook.handleNewChat}
        />

        {children.length > 0 && (
          <ChildSelector
            children={children}
            selectedChildId={selectedChildId}
            onSelectChild={handleChildSelect}
          />
        )}

        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={messages.scrollViewRef}
            style={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={messages.scrollToBottom}
          >
            {messages.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                childName={selectedChild?.name}
                currentSessionId={currentSessionId}
              />
            ))}
          </ScrollView>

          <ChatInputBar
            inputText={messages.inputText}
            onChangeText={messages.setInputText}
            onSend={messages.sendMessage}
            isSending={messages.isSending}
            isRecording={isRecording}
            onToggleRecording={() => setIsRecording((prev) => !prev)}
            onAttachPhoto={() => setIsImagePickerVisible(true)}
            selectedImageUri={messages.selectedImageUri}
            onRemoveImage={messages.handleRemoveImage}
            isUploadingImage={messages.isUploadingImage}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>

      <ChatSidebar
        visible={isSidebarVisible}
        onClose={() => setIsSidebarVisible(false)}
        sessions={sessionsHook.sessions}
        currentSessionId={currentSessionId || undefined}
        onSelectSession={sessionsHook.handleSelectSession}
        onNewChat={handleNewChatFromSidebar}
        onDeleteSession={sessionsHook.handleDeleteSession}
        children={children}
        isLoading={sessionsHook.isLoadingSessions}
        user={user}
        onProfilePress={handleProfilePress}
      />

      <ImagePicker
        visible={isImagePickerVisible}
        onClose={() => setIsImagePickerVisible(false)}
        onImageSelected={messages.handleImageSelected}
        selectedImage={messages.selectedImageUri}
        onRemoveImage={messages.handleRemoveImage}
        isUploading={messages.isUploadingImage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: THEME.colors.text.secondary,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 60,
  },
});
