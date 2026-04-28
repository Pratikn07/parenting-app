import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES Module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RAINFOREST_API_KEY = '0D6D50CA8D0845C1AB958AC7EC6851A3';
const AMAZON_TAG = 'mycuratedhave-20';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface CategoryMapping {
    name: string;
    slug: string;
    searchTerms: string[];
}

const categories: CategoryMapping[] = [
    {
        name: 'Feeding',
        slug: 'feeding',
        searchTerms: ['baby bottles', 'high chairs', 'baby utensils', 'baby bibs']
    },
    {
        name: 'Sleep',
        slug: 'sleep',
        searchTerms: ['cribs', 'sleep sacks', 'baby monitors', 'white noise machine baby']
    },
    {
        name: 'Safety',
        slug: 'safety',
        searchTerms: ['baby proofing kit', 'safety gates', 'car seats', 'baby corner guards']
    },
    {
        name: 'Toys & Development',
        slug: 'toys',
        searchTerms: ['baby toys 0-6 months', 'montessori toys baby', 'baby books', 'teething toys']
    },
    {
        name: 'Health & Care',
        slug: 'health',
        searchTerms: ['baby first aid kit', 'baby grooming kit', 'baby bath tub', 'baby lotion']
    },
    {
        name: 'Clothing',
        slug: 'clothing',
        searchTerms: ['baby onesies', 'baby sleepers', 'baby socks', 'baby hats']
    },
    {
        name: 'Outdoor & Travel',
        slug: 'travel',
        searchTerms: ['strollers', 'baby carriers', 'diaper bags', 'travel crib']
    },
    {
        name: 'Nursery',
        slug: 'nursery',
        searchTerms: ['nursery glider', 'nursery rug', 'baby dresser', 'changing table']
    }
];

async function seedProducts() {
    console.log('🚀 Starting product seeding...');

    // 1. Get category UUIDs from DB
    const { data: dbCategories, error: catError } = await supabase
        .from('shop_categories')
        .select('id, slug');

    if (catError) {
        console.error('Error fetching categories:', catError);
        return;
    }

    const categoryMap = new Map(dbCategories.map(c => [c.slug, c.id]));

    // 2. Get Amazon affiliate UUID
    const { data: amazonAffiliate, error: affError } = await supabase
        .from('shop_affiliates')
        .select('id')
        .eq('slug', 'amazon')
        .single();

    if (affError) {
        console.error('Error fetching Amazon affiliate:', affError);
        return;
    }

    for (const category of categories) {
        console.log(`\n📂 Processing category: ${category.name}`);
        const categoryId = categoryMap.get(category.slug);

        if (!categoryId) {
            console.error(`Category ID not found for slug: ${category.slug}`);
            continue;
        }

        for (const searchTerm of category.searchTerms) {
            console.log(`🔍 Searching for: ${searchTerm}`);

            try {
                const response = await fetch(
                    `https://api.rainforestapi.com/request?api_key=${RAINFOREST_API_KEY}&type=search&amazon_domain=amazon.com&search_term=${encodeURIComponent(searchTerm)}&sort_by=most_recent`
                );

                const data: any = await response.json();

                if (!data.search_results) {
                    console.warn(`No results for ${searchTerm}`);
                    continue;
                }

                // Take top 5 results for each search term to hit ~20 per category
                const results = data.search_results.slice(0, 5);

                for (const item of results) {
                    if (!item.asin || !item.title) continue;

                    // A. Insert Product
                    const { data: product, error: pError } = await supabase
                        .from('shop_products')
                        .insert({
                            name: item.title,
                            description: `Beautifully curated ${category.name.toLowerCase()} item.`,
                            image_url: item.image,
                            price: item.price?.value || null,
                            rating: item.rating || null,
                            review_count: item.ratings_total || 0,
                            category_id: categoryId,
                            category_slug: category.slug,
                            is_active: true,
                            tags: [category.slug, ...searchTerm.split(' ')]
                        })
                        .select()
                        .single();

                    if (pError) {
                        console.error(`Error inserting product ${item.asin}:`, pError.message);
                        continue;
                    }

                    // B. Insert Affiliate Link
                    const affiliateUrl = `https://www.amazon.com/dp/${item.asin}?tag=${AMAZON_TAG}`;

                    const { error: aError } = await supabase
                        .from('shop_product_affiliates')
                        .insert({
                            product_id: product.id,
                            affiliate_id: amazonAffiliate.id,
                            affiliate_product_id: item.asin,
                            affiliate_url: affiliateUrl,
                            price: item.price?.value || null,
                            is_primary: true
                        });

                    if (aError) {
                        console.error(`Error inserting affiliate for ${item.asin}:`, aError.message);
                    } else {
                        console.log(`✅ Seeded: ${item.title.substring(0, 50)}...`);
                    }
                }

                // Small delay to respect rate limits if any
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (err) {
                console.error(`Failed to fetch ${searchTerm}:`, err);
            }
        }
    }

    console.log('\n✨ Seeding complete!');
}

seedProducts();
