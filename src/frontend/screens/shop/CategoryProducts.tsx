import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';
import { shopService } from '@/src/services/shop/ShopService';
import { ShopProduct } from '@/src/types/shop';
import ProductCard from '../../components/shop/ProductCard';

export default function CategoryProducts() {
    const router = useRouter();
    const { slug, title } = useLocalSearchParams<{ slug: string; title: string }>();
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadProducts();
    }, [slug]);

    const loadProducts = async () => {
        setIsLoading(true);
        let data: ShopProduct[] = [];

        // Handle special slugs
        if (slug === 'top-rated') {
            data = await shopService.getTopRatedProducts(50);
        } else if (slug === 'popular') {
            data = await shopService.getPopularProducts(50);
        } else {
            data = await shopService.getProductsByCategory(slug, 50);
        }

        setProducts(data);
        setIsLoading(false);
    };

    const handleProductPress = async (product: ShopProduct) => {
        // Track click
        await shopService.trackClick(product.id, 'category_spotlight', 'category_page');

        // Open affiliate URL
        if (product.primary_affiliate?.affiliate_url) {
            Linking.openURL(product.primary_affiliate.affiliate_url);
        }
    };

    const renderProduct = ({ item, index }: { item: ShopProduct; index: number }) => (
        <View style={[styles.productWrapper, index % 2 === 0 ? styles.leftProduct : styles.rightProduct]}>
            <ProductCard
                product={item}
                variant="grid"
                onPress={() => handleProductPress(item)}
                index={index}
                showCategoryBadge={false}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={THEME.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title || 'Products'}</Text>
                <View style={styles.headerSpacer} />
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={THEME.colors.primary} />
                </View>
            ) : products.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No products found</Text>
                </View>
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={(item) => item.id}
                    renderItem={renderProduct}
                    numColumns={2}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    columnWrapperStyle={styles.row}
                />
            )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
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
    leftProduct: {
        // No additional margin needed
    },
    rightProduct: {
        // No additional margin needed
    },
});

