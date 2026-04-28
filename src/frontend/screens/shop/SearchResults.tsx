import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    SafeAreaView,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    Linking,
    Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, X, Search as SearchIcon } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';
import { shopService } from '@/src/services/shop/ShopService';
import { ShopProduct } from '@/src/types/shop';
import ProductCard from '../../components/shop/ProductCard';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LEN = 2;

export default function SearchResults() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ShopProduct[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reqIdRef = useRef(0);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        const trimmed = query.trim();
        if (trimmed.length < MIN_QUERY_LEN) {
            setResults([]);
            setIsSearching(false);
            setHasSearched(false);
            return;
        }

        setIsSearching(true);
        debounceRef.current = setTimeout(async () => {
            const myReqId = ++reqIdRef.current;
            const data = await shopService.searchProducts(trimmed);
            if (myReqId !== reqIdRef.current) return;
            setResults(data);
            setIsSearching(false);
            setHasSearched(true);
        }, DEBOUNCE_MS);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    const handleProductPress = async (product: ShopProduct) => {
        await shopService.trackClick(product.id, 'search', 'shop');
        if (product.primary_affiliate?.affiliate_url) {
            Linking.openURL(product.primary_affiliate.affiliate_url);
        }
    };

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setHasSearched(false);
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
        if (isSearching) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={THEME.colors.primary} />
                </View>
            );
        }

        if (!hasSearched) {
            return (
                <View style={styles.centerContainer}>
                    <View style={styles.hintIconWrap}>
                        <SearchIcon size={28} color={THEME.colors.text.secondary} />
                    </View>
                    <Text style={styles.hintTitle}>Search the shop</Text>
                    <Text style={styles.hintBody}>
                        Try {'"bottle"'}, {'"sleep sack"'}, or {'"hatch"'}
                    </Text>
                </View>
            );
        }

        if (results.length === 0) {
            return (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyTitle}>No products match</Text>
                    <Text style={styles.emptyBody}>
                        Nothing found for {`"${query.trim()}"`}. Try a different word.
                    </Text>
                </View>
            );
        }

        return (
            <FlatList
                data={results}
                keyExtractor={item => item.id}
                renderItem={renderProduct}
                numColumns={2}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.row}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                onScrollBeginDrag={() => Keyboard.dismiss()}
                ListHeaderComponent={
                    <Text style={styles.resultsCount}>
                        {results.length} result{results.length === 1 ? '' : 's'} for {`"${query.trim()}"`}
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
                <View style={styles.inputWrap}>
                    <SearchIcon size={16} color={THEME.colors.text.secondary} />
                    <TextInput
                        style={styles.input}
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Search products..."
                        placeholderTextColor={THEME.colors.text.secondary}
                        autoFocus
                        returnKeyType="search"
                        autoCorrect={false}
                        autoCapitalize="none"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={handleClear} hitSlop={8}>
                            <X size={16} color={THEME.colors.text.secondary} />
                        </TouchableOpacity>
                    )}
                </View>
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
        gap: 10,
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
    inputWrap: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        height: 40,
        borderRadius: 20,
        backgroundColor: THEME.colors.ui.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    input: {
        flex: 1,
        fontSize: 14,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.primary,
        paddingVertical: 0,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        gap: 8,
    },
    hintIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(0,0,0,0.04)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    hintTitle: {
        fontSize: 17,
        fontFamily: THEME.fonts.header,
        color: THEME.colors.text.primary,
    },
    hintBody: {
        fontSize: 13,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
        textAlign: 'center',
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
