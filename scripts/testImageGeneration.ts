import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for DB writes
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
// Test Configuration - Generate 1 Baby Puree Image (minimal test)
// ============================================================

const TEST_LIMIT = 1;
const TEST_CATEGORY = 'babyPurees';

interface RecipeData {
    id: string;
    title: string;
    ingredients: { item: string; amount: string }[];
    feeding_types: string[];
}

// Premium prompt template (from NANO_BANANA_PROMPTS.txt structure)
function generatePrompt(recipe: RecipeData): string {
    const ingredients = Array.isArray(recipe.ingredients)
        ? recipe.ingredients.slice(0, 4).map((i: any) => i.item.split(',')[0].trim()).join(', ')
        : 'fresh ingredients';

    return `Create a professional food photography image of "${recipe.title}".

SUBJECT:
- Main dish: ${recipe.title} made with ${ingredients}
- The food should look freshly prepared, appetizing, and photorealistic
- Visible texture details: smooth, silky puree with slight sheen

SCENE SETUP:
- Setting: A clean, minimalist Scandinavian-style kitchen counter
- Props: small ceramic baby bowl in soft white, tiny silicone spoon, scattered fresh ingredients nearby, soft linen napkin
- Arrangement: Balanced composition with the main dish as hero, props adding context without distraction

LIGHTING:
- Soft diffused window light from the left, creating gentle shadows and a warm, nurturing atmosphere
- Three-point lighting setup: soft key light, subtle fill, gentle rim light for food separation
- No harsh shadows, no blown-out highlights

CAMERA:
- Shot on Sony A7III with 90mm macro lens f/2.8, extreme close-up detail, creamy background blur
- Focus point: center of the main dish
- Background: naturally blurred, complementary colors

MOOD & STYLE:
- Overall feel: tender, wholesome, nurturing, clean
- Color palette: warm, inviting, appetizing
- hyper-realistic, 8k resolution, micro-details of food texture visible, natural skin on fruits and vegetables, visible steam or moisture where appropriate, photorealistic commercial food photography, high dynamic range, calibrated color grading

NEGATIVE:
- No artificial-looking food, no plastic textures, no distorted proportions
- No cluttered backgrounds, no distracting elements
- No oversaturated colors, no unrealistic lighting`;
}

// Download image from URL using fetch
async function downloadImage(url: string, filepath: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filepath, buffer);
}


// Generate image using FLUX.2 Pro with retry logic
async function generateImage(prompt: string, recipeId: string, retries = 3): Promise<string> {
    console.log(`   🎨 Generating image via FLUX.2 Pro...`);

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

            // FLUX Pro returns a URL string
            const imageUrl = Array.isArray(output) ? output[0] : output;
            console.log(`   ✅ Image generated successfully`);
            return imageUrl as string;

        } catch (error: any) {
            if (error.response?.status === 429 && attempt < retries) {
                const waitTime = attempt * 15; // 15s, 30s, 45s
                console.log(`   ⏳ Rate limited, waiting ${waitTime}s before retry ${attempt + 1}/${retries}...`);
                await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
            } else if (attempt < retries) {
                console.log(`   ⚠️ Attempt ${attempt} failed, retrying...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            } else {
                console.error(`   ❌ FLUX API error after ${retries} attempts:`, error.message || error);
                throw error;
            }
        }
    }

    throw new Error('Failed after all retries');
}


// Upload image to Supabase Storage
async function uploadToSupabase(localPath: string, recipeId: string): Promise<string> {
    const fileName = `${recipeId}.png`;
    const fileBuffer = fs.readFileSync(localPath);

    console.log(`   📤 Uploading to Supabase Storage...`);

    // Upload to recipe-images bucket
    const { data, error } = await supabase.storage
        .from('recipe-images')
        .upload(fileName, fileBuffer, {
            contentType: 'image/png',
            upsert: true
        });

    if (error) {
        console.error(`   ❌ Upload error:`, error);
        throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(fileName);

    console.log(`   ✅ Uploaded: ${publicUrl}`);
    return publicUrl;
}

// Update database with image URL
async function updateRecipeImage(recipeId: string, imageUrl: string): Promise<void> {
    const { error } = await supabase
        .from('recipes')
        .update({
            image_url: imageUrl,
            updated_at: new Date().toISOString()
        })
        .eq('id', recipeId);

    if (error) {
        console.error(`   ❌ Database update error:`, error);
        throw error;
    }

    console.log(`   ✅ Database updated`);
}

// Main test function
async function runTest() {
    console.log(`\n🍌 FLUX.2 Pro Image Generation - TEST RUN\n`);
    console.log(`📊 Generating ${TEST_LIMIT} images for category: ${TEST_CATEGORY}\n`);

    // Fetch test recipes
    const { data: recipes, error } = await supabase
        .from('recipes')
        .select('id, title, ingredients, feeding_types')
        .contains('feeding_types', [TEST_CATEGORY])
        .limit(TEST_LIMIT);

    if (error) {
        console.error('❌ Error fetching recipes:', error);
        return;
    }

    if (!recipes || recipes.length === 0) {
        console.error(`❌ No recipes found for category: ${TEST_CATEGORY}`);
        return;
    }

    console.log(`Found ${recipes.length} recipes to process:\n`);

    // Create temp directory for downloads
    const tempDir = path.join(__dirname, '..', 'temp_images');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < recipes.length; i++) {
        const recipe = recipes[i] as RecipeData;
        console.log(`\n[${i + 1}/${recipes.length}] Processing: "${recipe.title}"`);
        console.log(`   Recipe ID: ${recipe.id}`);

        try {
            // 1. Generate prompt
            const prompt = generatePrompt(recipe);

            // 2. Generate image
            const imageUrl = await generateImage(prompt, recipe.id);

            // 3. Download image
            const localPath = path.join(tempDir, `${recipe.id}.png`);
            console.log(`   💾 Downloading image...`);
            await downloadImage(imageUrl, localPath);
            console.log(`   ✅ Downloaded to: ${localPath}`);

            // 4. Upload to Supabase
            const publicUrl = await uploadToSupabase(localPath, recipe.id);

            // 5. Update database
            await updateRecipeImage(recipe.id, publicUrl);

            successCount++;
            console.log(`   ✨ SUCCESS!`);

            // Small delay between requests
            if (i < recipes.length - 1) {
                console.log(`   ⏳ Waiting 3s before next generation...`);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

        } catch (error) {
            failCount++;
            console.error(`   ❌ FAILED:`, error);
        }
    }

    console.log(`\n\n📊 Test Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   💰 Estimated cost: $${(successCount * 0.025).toFixed(3)}`);

    if (successCount > 0) {
        console.log(`\n✨ Test images saved to: ${tempDir}`);
        console.log(`\n🔍 Next steps:`);
        console.log(`   1. Review the generated images`);
        console.log(`   2. Check if they match the recipes`);
        console.log(`   3. If quality is good, run full generation for all 70 recipes`);
    }
}

runTest();
