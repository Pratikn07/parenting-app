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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Mic, BookOpen, Heart, Calendar, Book, User, Paperclip } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../src/shared/stores/authStore';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  actions?: Array<{
    id: string;
    label: string;
    type: 'learn' | 'save' | 'track';
    icon: any;
  }>;
}

export default function ChatScreen() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi there! I'm here to support you on your parenting journey. Feel free to ask me anything about feeding, sleep, development, or any concerns you have. What would you like to know today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Get current time greeting
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Get user's first name
  const getUserFirstName = () => {
    if (!user?.name) return 'there';
    return user.name.split(' ')[0];
  };

  const sampleResponses = [
    {
      trigger: ['sleep', 'sleeping', 'nap'],
      response: "Sleep is so important for both you and your baby! At this stage, it's normal for sleep patterns to be unpredictable. Try establishing a gentle bedtime routine with dimmed lights and quiet activities. Remember, every baby is different, and you're doing great!",
      actions: [
        { id: '1', label: 'Sleep Tips', type: 'learn' as const, icon: BookOpen },
        { id: '2', label: 'Save Answer', type: 'save' as const, icon: Heart },
        { id: '3', label: 'Track Sleep', type: 'track' as const, icon: Calendar },
      ],
    },
    {
      trigger: ['feeding', 'eating', 'milk', 'breastfeeding'],
      response: "Feeding can feel overwhelming at first, but you're giving your baby exactly what they need. Whether you're breastfeeding, formula feeding, or doing both, trust your instincts. Look for hunger cues like rooting or sucking motions, and remember that cluster feeding is completely normal.",
      actions: [
        { id: '1', label: 'Feeding Guide', type: 'learn' as const, icon: BookOpen },
        { id: '2', label: 'Save Answer', type: 'save' as const, icon: Heart },
      ],
    },
  ];

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    // Find appropriate response
    const matchingResponse = sampleResponses.find(response =>
      response.trigger.some(trigger => 
        inputText.toLowerCase().includes(trigger.toLowerCase())
      )
    );

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: matchingResponse?.response || "Thank you for sharing that with me. Every parent's journey is unique, and it sounds like you're being so thoughtful about your baby's needs. While I'd love to give you specific advice, I'd recommend speaking with your pediatrician about this particular concern. In the meantime, trust your instincts - they're often right on target!",
      isUser: false,
      timestamp: new Date(),
      actions: matchingResponse?.actions,
    };

    setMessages(prev => [...prev, userMessage, botMessage]);
    setInputText('');
    
    // Scroll to bottom after a short delay
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleActionPress = (action: any) => {
    console.log('Action pressed:', action);
    
    if (action.type === 'save') {
      alert('Answer saved to your collection!');
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      console.log('Start recording');
    } else {
      console.log('Stop recording');
    }
  };

  const handlePhotoAttachment = () => {
    console.log('Photo attachment pressed');
    // TODO: Implement photo picker functionality
    alert('Photo attachment feature - coming soon!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{getTimeGreeting()}, {getUserFirstName()}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/resources')}
            activeOpacity={0.7}
          >
            <BookOpen size={24} color="#6B7280" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/settings')}
            activeOpacity={0.7}
          >
            <User size={20} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          
          {/* Temporary logout button for testing */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={async () => {
              const { logout } = useAuthStore.getState();
              await logout();
              router.replace('/launch');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

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
        >
          {messages.map((message) => (
            <View key={message.id}>
              <View style={[
                styles.messageContainer,
                message.isUser ? styles.userMessage : styles.botMessage
              ]}>
                <Text style={[
                  styles.messageText,
                  message.isUser ? styles.userMessageText : styles.botMessageText
                ]}>
                  {message.text}
                </Text>
              </View>
              
              {message.actions && (
                <View style={styles.actionsContainer}>
                  {message.actions.map((action) => (
                    <TouchableOpacity
                      key={action.id}
                      style={styles.actionButton}
                      onPress={() => handleActionPress(action)}
                      activeOpacity={0.7}
                    >
                      <action.icon size={16} color="#D4635A" strokeWidth={2} />
                      <Text style={styles.actionButtonText}>{action.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={handlePhotoAttachment}
              activeOpacity={0.7}
            >
              <Paperclip size={20} color="#6B7280" strokeWidth={2} />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="Ask me anything about parenting..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <View style={styles.inputActions}>
              <TouchableOpacity
                style={[styles.micButton, isRecording && styles.micButtonActive]}
                onPress={toggleRecording}
                activeOpacity={0.7}
              >
                <Mic 
                  size={20} 
                  color={isRecording ? "#FFFFFF" : "#6B7280"} 
                  strokeWidth={2} 
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                onPress={sendMessage}
                disabled={!inputText.trim()}
                activeOpacity={0.7}
              >
                <Send size={20} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF7F3',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D4635A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '85%',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  userMessage: {
    backgroundColor: '#D4635A',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 8,
  },
  botMessage: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  botMessageText: {
    color: '#1F2937',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 0,
    marginBottom: 16,
    marginTop: 8,
    maxWidth: '85%',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#D4635A',
    fontWeight: '500',
    marginLeft: 6,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
  },
  attachButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    maxHeight: 120,
    minHeight: 24,
    paddingTop: 0,
    paddingVertical: 4,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  micButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  micButtonActive: {
    backgroundColor: '#EF4444',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D4635A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
});
