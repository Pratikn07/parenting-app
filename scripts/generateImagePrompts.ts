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
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================
// PREMIUM PROMPT TEMPLATES - Inspired by Nano Banana Pro Library
// ============================================================

interface RecipeData {
    id: string;
    title: string;
    ingredients: { item: string; amount: string }[];
    feeding_types: string[];
    cuisine: string | null;
}

// Category-specific scene setups (inspired by 4.2 Professional Product Photography & 1.6 Emotional Film)
const SCENE_CONFIGS: Record<string, {
    setting: string;
    props: string[];
    lighting: string;
    mood: string;
}> = {
    babyPurees: {
        setting: "A clean, minimalist Scandinavian-style kitchen counter",
        props: ["small ceramic baby bowl in soft white", "tiny silicone spoon", "scattered fresh ingredients nearby", "soft linen napkin"],
        lighting: "Soft diffused window light from the left, creating gentle shadows and a warm, nurturing atmosphere",
        mood: "tender, wholesome, nurturing, clean"
    },
    fingerFoods: {
        setting: "A rustic wooden serving board on a light marble countertop",
        props: ["colorful finger foods arranged in an appetizing pattern", "small dipping sauce in a ramekin", "fresh herb garnish", "toddler-sized plate nearby"],
        lighting: "Bright, airy natural daylight with soft fill, emphasizing textures and colors",
        mood: "playful, inviting, colorful, fun"
    },
    lunchboxIdeas: {
        setting: "An open bento box on a cheerful kitchen table",
        props: ["colorful silicone dividers", "cute food picks", "fresh fruit on the side", "reusable water bottle in background"],
        lighting: "Bright overhead soft light mixed with window daylight, creating an energetic morning vibe",
        mood: "organized, cheerful, healthy, school-ready"
    },
    pregnancyNutrition: {
        setting: "An elegant ceramic plate on a natural linen tablecloth",
        props: ["artisanal dinnerware", "fresh flowers in a small vase nearby", "sparkling water glass", "folded cloth napkin"],
        lighting: "Golden hour warm light streaming through sheer curtains, creating a relaxing spa-like atmosphere",
        mood: "nourishing, elegant, calming, self-care"
    },
    familyMeals: {
        setting: "A large family-style serving dish on a warm wooden dining table",
        props: ["matching dinner plates stacked nearby", "serving spoons", "cloth napkins", "wine glasses with water"],
        lighting: "Warm tungsten-mixed ambient light with candle glow, creating an intimate dinner atmosphere",
        mood: "cozy, gathering, hearty, comforting"
    },
    toddlerMeals: {
        setting: "A colorful kid-friendly plate on a high chair tray",
        props: ["sippy cup nearby", "scattered cheerios for realism", "tiny fork", "bib visible at edge"],
        lighting: "Bright, cheerful natural light with soft shadows, capturing the messy joy of toddler meals",
        mood: "adorable, messy-cute, realistic, everyday"
    },
    treatsSnacks: {
        setting: "A beautiful dessert plate on a styled coffee table or picnic blanket",
        props: ["scattered crumbs for authenticity", "glass of milk or fruit nearby", "decorative napkin", "natural elements like flowers or leaves"],
        lighting: "Soft, dreamy backlighting creating a slight glow, with warm fill light",
        mood: "indulgent, sweet, treat-yourself, joyful"
    }
};

// Camera & Technical Settings (inspired by 1.5 Business Photo & 4.2 Product Photography)
const CAMERA_SETTINGS = {
    standard: "Shot on Canon EOS R5 with 50mm f/1.8 lens, shallow depth of field, soft natural bokeh",
    macro: "Shot on Sony A7III with 90mm macro lens f/2.8, extreme close-up detail, creamy background blur",
    wide: "Shot on Canon 35mm f/1.4 lens, slightly wide composition showing context, balanced depth",
    overhead: "Shot from directly above (flat lay), 50mm lens, even soft lighting, no harsh shadows"
};

// Quality & Realism Keywords (from 1.1 Hyper-Realistic Crowd Composition)
const QUALITY_KEYWORDS = [
    "hyper-realistic",
    "8k resolution",
    "micro-details of food texture visible",
    "natural skin on fruits and vegetables",
    "visible steam or moisture where appropriate",
    "photorealistic commercial food photography",
    "high dynamic range",
    "calibrated color grading"
].join(", ");

