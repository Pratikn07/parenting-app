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
 * Handles both pipe (new) and colon (legacy) delimiters to prevent visual glitches
 */
export function parseProductCards(message: string): {
    textParts: string[];
    products: ProductCardData[];
} {
    // Match ANY product card tag (colon or pipe) to capture content
    const productRegex = /\[PRODUCT_CARD[:|](.+?)\]/g;
    const products: ProductCardData[] = [];
    const textParts: string[] = [];

    let lastIndex = 0;
    let match;

    while ((match = productRegex.exec(message)) !== null) {
        // Add text before this product card
        if (match.index > lastIndex) {
            textParts.push(message.slice(lastIndex, match.index));
        }

        const rawContent = match[1];
        let isValid = false;

        // Try pipe format (preferred/new)
        if (rawContent.includes('|')) {
            const parts = rawContent.split('|');
            // Expected: id|name|price|url|image
            if (parts.length >= 4) {
                products.push({
                    id: parts[0],
                    name: parts[1],
                    price: parts[2] || null,
                    affiliateUrl: parts[3],
                    imageUrl: parts[4] || null,
                });
                isValid = true;
            }
        }
        // Legacy colon format is consumed but ignored to prevent raw text display
        // (URLs with colons often break strict parsing in this format anyway)

        if (isValid) {
            textParts.push(`__PRODUCT_${products.length - 1}__`);
        }
        // If invalid, the tag is consumed from textParts (effectively hidden)

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
