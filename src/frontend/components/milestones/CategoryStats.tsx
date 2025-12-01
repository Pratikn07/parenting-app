import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../../../lib/constants';
import type { MilestoneStats } from '../../../services/milestones/MilestonesService';

interface CategoryStatsProps {
    stats: MilestoneStats;
}

const CATEGORY_INFO = {
    physical: { label: 'Physical', color: '#3B82F6', emoji: '💪' },
    cognitive: { label: 'Cognitive', color: '#8B5CF6', emoji: '🧠' },
    social: { label: 'Social', color: '#10B981', emoji: '👥' },
    emotional: { label: 'Emotional', color: '#F59E0B', emoji: '❤️' },
};

export const CategoryStats: React.FC<CategoryStatsProps> = ({ stats }) => {
    return (
        <View style={styles.container}>
            {(Object.keys(CATEGORY_INFO) as Array<keyof typeof CATEGORY_INFO>).map((category) => {
                const info = CATEGORY_INFO[category];
                const categoryStats = stats.byType[category];

                return (
                    <View key={category} style={styles.categoryCard}>
                        <View style={styles.categoryHeader}>
                            <Text style={styles.categoryEmoji}>{info.emoji}</Text>
                            <Text style={styles.categoryLabel}>{info.label}</Text>
                        </View>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${categoryStats.rate}%`,
                                        backgroundColor: info.color
                                    }
                                ]}
                            />
                        </View>
                        <Text style={styles.categoryCount}>
                            {categoryStats.completed}/{categoryStats.total}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginVertical: 16,
    },
    categoryCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    categoryEmoji: {
        fontSize: 18,
    },
    categoryLabel: {
        fontSize: 13,
        fontFamily: THEME.fonts.bodySemiBold,
        color: THEME.colors.text.primary,
    },
    progressBar: {
        height: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 6,
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    categoryCount: {
        fontSize: 11,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
    },
});
