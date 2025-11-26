// Supabase Edge Function for AI parenting chat
// Supports text (DeepSeek) and vision (OpenAI GPT-4 Vision)
// Deploy with: supabase functions deploy chat

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

interface ChatRequest {
  userId: string;
  message: string;
  childId?: string;
  sessionId?: string;
  imageUrl?: string; // For vision analysis
}

interface ChatResponse {
  id: string;
  message: string;
  response: string;
  createdAt: string;
  sessionId: string;
  sessionTitle?: string;
  imageUrl?: string;
}

interface ChildInfo {
  name: string;
  ageInMonths: number;
  ageDisplay: string;
}

interface UserContext {
  parentingStage: string;
  feedingPreference: string | null;
  userName: string | null;
  children: ChildInfo[];
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: string;
  user_id: string;
  child_id: string | null;
  title: string | null;
  message_count: number;
}

const SYSTEM_PROMPT = `You are a warm, empathetic, and knowledgeable parenting assistant. Your name is "Bloom" and you help parents navigate the joys and challenges of raising children.

CORE PERSONALITY:
- Warm, supportive, and non-judgmental
- Use a conversational, friendly tone
- Acknowledge emotions and validate concerns
- Be encouraging without being dismissive

GUIDELINES:
- Base advice on AAP (American Academy of Pediatrics) recommendations
- Consider the child's specific age and developmental stage
- Be culturally sensitive and inclusive of different parenting styles
- For breastfeeding/formula, be supportive of whatever choice the parent has made
- Keep responses concise but helpful (2-4 paragraphs max)
- Use bullet points for actionable tips when appropriate

SAFETY RULES:
- NEVER provide medical diagnoses
- For ANY health concerns (fever, rash, breathing issues, injuries), recommend consulting a pediatrician
- If symptoms sound urgent (high fever, difficulty breathing, lethargy), advise seeking immediate medical care
- Don't recommend specific medications or dosages

RESPONSE STYLE:
- Start with empathy or acknowledgment when appropriate
- Provide practical, actionable advice
- End with encouragement or offer to help with follow-up questions
- If you don't know something, say so honestly`;

const VISION_SYSTEM_PROMPT = `You are a warm, empathetic parenting assistant named "Bloom" with visual analysis capabilities. You help parents by analyzing photos related to their children.

IMPORTANT DISCLAIMERS (ALWAYS include when relevant):
- You are NOT a medical professional and cannot diagnose conditions
- For ANY health-related images (rashes, bumps, symptoms), ALWAYS recommend consulting a pediatrician
- Your observations are general guidance only, not medical advice

ANALYSIS GUIDELINES:
1. HEALTH CONCERNS (rashes, skin conditions, injuries):
   - Describe what you observe objectively
   - Note characteristics: color, size, location, texture
   - Suggest when to seek medical care (immediately vs. scheduled appointment)
   - NEVER say "this looks normal" or "nothing to worry about" for health images
   - Always recommend professional evaluation

2. FOOD SAFETY:
   - Assess if food appears appropriate for child's age
   - Note potential choking hazards
   - Comment on food preparation/presentation
   - Mention common allergens if visible

3. DEVELOPMENTAL OBSERVATIONS:
   - Comment on what you observe (posture, activity, engagement)
   - Be encouraging about developmental progress
   - Avoid definitive statements about delays

4. PRODUCT SAFETY:
   - Check for visible safety concerns
   - Note age appropriateness if visible
   - Recommend checking official safety ratings

RESPONSE FORMAT:
- Start with "I can see..." to acknowledge the image
- Provide observations, not diagnoses
- Include relevant safety recommendations
- End with supportive guidance`;

function buildContextPrompt(context: UserContext): string {
  let prompt = "";
  
  if (context.userName) {
    prompt += `The parent's name is ${context.userName}. `;
  }
  
  prompt += `They are in the "${context.parentingStage}" stage. `;
  
  if (context.children.length > 0) {
    const childrenInfo = context.children.map(child => {
      return `${child.name} (${child.ageDisplay})`;
    }).join(", ");
    prompt += `Their children: ${childrenInfo}. `;
  }
  
  if (context.feedingPreference) {
    prompt += `Feeding approach: ${context.feedingPreference}. `;
  }
  
  return prompt.trim();
}

