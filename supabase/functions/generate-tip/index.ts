// Supabase Edge Function for generating personalized parenting tips using DeepSeek AI
// Deploy with: supabase functions deploy generate-tip

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

interface GenerateTipRequest {
  userId: string;
  parentingStage: string;
  childAges: number[]; // ages in months
  feedingPreference?: string;
  recentCategories?: string[]; // categories of recent tips to avoid repetition
}

interface GeneratedTip {
  title: string;
  description: string;
  category: string;
  quick_tips: string[];
}

const SYSTEM_PROMPT = `You are an expert pediatric nurse and parenting coach. Generate a helpful, evidence-based daily parenting tip.

IMPORTANT GUIDELINES:
- Be warm, supportive, and non-judgmental
- Use clear, actionable language
- Base advice on AAP (American Academy of Pediatrics) guidelines
- Consider the child's developmental stage
- Be culturally sensitive and inclusive
- Avoid medical diagnoses - recommend consulting pediatrician for concerns

RESPONSE FORMAT (JSON only, no markdown):
{
  "title": "Brief, engaging title (max 50 chars)",
  "description": "2-3 sentence explanation with practical advice (max 200 chars)",
  "category": "one of: sleep, feeding, development, health, behavior, activities, safety, bonding",
  "quick_tips": ["4 actionable bullet points", "each max 60 chars", "practical and specific", "easy to implement"]
}`;

function buildUserPrompt(request: GenerateTipRequest): string {
  const { parentingStage, childAges, feedingPreference, recentCategories } = request;
  
  let prompt = `Generate a daily parenting tip for a parent in the "${parentingStage}" stage.`;
  
  if (childAges.length > 0) {
    const agesStr = childAges.map(age => {
      if (age < 1) return "newborn";
      if (age < 12) return `${age} month${age > 1 ? 's' : ''} old`;
      const years = Math.floor(age / 12);
      const months = age % 12;
      return months > 0 ? `${years} year${years > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''} old` : `${years} year${years > 1 ? 's' : ''} old`;
    }).join(", ");
    prompt += `\nChild age(s): ${agesStr}`;
  }
  
  if (feedingPreference) {
    prompt += `\nFeeding approach: ${feedingPreference}`;
  }
  
  if (recentCategories && recentCategories.length > 0) {
    prompt += `\n\nAvoid these categories (recently covered): ${recentCategories.join(", ")}`;
    prompt += "\nChoose a different category to provide variety.";
  }
  
  return prompt;
}

async function generateTipWithDeepSeek(request: GenerateTipRequest): Promise<GeneratedTip> {
  const deepseekApiKey = Deno.env.get("DEEPSEEK_API_KEY");
  
  if (!deepseekApiKey) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }
  
  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${deepseekApiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(request) },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" },
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("DeepSeek API error:", errorText);
    throw new Error(`DeepSeek API error: ${response.status}`);
  }
  
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error("No content in DeepSeek response");
  }
  
  try {
    const tip = JSON.parse(content) as GeneratedTip;
    
    // Validate required fields
    if (!tip.title || !tip.description || !tip.category || !tip.quick_tips) {
      throw new Error("Invalid tip structure");
    }
    
    // Normalize category
    const validCategories = ["sleep", "feeding", "development", "health", "behavior", "activities", "safety", "bonding"];
    if (!validCategories.includes(tip.category.toLowerCase())) {
      tip.category = "development"; // fallback
    } else {
      tip.category = tip.category.toLowerCase();
    }
    
    return tip;
  } catch (parseError) {
    console.error("Failed to parse DeepSeek response:", content);
    throw new Error("Failed to parse AI response");
  }
}

async function getRecentTipCategories(supabase: any, userId: string): Promise<string[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { data } = await supabase
    .from("daily_tips")
    .select("category")
    .eq("user_id", userId)
    .gte("tip_date", sevenDaysAgo.toISOString().split("T")[0])
    .order("tip_date", { ascending: false })
    .limit(5);
  
  return data?.map((t: { category: string }) => t.category) || [];
}

async function getUserContext(supabase: any, userId: string): Promise<{ parentingStage: string; feedingPreference: string | null }> {
  const { data } = await supabase
    .from("users")
    .select("parenting_stage, feeding_preference")
    .eq("id", userId)
    .single();
  
  return {
    parentingStage: data?.parenting_stage || "expecting",
    feedingPreference: data?.feeding_preference || null,
  };
}

async function getChildAges(supabase: any, userId: string): Promise<number[]> {
  const { data } = await supabase
    .from("children")
    .select("date_of_birth")
    .eq("user_id", userId);
  
  if (!data || data.length === 0) return [];
  
  const now = new Date();
  return data.map((child: { date_of_birth: string }) => {
    const birth = new Date(child.date_of_birth);
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    return years * 12 + months;
  });
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
      },
    });
  }
  
  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    const body = await req.json();
    const { userId } = body;
    
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Gather context
    const [userContext, childAges, recentCategories] = await Promise.all([
      getUserContext(supabase, userId),
      getChildAges(supabase, userId),
      getRecentTipCategories(supabase, userId),
    ]);
    
    // Generate tip with DeepSeek
    const generatedTip = await generateTipWithDeepSeek({
      userId,
      parentingStage: userContext.parentingStage,
      childAges,
      feedingPreference: userContext.feedingPreference || undefined,
      recentCategories,
    });
    
    // Store in database
    const today = new Date().toISOString().split("T")[0];
    const tipData = {
      user_id: userId,
      tip_date: today,
      title: generatedTip.title,
      description: generatedTip.description,
      category: generatedTip.category,
      parenting_stage: userContext.parentingStage,
      child_age_months: childAges.length > 0 ? Math.min(...childAges) : null,
      quick_tips: generatedTip.quick_tips,
      is_viewed: false,
      ai_generated: true,
    };
    
    const { data: savedTip, error: saveError } = await supabase
      .from("daily_tips")
      .upsert(tipData, { onConflict: "user_id,tip_date" })
      .select()
      .single();
    
    if (saveError) {
      console.error("Error saving tip:", saveError);
      // Return the generated tip even if save fails
      return new Response(JSON.stringify({ tip: { ...tipData, id: null } }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
    
    return new Response(JSON.stringify({ tip: savedTip }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
    
  } catch (error) {
    console.error("Error generating tip:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

