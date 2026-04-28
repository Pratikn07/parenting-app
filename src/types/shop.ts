export type RecommendationSection =
    | 'for_you'
    | 'chat_based'
    | 'age_based'
    | 'recipe_based'
    | 'milestone_based'
    | 'category_spotlight'
    | 'top_rated'
    | 'popular'
    | 'search';

export interface ShopCategory {
    id: string;
    name: string;
    slug: string;
    emoji: string;
    description: string | null;
    sort_order: number;
}

export interface ShopProduct {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    price: number | null;
    original_price: number | null;
    rating: number | null;
    review_count: number;
    category_id: string | null;
    category_slug: string | null;
    age_range_min: number;
    age_range_max: number | null;
    tags: string[];
    is_active: boolean;
    is_featured: boolean;
    click_count: number;
    primary_affiliate?: ProductAffiliate;
}

export interface ProductAffiliate {
    id: string;
    product_id: string;
    affiliate_id: string;
    affiliate_name: string;
    affiliate_logo_url: string | null;
    affiliate_url: string;
    price: number | null;
    is_available: boolean;
    is_primary: boolean;
}

export interface ShopUserRecommendation {
    id: string;
    user_id: string;
    section_type: RecommendationSection;
    product_ids: string[];
    context: any;
    expires_at: string;
    products?: ShopProduct[];
}

// =====================================================
// SUPPLEMENTARY TYPES
// (merged from src/lib/types/shop.ts — single source of truth)
// =====================================================

export type ShopCategorySlug =
    | 'feeding'
    | 'sleep'
    | 'safety'
    | 'toys'
    | 'health'
    | 'clothing'
    | 'travel'
    | 'nursery';

export type ClickSource = 'shop' | 'chat' | 'recipe' | 'milestone';

export interface ShopAffiliate {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    base_url: string;
    tag_param: string | null;
    store_tag: string | null;
    commission_rate: number | null;
    is_active: boolean;
    priority: number;
    created_at: string;
    updated_at: string;
}

export interface ShopClick {
    id: string;
    user_id: string | null;
    product_id: string;
    affiliate_id: string | null;
    session_id: string | null;
    source: ClickSource | null;
    section_type: RecommendationSection | null;
    clicked_at: string;
}

export interface GetProductsOptions {
    categorySlug?: ShopCategorySlug;
    ageMonths?: number;
    limit?: number;
    offset?: number;
    sortBy?: 'rating' | 'price' | 'popularity' | 'newest';
    sortOrder?: 'asc' | 'desc';
}

export interface TrackClickOptions {
    productId: string;
    affiliateId?: string;
    source: ClickSource;
    sectionType?: RecommendationSection;
    sessionId?: string;
}

export interface RecommendationContext {
    userId: string;
    childAgeMonths?: number;
    childName?: string;
    recentChatTopics?: string[];
    savedRecipeIds?: string[];
    upcomingMilestones?: string[];
}

// =====================================================
// CATEGORY CONSTANTS
// =====================================================

export const SHOP_CATEGORIES: Record<ShopCategorySlug, { name: string; emoji: string }> = {
    feeding: { name: 'Feeding', emoji: '🍼' },
    sleep: { name: 'Sleep', emoji: '💤' },
    safety: { name: 'Safety', emoji: '🛡️' },
    toys: { name: 'Toys & Development', emoji: '🧸' },
    health: { name: 'Health & Care', emoji: '❤️' },
    clothing: { name: 'Clothing', emoji: '👕' },
    travel: { name: 'Outdoor & Travel', emoji: '✈️' },
    nursery: { name: 'Nursery', emoji: '🌼' },
};

export const SECTION_TITLES: Record<RecommendationSection, string> = {
    for_you: 'For {childName}',
    chat_based: 'Because you asked about {topic}',
    age_based: 'Perfect for {age} months',
    recipe_based: 'From Your Recipes',
    milestone_based: 'Milestone Helpers',
    category_spotlight: '{category} Essentials',
    top_rated: 'Top Rated',
    popular: 'Parent Favorites',
    search: 'Search Results',
};
