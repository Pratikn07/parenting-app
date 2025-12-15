import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const replicateToken = process.env.REPLICATE_API_TOKEN;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env');
    console.error('   Required: EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

if (!replicateToken) {
    console.error('❌ Missing REPLICATE_API_TOKEN in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const replicate = new Replicate({ auth: replicateToken });

// ============================================================
// FULL RUN: Generate Images for ALL Recipes
// ============================================================

interface RecipeData {
    id: string;
    title: string;
    ingredients: { item: string; amount: string }[];
    feeding_types: string[];
}

// Category-specific scene configurations
const SCENE_CONFIG: Record<string, { setting: string; props: string; lighting: string; mood: string }> = {
    babyPurees: {
        setting: 'clean, minimalist Scandinavian-style kitchen counter',
        props: 'small ceramic baby bowl in soft white, tiny silicone spoon, scattered fresh ingredients nearby, soft linen napkin',
        lighting: 'soft diffused window light from the left, creating gentle shadows and a warm, nurturing atmosphere',
        mood: 'tender, wholesome, nurturing, clean'
    },
    fingerFoods: {
        setting: 'bright modern kitchen island with natural wood accents',
        props: 'colorful silicone baby plate with compartments, small finger food pieces artfully arranged, bright cloth napkin',
        lighting: 'bright natural daylight, cheerful and energetic atmosphere',
        mood: 'playful, colorful, engaging, fun'
    },
    toddlerMeals: {
        setting: 'family kitchen table with warm wood tones',
        props: 'child-sized ceramic plate, colorful kid-friendly utensils, fun placemat, sippy cup nearby',
        lighting: 'warm afternoon light, creating a cozy family atmosphere',
        mood: 'welcoming, homey, appetizing, family-centered'
    },
    familyDinners: {
        setting: 'elegant family dining table with rustic elements',
        props: 'large family-style serving dish, multiple place settings visible, cloth napkins, fresh herbs as garnish',
        lighting: 'warm tungsten-mixed ambient light, golden hour feel, romantic yet family-appropriate',
        mood: 'gathering, celebration, togetherness, abundance'
    },
    pregnancyNutrition: {
        setting: 'bright, airy modern kitchen with lots of greenery',
        props: 'beautiful ceramic bowl, fresh leafy greens, lemon wedge, glass of water nearby',
        lighting: 'fresh morning light, vibrant and health-focused atmosphere',
        mood: 'fresh, nourishing, vibrant, healthy'
    },
    lunchboxIdeas: {
        setting: 'kitchen counter with open lunchbox in view',
        props: 'open bento-style lunchbox with colorful dividers, fun food picks, reusable snack bags',
        lighting: 'bright, even lighting, school-morning energy',
        mood: 'organized, colorful, practical, fun'
    },
    treatsSnacks: {
        setting: 'cozy kitchen baking scene',
        props: 'cute dessert plate, scattered sprinkles or chocolate chips, parchment paper, cooling rack',
        lighting: 'warm, inviting baking ambiance with soft shadows',
        mood: 'indulgent yet wholesome, celebratory, sweet'
    }
};

// Premium prompt generator
function generatePrompt(recipe: RecipeData): string {
    const feedingType = recipe.feeding_types?.[0] || 'familyDinners';
    const config = SCENE_CONFIG[feedingType] || SCENE_CONFIG.familyDinners;

    const ingredients = Array.isArray(recipe.ingredients)
        ? recipe.ingredients.slice(0, 4).map((i: any) => i.item.split(',')[0].trim()).join(', ')
        : 'fresh ingredients';

    return `Create a professional food photography image of "${recipe.title}".

SUBJECT:
- Main dish: ${recipe.title} made with ${ingredients}
- The food should look freshly prepared, appetizing, and photorealistic
- Visible texture details, natural colors, slight sheen where appropriate

SCENE SETUP:
- Setting: ${config.setting}
- Props: ${config.props}
- Arrangement: Balanced composition with main dish as hero, props adding context without distraction

LIGHTING:
- ${config.lighting}
- Three-point lighting setup: soft key light, subtle fill, gentle rim light for food separation
- No harsh shadows, no blown-out highlights

CAMERA:
- Shot on Sony A7III with 90mm macro lens f/2.8, extreme close-up detail, creamy background blur
- Focus point: center of the main dish
- Shallow depth of field with beautiful bokeh

MOOD & STYLE:
- Overall feel: ${config.mood}
- Color palette: warm, inviting, appetizing
- hyper-realistic, 8k resolution, micro-details visible, photorealistic commercial food photography

NEGATIVE:
- No artificial-looking food, no plastic textures, no distorted proportions
- No cluttered backgrounds, no distracting elements
- No oversaturated colors, no unrealistic lighting`;
}

// Download image using fetch
async function downloadImage(url: string, filepath: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filepath, buffer);
}

// Generate image with retry logic
async function generateImage(prompt: string, retries = 3): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const output = await replicate.run(
                "black-forest-labs/flux-pro",
                {
                    input: {
                        prompt: prompt,
                        aspect_ratio: "1:1",
                        output_format: "png",
                        output_quality: 100
                    }
                }
            );
            return (Array.isArray(output) ? output[0] : output) as string;
        } catch (error: any) {
            if (error.response?.status === 429 && attempt < retries) {
                const waitTime = attempt * 20;
                console.log(`   ⏳ Rate limited, waiting ${waitTime}s...`);
                await new Promise(r => setTimeout(r, waitTime * 1000));
            } else if (attempt < retries) {
                console.log(`   ⚠️ Retrying (${attempt}/${retries})...`);
                await new Promise(r => setTimeout(r, 5000));
            } else {
                throw error;
            }
        }
    }
    throw new Error('Failed after retries');
}

