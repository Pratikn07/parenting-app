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
  id?: string;  // Optional for backwards compatibility
  name: string;
  ageInMonths: number;
  ageDisplay: string;
  developmentalStage: string;
  upcomingMilestones: string[];
  recentConcerns?: string[];
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

const SYSTEM_PROMPT = `You are Bloom, a warm and empathetic parenting assistant who remembers past conversations.

CORE PERSONALITY:
- Warm, supportive, conversational, and non-judgmental
- You REMEMBER previous discussions and reference them naturally
- You acknowledge progress and challenges from past conversations
- Use the parent's name when addressing them

PERSONALIZATION RULES (CRITICAL):
1. **Always use the child's name** - NEVER say "your child"
2. **Reference age/stage naturally** - "At 23 months, Emma..." not "Your toddler..."
3. **Build on past conversations** - If you have memory context, reference it naturally
4. **Adapt complexity for child's age** - Advice for 6-month-old ≠ advice for 3-year-old
5. **Anticipate needs** - Mention upcoming milestones relevant to their stage
6. **Show you remember** - If recent concerns are provided, acknowledge them

MEMORY & CONTINUITY:
- If you have information about past conversations, USE IT naturally in your response
- Reference previous advice you gave: "Last time we talked about..."
- Ask about outcomes: "How did the routine we discussed work out?"
- Show progress: "It sounds like Emma's sleep is improving since..."
- DON'T just repeat old advice - build on it or adjust based on feedback

SMART FOLLOW-UPS (END OF RESPONSE):
- After answering the parent's question, add ONE optional follow-up
- Format: "Is there anything else I can help with today? \n\nAlso, [contextual follow-up from memory]"
- Only ask if you have memory context from the last 7 days
- Keep it brief and relevant
- Examples:
  * "Also, how did Emma's bedtime routine go this week?"
  * "By the way, you mentioned tantrums were tough - any improvement?"
  * "Last time you were trying X - how's that working out?"

GUIDELINES:
- Base advice on AAP (American Academy of Pediatrics) recommendations
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

// Enhanced: Get developmental stage based on precise age
function getDevelopmentalStage(ageInMonths: number): string {
  if (ageInMonths < 1) return "newborn (0-1 month)";
  if (ageInMonths < 3) return "young infant (1-3 months)";
  if (ageInMonths < 6) return "infant (3-6 months)";
  if (ageInMonths < 9) return "older infant (6-9 months)";
  if (ageInMonths < 12) return "pre-toddler (9-12 months)";
  if (ageInMonths < 18) return "young toddler (12-18 months)";
  if (ageInMonths < 24) return "toddler (18-24 months)";
  if (ageInMonths < 36) return "older toddler (2-3 years)";
  return "preschooler (3+ years)";
}

// Enhanced: Get upcoming milestones based on AAP guidelines
function getUpcomingMilestones(ageInMonths: number): string[] {
  const milestoneMap: Record<number, string[]> = {
    1: ["first social smile", "tracking objects with eyes"],
    2: ["cooing sounds", "better head control"],
    4: ["rolling over", "reaching for toys", "4-month sleep regression common"],
    6: ["sitting up independently", "starting solid foods", "babbling consonants"],
    9: ["crawling", "stranger anxiety may appear", "pincer grasp developing"],
    12: ["first steps", "first words", "pointing to request"],
    15: ["walking independently", "using spoon", "vocabulary 5-10 words"],
    18: ["running", "vocabulary explosion (50+ words)", "pretend play begins"],
    24: ["potty training readiness", "parallel play with peers", "two-word phrases"],
    30: ["speaking in sentences", "imaginative play", "following 2-step instructions"],
    36: ["pedaling tricycle", "drawing circles", "playing cooperatively"],
  };

  const relevant: string[] = [];
  for (let i = -1; i <= 2; i++) {
    const month = ageInMonths + i;
    if (milestoneMap[month]) {
      relevant.push(...milestoneMap[month]);
    }
  }
  return relevant.slice(0, 3);
}

// Enhanced: Build deeply personalized context prompt
function buildEnhancedContextPrompt(
  context: UserContext,
  selectedChild?: ChildInfo,
  pastMemories?: string
): string {
  const parts: string[] = [];

  if (context.userName) {
    parts.push(`You are chatting with ${context.userName}, a parent in the "${context.parentingStage}" stage.`);
  }

  if (context.children.length > 0) {
    parts.push("\n**Family Profile:**");

    context.children.forEach((child) => {
      const isSelected = selectedChild?.name === child.name;
      const prefix = isSelected ? "🎯 CURRENTLY DISCUSSING" : "Also caring for";

      parts.push(
        `${prefix}: ${child.name}, ${child.ageDisplay} (${child.developmentalStage}).`
      );

      if (isSelected && child.upcomingMilestones.length > 0) {
        parts.push(
          `Expected developmental milestones for ${child.name}: ${child.upcomingMilestones.join(", ")}.`
        );
      }

      if (isSelected && child.recentConcerns && child.recentConcerns.length > 0) {
        parts.push(
          `Recent topics discussed about ${child.name}: ${child.recentConcerns.join(", ")}.`
        );
      }
    });
  }

  if (context.feedingPreference) {
    parts.push(`\n**Feeding approach:** ${context.feedingPreference} - be supportive and provide relevant guidance.`);
  }

  // Inject memory if available
  if (pastMemories) {
    parts.push(pastMemories);
  }

  if (selectedChild) {
    parts.push(
      `\n**CRITICAL:** Always use ${selectedChild.name}'s name naturally in your responses. Tailor ALL advice to ${selectedChild.ageDisplay}. Reference their developmental stage (${selectedChild.developmentalStage}) when relevant.`
    );
  }

  return parts.join(" ");
}

