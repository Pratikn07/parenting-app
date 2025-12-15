import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Clock, TrendingUp, X } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';

interface SearchSuggestionsDropdownProps {
    visible: boolean;
    recentSearches: string[];
    trendingSearches: string[];
    onSelectSearch: (query: string) => void;
    onClearHistory?: () => void;
    onRemoveRecent?: (query: string) => void;
}

export default function SearchSuggestionsDropdown({
    visible,
    recentSearches,
    trendingSearches,
    onSelectSearch,
    onClearHistory,
    onRemoveRecent,
}: SearchSuggestionsDropdownProps) {
    if (!visible) return null;

    const hasRecentSearches = recentSearches.length > 0;
    const hasTrendingSearches = trendingSearches.length > 0;

    if (!hasRecentSearches && !hasTrendingSearches) {
        return null;
    }

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Recent Searches */}
                {hasRecentSearches && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recent Searches</Text>
                            {onClearHistory && (
                                <TouchableOpacity onPress={onClearHistory}>
                                    <Text style={styles.clearButton}>Clear</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {recentSearches.map((query, index) => (
                            <TouchableOpacity
                                key={`recent-${index}`}
                                style={styles.suggestionItem}
                                onPress={() => onSelectSearch(query)}
                            >
                                <Clock size={16} color={THEME.colors.text.secondary} />
                                <Text style={styles.suggestionText} numberOfLines={1}>
                                    {query}
                                </Text>
                                {onRemoveRecent && (
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            onRemoveRecent(query);
                                        }}
                                    >
                                        <X size={14} color={THEME.colors.text.secondary} />
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Trending Searches */}
                {hasTrendingSearches && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Trending Now</Text>
                        </View>
                        {trendingSearches.map((query, index) => (
                            <TouchableOpacity
                                key={`trending-${index}`}
                                style={styles.suggestionItem}
                                onPress={() => onSelectSearch(query)}
                            >
                                <TrendingUp size={16} color={THEME.colors.primary} />
                                <Text style={styles.suggestionText} numberOfLines={1}>
                                    {query}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60, // Below search bar
        left: 24,
        right: 24,
        backgroundColor: THEME.colors.ui.white,
        borderRadius: 16,
        maxHeight: 300,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 1000,
        borderWidth: 1,
        borderColor: THEME.colors.ui.border,
    },
    scrollView: {
        maxHeight: 300,
    },
    section: {
        paddingVertical: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    sectionTitle: {
        fontSize: 12,
        fontFamily: THEME.fonts.bodySemiBold,
        color: THEME.colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    clearButton: {
        fontSize: 12,
        fontFamily: THEME.fonts.bodyMedium,
        color: THEME.colors.primary,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    suggestionText: {
        flex: 1,
        fontSize: 15,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.primary,
    },
    removeButton: {
        padding: 4,
    },
});
