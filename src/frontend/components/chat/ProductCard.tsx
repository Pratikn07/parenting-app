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
import { parseProductCards, type ProductCardData } from './parseProductCards';

export { parseProductCards };
export type { ProductCardData };

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
