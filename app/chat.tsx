import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Mic, BookOpen, Paperclip, Menu, PenSquare, X } from 'lucide-react-native';
import { router, useNavigation } from 'expo-router';
import { useAuthStore } from '../src/shared/stores/authStore';
import { ScreenBackground } from '../src/frontend/components/common/ScreenBackground';
import { ChildSelector } from '../src/frontend/components/chat/ChildSelector';
import { ChatSidebar } from '../src/frontend/components/chat/ChatSidebar';
import { ImagePicker } from '../src/frontend/components/chat/ImagePicker';
import { ChatImageBubble } from '../src/frontend/components/chat/ChatImageBubble';
import { ProductCard, parseProductCards } from '../src/frontend/components/chat/ProductCard';

import { THEME } from '../src/lib/constants';
import { progressService, chatService, imageService, GroupedSessions, affiliateService } from '../src/services';
import { ChatMessage, Child, ChatSession } from '../src/lib/database.types';
import { getDevelopmentalStage } from '../src/lib/dateUtils';
import { useChildStore } from '../src/shared/stores/childStore';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
  isError?: boolean;
  imageUrl?: string;
  isSystem?: boolean;
}

const WELCOME_MESSAGE = "Hi there! I'm Bloom, your parenting companion. I remember details about your little ones and our past conversations. You can also share photos for me to analyze - just tap the 📎 button. What's on your mind today?";

