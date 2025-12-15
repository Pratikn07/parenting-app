export type FeedingType =
    | 'pregnancyNutrition'
    | 'babyPurees'
    | 'fingerFoods'
    | 'toddlerMeals'
    | 'familyDinners'
    | 'lunchboxIdeas'
    | 'treatsSnacks';

export type DietaryNeed =
    | 'dairy-free'
    | 'gluten-free'
    | 'nut-free'
    | 'vegetarian'
    | 'vegan'
    | 'egg-free'
    | 'breastfeeding'
    | 'pregnancy';

export type KitchenStyle =
    | 'quick'
    | 'confident'
    | 'batch'
    | 'picky'
    | 'treats';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type CuisineType = 'italian' | 'mexican' | 'indian' | 'asian' | 'mediterranean' | 'american';

export interface Recipe {
    id: string;
    title: string;
    description: string;
    imageUrl: string;

    // Filtering Attributes
    ageRange: { min: number; max: number }; // In months
    feedingTypes: FeedingType[];
    dietaryTags: DietaryNeed[];
    kitchenStyleTags: KitchenStyle[];
    mealTypes: MealType[];
    cuisine?: CuisineType;

    // Metadata
    timeMinutes: number;
    difficulty: 'easy' | 'medium' | 'hard';
    servings?: number;
    calories?: number;
    rating: number; // 0-5

    // Details
    ingredients: {
        item: string;
        amount: string;
    }[];
    instructions: string[];
    tips?: string[];

    // Safety & Storage
    allergens?: string[];  // milk, eggs, wheat, soy, peanuts, tree_nuts, fish, shellfish, sesame
    storage?: string;      // Storage instructions
    imageDescription?: string; // For AI image generation
}
