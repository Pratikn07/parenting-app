import { supabase } from '@/src/lib/supabase';
import { ShopCategory, ShopProduct, RecommendationSection, ShopUserRecommendation } from '../../types/shop';

class ShopService {
    /**
     * Fetch all active shop categories
     */
    async getCategories(): Promise<ShopCategory[]> {
        const { data, error } = await supabase
            .from('shop_categories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('Error fetching shop categories:', error);
            return [];
        }

        return data || [];
    }

    /**
     * Fetch products by category slug
     */
    async getProductsByCategory(categorySlug: string, limit = 20): Promise<ShopProduct[]> {
        const { data, error } = await supabase
            .from('shop_products')
            .select(`
                *,
                primary_affiliate:shop_product_affiliates!inner(
                    id,
                    product_id,
                    affiliate_id,
                    affiliate_url,
                    price,
                    is_available,
                    is_primary,
                    affiliate:shop_affiliates(
                        name,
                        logo_url
                    )
                )
            `)
            .eq('category_slug', categorySlug)
            .eq('is_active', true)
            .eq('shop_product_affiliates.is_primary', true)
            .order('click_count', { ascending: false })
            .limit(limit);

        if (error) {
            console.error(`Error fetching products for category ${categorySlug}:`, error);
            return [];
        }

        return this.mapProductData(data);
    }

    /**
     * Fetch featured products
     */
    async getFeaturedProducts(limit = 10): Promise<ShopProduct[]> {
        const { data, error } = await supabase
            .from('shop_products')
            .select(`
                *,
                primary_affiliate:shop_product_affiliates!inner(
                    id,
                    product_id,
                    affiliate_id,
                    affiliate_url,
                    price,
                    is_available,
                    is_primary,
                    affiliate:shop_affiliates(
                        name,
                        logo_url
                    )
                )
            `)
            .eq('is_featured', true)
            .eq('is_active', true)
            .eq('shop_product_affiliates.is_primary', true)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching featured products:', error);
            return [];
        }

        return this.mapProductData(data);
    }

    /**
     * Track a product click. Used by both the Shop tab and the chat product
     * card flow (after the 2026-04-27 affiliate consolidation).
     *
     * @param sessionId Optional chat session id. Only meaningful when source='chat'.
     */
    async trackClick(
        productId: string,
        sectionType: RecommendationSection,
        source = 'shop',
        sessionId?: string | null
    ): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error: clickError } = await supabase
                .from('shop_clicks')
                .insert({
                    user_id: user?.id || null,
                    product_id: productId,
                    source,
                    section_type: sectionType,
                    session_id: sessionId ?? null,
                });

            if (clickError) throw clickError;

            const { error: rpcError } = await supabase.rpc('increment_shop_click', {
                product_id_input: productId
            });

            if (rpcError) throw rpcError;
        } catch (error) {
            console.error('Error tracking shop click:', error);
        }
    }

    /**
     * Helper to map raw DB data to ShopProduct interface
     */
    private mapProductData(data: any[]): ShopProduct[] {
        return data.map(item => ({
            ...item,
            primary_affiliate: item.primary_affiliate?.[0] ? {
                ...item.primary_affiliate[0],
                affiliate_name: item.primary_affiliate[0].affiliate.name,
                affiliate_logo_url: item.primary_affiliate[0].affiliate.logo_url
            } : undefined
        }));
    }

    /**
     * Private helper for common product select query
     */
    private get productSelectQuery() {
        return `
            *,
            primary_affiliate:shop_product_affiliates!inner(
                id,
                product_id,
                affiliate_id,
                affiliate_url,
                price,
                is_available,
                is_primary,
                affiliate:shop_affiliates(
                    name,
                    logo_url
                )
            )
        `;
    }

    /**
     * Fetch top-rated products (4.5+ rating)
     */
    async getTopRatedProducts(limit = 8): Promise<ShopProduct[]> {
        const { data, error } = await supabase
            .from('shop_products')
            .select(this.productSelectQuery)
            .eq('is_active', true)
            .eq('shop_product_affiliates.is_primary', true)
            .gte('rating', 4.5)
            .order('rating', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching top rated products:', error);
            return [];
        }

        return this.mapProductData(data || []);
    }

    /**
     * Fetch popular products (most clicked)
     */
    async getPopularProducts(limit = 8): Promise<ShopProduct[]> {
        const { data, error } = await supabase
            .from('shop_products')
            .select(this.productSelectQuery)
            .eq('is_active', true)
            .eq('shop_product_affiliates.is_primary', true)
            .gt('click_count', 0)
            .order('click_count', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching popular products:', error);
            return [];
        }

        return this.mapProductData(data || []);
    }

    /**
     * Fetch all sections data for shop home
     */
    async getShopHomeSections(): Promise<{
        feeding: ShopProduct[];
        sleep: ShopProduct[];
        safety: ShopProduct[];
        toys: ShopProduct[];
        topRated: ShopProduct[];
        popular: ShopProduct[];
    }> {
        const [feeding, sleep, safety, toys, topRated, popular] = await Promise.all([
            this.getProductsByCategory('feeding', 8),
            this.getProductsByCategory('sleep', 8),
            this.getProductsByCategory('safety', 8),
            this.getProductsByCategory('toys', 8),
            this.getTopRatedProducts(8),
            this.getPopularProducts(8),
        ]);

        return { feeding, sleep, safety, toys, topRated, popular };
    }
}


export const shopService = new ShopService();
