import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Linking,
} from 'react-native';
import { ExternalLink } from 'lucide-react-native';
import { THEME } from '../../../lib/constants';

export interface ProductCardData {
    id: string;
    name: string;
    price: string | null;
    affiliateUrl: string;
    imageUrl: string | null;
}

interface ProductCardProps {
    product: ProductCardData;
    onPress?: () => void;
}

/**
 * ProductCard - Displays an affiliate product recommendation in chat
 * 
 * Renders as a compact, tappable card that opens the affiliate link.
 * Includes subtle disclosure for FTC compliance.
 */
export function ProductCard({ product, onPress }: ProductCardProps) {
    const handlePress = async () => {
        // Track click (optional callback)
        if (onPress) {
            onPress();
        }

        // Open affiliate link
        try {
            const canOpen = await Linking.canOpenURL(product.affiliateUrl);
            if (canOpen) {
                await Linking.openURL(product.affiliateUrl);
            }
        } catch (error) {
            console.error('Error opening product link:', error);
        }
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={handlePress}
            activeOpacity={0.8}
        >
            <View style={styles.content}>
                {product.imageUrl ? (
                    <Image
                        source={{ uri: product.imageUrl }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Text style={styles.imagePlaceholderText}>📦</Text>
                    </View>
                )}

                <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={2}>
                        {product.name}
                    </Text>
                    {product.price && (
                        <Text style={styles.price}>${product.price}</Text>
                    )}
                    <Text style={styles.disclosure}>
                        Affiliate link
                    </Text>
                </View>

                <View style={styles.action}>
                    <ExternalLink size={16} color={THEME.colors.primary} />
                    <Text style={styles.actionText}>View</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

/**
 * Parse product card markers from chat message
 * Format: [PRODUCT_CARD|id|name|price|url|image]
 * Using pipe delimiter to avoid conflicts with URLs
 */
export function parseProductCards(message: string): {
    textParts: string[];
    products: ProductCardData[];
} {
    const productRegex = /\[PRODUCT_CARD\|([^|]+)\|([^|]+)\|([^|]*)\|([^|]+)\|([^\]]*)\]/g;
    const products: ProductCardData[] = [];
    const textParts: string[] = [];

    let lastIndex = 0;
    let match;

    while ((match = productRegex.exec(message)) !== null) {
        // Add text before this product card
        if (match.index > lastIndex) {
            textParts.push(message.slice(lastIndex, match.index));
        }

        // Parse product data
        products.push({
            id: match[1],
            name: match[2],
            price: match[3] || null,
            affiliateUrl: match[4],
            imageUrl: match[5] || null,
        });

        // Add placeholder for product card position
        textParts.push(`__PRODUCT_${products.length - 1}__`);

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < message.length) {
        textParts.push(message.slice(lastIndex));
    }

    return { textParts, products };
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    image: {
        width: 56,
        height: 56,
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
    },
    imagePlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholderText: {
        fontSize: 24,
    },
    info: {
        flex: 1,
        marginLeft: 12,
    },
    name: {
        fontSize: 14,
        fontWeight: '600',
        color: THEME.colors.text.primary,
        lineHeight: 18,
    },
    price: {
        fontSize: 14,
        fontWeight: '700',
        color: THEME.colors.primary,
        marginTop: 2,
    },
    disclosure: {
        fontSize: 10,
        color: '#9CA3AF',
        marginTop: 4,
    },
    action: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FDF8F6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 8,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600',
        color: THEME.colors.primary,
        marginLeft: 4,
    },
});

export default ProductCard;
