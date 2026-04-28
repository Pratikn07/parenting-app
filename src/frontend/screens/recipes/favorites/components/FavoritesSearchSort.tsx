import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ArrowUpDown, Clock, Search, SortAsc } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { THEME } from '@/src/lib/constants';
import { SORT_LABELS, SortOption } from '../constants';

interface FavoritesSearchSortProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: SortOption;
  onCycleSort: () => void;
}

const SORT_ICONS: Record<SortOption, typeof Clock> = {
  recent: Clock,
  alphabetical: SortAsc,
  rating: ArrowUpDown,
};

export function FavoritesSearchSort({
  searchQuery,
  onSearchChange,
  sortBy,
  onCycleSort,
}: FavoritesSearchSortProps) {
  const SortIcon = SORT_ICONS[sortBy];

  return (
    <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.searchSortBar}>
      <View style={styles.searchBar}>
        <Search size={18} color={THEME.colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search favorites..."
          placeholderTextColor={THEME.colors.text.secondary}
          value={searchQuery}
          onChangeText={onSearchChange}
        />
      </View>
      <TouchableOpacity style={styles.sortButton} onPress={onCycleSort}>
        <SortIcon size={16} color={THEME.colors.primary} />
        <Text style={styles.sortButtonText}>{SORT_LABELS[sortBy]}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  searchSortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.ui.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: THEME.colors.ui.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.primary,
    padding: 0,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.ui.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: THEME.colors.ui.border,
  },
  sortButtonText: {
    fontSize: 14,
    fontFamily: THEME.fonts.bodyMedium,
    color: THEME.colors.primary,
  },
});