function formatAgeDisplay(ageInMonths: number): string {
  if (ageInMonths < 1) return "newborn";
  if (ageInMonths < 12) return `${ageInMonths} month${ageInMonths > 1 ? "s" : ""} old`;
  const years = Math.floor(ageInMonths / 12);
  const months = ageInMonths % 12;
  if (months === 0) return `${years} year${years > 1 ? "s" : ""} old`;
  return `${years} year${years > 1 ? "s" : ""} ${months} month${months > 1 ? "s" : ""} old`;
}

function calculateAgeInMonths(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  let totalMonths = years * 12 + months;
  if (now.getDate() < birth.getDate()) totalMonths--;
  return Math.max(0, totalMonths);
}

async function getUserContext(supabase: any, userId: string): Promise<UserContext> {
  const { data: userData } = await supabase
    .from("users")
    .select("name, parenting_stage, feeding_preference")
    .eq("id", userId)
    .single();
  
  const { data: childrenData } = await supabase
    .from("children")
    .select("name, date_of_birth")
    .eq("user_id", userId)
    .order("date_of_birth", { ascending: true });
  
  const children: ChildInfo[] = (childrenData || []).map((child: any) => {
    const ageInMonths = calculateAgeInMonths(child.date_of_birth);
    return {
      name: child.name || "Baby",
      ageInMonths,
      ageDisplay: formatAgeDisplay(ageInMonths),
    };
  });
  
  return {
    parentingStage: userData?.parenting_stage || "expecting",
    feedingPreference: userData?.feeding_preference || null,
    userName: userData?.name || null,
    children,
  };
}

async function getSessionMessages(
  supabase: any, 
  sessionId: string, 
  limit: number = 10
): Promise<ConversationMessage[]> {
  const { data } = await supabase
    .from("chat_messages")
    .select("message, is_from_user, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(limit);
  
  if (!data || data.length === 0) return [];
  
  return data.reverse().map((msg: any) => ({
    role: msg.is_from_user ? "user" : "assistant",
    content: msg.message,
  }));
}

async function getOrCreateSession(
  supabase: any,
  userId: string,
  childId?: string,
  sessionId?: string
): Promise<ChatSession> {
  if (sessionId) {
    const { data: existingSession } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();
    
    if (existingSession) {
      return existingSession;
    }
  }
  
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  let query = supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("is_archived", false)
    .gte("last_message_at", oneHourAgo)
    .order("last_message_at", { ascending: false })
    .limit(1);

  if (childId) {
    query = query.eq("child_id", childId);
  }

  const { data: recentSessions } = await query;
  
  if (recentSessions && recentSessions.length > 0) {
    return recentSessions[0];
  }
  
  const { data: newSession, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: userId,
      child_id: childId || null,
      started_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
      message_count: 0,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating session:", error);
    throw new Error("Failed to create session");
  }
  
  return newSession;
}

async function updateSessionMetadata(
  supabase: any,
  sessionId: string,
  messageCount: number
): Promise<void> {
  await supabase
    .from("chat_sessions")
    .update({
      last_message_at: new Date().toISOString(),
      message_count: messageCount + 2,
    })
    .eq("id", sessionId);
}

async function generateSessionTitle(
  userMessage: string,
  hasImage: boolean
): Promise<string> {
  if (hasImage) {
    // For image messages, create a descriptive title
    const prefix = "📷 ";
    const cleanMessage = userMessage.trim();
    if (cleanMessage.length <= 35) {
      return prefix + cleanMessage;
    }
    const truncated = cleanMessage.substring(0, 35);
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > 15) {
      return prefix + truncated.substring(0, lastSpace) + "...";
    }
    return prefix + truncated + "...";
  }
  
  const cleanMessage = userMessage.trim();
  if (cleanMessage.length <= 40) {
    return cleanMessage;
  }
  
  const truncated = cleanMessage.substring(0, 40);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 20) {
    return truncated.substring(0, lastSpace) + "...";
  }
  return truncated + "...";
}

async function updateSessionTitle(
  supabase: any,
  sessionId: string,
  title: string
): Promise<void> {
  await supabase
    .from("chat_sessions")
    .update({ title })
    .eq("id", sessionId);
}

