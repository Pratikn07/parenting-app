import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';

interface AnimatedLogoProps {
    width?: number;
    height?: number;
    onAnimationComplete?: () => void;
}

export default function AnimatedLogo({
    width = 200,
    height = 200,
    onAnimationComplete
}: AnimatedLogoProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Infinite slow reveal animation
        Animated.loop(
            Animated.sequence([
                // Slowly fade in (reveal)
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                // Hold at full opacity
                Animated.delay(1000),
                // Slowly fade out
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 3000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                // Brief pause before repeating
                Animated.delay(500),
            ])
        ).start();

        if (onAnimationComplete) {
            onAnimationComplete();
        }
    }, []);

    return (
        <View style={[styles.container, { width, height }]}>
            <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={styles.textLogo}>My Curated Haven</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    textLogo: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        fontFamily: 'System', // Using system font for now, can be updated to a custom font
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    }
});
