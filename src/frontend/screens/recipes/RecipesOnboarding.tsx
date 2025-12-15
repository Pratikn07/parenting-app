import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRecipeOnboardingStore } from '@/src/shared/stores/recipeStore';
import { ScreenBackground } from '@/src/frontend/components/common/ScreenBackground';
import { THEME } from '@/src/lib/constants';
import SmartConfirmStep from './SmartConfirmStep';
import DietaryStep from './DietaryStep';
import KitchenStep from './KitchenStep';

export default function RecipesOnboarding() {
    const { currentStep } = useRecipeOnboardingStore();

    return (
        <View style={styles.container}>
            <ScreenBackground />
            <SafeAreaView style={styles.safeArea}>
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    {[1, 2, 3].map((step) => (
                        <View
                            key={step}
                            style={[
                                styles.progressDot,
                                step === currentStep && styles.progressDotActive,
                                step < currentStep && styles.progressDotComplete,
                            ]}
                        />
                    ))}
                </View>

                {/* Step Content */}
                {currentStep === 1 && <SmartConfirmStep />}
                {currentStep === 2 && <DietaryStep />}
                {currentStep === 3 && <KitchenStep />}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 24,
        gap: 12,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: THEME.colors.ui.border,
    },
    progressDotActive: {
        width: 24,
        backgroundColor: THEME.colors.primary,
    },
    progressDotComplete: {
        backgroundColor: THEME.colors.secondary,
    },
});
