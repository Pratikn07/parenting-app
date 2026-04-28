import React from 'react';
import { Pressable, StyleSheet, Alert, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
} from 'react-native-reanimated';
import { Heart } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';
import { useSavedProductsStore } from '@/src/shared/stores/savedProductsStore';
import { useAuthStore } from '@/src/shared/stores/authStore';

interface SaveButtonProps {
    productId: string;
    /** Defaults to 'overlay' (positioned absolute on top of an image). */
    variant?: 'overlay' | 'inline';
}

const AnimatedView = Animated.createAnimatedComponent(View);

export default function SaveButton({ productId, variant = 'overlay' }: SaveButtonProps) {
    const isSaved = useSavedProductsStore(s => s.ids.has(productId));
    const toggle = useSavedProductsStore(s => s.toggle);
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);

    const scale = useSharedValue(1);

    const wrapperStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePress = async () => {
        if (!isAuthenticated) {
            Alert.alert(
                'Sign in to save',
                'Create a free account to save products to your wishlist.',
                [{ text: 'OK' }]
            );
            return;
        }

        scale.value = withSequence(
            withSpring(0.85, { damping: 12, stiffness: 400 }),
            withSpring(1.12, { damping: 10, stiffness: 300 }),
            withSpring(1.0, { damping: 14, stiffness: 220 })
        );

        await toggle(productId);
    };

    return (
        <AnimatedView style={[styles.wrapper, variant === 'overlay' ? styles.overlay : styles.inline, wrapperStyle]}>
            <Pressable
                onPress={handlePress}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={isSaved ? 'Remove from saved' : 'Save product'}
                style={styles.pressable}
            >
                <Heart
                    size={18}
                    color={isSaved ? THEME.colors.primary : THEME.colors.text.primary}
                    fill={isSaved ? THEME.colors.primary : 'transparent'}
                    strokeWidth={2}
                />
            </Pressable>
        </AnimatedView>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
    },
    overlay: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    inline: {
        // No positioning, placed inline by parent
    },
    pressable: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
