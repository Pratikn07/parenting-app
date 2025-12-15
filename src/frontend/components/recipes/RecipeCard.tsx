import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Clock, Star, Heart } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';
import { Recipe } from '@/src/lib/types/recipes';

interface RecipeCardProps {
    recipe: Recipe;
    onPress: () => void;
    variant?: 'vertical' | 'horizontal';
    isSaved?: boolean;
    onToggleSave?: (id: string) => void;
}

export default function RecipeCard({ recipe, onPress, variant = 'horizontal', isSaved = false, onToggleSave }: RecipeCardProps) {
    const isHorizontal = variant === 'horizontal';

    const handleSave = () => {
        if (onToggleSave) {
            onToggleSave(recipe.id);
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.container,
                isHorizontal ? styles.horizontalContainer : styles.verticalContainer,
            ]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <View style={[styles.imageContainer, isHorizontal ? styles.horizontalImage : styles.verticalImage]}>
                <Image source={{ uri: recipe.imageUrl }} style={styles.image} resizeMode="cover" />
                <View style={styles.badgeContainer}>
                    <View style={styles.timeBadge}>
                        <Clock size={12} color={THEME.colors.text.light} strokeWidth={3} />
                        <Text style={styles.timeText}>{recipe.timeMinutes}m</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={[styles.saveButton, isSaved && styles.saveButtonActive]}
                    onPress={handleSave}
                >
                    <Heart
                        size={18}
                        color={isSaved ? THEME.colors.primary : THEME.colors.ui.white}
                        fill={isSaved ? THEME.colors.primary : 'transparent'}
                        strokeWidth={2.5}
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.headerRow}>
                    <Text style={styles.title} numberOfLines={2}>
                        {recipe.title}
                    </Text>
                </View>

                <View style={styles.metaRow}>
                    <View style={styles.ratingContainer}>
                        <Star size={14} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.ratingText}>{recipe.rating}</Text>
                    </View>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.difficultyText}>{recipe.difficulty}</Text>

                    {!!recipe.calories && (
                        <>
                            <Text style={styles.dot}>•</Text>
                            <Text style={styles.caloriesText}>{recipe.calories} kcal</Text>
                        </>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: THEME.colors.ui.white,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
        overflow: 'hidden',
    },
    horizontalContainer: {
        width: 280,
        marginRight: 16,
    },
    verticalContainer: {
        width: '100%',
        marginBottom: 20,
        flexDirection: 'column',
    },
    imageContainer: {
        position: 'relative',
        backgroundColor: THEME.colors.ui.border,
    },
    horizontalImage: {
        height: 160,
        width: '100%',
    },
    verticalImage: {
        height: 200,
        width: '100%',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    badgeContainer: {
        position: 'absolute',
        bottom: 12,
        left: 12,
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    timeText: {
        color: THEME.colors.text.light,
        fontSize: 12,
        fontFamily: THEME.fonts.bodySemiBold,
    },
    saveButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonActive: {
        backgroundColor: THEME.colors.ui.white,
    },
    content: {
        padding: 16,
    },
    headerRow: {
        marginBottom: 8,
    },
    title: {
        fontSize: 16,
        fontFamily: THEME.fonts.header,
        color: THEME.colors.text.primary,
        lineHeight: 22,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 13,
        fontFamily: THEME.fonts.bodySemiBold,
        color: THEME.colors.text.primary,
    },
    dot: {
        marginHorizontal: 6,
        color: THEME.colors.text.secondary,
    },
    difficultyText: {
        fontSize: 13,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
        textTransform: 'capitalize',
    },
    caloriesText: {
        fontSize: 13,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
    },
});
