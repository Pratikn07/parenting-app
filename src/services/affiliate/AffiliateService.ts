import { supabase } from '../../lib/supabase';

export interface AffiliateProduct {
    id: string;
    product_name: string;
    affiliate_url: string;
    image_url: string | null;
    price: number | null;
    category: string | null;
}

/**
 * Service for managing affiliate product interactions
 */
export class AffiliateService {
    /**
     * Track when a user clicks on an affiliate product link
     */
    async trackClick(
        userId: string,
        productId: string,
        sessionId?: string
    ): Promise<void> {
        try {
            await supabase.from('affiliate_clicks').insert({
                user_id: userId,
                product_id: productId,
                session_id: sessionId || null,
            });

            // Also increment click count on the product
            await supabase.rpc('increment_affiliate_click', {
                product_id_input: productId
            });
        } catch (error) {
            console.error('Error tracking affiliate click:', error);
            // Non-fatal - don't throw
        }
    }

    /**
     * Get popular products (for potential future features)
     */
    async getPopularProducts(limit: number = 5): Promise<AffiliateProduct[]> {
        try {
            const { data, error } = await supabase
                .from('affiliate_products')
                .select('id, product_name, affiliate_url, image_url, price, category')
                .eq('is_active', true)
                .order('click_count', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Error fetching popular products:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error in getPopularProducts:', error);
            return [];
        }
    }

    /**
     * Get products by category
     */
    async getProductsByCategory(
        category: string,
        childAgeMonths?: number
    ): Promise<AffiliateProduct[]> {
        try {
            let query = supabase
                .from('affiliate_products')
                .select('id, product_name, affiliate_url, image_url, price, category')
                .eq('is_active', true)
                .eq('category', category);

            // Filter by age appropriateness if child age provided
            if (childAgeMonths !== undefined) {
                query = query
                    .lte('age_range_min', childAgeMonths)
                    .or(`age_range_max.is.null,age_range_max.gte.${childAgeMonths}`);
            }

            const { data, error } = await query.limit(10);

            if (error) {
                console.error('Error fetching products by category:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error in getProductsByCategory:', error);
            return [];
        }
    }

    /**
     * Get analytics on product mentions (for admin insights)
     */
    async getMentionStats(): Promise<{ product_name: string; count: number; has_affiliate: boolean }[]> {
        try {
            const { data, error } = await supabase
                .from('product_mentions_log')
                .select('product_name, had_affiliate')
                .order('mentioned_at', { ascending: false })
                .limit(100);

            if (error || !data) return [];

            // Aggregate mentions
            const stats = new Map<string, { count: number; has_affiliate: boolean }>();
            data.forEach(mention => {
                const existing = stats.get(mention.product_name) || { count: 0, has_affiliate: mention.had_affiliate };
                existing.count++;
                stats.set(mention.product_name, existing);
            });

            return Array.from(stats.entries())
                .map(([product_name, { count, has_affiliate }]) => ({
                    product_name,
                    count,
                    has_affiliate
                }))
                .sort((a, b) => b.count - a.count);
        } catch (error) {
            console.error('Error getting mention stats:', error);
            return [];
        }
    }
}

export const affiliateService = new AffiliateService();
