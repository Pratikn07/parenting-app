import type { Recipe } from '@/src/lib/types/recipes';

export const ALLERGEN_LABELS: Record<string, string> = {
  milk: '🥛 Milk',
  eggs: '🥚 Eggs',
  wheat: '🌾 Wheat',
  soy: '🫘 Soy',
  peanuts: '🥜 Peanuts',
  tree_nuts: '🌰 Tree Nuts',
  fish: '🐟 Fish',
  shellfish: '🦐 Shellfish',
  sesame: '🌱 Sesame',
};

const FEEDING_TYPE_LABELS: Record<string, string> = {
  pregnancyNutrition: 'Pregnancy Nutrition',
  babyPurees: 'Baby Purées',
  fingerFoods: 'Baby-Led Weaning',
  toddlerMeals: 'Toddler Meals',
  familyDinners: 'Family Dinners',
  lunchboxIdeas: 'Lunchbox Ideas',
  treatsSnacks: 'Treats & Snacks',
};

const KITCHEN_STYLE_LABELS: Record<string, string> = {
  quick: 'Quick & Easy',
  confident: 'Chef Approved',
  batch: 'Batch Cooking',
  picky: 'Picky Eater Friendly',
  treats: 'Special Treats',
};

export function getRecipeTag(recipe: Recipe): string | null {
  if (recipe.feedingTypes && recipe.feedingTypes.length > 0) {
    const firstType = recipe.feedingTypes[0];
    return FEEDING_TYPE_LABELS[firstType] || null;
  }
  if (recipe.kitchenStyleTags && recipe.kitchenStyleTags.length > 0) {
    const firstStyle = recipe.kitchenStyleTags[0];
    return KITCHEN_STYLE_LABELS[firstStyle] || null;
  }
  return null;
}

export function makeTimeDisplay(mins: number): string {
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return `${hrs} hr ${m} min`;
  }
  return `${mins} min`;
}