export default function ChatScreen() {
  const { user, guestData } = useAuthStore();
  const navigation = useNavigation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Child context from global store (loaded in _layout.tsx)
  const { children, activeChild, setActiveChild } = useChildStore();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // Session state
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<GroupedSessions>({
    today: [],
    yesterday: [],
    lastWeek: [],
    older: [],
  });
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  // Hide tab bar when sidebar is open
  useEffect(() => {
    try {
      navigation.setOptions({
        tabBarStyle: {
          display: isSidebarVisible ? 'none' : 'flex'
        }
      });
    } catch (error) {
      console.log('Navigation setOptions error:', error);
    }

    // Cleanup function to ensure tab bar is visible when component unmounts
    return () => {
      try {
        navigation.setOptions({
          tabBarStyle: {
            display: 'flex'
          }
        });
      } catch (error) {
        // Silent cleanup error
      }
    };
  }, [isSidebarVisible, navigation]);

  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Image state
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  // Sync selectedChildId with activeChild from store
  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      const firstChildId = children[0].id;
      setSelectedChildId(firstChildId);
      setActiveChild(firstChildId);
    }
  }, [children]);

  // Get selected child object
  const selectedChild = children.find(c => c.id === selectedChildId);

  // Auto-send first message for Guests
  useEffect(() => {
    if (!user?.id && guestData && messages.length === 0) {
      const initialMessage = `Hi ${guestData.parentName}! I see you're navigating ${guestData.mainChallenge} with a ${guestData.childAge} old. How can I help you start?`;

      setMessages([{
        id: 'welcome-guest',
        text: initialMessage,
        isUser: false,
        timestamp: new Date(),
      }]);
      setIsLoadingHistory(false);
    }
  }, [user?.id, guestData]);

  // Load sessions and chat history on mount (children loaded globally)
  useEffect(() => {
    if (user?.id) {
      loadSessions();
    } else if (!guestData) {
      setMessages([createWelcomeMessage()]);
      setIsLoadingHistory(false);
    }
  }, [user?.id]);

  // Update welcome message when child is selected (only if it's the very first load)
  useEffect(() => {
    if (messages.length === 0 && selectedChild && !isLoadingHistory) {
      const stage = selectedChild.birth_date ? getDevelopmentalStage(selectedChild.birth_date) : { label: 'Unknown', icon: '❓' };
      const personalizedWelcome = `Hi ${getUserFirstName()}! Ready to tackle ${stage.label.toLowerCase()} life with ${selectedChild.name}? What's on your mind?`;

      setMessages([{
        id: 'welcome',
        text: personalizedWelcome,
        isUser: false,
        timestamp: new Date(),
      }]);
    }
  }, [selectedChild, isLoadingHistory]);

  const loadSessions = async () => {
    if (!user?.id) return;
    setIsLoadingSessions(true);
    try {
      const userSessions = await chatService.getSessions(user.id);
      setSessions(userSessions);

      const allSessions = [
        ...userSessions.today,
        ...userSessions.yesterday,
        ...userSessions.lastWeek,
        ...userSessions.older,
      ];

      if (allSessions.length > 0) {
        await loadSessionMessages(allSessions[0].id);
      } else {
        // Don't set generic welcome message here if we have children, 
        // let the personalized useEffect handle it
        if (children.length === 0) {
          setMessages([createWelcomeMessage()]);
        }
        setIsLoadingHistory(false);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      setMessages([createWelcomeMessage()]);
      setIsLoadingHistory(false);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    setIsLoadingHistory(true);
    try {
      const sessionMessages = await chatService.getSessionMessages(sessionId);
      setCurrentSessionId(sessionId);

      if (sessionMessages.length === 0) {
        // Don't set generic welcome message here if we have children
        if (children.length === 0) {
          setMessages([createWelcomeMessage()]);
        }
      } else {
        const uiMessages: Message[] = sessionMessages.map((msg: ChatMessage) => ({
          id: msg.id,
          text: msg.message,
          isUser: msg.is_from_user,
          timestamp: new Date(msg.created_at),
          imageUrl: msg.image_url || undefined,
        }));
        setMessages(uiMessages);
      }
    } catch (error) {
      console.error('Error loading session messages:', error);
      setMessages([createWelcomeMessage()]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const createWelcomeMessage = (): Message => ({
    id: 'welcome',
    text: WELCOME_MESSAGE,
    isUser: false,
    timestamp: new Date(),
  });

  const handleNewChat = async () => {
    if (!user?.id) return;
    setCurrentSessionId(null);
    // Don't reset to generic welcome immediately, let effect handle it or clear messages
    setMessages([]);
    setSelectedImageUri(null);

    // If we have a selected child, the effect will trigger a personalized welcome
    // If not, we might need a fallback
    if (children.length === 0) {
      setMessages([createWelcomeMessage()]);
    }
  };

  const handleSelectSession = async (session: ChatSession) => {
    await loadSessionMessages(session.id);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!user?.id) return;
    const success = await chatService.deleteSession(sessionId);
    if (success) {
      await loadSessions();
      if (currentSessionId === sessionId) {
        handleNewChat();
      }
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getUserFirstName = () => {
    if (!user?.name) return 'there';
    return user.name.split(' ')[0];
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleImageSelected = (uri: string) => {
    setSelectedImageUri(uri);
  };

  const handleRemoveImage = () => {
    setSelectedImageUri(null);
  };

  const sendMessage = async () => {
    // Allow sending if there's text OR an image
    if ((!inputText.trim() && !selectedImageUri) || isSending) return;
    if (!user?.id) {
      alert('Please sign in to chat');
      return;
    }

    const messageText = inputText.trim() || (selectedImageUri ? "What do you see in this image?" : "");
    const imageToSend = selectedImageUri;

    setInputText('');
    setSelectedImageUri(null);
    setIsSending(true);

    // Upload image first if present
    let uploadedImageUrl: string | undefined;
    if (imageToSend) {
      setIsUploadingImage(true);
      try {
        const uploadResult = await imageService.uploadImage(
          user.id,
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
        // Show error message
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          text: "Failed to upload image. Please try again.",
          isUser: false,
          timestamp: new Date(),
          isError: true,
        }]);
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

    setMessages(prev => [...prev, userMessage, typingMessage]);
    scrollToBottom();

    try {
      const result = await chatService.sendMessage(
        user.id,
        messageText,
        selectedChildId || undefined,
        currentSessionId || undefined,
        uploadedImageUrl
      );

      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'typing');

        if (result.success && result.data) {
          if (result.data.sessionId && result.data.sessionId !== currentSessionId) {
            setCurrentSessionId(result.data.sessionId);
            loadSessions();
          }

          return [...filtered, {
            id: result.data.id,
            text: result.data.response,
            isUser: false,
            timestamp: new Date(result.data.createdAt),
          }];
        } else {
          return [...filtered, {
            id: `error-${Date.now()}`,
            text: result.fallbackResponse || "I'm having trouble responding right now. Please try again.",
            isUser: false,
            timestamp: new Date(),
            isError: true,
          }];
        }
      });

      try {
        await progressService.logQuestionAsked(user.id, messageText);
      } catch (error) {
        console.error('Error logging question:', error);
      }

    } catch (error) {
      console.error('Error sending message:', error);

      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'typing');
        return [...filtered, {
          id: `error-${Date.now()}`,
          text: "Something went wrong. Please try again in a moment.",
          isUser: false,
          timestamp: new Date(),
          isError: true,
        }];
      });
    } finally {
      setIsSending(false);
      scrollToBottom();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const handlePhotoAttachment = () => {
    setIsImagePickerVisible(true);
  };

  const handleChildSelect = (childId: string) => {
    if (childId === selectedChildId) return;

    setSelectedChildId(childId);
    setActiveChild(childId); // Sync with global store
    const newChild = children.find(c => c.id === childId);

    if (newChild) {
      // Add system message for context switch
      const stage = newChild.birth_date ? getDevelopmentalStage(newChild.birth_date) : { label: 'Unknown', icon: '❓' };
      setMessages(prev => [...prev, {
        id: `system-${Date.now()}`,
        text: `✨ Switched context to ${newChild.name}. Asking about ${stage.label.toLowerCase()} sleep, feeding, and milestones.`,
        isUser: false,
        timestamp: new Date(),
        isSystem: true,
      }]);
    }
  };

  const renderTypingIndicator = () => (
    <View style={styles.typingContainer}>
      <View style={styles.typingDot} />
      <View style={[styles.typingDot, styles.typingDotMiddle]} />
      <View style={styles.typingDot} />
      {selectedChild && (
        <Text style={styles.typingText}>Thinking about {selectedChild.name}...</Text>
      )}
    </View>
  );

  const renderMessage = (message: Message) => {
    // System message
    if (message.isSystem) {
      return (
        <View style={styles.systemMessage}>
          <Text style={styles.systemMessageText}>{message.text}</Text>
        </View>
      );
    }

    // If message has an image, use ChatImageBubble
    if (message.imageUrl) {
      return (
        <ChatImageBubble
          imageUrl={message.imageUrl}
          message={message.text}
          isUser={message.isUser}
          timestamp={message.timestamp}
        />
      );
    }

    // Loading state
    if (message.isLoading) {
      return (
        <View style={[styles.messageBubble, styles.botMessage]}>
          {renderTypingIndicator()}
        </View>
      );
    }

    // User message
    if (message.isUser) {
      return (
        <View style={[styles.messageBubble, styles.userMessage]}>
          <Text style={styles.userMessageText}>{message.text}</Text>
        </View>
      );
    }

    // Bot message - check for product cards
    const { textParts, products } = parseProductCards(message.text);
    const hasProducts = products.length > 0;

    // Render bot message with inline product cards
    const renderMessageContent = () => {
      if (!hasProducts) {
        return (
          <Text style={[
            styles.botMessageText,
            message.isError && styles.errorMessageText
          ]}>{message.text}</Text>
        );
      }

      // Render text parts with product cards interspersed
      return textParts.map((part, index) => {
        // Check if this is a product placeholder
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
                  if (user?.id) {
                    affiliateService.trackClick(user.id, product.id, currentSessionId || undefined);
                  }
                }}
              />
            );
          }
        }
        // Regular text
        if (part.trim()) {
          return (
            <Text
              key={`text-${index}`}
              style={[
                styles.botMessageText,
                message.isError && styles.errorMessageText
              ]}
            >
              {part}
            </Text>
          );
        }
        return null;
      });
    };

    return (
      <View style={[
        styles.messageBubble,
        styles.botMessage,
        message.isError && styles.errorMessage
      ]}>
        {renderMessageContent()}
      </View>
    );
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setIsSidebarVisible(true)}
          >
            <Menu size={24} color="#3D405B" strokeWidth={2} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{getTimeGreeting()}, {getUserFirstName()}</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleNewChat}
            >
              <PenSquare size={22} color="#3D405B" strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push('/resources')}
            >
              <BookOpen size={22} color="#3D405B" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>



        {/* Child Selector */}
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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={scrollToBottom}
          >
            {messages.map((message) => (
              <View key={message.id} style={[
                styles.messageWrapper,
                message.isUser ? styles.userMessageWrapper :
                  message.isSystem ? styles.systemMessageWrapper : styles.botMessageWrapper
              ]}>
                {renderMessage(message)}
              </View>
            ))}
          </ScrollView>

          {/* Selected Image Preview */}
          {selectedImageUri && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={handleRemoveImage}
              >
                <X size={16} color="#FFF" strokeWidth={2} />
              </TouchableOpacity>
              {isUploadingImage && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color="#FFF" />
                </View>
              )}
            </View>
          )}

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TouchableOpacity
                style={[
                  styles.attachButton,
                  selectedImageUri && styles.attachButtonActive
                ]}
                onPress={handlePhotoAttachment}
              >
                <Paperclip size={20} color={selectedImageUri ? THEME.colors.primary : "#6B7280"} strokeWidth={2} />
              </TouchableOpacity>
              <TextInput
                style={styles.textInput}
                placeholder={selectedImageUri ? "Add a question about this photo..." : "Ask me anything..."}
                placeholderTextColor="#9CA3AF"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                editable={!isSending}
                onSubmitEditing={sendMessage}
              />
              <View style={styles.inputActions}>
                <TouchableOpacity
                  style={[styles.micButton, isRecording && styles.micButtonActive]}
                  onPress={toggleRecording}
                >
                  <Mic
                    size={20}
                    color={isRecording ? "#FFFFFF" : "#6B7280"}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!inputText.trim() && !selectedImageUri || isSending) && styles.sendButtonDisabled
                  ]}
                  onPress={sendMessage}
                  disabled={(!inputText.trim() && !selectedImageUri) || isSending}
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
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Sidebar */}
      <ChatSidebar
        visible={isSidebarVisible}
        onClose={() => setIsSidebarVisible(false)}
        sessions={sessions}
        currentSessionId={currentSessionId || undefined}
        onSelectSession={handleSelectSession}
        onNewChat={() => {
          handleNewChat();
          setIsSidebarVisible(false);
        }}
        onDeleteSession={handleDeleteSession}
        children={children}
        isLoading={isLoadingSessions}
        user={user}
        onProfilePress={() => {
          console.log('📱  Profile/Settings button pressed');
          console.log('📱 Sidebar visible:', isSidebarVisible);
          console.log('📱 Closing sidebar...');
          setIsSidebarVisible(false);
          setTimeout(() => {
            console.log('📱 Navigating to settings...');
            router.push('/settings');
            console.log('📱 Navigation complete');
          }, 300); // Add delay to ensure sidebar closes first
        }}
      />

      {/* Image Picker Modal */}
      <ImagePicker
        visible={isImagePickerVisible}
        onClose={() => setIsImagePickerVisible(false)}
        onImageSelected={handleImageSelected}
        selectedImage={selectedImageUri}
        onRemoveImage={handleRemoveImage}
        isUploading={isUploadingImage}
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
    paddingBottom: 100, // More space for floating glassmorphic tab bar
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FDFCF8',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: THEME.fonts.header,
    color: THEME.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 40,
  },
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
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
  botMessageText: {
    color: '#3D405B',
    fontSize: 16,
    lineHeight: 22,
  },
  errorMessageText: {
    color: '#991B1B',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 2,
    opacity: 0.4,
  },
  typingDotMiddle: {
    opacity: 0.7,
  },
  typingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
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