// Keep original function for backwards compatibility
function buildContextPrompt(context: UserContext): string {
  return buildEnhancedContextPrompt(context);
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
    .select("id, name, date_of_birth")
    .eq("user_id", userId)
    .order("date_of_birth", { ascending: true });

  const children: ChildInfo[] = (childrenData || []).map((child: any) => {
    const ageInMonths = calculateAgeInMonths(child.date_of_birth);
    return {
      id: child.id,  // Include id for matching
      name: child.name || "Baby",
      ageInMonths,
      ageDisplay: formatAgeDisplay(ageInMonths),
      developmentalStage: getDevelopmentalStage(ageInMonths),
      upcomingMilestones: getUpcomingMilestones(ageInMonths),
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

// Enhanced: Extract recent concerns from chat history
async function getRecentConcerns(
  supabase: any,
  userId: string,
  childId: string,
  limit: number = 5
): Promise<string[]> {
  const { data } = await supabase
    .from("chat_messages")
    .select("message")
    .eq("user_id", userId)
    .eq("child_id", childId)
    .eq("is_from_user", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data || data.length === 0) return [];

  // Extract key topics using keyword matching
  const messages = data.map((m: any) => m.message.toLowerCase());
  const topicKeywords = {
    "sleep": ["sleep", "nap", "bedtime", "night", "wake", "insomnia"],
    "feeding": ["eat", "food", "milk", "bottle", "breastfeed", "formula", "feeding"],
    "behavior": ["tantrum", "crying", "behavior", "discipline", "anger", "frustration"],
    "development": ["walk", "talk", "milestone", "delay", "development", "speech"],
    "health": ["sick", "fever", "rash", "doctor", "vaccine", "illness"],
    "potty training": ["potty", "toilet", "diaper", "bathroom"],
  };

  const detectedTopics = new Set<string>();
  messages.forEach(msg => {
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => msg.includes(keyword))) {
        detectedTopics.add(topic);
      }
    });
  });

  return Array.from(detectedTopics).slice(0, 3);
}

// Retrieve past conversation summaries for memory
async function retrievePastMemories(
  supabase: any,
  userId: string,
  childId?: string
): Promise<string> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let query = supabase
      .from("conversation_summaries")
      .select("topics, key_insights, period_start, period_end")
      .eq("user_id", userId)
      .gte("period_end", sevenDaysAgo.toISOString())
      .order("period_end", { ascending: false })
      .limit(3);

    if (childId) {
      query = query.eq("child_id", childId);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return "";
    }

    // Format memories into readable context
    const memoryParts: string[] = [];

    data.forEach((summary: any) => {
      const daysAgo = Math.floor(
        (new Date().getTime() - new Date(summary.period_end).getTime()) / (1000 * 60 * 60 * 24)
      );

      const timeRef = daysAgo === 0 ? "today" :
        daysAgo === 1 ? "yesterday" :
          daysAgo < 7 ? `${daysAgo} days ago` : "last week";

      if (summary.topics && Object.keys(summary.topics).length > 0) {
        const topicsList = Object.keys(summary.topics).join(", ");
        memoryParts.push(`${timeRef}: discussed ${topicsList}`);
      }

      if (summary.key_insights && summary.key_insights.length > 0) {
        summary.key_insights.forEach((insight: string) => {
          memoryParts.push(`- ${insight}`);
        });
      }
    });

    if (memoryParts.length === 0) {
      return "";
    }

    return `\n\n**PAST CONVERSATIONS (Use this to show continuity):**\n${memoryParts.join("\n")}`;
  } catch (error) {
    console.error("Error retrieving past memories:", error);
    return "";
  }
}

