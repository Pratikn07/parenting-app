import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle } from 'lucide-react-native';

import { THEME } from '@/src/lib/constants';
import { useAuthStore } from '@/src/shared/stores/authStore';
import { RecipeAssistantSheet } from '@/src/frontend/components/recipes/recipeAssistant/RecipeAssistantSheet';

import { AllergensSection } from './components/AllergensSection';
import { ChefTipsSection } from './components/ChefTipsSection';
import { IngredientsSection } from './components/IngredientsSection';
import { PreparationSection } from './components/PreparationSection';
import { ProgressFab } from './components/ProgressFab';
import { RecipeHero } from './components/RecipeHero';
import { RecipeMetaSection } from './components/RecipeMetaSection';
import { StickyTopNav } from './components/StickyTopNav';
import { StorageSection } from './components/StorageSection';
import { useRecipeData } from './hooks/useRecipeData';
import { useScrollFab } from './hooks/useScrollFab';

type AssistantMode = 'ingredient' | 'progress';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const { recipe, isLoading, isSaved, toggleSave } = useRecipeData({
    recipeId: id,
    userId: user?.id,
  });

  const { showFab, fabFadeAnim, setTriggerY, handleScroll } = useScrollFab();

  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('ingredient');

  const openAssistant = (mode: AssistantMode) => {
    setAssistantMode(mode);
    setShowAssistant(true);
  };

  const closeAssistant = () => {
    setShowAssistant(false);
    setTimeout(() => setAssistantMode('ingredient'), 300);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Loading recipe...</Text>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color={THEME.colors.text.secondary} />
        <Text style={styles.errorText}>Recipe not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonGeneric}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <RecipeHero imageUrl={recipe.imageUrl} />

        <View style={styles.contentContainer}>
          <RecipeMetaSection recipe={recipe} />

          <ChefTipsSection tips={recipe.tips} />

          <IngredientsSection
            ingredients={recipe.ingredients}
            servings={recipe.servings}
            onIngredientHelp={() => openAssistant('ingredient')}
          />

          <PreparationSection
            timeMinutes={recipe.timeMinutes}
            instructions={recipe.instructions}
            onLayout={(e) => setTriggerY(e.nativeEvent.layout.y)}
          />

          <AllergensSection allergens={recipe.allergens} />

          <StorageSection storage={recipe.storage} />
        </View>
      </ScrollView>

      <RecipeAssistantSheet
        visible={showAssistant}
        onClose={closeAssistant}
        recipe={recipe}
        mode={assistantMode}
      />

      <ProgressFab
        visible={showFab}
        fadeAnim={fabFadeAnim}
        onPress={() => openAssistant('progress')}
      />

      <StickyTopNav
        topInset={insets.top}
        isSaved={isSaved}
        onBack={() => router.back()}
        onToggleSave={toggleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingTop: 32,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.body,
  },
  backButtonGeneric: {
    padding: 12,
    backgroundColor: THEME.colors.ui.inputBg,
    borderRadius: 8,
  },
  backButtonText: {
    color: THEME.colors.primary,
    fontFamily: THEME.fonts.bodySemiBold,
  },
});
