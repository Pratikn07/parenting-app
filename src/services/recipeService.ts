import { supabase } from '@/src/lib/supabase';
import { Recipe } from '@/src/lib/types/recipes';

// Fetch all recipes from Supabase
// Fetch recipes with pagination for efficiency
export async function getRecipes(page = 1, limit = 10): Promise<Recipe[]> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
        .from('recipes')
        .select('id, title, image_url, rating, time_minutes, difficulty, age_range_min, age_range_max, dietary_tags, kitchen_style_tags, meal_types, cuisine')
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        console.error('Error fetching recipes:', error);
        return [];
    }

    // Transform DB format to Recipe interface
    return (data || []).map(item => transformRecipe({
        ...item,
        // Provide defaults for missing fields in the summary view
        description: '',
        ingredients: [],
        instructions: [],
        tips: [],
        servings: 2,
        calories: 0,
        feeding_types: []
    }));
}

// Fetch recipes with filters and pagination
export async function getFilteredRecipes(filters: {
    feedingTypes?: string[];
    dietaryNeeds?: string[];
    mealType?: string;
    cuisine?: string;
    minAge?: number;
    maxAge?: number;
    searchQuery?: string;
    kitchenStyleTags?: string[]; // Added
    page?: number;
    limit?: number;
}): Promise<Recipe[]> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from('recipes')
        .select('id, title, image_url, rating, time_minutes, difficulty, age_range_min, age_range_max, dietary_tags, kitchen_style_tags, meal_types, cuisine')
        .range(from, to);

    // Age range filter
    if (filters.minAge !== undefined) {
        query = query.lte('age_range_min', filters.minAge);
    }
    if (filters.maxAge !== undefined) {
        query = query.gte('age_range_max', filters.maxAge);
    }

    // Meal type filter
    if (filters.mealType && filters.mealType !== 'all') {
        query = query.contains('meal_types', [filters.mealType]);
    }

    // Cuisine filter
    if (filters.cuisine && filters.cuisine !== 'all') {
        query = query.eq('cuisine', filters.cuisine);
    }

    // Feeding Types (Array filter)
    if (filters.feedingTypes && filters.feedingTypes.length > 0) {
        query = query.contains('feeding_types', filters.feedingTypes);
    }

    // Dietary Needs (Array filter)
    if (filters.dietaryNeeds && filters.dietaryNeeds.length > 0) {
        query = query.contains('dietary_tags', filters.dietaryNeeds);
    }

    // Kitchen Style (Overlap filter)
    if (filters.kitchenStyleTags && filters.kitchenStyleTags.length > 0) {
        query = query.overlaps('kitchen_style_tags', filters.kitchenStyleTags);
    }

    // Text search (searches title, description, and ingredients using RPC)
    if (filters.searchQuery) {
        // Use custom RPC function that properly searches within ingredients array
        const { data: searchResults, error: searchError } = await supabase
            .rpc('search_recipes_with_ingredients', { search_term: filters.searchQuery });

        if (searchError) {
            // Fallback to basic search if RPC fails (function not yet created)
            console.log('RPC function not available, using basic search');
            query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
        } else if (searchResults && searchResults.length > 0) {
            // Filter by recipe IDs returned from RPC
            const recipeIds = searchResults.map((r: any) => r.id);
            query = query.in('id', recipeIds);
        } else {
            // No results from RPC, return empty
            return [];
        }
    }

    const { data, error } = await query.order('rating', { ascending: false });

    if (error) {
        console.error('Error fetching filtered recipes:', error);
        return [];
    }

    return (data || []).map(item => transformRecipe({
        ...item,
        description: '', // Default
        ingredients: [],
        instructions: [],
        tips: [],
        servings: 2,
        calories: 0,
        feeding_types: []
    }));
}

// Fetch a single recipe by ID
export async function getRecipeById(id: string): Promise<Recipe | null> {
    const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching recipe:', error);
        return null;
    }

    return data ? transformRecipe(data) : null;
}

