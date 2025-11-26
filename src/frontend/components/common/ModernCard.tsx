import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { THEME } from '@/src/lib/constants';

interface ModernCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

export const ModernCard: React.FC<ModernCardProps> = ({ children, style }) => {
    return (
        <View style={[styles.card, style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: THEME.colors.ui.white,
        borderRadius: THEME.layout.borderRadius.md,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
});
