---
description: Check the existing database schema before implementing features
---

# Check Database Schema

Before implementing any feature that involves database tables, you MUST check the existing schema to avoid creating duplicate tables or ignoring existing ones.

1. **Check for existing schema dump**:
   - Look for `.agent/schema_dump.sql` or `supabase/schema.sql`.

2. **Fetch current schema** (if dump is missing or old):
   - Run `supabase db dump --local --schema public` (if working locally) or `supabase db dump --linked --schema public` (if working with remote).
   - OR use the `list_tables` or `get_schema` tool if available via MCP.

3. **Analyze the Schema**:
   - Read the schema file.
   - Identify existing tables that match the domain of the feature you are implementing.
   - **DO NOT** create a new table if a semantically equivalent one exists (e.g., do not create `user_profiles` if `profiles` exists).

4. **Proceed**:
   - Only create new migrations if the table truly does not exist.