// Upload to Supabase Storage
async function uploadToSupabase(localPath: string, recipeId: string): Promise<string> {
    const fileName = `${recipeId}.png`;
    const fileBuffer = fs.readFileSync(localPath);

    const { error } = await supabase.storage
        .from('recipe-images')
        .upload(fileName, fileBuffer, { contentType: 'image/png', upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(fileName);

    return publicUrl;
}

// Update database
async function updateRecipeImage(recipeId: string, imageUrl: string): Promise<void> {
    const { error } = await supabase
        .from('recipes')
        .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
        .eq('id', recipeId);
    if (error) throw error;
}

// Main execution
async function main() {
    console.log('\n🍌 FLUX.2 Pro Image Generation - FULL RUN\n');
    console.log('⚙️  Fetching all recipes...\n');

    // Fetch ALL recipes that don't have images yet
    const { data: recipes, error } = await supabase
        .from('recipes')
        .select('id, title, ingredients, feeding_types, image_url')
        .order('created_at', { ascending: true });

    if (error || !recipes) {
        console.error('❌ Error fetching recipes:', error);
        return;
    }

    // Filter to only recipes without images or with placeholder
    const recipesToProcess = recipes.filter(r =>
        !r.image_url || r.image_url.includes('placeholder')
    );

    console.log(`📊 Total recipes: ${recipes.length}`);
    console.log(`🎨 Recipes needing images: ${recipesToProcess.length}`);
    console.log(`💰 Estimated cost: $${(recipesToProcess.length * 0.025).toFixed(2)}\n`);

    if (recipesToProcess.length === 0) {
        console.log('✅ All recipes already have images!');
        return;
    }

    // Create temp directory
    const tempDir = path.join(__dirname, '..', 'temp_images');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    let successCount = 0;
    let failCount = 0;
    const startTime = Date.now();

    for (let i = 0; i < recipesToProcess.length; i++) {
        const recipe = recipesToProcess[i] as RecipeData;
        console.log(`\n[${i + 1}/${recipesToProcess.length}] ${recipe.title}`);

        try {
            // Generate
            console.log('   🎨 Generating...');
            const prompt = generatePrompt(recipe);
            const imageUrl = await generateImage(prompt);
            console.log('   ✅ Generated');

            // Download
            const localPath = path.join(tempDir, `${recipe.id}.png`);
            await downloadImage(imageUrl, localPath);
            console.log('   💾 Downloaded');

            // Upload
            const publicUrl = await uploadToSupabase(localPath, recipe.id);
            console.log('   📤 Uploaded');

            // Update DB
            await updateRecipeImage(recipe.id, publicUrl);
            console.log('   ✨ Database updated');

            successCount++;

            // Rate limit protection: 15s between requests
            if (i < recipesToProcess.length - 1) {
                console.log('   ⏳ Waiting 15s...');
                await new Promise(r => setTimeout(r, 15000));
            }

        } catch (err: any) {
            console.error(`   ❌ FAILED: ${err.message}`);
            failCount++;
        }
    }

    const duration = Math.round((Date.now() - startTime) / 1000 / 60);
    console.log('\n\n════════════════════════════════════════');
    console.log('📊 FINAL SUMMARY');
    console.log('════════════════════════════════════════');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   ⏱️  Duration: ${duration} minutes`);
    console.log(`   💰 Cost: ~$${(successCount * 0.025).toFixed(2)}`);
    console.log('════════════════════════════════════════\n');
}

main();
