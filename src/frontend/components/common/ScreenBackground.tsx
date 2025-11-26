import React from 'react';
import { View, StyleSheet } from 'react-native';
import { THEME } from '@/src/lib/constants';

export const ScreenBackground = () => {
    return <View style={styles.container} />;
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: THEME.colors.background,
    },
});
