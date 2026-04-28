import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Search } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';
import SearchSuggestionsDropdown from '@/src/frontend/components/recipes/SearchSuggestionsDropdown';

interface RecipesSearchBarProps {
  query: string;
  onChangeQuery: (query: string) => void;
  onSubmit: () => void;
  recentSearches: string[];
  trendingSearches: string[];
  onSelectSearch: (query: string) => void;
  onClearHistory: () => void;
  onRemoveRecent: (query: string) => void;
}

const BLUR_DELAY_MS = 200;

export function RecipesSearchBar({
  query,
  onChangeQuery,
  onSubmit,
  recentSearches,
  trendingSearches,
  onSelectSearch,
  onClearHistory,
  onRemoveRecent,
}: RecipesSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleSelectFromDropdown = (selected: string) => {
    onSelectSearch(selected);
    setIsFocused(false);
  };

  const handleSubmit = () => {
    setIsFocused(false);
    onSubmit();
  };

  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Search size={20} color={THEME.colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes, ingredients..."
          placeholderTextColor={THEME.colors.text.secondary}
          value={query}
          onChangeText={onChangeQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), BLUR_DELAY_MS)}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
        />
      </View>

      <SearchSuggestionsDropdown
        visible={isFocused}
        recentSearches={recentSearches}
        trendingSearches={trendingSearches}
        onSelectSearch={handleSelectFromDropdown}
        onClearHistory={onClearHistory}
        onRemoveRecent={onRemoveRecent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.ui.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.ui.border,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.primary,
  },
});