// Generate conversation summary using AI
async function generateConversationSummary(
  messages: any[],
  childName?: string
): Promise<{ topics: Record<string, number>; keyInsights: string[] }> {
  if (messages.length < 3) {
    return { topics: {}, keyInsights: [] };
  }

  // Extract topics from messages
  const topicKeywords = [
    "sleep", "feeding", "behavior", "development", "health",
    "potty training", "tantrums", "milestones", "safety", "crying"
  ];

  const topics: Record<string, number> = {};
  const userMessages = messages.filter((msg: any) => msg.is_from_user);

  userMessages.forEach((msg: any) => {
    const text = msg.message.toLowerCase();
    topicKeywords.forEach(topic => {
      if (text.includes(topic)) {
        topics[topic] = (topics[topic] || 0) + 1;
      }
    });
  });

  // Generate key insights
  const keyInsights: string[] = [];

  // Get most discussed topic
  const sortedTopics = Object.entries(topics)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);

  sortedTopics.forEach(([topic, count]) => {
    if (count >= 2) {
      keyInsights.push(
        childName
          ? `${childName}'s ${topic} was a focus (mentioned ${count} times)`
          : `${topic} was a key concern (mentioned ${count} times)`
      );
    }
  });

  return { topics, keyInsights };
}

// Save conversation summary
async function saveConversationSummary(
  supabase: any,
  userId: string,
  sessionId: string,
  childId?: string
): Promise<void> {
  try {
    // Get all messages from this session
    const { data: messages } = await supabase
      .from("chat_messages")
      .select("message, is_from_user, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (!messages || messages.length < 3) {
      return; // Don't summarize very short conversations
    }

    // Get child name if available
    let childName: string | undefined;
    if (childId) {
      const { data: childData } = await supabase
        .from("children")
        .select("name")
        .eq("id", childId)
        .single();
      childName = childData?.name;
    }

    const { topics, keyInsights } = await generateConversationSummary(messages, childName);

    if (Object.keys(topics).length === 0) {
      return; // No topics identified
    }

    const firstMessage = new Date(messages[0].created_at);
    const lastMessage = new Date(messages[messages.length - 1].created_at);

    // Insert summary
    await supabase.from("conversation_summaries").insert({
      user_id: userId,
      child_id: childId || null,
      summary_period: "week",
      topics: topics,
      key_insights: keyInsights,
      period_start: firstMessage.toISOString(),
      period_end: lastMessage.toISOString(),
    });

    console.log("Conversation summary saved successfully");
  } catch (error) {
    console.error("Error saving conversation summary:", error);
    // Don't throw - this is a background task
  }
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

    // Get user context with enhanced child data
    const userContext = await getUserContext(supabase, userId);

    // Enhanced: Get selected child with recent concerns
    let selectedChildInfo: ChildInfo | undefined;
    if (childId) {
      const selectedChild = userContext.children.find((c: any) => c.id === childId);
      if (selectedChild) {
        const recentConcerns = await getRecentConcerns(supabase, userId, childId);
        selectedChildInfo = {
          ...selectedChild,
          recentConcerns,
        };
      }
    }

    // Retrieve past memories for continuity
    const pastMemories = await retrievePastMemories(supabase, userId, childId);

    // Build enhanced context prompt with selected child and memory
    const contextPrompt = buildEnhancedContextPrompt(userContext, selectedChildInfo, pastMemories);

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

    // Save conversation summary in background (async, don't await)
    // Only after a meaningful conversation (5+ messages)
    if (session.message_count >= 4) {
      saveConversationSummary(supabase, userId, session.id, childId).catch(err => {
        console.error("Background summary save failed:", err);
      });
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
