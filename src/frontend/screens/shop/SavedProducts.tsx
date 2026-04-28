import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    SafeAreaView,
    ActivityIndicator,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft, Heart } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';
import { shopService } from '@/src/services/shop/ShopService';
import { ShopProduct } from '@/src/types/shop';
import { useAuthStore } from '@/src/shared/stores/authStore';
import { useSavedProductsStore } from '@/src/shared/stores/savedProductsStore';
import ProductCard from '../../components/shop/ProductCard';

export default function SavedProducts() {
    const router = useRouter();
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);

    // Subscribe to the saved-ids Set so unsaving locally drops the card
    // from view *immediately* (filtered below). Avoids a race where a
    // post-toggle refetch hits the DB before the DELETE has committed.
    const savedIds = useSavedProductsStore(s => s.ids);

    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadProducts = useCallback(async () => {
        if (!isAuthenticated) {
            setProducts([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const data = await shopService.getSavedProducts();
        setProducts(data);
        setIsLoading(false);
    }, [isAuthenticated]);

    // Refresh on every screen focus (covers cross-device unsaves and
    // pulls fresh hydrated rows for cards saved from other surfaces).
    useFocusEffect(
        useCallback(() => {
            loadProducts();
        }, [loadProducts])
    );

    // Optimistic visibility: only show cards whose IDs are still in the
    // saved store. Unsaving (heart toggle) instantly removes the card
    // without waiting for the DB DELETE to round-trip.
    const visibleProducts = React.useMemo(
        () => products.filter(p => savedIds.has(p.id)),
        [products, savedIds]
    );

    const handleProductPress = async (product: ShopProduct) => {
        await shopService.trackClick(product.id, 'saved', 'shop');
        if (product.primary_affiliate?.affiliate_url) {
            Linking.openURL(product.primary_affiliate.affiliate_url);
        }
    };

    const renderProduct = ({ item, index }: { item: ShopProduct; index: number }) => (
        <View style={styles.productWrapper}>
            <ProductCard
                product={item}
                variant="grid"
                onPress={() => handleProductPress(item)}
                index={index}
                showCategoryBadge
            />
        </View>
    );

    const renderBody = () => {
        if (!isAuthenticated) {
            return (
                <View style={styles.centerContainer}>
                    <View style={styles.iconWrap}>
                        <Heart size={28} color={THEME.colors.text.secondary} />
                    </View>
                    <Text style={styles.emptyTitle}>Sign in to save products</Text>
                    <Text style={styles.emptyBody}>
                        Create a free account to keep a wishlist of products you want to revisit later.
                    </Text>
                </View>
            );
        }

        if (isLoading) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={THEME.colors.primary} />
                </View>
            );
        }

        if (visibleProducts.length === 0) {
            return (
                <View style={styles.centerContainer}>
                    <View style={styles.iconWrap}>
                        <Heart size={28} color={THEME.colors.text.secondary} />
                    </View>
                    <Text style={styles.emptyTitle}>No saved products yet</Text>
                    <Text style={styles.emptyBody}>
                        Tap the heart on any product to save it here for later.
                    </Text>
                </View>
            );
        }

        return (
            <FlatList
                data={visibleProducts}
                keyExtractor={item => item.id}
                renderItem={renderProduct}
                numColumns={2}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.row}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <Text style={styles.resultsCount}>
                        {visibleProducts.length} saved product{visibleProducts.length === 1 ? '' : 's'}
                    </Text>
                }
            />
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={THEME.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Saved</Text>
                <View style={styles.headerSpacer} />
            </View>

            {renderBody()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: THEME.colors.ui.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: THEME.fonts.header,
        color: THEME.colors.text.primary,
    },
    headerSpacer: {
        width: 40,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        gap: 8,
    },
    iconWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(0,0,0,0.04)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    emptyTitle: {
        fontSize: 17,
        fontFamily: THEME.fonts.header,
        color: THEME.colors.text.primary,
    },
    emptyBody: {
        fontSize: 13,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
        textAlign: 'center',
    },
    resultsCount: {
        fontSize: 12,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
        paddingBottom: 12,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 120,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    productWrapper: {
        width: '48%',
    },
});
