const { Client } = require("@notionhq/client");

// Configuration
const NOTION_KEY = process.env.NOTION_KEY;
const DATABASE_ID = "49988446-70c3-4b22-8925-c72a999ef8b3";

const notion = new Client({ auth: NOTION_KEY });

const FEATURES = [
    {
        name: "Milestone Tracker",
        productBrief: {
            problem: "Parents struggle to know if their child is developing on track. They need a reliable, evidence-based way to monitor developmental progress (physical, cognitive, social, emotional) and celebrate achievements, as generic advice often lacks context.",
            solution: "A comprehensive Milestone Tracker integrated into the app. It provides age-specific milestones based on CDC/AAP guidelines, visualizes progress with rings and charts, allows for marking milestones as complete/incomplete, and filters by developmental category. It supports multiple children and adjusts milestones dynamically based on age.",
            metrics: [
                "User Engagement: % of DAU visiting the Milestones tab.",
                "Completion Rate: Average number of milestones marked complete per child per month.",
                "Retention: Correlation between milestone tracking frequency and D30 retention.",
                "Feature Adoption: % of users who complete at least one milestone within first 7 days."
            ]
        },
        technical: {
            architecture: "The feature follows a Service-Repository pattern. `MilestonesService` handles all business logic (fetching templates, calculating age, aggregating stats). The Frontend uses a dedicated `MilestonesScreen` and reusable components (`MilestoneCard`, `ProgressRing`). Data is fetched from Supabase, with `milestone_templates` serving as the immutable source of truth and `user_milestone_progress` storing user state.",
            files: [
                "src/services/milestones/MilestonesService.ts (Core logic)",
                "app/milestones.tsx (Main screen)",
                "app/(tabs)/_layout.tsx (Navigation)",
                "src/frontend/components/milestones/MilestoneCard.tsx (UI Component)",
                "src/frontend/components/milestones/ProgressRing.tsx (UI Component)",
                "src/frontend/components/milestones/CategoryStats.tsx (UI Component)",
                "src/frontend/components/milestones/MilestoneFilters.tsx (UI Component)",
                "src/frontend/screens/resources/ResourcesScreen.tsx (Integration)"
            ],
            database: "1. Created `milestone_templates` table: Stores static milestone definitions (title, description, category, age range).\n2. Created `user_milestone_progress` table: Links users/children to milestones with completion status and timestamps.\n3. Seeded 80+ milestones via `migrations/002_seed_milestone_templates.sql`.\n4. Added indexes on `child_id` and `template_id` for performance."
        }
    },
    {
        name: "Wizard Onboarding Enhancements",
        productBrief: {
            problem: "The initial onboarding flow was limited to 4 parenting stages (expecting, newborn, infant, toddler). Users with 'Preschool' (3-5y) or 'School Age' (5y+) children could select these options in the UI, but the backend would silently fail to save their profile because the database enum did not support these values.",
            solution: "Extended the entire stack to support 6 parenting stages. This ensures that parents of older children can successfully onboard, have their profiles saved correctly, and receive relevant content. The UI was already capable, but the data layer was the bottleneck.",
            metrics: [
                "Onboarding Completion Rate: Increase in completion rate for users selecting Preschool/School Age.",
                "Data Integrity: 0% error rate for profile creation in new stages.",
                "User Acquisition: Increase in successful sign-ups from parents with older children."
            ]
        },
        technical: {
            architecture: "This was a full-stack refactor of the `ParentingStage` type definition. It required updating the Supabase Database Enum, the generated TypeScript types, the shared Auth types, the Zustand store, and the Constants file to ensure consistency across the application.",
            files: [
                "supabase/migrations/20251201000003_add_parenting_stages.sql (DB Migration)",
                "src/lib/database.types.ts (Type Definitions)",
                "src/shared/types/auth.types.ts (Auth Interfaces)",
                "src/shared/stores/authStore.ts (State Management)",
                "src/lib/constants.ts (App Constants)",
                "src/frontend/screens/wizard/components/StepChildProfile.tsx (UI)"
            ],
            database: "Executed `ALTER TYPE parenting_stage ADD VALUE 'preschool'` and `ALTER TYPE parenting_stage ADD VALUE 'school'` to expand the Postgres enum."
        }
    },
    {
        name: "Articles & Resources System",
        productBrief: {
            problem: "The app needed a way to deliver high-quality, curated parenting content. Hardcoded content is not scalable or easily updateable. Users need to search, filter, and save articles relevant to their specific needs.",
            solution: "A dynamic Articles & Resources system backed by a database. It supports rich content (Markdown/HTML), categorization (Sleep, Feeding, etc.), reading time estimates, and search functionality. It also includes a 'Saved Articles' feature for bookmarking.",
            metrics: [
                "Content Consumption: Average articles read per user per week.",
                "Search Usage: % of sessions involving a resource search.",
                "Save Rate: % of articles saved after reading.",
                "Time on Screen: Average time spent in the Resources tab."
            ]
        },
        technical: {
            architecture: "The `ResourcesService` acts as the data layer, fetching articles from Supabase. The `ResourcesScreen` is the presentation layer, handling tab switching (Next Steps vs Library), search state, and category filtering. Content is rendered dynamically based on database records.",
            files: [
                "src/services/resources/ResourcesService.ts (Data Fetching)",
                "src/frontend/screens/resources/ResourcesScreen.tsx (UI)",
                "migrations/004_create_articles_table.sql (Schema)",
                "migrations/003_saved_articles.sql (Bookmarking)"
            ],
            database: "1. Created `articles` table: id, title, content, category, author, read_time, published_at.\n2. Created `saved_articles` table: user_id, article_id, saved_at.\n3. Implemented RLS policies for public read access to articles."
        }
    },
    {
        name: "Chat Context Awareness",
        productBrief: {
            problem: "The AI assistant gave generic advice because it didn't know *who* the parent was asking about. A parent asking 'Why is he crying?' needs different answers for a newborn vs. a toddler.",
            solution: "Implemented Context Injection. The Chat system now automatically retrieves the currently selected child's profile (Age, Name, Stage) and injects this as a system prompt context before sending the user's message to the LLM. This results in highly personalized, age-appropriate advice.",
            metrics: [
                "Response Relevance: User feedback ratings (thumbs up/down) on chat responses.",
                "Session Length: Number of turns per conversation.",
                "Retention: Repeat usage of the Chat feature."
            ]
        },
        technical: {
            architecture: "Modified `ChatService.sendMessage` to intercept the request. It calls `ChildService` to get the active child's details. It then constructs a 'System Context' string (e.g., 'Context: Child is 2 months old, Stage: Newborn') and prepends it to the message history sent to the Edge Function.",
            files: [
                "src/services/chat/ChatService.ts (Context Logic)",
                "src/frontend/components/chat/ChildSelector.tsx (Context Switching UI)",
                "supabase/functions/chat/index.ts (Edge Function)",
                "src/shared/stores/childStore.ts (State)"
            ],
            database: "No schema changes. Leverages existing `children` table queries to fetch context data dynamically at runtime."
        }
    }
];

