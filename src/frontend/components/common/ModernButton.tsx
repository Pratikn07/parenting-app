import React from 'react';
import { StyleSheet, Text, Pressable, ViewStyle, TextStyle, StyleProp } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { THEME } from '@/src/lib/constants';

interface ModernButtonProps {
    onPress: () => void;
    title: string;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    variant?: 'primary' | 'secondary' | 'success';
    icon?: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ModernButton: React.FC<ModernButtonProps> = ({
    onPress,
    title,
    style,
    textStyle,
    variant = 'primary',
    icon,
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const handlePressIn = () => {
        scale.value = withSpring(0.98);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const isPrimary = variant === 'primary';
    const isSuccess = variant === 'success';

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[
                styles.container,
                isPrimary ? styles.primary : 
                isSuccess ? styles.success : 
                styles.secondary,
                style,
                animatedStyle,
            ]}
        >
            {icon}
            <Text
                style={[
                    styles.text,
                    isPrimary || isSuccess ? styles.primaryText : styles.secondaryText,
                    textStyle,
                    icon ? { marginLeft: 8 } : {},
                ]}
            >
                {title}
            </Text>
        </AnimatedPressable>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: THEME.layout.borderRadius.lg,
        paddingVertical: 16,
        paddingHorizontal: 32,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    primary: {
        backgroundColor: THEME.colors.primary,
        shadowColor: THEME.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    secondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: THEME.colors.primary,
    },
    success: {
        backgroundColor: THEME.colors.secondary,
        shadowColor: THEME.colors.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    text: {
        fontSize: 16,
        fontFamily: THEME.fonts.bodySemiBold,
        letterSpacing: 0.5,
    },
    primaryText: {
        color: THEME.colors.text.light,
    },
    secondaryText: {
        color: THEME.colors.primary,
    },
});
