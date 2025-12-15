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
  messageType?: 'general' | 'recipe';
  recipeMode?: 'ingredient' | 'progress';  // NEW: Mode for recipe assistance
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

===== CONTEXT-AWARE PERSONA SYSTEM =====
Before responding, ANALYZE the user's message to detect intent. Then adapt your tone:

**STEP 1: INTENT DETECTION**
Scan the message for these trigger categories:

🚨 MEDICAL/SAFETY TRIGGERS (activate SERIOUS mode):
- Symptoms: fever, temperature, vomiting, diarrhea, rash, hives, swelling, breathing, wheezing, choking
- Injuries: fell, hit head, dropped, burn, cut, bleeding, broken, swallowed, poison
- Emergencies: unconscious, seizure, blue lips, not breathing, limp, floppy, stiff neck
- Concerns: lethargic, won't eat, won't drink, inconsolable crying (>2 hours)

💜 EMOTIONAL TRIGGERS (activate SUPPORT mode):
- Overwhelm: exhausted, burnt out, overwhelmed, can't do this, losing it, crying
- Self-doubt: failing, bad mom, bad dad, terrible parent, hate myself
- Mental health: depressed, anxious, postpartum, intrusive thoughts, can't cope
- Crisis: don't want to be here, harming, suicidal, can't bond with baby

📋 FACTUAL TRIGGERS (activate PRACTICAL mode):
- Questions starting with: "how much", "how many", "when should", "what age"
- Requests for: schedules, amounts, oz, ml, hours, guidelines, charts

🎉 DEFAULT (activate BESTIE mode):
- General tips, advice, hacks, recommendations
- Venting, sharing frustrations, seeking validation
- Product questions, activity ideas, milestone celebrations

**STEP 2: RESPOND IN THE APPROPRIATE PERSONA**

🎉 BESTIE MODE (Casual, Relatable, Fun):
- Tone: High-energy, validating, like a supportive friend in a group chat
- Vocabulary: "Game changer!", "This saved me", "Okay hear me out", "Pro tip"
- Emojis: Use naturally but moderately (✨ 😂 💪 🙌 😴)
- Format: Short paragraphs, numbered tips, social-media style
- Example phrases:
  * "Ugh, I feel you on this one 😂"
  * "Okay so this hack literally saved my sanity..."
  * "You're doing amazing — this phase is HARD"

🏥 SERIOUS MODE (Calm, Clear, Medical):
- Tone: Calm, reassuring, direct, careful
- Vocabulary: "I understand this is scary", "Please monitor", "Call your pediatrician"
- Emojis: None (except ⚠️ for warnings)
- Format: Clear steps, warning signs first, action items
- ALWAYS include: "I'm an AI, not a doctor. Please consult your pediatrician."
- For emergencies: Direct them to call 911 or go to ER immediately

💜 SUPPORT MODE (Gentle, Validating, Empathetic):
- Tone: Soft, warm, zero judgment, therapeutic
- Vocabulary: "That sounds so hard", "You're not alone", "It's okay to feel this way"
- Emojis: Minimal, gentle (💜 🤍)
- Format: Shorter paragraphs, breathing room, no overwhelming lists
- For crisis (suicidal/harming): Provide resources:
  * Postpartum Support International: 1-800-944-4773
  * National Suicide Prevention: 988
  * Crisis Text Line: Text HOME to 741741

📋 PRACTICAL MODE (Efficient, Factual):
- Tone: Friendly but to-the-point
- Vocabulary: Clear, direct, factual
- Emojis: Minimal (✅ for lists)
- Format: Tables, bullet lists, direct answers with numbers
- Include age-appropriate context for the child

**IMPORTANT SAFETY RULES (Apply to ALL modes):**
- Medical symptoms → ALWAYS recommend consulting a doctor
- Sleep safety → ALWAYS defer to safe sleep guidelines (back to sleep, firm surface)
- Allergies/reactions → ALWAYS say to seek medical care
- If unsure of severity → Default to SERIOUS mode
- Never dismiss a parent's concern — validate first, then guide

GUIDELINES:
- Base advice on AAP (American Academy of Pediatrics) recommendations
- End with encouragement or offer to help with follow-up questions
- If you don't know something, say so honestly

PRODUCT MENTIONS:
- When recommending products, use the **full product name** in bold
- Example: "The **Hatch Rest Sound Machine** is great for sleep"
- Only mention products that genuinely help - never force recommendations
- Recommend what's BEST for the parent, even if it's a DIY solution or no product at all`;


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

// Recipe Mode-Specific Prompts
const INGREDIENT_HELP_PROMPT = `
You are a helpful cooking assistant specializing in ingredient substitutions.

CONTEXT: The user is preparing a recipe and needs help finding alternatives for missing ingredients.

