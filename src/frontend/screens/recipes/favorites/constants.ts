export type SortOption = 'recent' | 'alphabetical' | 'rating';
export type MealFilter = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealFilterOption {
  id: MealFilter;
  label: string;
  emoji: string;
}

export const MEAL_FILTERS: MealFilterOption[] = [
  { id: 'all', label: 'All', emoji: '🍽️' },
  { id: 'breakfast', label: 'Breakfast', emoji: '🍳' },
  { id: 'lunch', label: 'Lunch', emoji: '🥪' },
  { id: 'dinner', label: 'Dinner', emoji: '🥘' },
  { id: 'snack', label: 'Snacks', emoji: '🍎' },
];

export const SORT_CYCLE: SortOption[] = ['recent', 'alphabetical', 'rating'];

export const SORT_LABELS: Record<SortOption, string> = {
  recent: 'Recent',
  alphabetical: 'A-Z',
  rating: 'Rating',
};
