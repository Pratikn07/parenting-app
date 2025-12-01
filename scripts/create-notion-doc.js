const { Client } = require("@notionhq/client");

// Configuration
const NOTION_KEY = process.env.NOTION_KEY;
const DATABASE_ID = "49988446-70c3-4b22-8925-c72a999ef8b3";

const notion = new Client({ auth: NOTION_KEY });

const featureName = process.argv[2];

if (!featureName) {
    console.error("Please provide a feature name.");
    console.error("Usage: node scripts/create-notion-doc.js \"Feature Name\"");
    process.exit(1);
}

async function createDocs() {
    try {
        console.log(`Creating documentation for: "${featureName}"...`);

        // 1. Create Parent Page in Database
        const parentPage = await notion.pages.create({
            parent: { database_id: DATABASE_ID },
            properties: {
                Name: {
                    title: [
                        {
                            text: {
                                content: featureName,
                            },
                        },
                    ],
                },
                // Only using Name for now to ensure stability
            },
        });

        console.log(`✅ Created parent page: ${parentPage.url}`);

        // 2. Create Product Brief Child Page
        await notion.pages.create({
            parent: { page_id: parentPage.id },
            properties: {
                title: [
                    {
                        text: {
                            content: "📋 Product Brief",
                        },
                    },
                ],
            },
            children: [
                {
                    heading_2: {
                        rich_text: [{ text: { content: "Problem Statement" } }],
                    },
                },
                {
                    paragraph: {
                        rich_text: [{ text: { content: "What user need does this solve?" } }],
                    },
                },
                {
                    heading_2: {
                        rich_text: [{ text: { content: "Solution Overview" } }],
                    },
                },
                {
                    paragraph: {
                        rich_text: [{ text: { content: "How does this feature address the problem?" } }],
                    },
                },
                {
                    heading_2: {
                        rich_text: [{ text: { content: "Success Metrics" } }],
                    },
                },
                {
                    bulleted_list_item: {
                        rich_text: [{ text: { content: "Metric 1" } }],
                    },
                },
            ],
        });

        console.log("✅ Created Product Brief");

        // 3. Create Technical Implementation Child Page
        await notion.pages.create({
            parent: { page_id: parentPage.id },
            properties: {
                title: [
                    {
                        text: {
                            content: "🔧 Technical Implementation",
                        },
                    },
                ],
            },
            children: [
                {
                    heading_2: {
                        rich_text: [{ text: { content: "Architecture Overview" } }],
                    },
                },
                {
                    paragraph: {
                        rich_text: [{ text: { content: "High-level description of technical approach" } }],
                    },
                },
                {
                    heading_2: {
                        rich_text: [{ text: { content: "Files Changed" } }],
                    },
                },
                {
                    bulleted_list_item: {
                        rich_text: [{ text: { content: "List files here..." } }],
                    },
                },
                {
                    heading_2: {
                        rich_text: [{ text: { content: "Database Changes" } }],
                    },
                },
                {
                    paragraph: {
                        rich_text: [{ text: { content: "None" } }],
                    },
                },
            ],
        });

        console.log("✅ Created Technical Implementation Doc");
        console.log("\n🎉 Documentation setup complete!");

    } catch (error) {
        console.error("Error:", error.message);
    }
}

createDocs();
