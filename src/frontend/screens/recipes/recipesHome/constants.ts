export interface FilterOption {
  id: string;
  label: string;
  emoji: string;
}

export const MEAL_OPTIONS: FilterOption[] = [
  { id: 'all', label: 'All Meals', emoji: '🍽️' },
  { id: 'breakfast', label: 'Breakfast', emoji: '🍳' },
  { id: 'lunch', label: 'Lunch', emoji: '🥪' },
  { id: 'dinner', label: 'Dinner', emoji: '🥘' },
  { id: 'snack', label: 'Snacks', emoji: '🍎' },
];

export const CUISINE_OPTIONS: FilterOption[] = [
  { id: 'all', label: 'All Cuisines', emoji: '🌍' },
  { id: 'italian', label: 'Italian', emoji: '🍝' },
  { id: 'mexican', label: 'Mexican', emoji: '🌮' },
  { id: 'indian', label: 'Indian', emoji: '🍛' },
  { id: 'asian', label: 'Asian', emoji: '🥢' },
  { id: 'american', label: 'American', emoji: '🍔' },
];

export const FEED_PAGE_SIZE = 10;
export const FEATURED_LIMIT = 5;
