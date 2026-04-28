import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';
import { ShopProduct, RecommendationSection } from '@/src/types/shop';
import ProductCard from './ProductCard';

interface ShopSectionProps {
    title: string;
    subtitle?: string;
    products: ShopProduct[];
    sectionType: RecommendationSection;
    onProductPress: (product: ShopProduct) => void;
    onViewAll?: () => void;
}

export default function ShopSection({
    title,
    subtitle,
    products,
    sectionType,
    onProductPress,
    onViewAll
}: ShopSectionProps) {
    if (products.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>{title}</Text>
                    {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>
                {onViewAll && (
                    <TouchableOpacity style={styles.viewAllButton} onPress={onViewAll}>
                        <Text style={styles.viewAllText}>View All</Text>
                        <ChevronRight size={16} color={THEME.colors.primary} />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={products}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                renderItem={({ item, index }) => (
                    <ProductCard
                        product={item}
                        variant="horizontal"
                        onPress={() => onProductPress(item)}
                        index={index}
                        showCategoryBadge={sectionType === 'top_rated' || sectionType === 'popular'}
                    />
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 32,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontFamily: THEME.fonts.header,
        color: THEME.colors.text.primary,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
        marginTop: 2,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    viewAllText: {
        fontSize: 14,
        fontFamily: THEME.fonts.bodySemiBold,
        color: THEME.colors.primary,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 4, // Space for shadow
    },
});