// Text-only chat using DeepSeek
async function callDeepSeek(
  systemPrompt: string,
  contextPrompt: string,
  conversationHistory: ConversationMessage[],
  userMessage: string
): Promise<string> {
  const deepseekApiKey = Deno.env.get("DEEPSEEK_API_KEY");
  
  if (!deepseekApiKey) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }
  
  const messages = [
    { role: "system", content: `${systemPrompt}\n\nCURRENT CONTEXT:\n${contextPrompt}` },
    ...conversationHistory,
    { role: "user", content: userMessage },
  ];
  
  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${deepseekApiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      temperature: 0.7,
      max_tokens: 800,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
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
  
  return content;
}

// Vision analysis using OpenAI GPT-4 Vision
async function callOpenAIVision(
  contextPrompt: string,
  userMessage: string,
  imageUrl: string
): Promise<string> {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  
  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  
  const messages = [
    { 
      role: "system", 
      content: `${VISION_SYSTEM_PROMPT}\n\nCURRENT CONTEXT:\n${contextPrompt}` 
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: userMessage || "Please analyze this image and provide your observations.",
        },
        {
          type: "image_url",
          image_url: {
            url: imageUrl,
            detail: "low", // Use low resolution for cost efficiency
          },
        },
      ],
    },
  ];
  
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // Cost-effective vision model
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI Vision API error:", errorText);
    throw new Error(`OpenAI Vision API error: ${response.status}`);
  }
  
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error("No content in OpenAI Vision response");
  }
  
  return content;
}

async function saveMessage(
  supabase: any,
  userId: string,
  message: string,
  isFromUser: boolean,
  sessionId: string,
  childId?: string,
  imageUrl?: string
): Promise<string> {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      user_id: userId,
      message,
      is_from_user: isFromUser,
      session_id: sessionId,
      child_id: childId || null,
      image_url: imageUrl || null,
    })
    .select("id")
    .single();
  
  if (error) {
    console.error("Error saving message:", error);
    throw new Error("Failed to save message");
  }
  
  return data.id;
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body: ChatRequest = await req.json();
    const { userId, message, childId, sessionId, imageUrl } = body;
    
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Allow empty message if image is provided
    if ((!message || !message.trim()) && !imageUrl) {
      return new Response(JSON.stringify({ error: "message or imageUrl is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    const hasImage = !!imageUrl;
    const userMessageText = message?.trim() || "What do you see in this image?";
    
    // Get or create session
    const session = await getOrCreateSession(supabase, userId, childId, sessionId);
    
    // Get user context
    const userContext = await getUserContext(supabase, userId);
    const contextPrompt = buildContextPrompt(userContext);
    
    // Get conversation history (only for text messages)
    const conversationHistory = hasImage 
      ? [] 
      : await getSessionMessages(supabase, session.id, 10);
    
    // Save user message
    await saveMessage(
      supabase, 
      userId, 
      userMessageText, 
      true, 
      session.id, 
      childId,
      imageUrl
    );
    
    // Call appropriate AI based on whether image is present
    let aiResponse: string;
    
    if (hasImage) {
      console.log("Processing vision request with image");
      aiResponse = await callOpenAIVision(contextPrompt, userMessageText, imageUrl);
    } else {
      aiResponse = await callDeepSeek(
        SYSTEM_PROMPT,
        contextPrompt,
        conversationHistory,
        userMessageText
      );
    }
    
    // Save AI response
    const responseId = await saveMessage(
      supabase, 
      userId, 
      aiResponse, 
      false, 
      session.id, 
      childId
    );
    
    // Update session metadata
    await updateSessionMetadata(supabase, session.id, session.message_count);
    
    // Generate title if first message
    let sessionTitle = session.title;
    if (!sessionTitle && session.message_count === 0) {
      sessionTitle = await generateSessionTitle(userMessageText, hasImage);
      await updateSessionTitle(supabase, session.id, sessionTitle);
    }
    
    const response: ChatResponse = {
      id: responseId,
      message: userMessageText,
      response: aiResponse,
      createdAt: new Date().toISOString(),
      sessionId: session.id,
      sessionTitle: sessionTitle || undefined,
      imageUrl: imageUrl,
    };
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
    
  } catch (error) {
    console.error("Chat error:", error);
    
    const fallbackResponse = "I'm having a little trouble right now, but I'm still here to help! Could you try asking that again? If this keeps happening, it might be a temporary issue on my end.";
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
        fallbackResponse,
      }),
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