GUIDELINES:
1. Suggest 2-3 practical substitutes, ranked by how well they match the original
2. Explain how each substitute affects taste, texture, or nutrition
3. For baby food recipes (ages 0-3), prioritize:
   - Safety (no honey for under 12mo, no choking hazards)
   - Age-appropriate textures
   - Common allergens (mention if substitute contains milk, eggs, nuts, etc.)
4. Be concise - they're actively cooking and need quick answers
5. If the recipe context includes cuisine preference, suggest culturally appropriate alternatives

FORMAT:
- Keep responses short and actionable (3-4 sentences per substitute)
- Use bullet points for multiple options
- Always mention key differences (e.g., "Yogurt works but makes it tangier")

SAFETY RULES:
- ALWAYS warn about allergens in substitutes
- For baby food, mention if texture needs adjustment for age
- If unsure about baby food safety, recommend consulting pediatrician

IMPORTANT: DO NOT ask follow-up questions about child development, sleep, behavior, or parenting topics.
Focus ONLY on recipe and cooking help.
`;

const PROGRESS_CHECK_PROMPT = `
You are a supportive cooking coach providing feedback on cooking progress.

CONTEXT: The user is actively cooking and wants to verify their progress or get guidance.

GUIDELINES:
1. If they share a photo, analyze:
   - Color (is it browning correctly, is baby food the right shade?)
   - Texture (chunky vs smooth, crispy vs soggy)
   - Consistency (too thick/thin, properly mixed)
   - Safety concerns (undercooked, burning, choking hazards for baby food)

2. Provide specific, actionable next steps:
   - "Cook 3-5 more minutes until golden"
   - "Blend another 30 seconds for smoother texture"
   - "Add 2 tbsp water if too thick"

3. For baby food, emphasize:
   - Temperature safety (let cool before serving)
   - Texture appropriate for age (puree for 6mo, soft chunks for 10mo+)
   - Portion sizes
   - Storage safety if making batches

4. Be encouraging but honest about issues:
   - Start with validation: "This looks great so far!"
   - Then guide: "Just needs a bit more time to..."
   - End positively: "You're doing awesome!"

5. Ask clarifying questions if needed:
   - "What step are you on?"
   - "How long has it been cooking?"
   - "What's the texture like when you stir?"

FORMAT:
- Start with assessment (what you observe)
- Give 1-2 specific actions
- End with encouragement or next milestone

SAFETY RULES:
- For baby food, ALWAYS mention temperature checking
- Warn about choking hazards (hard pieces, round foods)
- If food looks unsafe, clearly state concerns

