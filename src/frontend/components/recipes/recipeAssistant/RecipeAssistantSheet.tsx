import React, { useCallback, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { THEME } from '@/src/lib/constants';
import type { Recipe } from '@/src/lib/types/recipes';
import { SHEET_HEIGHT } from './constants';
import { AssistantMode } from './types';
import { useAssistantChat } from './hooks/useAssistantChat';
import { useIngredientChips } from './hooks/useIngredientChips';
import { useSheetAnimation } from './hooks/useSheetAnimation';
import { SheetHeader } from './components/SheetHeader';
import { MessageList } from './components/MessageList';
import { IngredientChipsRow } from './components/IngredientChipsRow';
import { ChatInputBar } from './components/ChatInputBar';

export interface RecipeAssistantSheetProps {
  visible: boolean;
  onClose: () => void;
  recipe: Recipe;
  mode?: AssistantMode;
}

export const RecipeAssistantSheet: React.FC<RecipeAssistantSheetProps> = ({
  visible,
  onClose,
  recipe,
  mode = 'ingredient',
}) => {
  const [inputText, setInputText] = useState('');

  const { messages, isLoading, scrollViewRef, sendText, sendPhoto, reset: resetChat } =
    useAssistantChat({ visible, recipe, mode });

  const { selected, toggle, reset: resetChips } = useIngredientChips({ setInputText });

  const handleClosed = useCallback(() => {
    resetChat();
    resetChips();
    setInputText('');
  }, [resetChat, resetChips]);

  const { slideAnim, fadeAnim } = useSheetAnimation({ visible, onClosed: handleClosed });

  const handleSend = useCallback(async () => {
    const text = inputText;
    setInputText('');
    await sendText(text);
  }, [inputText, sendText]);

  if (!visible) return null;

  const showChips = mode === 'ingredient' && messages.length <= 1;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.backdropTouch} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        <SheetHeader mode={mode} onClose={onClose} />

        <MessageList ref={scrollViewRef} messages={messages} isLoading={isLoading} />

        {showChips && (
          <IngredientChipsRow
            ingredients={recipe.ingredients}
            selected={selected}
            onToggle={toggle}
          />
        )}

        <ChatInputBar
          value={inputText}
          onChange={setInputText}
          onSend={handleSend}
          onTakePhoto={sendPhoto}
          isSending={isLoading}
        />
      </Animated.View>
    </View>
  );
};

export default RecipeAssistantSheet;

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
});
