---
description: Create Notion documentation after implementing a feature
---

# Create Notion Documentation

After completing feature implementation, document it in Notion.

// turbo-all

1. **Prompt User for Confirmation**
   - Ask: "Would you like me to create Notion documentation for [Feature Name]?"
   
2. **If User Confirms, Create Pages via MCP**
   - **Database ID**: `49988446-70c3-4b22-8925-c72a999ef8b3`
   - **Step 1**: Create a parent page in the database for the feature.
     - Name: [Feature Name]
     - Status: "Implemented"
     - Date: Today
   - **Step 2**: Create "Product Brief" child page inside the parent page.
     - Use the Product Brief template structure.
   - **Step 3**: Create "Technical Implementation" child page inside the parent page.
     - Use the Technical Implementation template structure.
   
3. **Populate Technical Implementation**
   - List files changed (from git diff or memory)
   - List database migrations created
   - List dependencies added
   - Add testing notes
   
4. **For Product Brief**
   - Ask user to fill in manually OR
   - Pre-fill with basic information if available (Problem, Solution)

5. **Fallback (If MCP fails)**
   - Run: `node scripts/create-notion-doc.js "[Feature Name]"`