IMPORTANT: DO NOT ask follow-up questions about child development, sleep, behavior, or parenting topics.
Focus ONLY on recipe and cooking help.
`;


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
  systemPrompt: string,  // NEW: Accept custom system prompt
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
      content: `${systemPrompt}\n\nCURRENT CONTEXT:\n${contextPrompt}`  // Use provided systemPrompt
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

// =====================================================
// AFFILIATE PRODUCT ENRICHMENT
// =====================================================

interface AffiliateProduct {
  id: string;
  product_name: string;
  name_variants: string[];
  affiliate_url: string;
  image_url: string | null;
  price: number | null;
  category: string | null;
}

interface ProductMatch {
  originalText: string;
  productName: string;
  affiliate: AffiliateProduct | null;
}

/**
 * Extract bold product names from AI response
 * Matches patterns like **Product Name** or **Product Name Here**
 */
function extractBoldProductNames(response: string): string[] {
  const regex = /\*\*([^*]+)\*\*/g;
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(response)) !== null) {
    const text = match[1].trim();
    // Filter out non-product bold text (short phrases, common headers)
    if (text.length > 3 && !text.includes(':') && !text.match(/^(pro tip|important|note|warning)/i)) {
      matches.push(text);
    }
  }
  return matches;
}

/**
 * Find matching affiliate product for a product name
 */
async function findAffiliateMatch(
  supabase: any,
  productName: string
): Promise<AffiliateProduct | null> {
  const normalizedName = productName.toLowerCase().trim();

  // First, try exact match on product_name
  const { data: exactMatch } = await supabase
    .from('affiliate_products')
    .select('id, product_name, name_variants, affiliate_url, image_url, price, category')
    .eq('is_active', true)
    .ilike('product_name', `%${normalizedName}%`)
    .limit(1)
    .single();

  if (exactMatch) return exactMatch;

  // Try matching against name_variants using array contains
  const { data: variantMatches } = await supabase
    .from('affiliate_products')
    .select('id, product_name, name_variants, affiliate_url, image_url, price, category')
    .eq('is_active', true);

  if (variantMatches) {
    for (const product of variantMatches) {
      const variants = product.name_variants || [];
      for (const variant of variants) {
        if (normalizedName.includes(variant.toLowerCase()) ||
          variant.toLowerCase().includes(normalizedName)) {
          return product;
        }
      }
      // Also check if product_name is contained in the mention
      if (normalizedName.includes(product.product_name.toLowerCase())) {
        return product;
      }
    }
  }

  return null;
}

/**
 * Log product mention for analytics (which products are mentioned most)
 */
async function logProductMention(
  supabase: any,
  productName: string,
  hadAffiliate: boolean,
  sessionId: string,
  userId: string
): Promise<void> {
  try {
    await supabase.from('product_mentions_log').insert({
      product_name: productName,
      had_affiliate: hadAffiliate,
      session_id: sessionId,
      user_id: userId,
    });
  } catch (error) {
    console.error('Error logging product mention:', error);
  }
}

/**
 * Enrich AI response with affiliate product data
 * Returns modified response with product markers for frontend
 */
async function enrichWithAffiliateProducts(
  supabase: any,
  response: string,
  sessionId: string,
  userId: string
): Promise<{ enrichedResponse: string; products: ProductMatch[] }> {
  const boldNames = extractBoldProductNames(response);
  const products: ProductMatch[] = [];

  for (const productName of boldNames) {
    const affiliate = await findAffiliateMatch(supabase, productName);

    products.push({
      originalText: productName,
      productName: affiliate?.product_name || productName,
      affiliate,
    });

    // Log for analytics
    await logProductMention(supabase, productName, !!affiliate, sessionId, userId);
  }

  // If we have affiliate matches, add product markers to response
  // Format: [PRODUCT_CARD|id|name|price|url|image] (using pipe to avoid URL conflicts)
  let enrichedResponse = response;

  for (const product of products) {
    if (product.affiliate) {
      const marker = `\n[PRODUCT_CARD|${product.affiliate.id}|${product.affiliate.product_name}|${product.affiliate.price || ''}|${product.affiliate.affiliate_url}|${product.affiliate.image_url || ''}]`;
      // Add marker after the bold product name
      const boldPattern = `**${product.originalText}**`;
      const insertIndex = enrichedResponse.indexOf(boldPattern);
      if (insertIndex !== -1) {
        const insertPoint = insertIndex + boldPattern.length;
        // Find end of current sentence or line
        let sentenceEnd = enrichedResponse.indexOf('.', insertPoint);
        const lineEnd = enrichedResponse.indexOf('\n', insertPoint);
        if (sentenceEnd === -1 || (lineEnd !== -1 && lineEnd < sentenceEnd)) {
          sentenceEnd = lineEnd;
        }
        if (sentenceEnd === -1) sentenceEnd = enrichedResponse.length;

        // Insert marker after the sentence containing the product
        enrichedResponse =
          enrichedResponse.slice(0, sentenceEnd + 1) +
          marker +
          enrichedResponse.slice(sentenceEnd + 1);
      }
    }
  }

  return { enrichedResponse, products };
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
    const { userId, message, childId, sessionId, imageUrl, messageType, recipeMode } = body;

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

    // Select system prompt based on message type and recipe mode
    let systemPrompt = SYSTEM_PROMPT;
    if (messageType === 'recipe' && recipeMode) {
      const modePrompt = recipeMode === 'progress'
        ? PROGRESS_CHECK_PROMPT
        : INGREDIENT_HELP_PROMPT;
      systemPrompt = SYSTEM_PROMPT + "\n\n" + modePrompt;
      console.log(`Using ${recipeMode} mode prompt for recipe assistance`);
    }

    if (hasImage) {
      console.log("Processing vision request with image");
      // For images, use vision prompt + mode-specific guidance
      const visionSystemPrompt = messageType === 'recipe' && recipeMode
        ? VISION_SYSTEM_PROMPT + "\n\n" + (recipeMode === 'progress'
          ? PROGRESS_CHECK_PROMPT
          : INGREDIENT_HELP_PROMPT)
        : VISION_SYSTEM_PROMPT;

      aiResponse = await callOpenAIVision(visionSystemPrompt, contextPrompt, userMessageText, imageUrl);
    } else {
      aiResponse = await callDeepSeek(
        systemPrompt,
        contextPrompt,
        conversationHistory,
        userMessageText
      );
    }


    // Enrich AI response with affiliate product data (for general chat, not recipe mode)
    let finalResponse = aiResponse;
    if (messageType !== 'recipe') {
      try {
        const { enrichedResponse } = await enrichWithAffiliateProducts(
          supabase,
          aiResponse,
          session.id,
          userId
        );
        finalResponse = enrichedResponse;
      } catch (enrichError) {
        console.error("Affiliate enrichment error (non-fatal):", enrichError);
        // Continue with original response if enrichment fails
      }
    }

    // Save AI response (save enriched version)
    const responseId = await saveMessage(
      supabase,
      userId,
      finalResponse,
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
      response: finalResponse,
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
