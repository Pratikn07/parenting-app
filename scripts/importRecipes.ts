/**
 * Recipe Import Script
 * 
 * Usage: npx ts-node scripts/importRecipes.ts <json-file-path>
 * Example: npx ts-node scripts/importRecipes.ts recipes_fingerFoods.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// ES Module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface RecipeInput {
    title: string;
    description: string;
    feeding_types: string[];
    dietary_tags: string[];
    kitchen_style_tags: string[];
    meal_types: string[];
    cuisine: string;
    age_range_min: number;
    age_range_max: number;
    ingredients: { item: string; amount: string }[];
    instructions: string[];
    tips: string[];
    time_minutes: number;
    difficulty: string;
    servings: number;
    calories: number;
    allergens?: string[];
    storage?: string;
    image_description?: string;
}

interface RecipeFile {
    recipes: RecipeInput[];
}

async function importRecipes(filePath: string) {
    console.log(`\n📂 Reading file: ${filePath}\n`);

    // Read and parse JSON file
    let fileContent: string;
    try {
        fileContent = fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
        console.error(`❌ Could not read file: ${filePath}`);
        process.exit(1);
    }

    let data: RecipeFile;
    try {
        data = JSON.parse(fileContent);
    } catch (error) {
        console.error('❌ Invalid JSON format');
        process.exit(1);
    }

    if (!data.recipes || !Array.isArray(data.recipes)) {
        console.error('❌ JSON must have a "recipes" array');
        process.exit(1);
    }

    console.log(`📊 Found ${data.recipes.length} recipes to import\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const recipe of data.recipes) {
        // Check for duplicate by title
        const { data: existing } = await supabase
            .from('recipes')
            .select('id')
            .ilike('title', recipe.title)
            .limit(1);

        if (existing && existing.length > 0) {
            console.log(`⏭️  Skipping (duplicate): "${recipe.title}"`);
            skipCount++;
            continue;
        }

        // Insert recipe
        const { error } = await supabase.from('recipes').insert({
            title: recipe.title,
            description: recipe.description,
            image_url: null, // Will add images later
            feeding_types: recipe.feeding_types,
            dietary_tags: recipe.dietary_tags || [],
            kitchen_style_tags: recipe.kitchen_style_tags || [],
            meal_types: recipe.meal_types || [],
            cuisine: recipe.cuisine,
            age_range_min: recipe.age_range_min,
            age_range_max: recipe.age_range_max,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            tips: recipe.tips || [],
            time_minutes: recipe.time_minutes,
            difficulty: recipe.difficulty,
            servings: recipe.servings,
            calories: recipe.calories,
            allergens: recipe.allergens || [],
            storage: recipe.storage || null,
            image_description: recipe.image_description || null,
            rating: 4.5, // Default rating
        });

        if (error) {
            console.error(`❌ Error inserting "${recipe.title}":`, error.message);
            errorCount++;
        } else {
            console.log(`✅ Imported: "${recipe.title}"`);
            successCount++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 IMPORT SUMMARY:`);
    console.log(`   ✅ Imported: ${successCount}`);
    console.log(`   ⏭️  Skipped (duplicates): ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('='.repeat(50) + '\n');
}

// Get file path from command line args
const args = process.argv.slice(2);
if (args.length === 0) {
    console.log(`
📚 Recipe Import Script

Usage: npx ts-node scripts/importRecipes.ts <json-file>

Example:
  npx ts-node scripts/importRecipes.ts recipes_fingerFoods.json
  npx ts-node scripts/importRecipes.ts ./data/recipes.json
`);
    process.exit(0);
}

const filePath = path.resolve(args[0]);
importRecipes(filePath);
