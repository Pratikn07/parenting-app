import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
} from 'react-native';
import { X, Send, Camera, RefreshCw, ChefHat } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { THEME } from '@/src/lib/constants';
import { Recipe } from '@/src/lib/types/recipes';
import { chatService, ChatMessage } from '@/src/services/chat/ChatService';
import { useAuthStore } from '@/src/shared/stores/authStore';
import { useChildStore } from '@/src/shared/stores/childStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;

// Helper to strip markdown formatting from AI responses
const stripMarkdown = (text: string): string => {
    return text
        .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold **text**
        .replace(/\*(.*?)\*/g, '$1')      // Remove italic *text*
        .replace(/__(.*?)__/g, '$1')      // Remove bold __text__
        .replace(/_(.*?)_/g, '$1')        // Remove italic _text_
        .replace(/`(.*?)`/g, '$1')        // Remove inline code
        .replace(/^#+\s/gm, '')           // Remove headers
        .replace(/^-\s/gm, '• ');         // Replace - with bullet
};

interface RecipeAssistantSheetProps {
    visible: boolean;
    onClose: () => void;
    recipe: Recipe;
    mode?: 'ingredient' | 'progress';
}

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    imageUrl?: string;
}

export const RecipeAssistantSheet: React.FC<RecipeAssistantSheetProps> = ({
    visible,
    onClose,
    recipe,
    mode = 'ingredient',
}) => {
    const { user } = useAuthStore();
    const { activeChild } = useChildStore();

    const [slideAnim] = useState(new Animated.Value(SHEET_HEIGHT));
    const [fadeAnim] = useState(new Animated.Value(0));
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);  // NEW: Track multi-select
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | undefined>();
    const scrollViewRef = useRef<ScrollView>(null);

    // Initial greeting when sheet opens
    useEffect(() => {
        if (visible && messages.length === 0) {
            const greeting: Message = {
                id: 'greeting',
                text: mode === 'progress'
                    ? `How's your cooking going? 📸 Share a photo of what you're making and I'll help you out!`
                    : `Making ${recipe.title}? 🍳 Tap an ingredient below or tell me what you're missing!`,
                isUser: false,
            };
            setMessages([greeting]);
        }
    }, [visible, recipe.title, mode]);

    // Animation
    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    damping: 20,
                    stiffness: 150,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: SHEET_HEIGHT,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                // Clear messages when sheet closes to reset for next opening
                setMessages([]);
                setInputText('');
                setSelectedIngredients([]);  // Clear selections
            });
        }
    }, [visible]);

    const handleSend = async () => {
        if (!inputText.trim() || !user?.id || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            isUser: true,
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        // Add recipe context to the message
        const contextMessage = `[Recipe Context: Making "${recipe.title}" - Ingredients: ${recipe.ingredients.map(i => i.item).join(', ')}]\n\nUser: ${inputText.trim()}`;

        try {
            const result = await chatService.sendMessage(
                user.id,
                contextMessage,
                activeChild?.id,
                sessionId,
                undefined,
                'recipe',
                mode  // Pass current mode (ingredient or progress)
            );

            if (result.success && result.data) {
                if (result.data.sessionId) {
                    setSessionId(result.data.sessionId);
                }

                const aiMessage: Message = {
                    id: result.data.id,
                    text: stripMarkdown(result.data.response),
                    isUser: false,
                };
                setMessages(prev => [...prev, aiMessage]);
            } else {
                const errorMessage: Message = {
                    id: Date.now().toString() + '-error',
                    text: result.fallbackResponse || "I'm having trouble responding. Please try again.",
                    isUser: false,
                };
                setMessages(prev => [...prev, errorMessage]);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsLoading(false);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    const handleTakePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return;

        const pickerResult = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            base64: true,
        });

        if (!pickerResult.canceled && pickerResult.assets[0]) {
            const imageUri = pickerResult.assets[0].uri;
            const imageBase64 = pickerResult.assets[0].base64;

            const userMessage: Message = {
                id: Date.now().toString(),
                text: "Here's what I have in my kitchen:",
                isUser: true,
                imageUrl: imageUri,
            };

            setMessages(prev => [...prev, userMessage]);
            setIsLoading(true);

            // Send image to AI (base64)
            const contextMessage = `[Recipe Context: Making "${recipe.title}"]\n\nUser shared a photo of their available ingredients. Identify what's in the photo and suggest substitutes for the recipe ingredients.`;

            try {
                const chatResult = await chatService.sendMessage(
                    user!.id,
                    contextMessage,
                    activeChild?.id,
                    sessionId,
                    imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : undefined,
                    'recipe',
                    mode  // Pass current mode for photo analysis
                );

                if (chatResult.success && chatResult.data) {
                    if (chatResult.data.sessionId) setSessionId(chatResult.data.sessionId);

                    const aiMessage: Message = {
                        id: chatResult.data.id,
                        text: stripMarkdown(chatResult.data.response),
                        isUser: false,
                    };
                    setMessages(prev => [...prev, aiMessage]);
                }
            } catch (error) {
                console.error('Error with image:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleIngredientChip = (ingredient: string) => {
        setSelectedIngredients(prev => {
            const isSelected = prev.includes(ingredient);
            if (isSelected) {
                // Remove if already selected
                const updated = prev.filter(i => i !== ingredient);
                // Update input text
                if (updated.length === 0) {
                    setInputText('');
                } else if (updated.length === 1) {
                    setInputText(`I don't have ${updated[0]}`);
                } else {
                    setInputText(`I don't have ${updated.join(', ')}`);
                }
                return updated;
            } else {
                // Add to selection
                const updated = [...prev, ingredient];
                // Update input text
                if (updated.length === 1) {
                    setInputText(`I don't have ${ingredient}`);
                } else {
                    setInputText(`I don't have ${updated.join(', ')}`);
                }
                return updated;
            }
        });
    };

    if (!visible) return null;

    return (
        <View style={styles.container}>
            {/* Backdrop */}
            <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
                <TouchableOpacity style={styles.backdropTouch} onPress={onClose} />
            </Animated.View>

            {/* Sheet */}
            <Animated.View
                style={[
                    styles.sheet,
                    { transform: [{ translateY: slideAnim }] },
                ]}
            >
                {/* Handle */}
                <View style={styles.handleContainer}>
                    <View style={styles.handle} />
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        {mode === 'progress' ? (
                            <ChefHat size={20} color={THEME.colors.primary} />
                        ) : (
                            <RefreshCw size={20} color={THEME.colors.primary} />
                        )}
                        <Text style={styles.headerTitle}>
                            {mode === 'progress' ? 'Cooking Progress' : 'Ingredient Help'}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={20} color={THEME.colors.text.secondary} />
                    </TouchableOpacity>
                </View>

                {/* Messages */}
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    showsVerticalScrollIndicator={false}
                >
                    {messages.map((msg) => (
                        <View
                            key={msg.id}
                            style={[
                                styles.messageBubble,
                                msg.isUser ? styles.userBubble : styles.aiBubble,
                            ]}
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

                {/* Quick Ingredient Chips - Only show in ingredient mode */}
                {messages.length <= 1 && mode === 'ingredient' && (
                    <View style={styles.chipsContainer}>
                        {recipe.ingredients.slice(0, 5).map((ing, idx) => {
                            const isSelected = selectedIngredients.includes(ing.item);
                            return (
                                <TouchableOpacity
                                    key={idx}
                                    style={[styles.chip, isSelected && styles.chipSelected]}
                                    onPress={() => handleIngredientChip(ing.item)}
                                >
                                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                                        {ing.item}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* Input */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={20}
                >
                    <View style={styles.inputContainer}>
                        <TouchableOpacity style={styles.cameraButton} onPress={handleTakePhoto}>
                            <Camera size={22} color={THEME.colors.primary} />
                        </TouchableOpacity>
                        <TextInput
                            style={styles.input}
                            placeholder="Type or take a photo..."
                            placeholderTextColor={THEME.colors.text.secondary}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                            onPress={handleSend}
                            disabled={!inputText.trim() || isLoading}
                        >
                            <Send size={20} color={inputText.trim() ? '#FFF' : THEME.colors.text.secondary} />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backdropTouch: {
        flex: 1,
    },
    sheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: SHEET_HEIGHT,
        backgroundColor: THEME.colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 20,
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: THEME.colors.ui.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.ui.border,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: THEME.fonts.header,
        color: THEME.colors.text.primary,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: THEME.colors.ui.inputBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
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
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: THEME.colors.ui.border,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: THEME.colors.ui.inputBg,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: THEME.colors.ui.border,
    },
    chipText: {
        fontSize: 14,
        color: THEME.colors.text.primary,
        fontFamily: THEME.fonts.bodyMedium,
    },
    chipSelected: {
        backgroundColor: THEME.colors.primary,
        borderColor: THEME.colors.primary,
    },
    chipTextSelected: {
        color: '#FFFFFF',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: 24,
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: THEME.colors.ui.border,
        backgroundColor: THEME.colors.background,
    },
    cameraButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: THEME.colors.ui.inputBg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: THEME.colors.ui.border,
    },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 100,
        backgroundColor: THEME.colors.ui.inputBg,
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.primary,
        borderWidth: 1,
        borderColor: THEME.colors.ui.border,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: THEME.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: THEME.colors.ui.inputBg,
    },
});

export default RecipeAssistantSheet;