// Generate a premium prompt for a single recipe
function generatePremiumPrompt(recipe: RecipeData): string {
    const category = recipe.feeding_types?.[0] || 'familyMeals';
    const config = SCENE_CONFIGS[category] || SCENE_CONFIGS.familyMeals;

    // Extract top 3-4 key ingredients for visual description
    const keyIngredients = Array.isArray(recipe.ingredients)
        ? recipe.ingredients.slice(0, 4).map((i: any) => i.item.split(',')[0].trim()).join(', ')
        : 'fresh ingredients';

    // Determine best camera setting based on category
    let cameraConfig = CAMERA_SETTINGS.standard;
    if (category === 'babyPurees') cameraConfig = CAMERA_SETTINGS.macro;
    if (category === 'lunchboxIdeas') cameraConfig = CAMERA_SETTINGS.overhead;
    if (category === 'familyMeals') cameraConfig = CAMERA_SETTINGS.wide;

    // Construct the premium prompt
    const prompt = `
Create a professional food photography image of "${recipe.title}".

SUBJECT:
- Main dish: ${recipe.title} made with ${keyIngredients}
- The food should look freshly prepared, appetizing, and photorealistic
- Visible texture details: ${category === 'babyPurees' ? 'smooth, silky puree with slight sheen' : 'crisp edges, natural colors, steam or moisture where appropriate'}

SCENE SETUP:
- Setting: ${config.setting}
- Props: ${config.props.join(', ')}
- Arrangement: Balanced composition with the main dish as hero, props adding context without distraction

LIGHTING:
- ${config.lighting}
- Three-point lighting setup: soft key light, subtle fill, gentle rim light for food separation
- No harsh shadows, no blown-out highlights

CAMERA:
- ${cameraConfig}
- Focus point: center of the main dish
- Background: naturally blurred, complementary colors

MOOD & STYLE:
- Overall feel: ${config.mood}
- Color palette: warm, inviting, appetizing
- ${QUALITY_KEYWORDS}

NEGATIVE:
- No artificial-looking food, no plastic textures, no distorted proportions
- No cluttered backgrounds, no distracting elements
- No oversaturated colors, no unrealistic lighting
`.trim();

    return prompt;
}

async function generateAllPrompts() {
    console.log("🍳 Fetching recipes from database...\n");

    const { data: recipes, error } = await supabase
        .from('recipes')
        .select('id, title, ingredients, feeding_types, cuisine');

    if (error) {
        console.error("Error fetching recipes:", error);
        return;
    }

    let outputContent = `# 🍌 Nano Banana Pro - Premium Recipe Image Prompts
Generated: ${new Date().toLocaleDateString()}

These prompts are crafted using techniques from the Nano Banana Pro prompt library:
- Hyper-realistic lighting setups (3-point lighting)
- Professional camera settings (Canon EOS R5, Sony A7III)
- Category-specific scene styling
- Micro-texture and detail emphasis

---

`;

    // Group recipes by category for organized output
    const byCategory: Record<string, RecipeData[]> = {};
    recipes.forEach((recipe: RecipeData) => {
        const cat = recipe.feeding_types?.[0] || 'other';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(recipe);
    });

    let totalCount = 0;

    for (const [category, categoryRecipes] of Object.entries(byCategory)) {
        const categoryTitle = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        outputContent += `\n## 📂 ${categoryTitle}\n\n`;

        categoryRecipes.forEach((recipe, index) => {
            totalCount++;
            const prompt = generatePremiumPrompt(recipe);

            outputContent += `### ${totalCount}. ${recipe.title}\n`;
            outputContent += `**Category:** ${category}\n\n`;
            outputContent += `\`\`\`\n${prompt}\n\`\`\`\n\n`;
            outputContent += `---\n\n`;
        });
    }

    // Add quick-copy section with simplified prompts
    outputContent += `\n# 🚀 Quick-Copy Prompts (Simplified)\n\n`;
    outputContent += `If the detailed prompts above don't work well, try these shorter versions:\n\n`;

    recipes.forEach((recipe: RecipeData, index: number) => {
        const category = recipe.feeding_types?.[0] || 'meal';
        const config = SCENE_CONFIGS[category] || SCENE_CONFIGS.familyMeals;
        const shortPrompt = `${recipe.title}, professional food photography, ${config.mood}, soft natural lighting, shallow depth of field, 8k, hyper-realistic, Canon 50mm f/1.8`;
        outputContent += `${index + 1}. \`${shortPrompt}\`\n\n`;
    });

    const outputPath = path.join(__dirname, '..', 'NANO_BANANA_PROMPTS.txt');
    fs.writeFileSync(outputPath, outputContent);

    console.log(`✅ Successfully generated PREMIUM prompts for ${totalCount} recipes!`);
    console.log(`📂 Output file: ${outputPath}`);
    console.log(`\n📊 Breakdown by category:`);
    for (const [cat, items] of Object.entries(byCategory)) {
        console.log(`   - ${cat}: ${items.length} recipes`);
    }
}

generateAllPrompts();
