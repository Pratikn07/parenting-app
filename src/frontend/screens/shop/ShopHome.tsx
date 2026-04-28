import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, SafeAreaView, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { Search, ShoppingBag } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { THEME } from '@/src/lib/constants';
import { shopService } from '@/src/services/shop/ShopService';
import { ShopProduct, RecommendationSection } from '@/src/types/shop';
import ShopSection from '../../components/shop/ShopSection';

interface SectionData {
    feeding: ShopProduct[];
    sleep: ShopProduct[];
    safety: ShopProduct[];
    toys: ShopProduct[];
    topRated: ShopProduct[];
    popular: ShopProduct[];
}

// Category styling with labels
const categoryConfig: Record<string, { emoji: string; label: string; bgColor: string; textColor: string }> = {
    feeding: { emoji: '🍼', label: 'Feeding', bgColor: 'rgba(254, 226, 226, 0.9)', textColor: '#B45309' },
    sleep: { emoji: '💤', label: 'Sleep', bgColor: 'rgba(224, 231, 255, 0.9)', textColor: '#4338CA' },
    safety: { emoji: '🛡️', label: 'Safety', bgColor: 'rgba(209, 250, 229, 0.9)', textColor: '#047857' },
    toys: { emoji: '🧸', label: 'Toys', bgColor: 'rgba(254, 243, 199, 0.9)', textColor: '#B45309' },
    health: { emoji: '❤️', label: 'Health', bgColor: 'rgba(252, 231, 243, 0.9)', textColor: '#BE185D' },
};