async function createFeatureDoc(feature) {
    try {
        console.log(`Creating detailed documentation for: "${feature.name}"...`);

        // 1. Create Parent Page
        const parentPage = await notion.pages.create({
            parent: { database_id: DATABASE_ID },
            properties: {
                Name: {
                    title: [{ text: { content: feature.name } }],
                },
            },
        });

        // 2. Create Product Brief
        await notion.pages.create({
            parent: { page_id: parentPage.id },
            properties: {
                title: [{ text: { content: "📋 Product Brief" } }],
            },
            children: [
                {
                    heading_2: { rich_text: [{ text: { content: "Problem Statement" } }] },
                },
                {
                    paragraph: { rich_text: [{ text: { content: feature.productBrief.problem } }] },
                },
                {
                    heading_2: { rich_text: [{ text: { content: "Solution Overview" } }] },
                },
                {
                    paragraph: { rich_text: [{ text: { content: feature.productBrief.solution } }] },
                },
                {
                    heading_2: { rich_text: [{ text: { content: "Success Metrics" } }] },
                },
                {
                    bulleted_list_item: { rich_text: [{ text: { content: feature.productBrief.metrics[0] || "N/A" } }] },
                },
                ...(feature.productBrief.metrics.slice(1).map(metric => ({
                    bulleted_list_item: { rich_text: [{ text: { content: metric } }] }
                })))
            ],
        });

        // 3. Create Technical Implementation
        await notion.pages.create({
            parent: { page_id: parentPage.id },
            properties: {
                title: [{ text: { content: "🔧 Technical Implementation" } }],
            },
            children: [
                {
                    heading_2: { rich_text: [{ text: { content: "Architecture Overview" } }] },
                },
                {
                    paragraph: { rich_text: [{ text: { content: feature.technical.architecture } }] },
                },
                {
                    heading_2: { rich_text: [{ text: { content: "Files Changed" } }] },
                },
                {
                    bulleted_list_item: { rich_text: [{ text: { content: feature.technical.files[0] || "None" } }] },
                },
                ...(feature.technical.files.slice(1).map(file => ({
                    bulleted_list_item: { rich_text: [{ text: { content: file } }] }
                }))),
                {
                    heading_2: { rich_text: [{ text: { content: "Database Changes" } }] },
                },
                {
                    paragraph: { rich_text: [{ text: { content: feature.technical.database } }] },
                },
            ],
        });

        console.log(`✅ Completed: ${feature.name}`);

    } catch (error) {
        console.error(`Error creating doc for ${feature.name}:`, error.message);
    }
}

async function syncAll() {
    console.log("Starting detailed documentation sync...");
    for (const feature of FEATURES) {
        await createFeatureDoc(feature);
    }
    console.log("\n🎉 All detailed documentation synced to Notion!");
}

syncAll();