// Transform database row to Recipe interface
function transformRecipe(row: any): Recipe {
    return {
        id: row.id,
        title: row.title,
        description: row.description || '',
        imageUrl: row.image_url || 'https://via.placeholder.com/300x200?text=No+Image',
        feedingTypes: row.feeding_types || [],
        dietaryTags: row.dietary_tags || [],
        kitchenStyleTags: row.kitchen_style_tags || [],
        mealTypes: row.meal_types || [],
        cuisine: row.cuisine,
        ageRange: {
            min: row.age_range_min || 0,
            max: row.age_range_max || 120,
        },
        ingredients: row.ingredients || [],
        instructions: row.instructions || [],
        tips: row.tips || [],
        timeMinutes: row.time_minutes || 30,
        difficulty: row.difficulty || 'easy',
        servings: row.servings || 2,
        calories: row.calories,
        rating: row.rating || 0,
        allergens: row.allergens || [],
        storage: row.storage || null,
        imageDescription: row.image_description || null,
    };
}

// Upload recipe image
export async function uploadRecipeImage(
    recipeId: string,
    imageUri: string,
    bucket: 'recipe-images' | 'recipe-thumbnails' | 'recipe-steps' = 'recipe-images'
): Promise<string | null> {
    try {
        const response = await fetch(imageUri);
        const blob = await response.blob();

        const fileName = `${recipeId}_${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, blob, {
                contentType: 'image/jpeg',
                upsert: true,
            });

        if (uploadError) {
            console.error('Error uploading image:', uploadError);
            return null;
        }

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        console.error('Error uploading recipe image:', error);
        return null;
    }
}

// Save a recipe
export async function saveRecipe(userId: string, recipeId: string): Promise<boolean> {
    const { error } = await supabase
        .from('saved_recipes')
        .insert({ user_id: userId, recipe_id: recipeId });

    if (error) {
        console.error('Error saving recipe:', error);
        return false;
    }
    return true;
}

// Unsave a recipe
export async function unsaveRecipe(userId: string, recipeId: string): Promise<boolean> {
    const { error } = await supabase
        .from('saved_recipes')
        .delete()
        .eq('user_id', userId)
        .eq('recipe_id', recipeId);

    if (error) {
        console.error('Error unsaving recipe:', error);
        return false;
    }
    return true;
}

// Get all saved recipe IDs for the user (for heart icons)
export async function getSavedRecipeIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase
        .from('saved_recipes')
        .select('recipe_id')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching saved recipe IDs:', error);
        return [];
    }

    return (data || []).map(item => item.recipe_id);
}

// Get full saved recipes
export async function getSavedRecipes(userId: string): Promise<Recipe[]> {
    const { data, error } = await supabase
        .from('saved_recipes')
        .select('recipes(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching saved recipes:', error);
        return [];
    }


    // Flatten the response and transform
    return (data || [])
        .map(item => item.recipes)
        .filter(recipe => recipe !== null) // Filter out any nulls if recipe was deleted
        .map(recipe => transformRecipe(recipe));
}

/**
 * Log a search query for analytics (trending searches)
 */
export async function logSearchQuery(userId: string, query: string): Promise<void> {
    try {
        if (!query || query.trim().length === 0) return;

        const { error } = await supabase
            .from('search_analytics')
            .insert({
                user_id: userId,
                query: query.trim().toLowerCase()
            });

        if (error) {
            console.error('Error logging search query:', error);
        }
    } catch (error) {
        console.error('Error logging search query:', error);
    }
}

/**
 * Get trending searches from the last 7 days
 * Returns top 10 most searched queries
 */
export async function getTrendingSearches(): Promise<string[]> {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data, error } = await supabase
            .from('search_analytics')
            .select('query')
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(1000); // Get recent searches to aggregate

        if (error) {
            // If table doesn't exist yet, just return empty array (graceful degradation)
            if (error.code === 'PGRST205' || error.message?.includes('search_analytics')) {
                console.log('search_analytics table not yet created, skipping trending searches');
                return [];
            }
            console.error('Error fetching trending searches:', error);
            return [];
        }

        // Aggregate and count occurrences
        const queryCount = new Map<string, number>();
        (data || []).forEach(item => {
            const count = queryCount.get(item.query) || 0;
            queryCount.set(item.query, count + 1);
        });

        // Sort by count and return top 10
        return Array.from(queryCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([query]) => query);
    } catch (error) {
        console.error('Error fetching trending searches:', error);
        return [];
    }
}
