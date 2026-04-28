import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Pressable } from 'react-native';
import { Star, ExternalLink } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    FadeIn,
    interpolate,
} from 'react-native-reanimated';
import { THEME } from '@/src/lib/constants';
import { ShopProduct } from '@/src/types/shop';
import SaveButton from './SaveButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ProductCardProps {
    product: ShopProduct;
    onPress: () => void;
    variant?: 'horizontal' | 'grid';
    index?: number;
    showCategoryBadge?: boolean;
    showSaveButton?: boolean;
}

// Category styling with labels
const categoryConfig: Record<string, { emoji: string; label: string; bgColor: string; textColor: string }> = {
    feeding: { emoji: '🍼', label: 'Feeding', bgColor: 'rgba(254, 226, 226, 0.9)', textColor: '#B45309' },
    sleep: { emoji: '💤', label: 'Sleep', bgColor: 'rgba(224, 231, 255, 0.9)', textColor: '#4338CA' },
    safety: { emoji: '🛡️', label: 'Safety', bgColor: 'rgba(209, 250, 229, 0.9)', textColor: '#047857' },
    toys: { emoji: '🧸', label: 'Toys', bgColor: 'rgba(254, 243, 199, 0.9)', textColor: '#B45309' },
    health: { emoji: '❤️', label: 'Health', bgColor: 'rgba(252, 231, 243, 0.9)', textColor: '#BE185D' },
    clothing: { emoji: '👕', label: 'Clothing', bgColor: 'rgba(219, 234, 254, 0.9)', textColor: '#1D4ED8' },
    travel: { emoji: '✈️', label: 'Travel', bgColor: 'rgba(224, 231, 255, 0.9)', textColor: '#4338CA' },
    nursery: { emoji: '🌼', label: 'Nursery', bgColor: 'rgba(254, 249, 195, 0.9)', textColor: '#A16207' },
};

export default function ProductCard({ product, onPress, variant = 'horizontal', index = 0, showCategoryBadge = true, showSaveButton = true }: ProductCardProps) {
    const isHorizontal = variant === 'horizontal';
    const cardWidth = isHorizontal ? 220 : (SCREEN_WIDTH - 52) / 2;

    // Animation values
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    // Format price
    const formattedPrice = product.price
        ? `$${product.price.toFixed(2)}`
        : 'View Price';

    // Get category config
    const category = product.category_slug
        ? categoryConfig[product.category_slug] || { emoji: '📦', label: 'Shop', bgColor: 'rgba(243, 244, 246, 0.9)', textColor: '#4B5563' }
        : { emoji: '📦', label: 'Shop', bgColor: 'rgba(243, 244, 246, 0.9)', textColor: '#4B5563' };

    // Get star rating
    const rating = product.rating ? parseFloat(String(product.rating)).toFixed(1) : '4.8';

    // Animated press style
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    };

    return (
        <AnimatedPressable
            entering={FadeIn.delay(index * 50).duration(400)}
            style={[
                styles.container,
                isHorizontal ? styles.horizontalContainer : styles.gridContainer,
                { width: cardWidth },
                animatedStyle,
            ]}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            {/* Image Section */}
            <View style={[styles.imageContainer, isHorizontal ? styles.horizontalImage : styles.gridImage]}>
                <Image
                    source={{ uri: product.image_url || 'https://via.placeholder.com/300' }}
                    style={styles.image}
                    resizeMode="contain"
                />

                {/* Subtle gradient overlay for depth */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.02)']}
                    style={styles.imageGradient}
                />

                {/* Glassmorphism Category Badge - Top Left (conditional) */}
                {showCategoryBadge && (
                    <View style={[styles.categoryBadge, { backgroundColor: category.bgColor }]}>
                        <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                        <Text style={[styles.categoryLabel, { color: category.textColor }]}>{category.label}</Text>
                    </View>
                )}

                {/* Save (heart) Button - Top Right (conditional) */}
                {showSaveButton && <SaveButton productId={product.id} />}
            </View>

            {/* Content Section */}
            <View style={styles.content}>
                {/* Product Name */}
                <Text style={styles.title} numberOfLines={2}>
                    {product.name}
                </Text>

                {/* Price Row - Prominent */}
                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>From</Text>
                    <Text style={styles.priceText}>{formattedPrice}</Text>
                </View>

                {/* Meta Row: Rating + Store */}
                <View style={styles.metaRow}>
                    <View style={styles.ratingContainer}>
                        <Star size={12} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.ratingText}>{rating}</Text>
                    </View>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.storeText} numberOfLines={1}>
                        {product.primary_affiliate?.affiliate_name || 'Amazon'}
                    </Text>
                </View>

                {/* Premium CTA Button with Gradient */}
                <Pressable onPress={onPress}>
                    <LinearGradient
                        colors={[THEME.colors.primary, '#D4694F']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.buyButton}
                    >
                        <Text style={styles.buyText}>View Deal</Text>
                        <ExternalLink size={13} color={THEME.colors.ui.white} strokeWidth={2.5} />
                    </LinearGradient>
                </Pressable>
            </View>
        </AnimatedPressable>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: THEME.colors.ui.white,
        borderRadius: 18,
        overflow: 'hidden',
        // Multi-layer shadow for premium depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
        elevation: 5,
        // Secondary shadow effect via border
        borderWidth: 0.5,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    horizontalContainer: {
        marginRight: 16,
    },
    gridContainer: {
        marginBottom: 16,
    },
    imageContainer: {
        position: 'relative',
        backgroundColor: '#FAFBFC',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        // Subtle inner border for polish
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.03)',
    },
    horizontalImage: {
        height: 160,
    },
    gridImage: {
        height: 140,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    categoryBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        // Glassmorphism effect
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    categoryEmoji: {
        fontSize: 12,
    },
    categoryLabel: {
        fontSize: 11,
        fontFamily: THEME.fonts.bodySemiBold,
        letterSpacing: 0.3,
    },
    content: {
        padding: 14,
    },
    title: {
        fontSize: 14,
        fontFamily: THEME.fonts.header,
        color: THEME.colors.text.primary,
        lineHeight: 19,
        marginBottom: 6,
        minHeight: 38,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
        marginBottom: 6,
    },
    priceLabel: {
        fontSize: 11,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
    },
    priceText: {
        fontSize: 18,
        fontFamily: THEME.fonts.header,
        color: THEME.colors.text.primary,
        letterSpacing: -0.3,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    ratingText: {
        fontSize: 12,
        fontFamily: THEME.fonts.bodySemiBold,
        color: THEME.colors.text.primary,
    },
    dot: {
        marginHorizontal: 6,
        color: THEME.colors.text.secondary,
        fontSize: 8,
    },
    storeText: {
        fontSize: 12,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
        textTransform: 'capitalize',
        flex: 1,
    },
    buyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 11,
        paddingHorizontal: 16,
        borderRadius: 12,
        // Subtle shadow on button
        shadowColor: THEME.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    buyText: {
        fontSize: 13,
        fontFamily: THEME.fonts.bodySemiBold,
        color: THEME.colors.ui.white,
        letterSpacing: 0.3,
    },
});