export default function ShopHome() {
    const router = useRouter();
    const [sections, setSections] = useState<SectionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        loadSections();
    }, []);

    const loadSections = async () => {
        setIsLoading(true);
        const data = await shopService.getShopHomeSections();
        setSections(data);
        setIsLoading(false);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadSections();
        setIsRefreshing(false);
    };

    const handleProductPress = async (product: ShopProduct, sectionType: RecommendationSection) => {
        // Track click
        await shopService.trackClick(product.id, sectionType, 'shop');

        // Open affiliate URL
        if (product.primary_affiliate?.affiliate_url) {
            Linking.openURL(product.primary_affiliate.affiliate_url);
        }
    };

    const handleViewAll = (categorySlug: string, title: string) => {
        router.push({
            pathname: '/shop/category/[slug]',
            params: { slug: categorySlug, title }
        });
    };

    if (isLoading || !sections) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={THEME.colors.primary} />
                    <Text style={styles.loadingText}>Loading curated picks...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcomeText}>Curated Shop</Text>
                        <Text style={styles.subtitle}>Handpicked essentials for your little one</Text>
                    </View>
                    <TouchableOpacity style={styles.iconButton}>
                        <Search size={22} color={THEME.colors.text.primary} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor={THEME.colors.primary}
                        />
                    }
                >
                    {/* Category Quick Access (Instagram-style) */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoryScroll}
                    >
                        {Object.entries(categoryConfig).map(([slug, config]) => (
                            <TouchableOpacity
                                key={slug}
                                style={styles.categoryCircleItem}
                                onPress={() => handleViewAll(slug, config.label + ' Essentials')}
                            >
                                <View style={[styles.categoryCircle, { backgroundColor: config.bgColor }]}>
                                    <Text style={styles.categoryCircleEmoji}>{config.emoji}</Text>
                                </View>
                                <Text style={styles.categoryCircleLabel} numberOfLines={1}>{config.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Trust Strip */}
                    <View style={styles.trustStrip}>
                        {[
                            { label: 'Parent Tested' },
                            { label: 'Safety-First' },
                            { label: 'Curated Daily' }
                        ].map((item, index) => (
                            <View key={item.label} style={styles.trustItem}>
                                {index > 0 && <View style={styles.dotSeparator} />}
                                <Text style={styles.trustText}>{item.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Top Rated Section */}
                    {sections.topRated.length > 0 && (
                        <ShopSection
                            title="⭐ Top Rated"
                            subtitle="Highest rated by parents"
                            products={sections.topRated}
                            sectionType="top_rated"
                            onProductPress={(p) => handleProductPress(p, 'top_rated')}
                            onViewAll={() => handleViewAll('top-rated', 'Top Rated')}
                        />
                    )}

                    {/* Feeding Essentials */}
                    {sections.feeding.length > 0 && (
                        <ShopSection
                            title="🍼 Feeding Essentials"
                            subtitle="Bottles, high chairs, and more"
                            products={sections.feeding}
                            sectionType="category_spotlight"
                            onProductPress={(p) => handleProductPress(p, 'category_spotlight')}
                            onViewAll={() => handleViewAll('feeding', 'Feeding Essentials')}
                        />
                    )}

                    {/* Sleep Section */}
                    {sections.sleep.length > 0 && (
                        <ShopSection
                            title="💤 Sleep Solutions"
                            subtitle="For restful nights"
                            products={sections.sleep}
                            sectionType="category_spotlight"
                            onProductPress={(p) => handleProductPress(p, 'category_spotlight')}
                            onViewAll={() => handleViewAll('sleep', 'Sleep Solutions')}
                        />
                    )}

                    {/* Promo Banner */}
                    <View style={styles.promoBanner}>
                        <View style={styles.promoContent}>
                            <ShoppingBag size={28} color={THEME.colors.ui.white} />
                            <View style={styles.promoTextContainer}>
                                <Text style={styles.promoTitle}>Safe & Tested</Text>
                                <Text style={styles.promoSubtitle}>Every product is vetted by parents like you</Text>
                            </View>
                        </View>
                    </View>

                    {/* Safety Section */}
                    {sections.safety.length > 0 && (
                        <ShopSection
                            title="🛡️ Safety First"
                            subtitle="Baby proofing and protection"
                            products={sections.safety}
                            sectionType="category_spotlight"
                            onProductPress={(p) => handleProductPress(p, 'category_spotlight')}
                            onViewAll={() => handleViewAll('safety', 'Safety Products')}
                        />
                    )}

                    {/* Toys & Development */}
                    {sections.toys.length > 0 && (
                        <ShopSection
                            title="🧸 Toys & Development"
                            subtitle="Age-appropriate learning aids"
                            products={sections.toys}
                            sectionType="category_spotlight"
                            onProductPress={(p) => handleProductPress(p, 'category_spotlight')}
                            onViewAll={() => handleViewAll('toys', 'Toys & Development')}
                        />
                    )}

                    {/* Parent Favorites */}
                    {sections.popular.length > 0 && (
                        <ShopSection
                            title="❤️ Parent Favorites"
                            subtitle="Most loved by our community"
                            products={sections.popular}
                            sectionType="popular"
                            onProductPress={(p) => handleProductPress(p, 'popular')}
                            onViewAll={() => handleViewAll('popular', 'Parent Favorites')}
                        />
                    )}

                    {/* Bottom padding for tab bar */}
                    <View style={{ height: 100 }} />
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 16,
    },
    welcomeText: {
        fontSize: 28,
        fontFamily: THEME.fonts.header,
        color: THEME.colors.text.primary,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
        marginTop: 2,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: THEME.colors.ui.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    scrollContent: {
        paddingTop: 8,
    },
    categoryScroll: {
        paddingHorizontal: 20,
        paddingBottom: 24,
        gap: 20,
    },
    categoryCircleItem: {
        alignItems: 'center',
        width: 70,
    },
    categoryCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    categoryCircleEmoji: {
        fontSize: 24,
    },
    categoryCircleLabel: {
        fontSize: 12,
        fontFamily: THEME.fonts.bodySemiBold,
        color: THEME.colors.text.primary,
        textAlign: 'center',
    },
    trustStrip: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(224, 122, 95, 0.05)',
        marginHorizontal: 20,
        borderRadius: 12,
        marginBottom: 32,
    },
    trustItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dotSeparator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: THEME.colors.primary,
        opacity: 0.5,
    },
    trustText: {
        fontSize: 11,
        fontFamily: THEME.fonts.bodySemiBold,
        color: THEME.colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    promoBanner: {
        marginHorizontal: 20,
        marginVertical: 24,
        height: 90,
        borderRadius: 20,
        backgroundColor: THEME.colors.secondary,
        justifyContent: 'center',
        paddingHorizontal: 20,
        shadowColor: THEME.colors.secondary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 4,
    },
    promoContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    promoTextContainer: {
        flex: 1,
    },
    promoTitle: {
        fontSize: 18,
        fontFamily: THEME.fonts.header,
        color: THEME.colors.ui.white,
    },
    promoSubtitle: {
        fontSize: 13,
        fontFamily: THEME.fonts.body,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 2,
    },
});
