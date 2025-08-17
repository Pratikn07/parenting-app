
🚀 SUPABASE DATABASE SETUP INSTRUCTIONS
=====================================

Project: Your Parenting Compass
URL: https://ccrgvammglkvdlaojgzv.supabase.co
Generated: 2025-08-17 12:25:09

STEP 1: Open Supabase Dashboard
------------------------------
1. Go to: https://ccrgvammglkvdlaojgzv.supabase.co
2. Navigate to "SQL Editor" in the left sidebar
3. Click "New Query"

STEP 2: Execute Setup SQL
------------------------
1. Copy the contents of the generated SQL file
2. Paste into the SQL Editor
3. Click "Run" to execute

STEP 3: Configure Authentication
-------------------------------
1. Go to "Authentication" > "Settings"
2. Enable Email authentication (should be enabled by default)
3. Configure OAuth providers:
   - Apple: Add Service ID, Key ID, Team ID, and private key
   - Google: Add OAuth client ID and secret
4. Set Site URL: yourapp://callback
5. Add Redirect URLs: yourapp://callback

STEP 4: Enable Realtime
----------------------
1. Go to "Database" > "Replication"
2. Enable realtime for these tables:
   - chat_messages (for live chat updates)
   - reminders (for notification updates)

STEP 5: Test the Setup
---------------------
1. Check that all tables were created in "Database" > "Tables"
2. Verify RLS policies in "Database" > "Policies"
3. Test RPC functions in "SQL Editor":
   
   SELECT * FROM search_articles(20, 'en-US', ARRAY['sleep']);

✅ VERIFICATION CHECKLIST
========================
□ Extensions enabled (uuid-ossp, pgcrypto, vector, pg_trgm)
□ All 12 tables created successfully
□ RLS policies applied to all tables
□ RPC functions created and working
□ Sample data inserted
□ Authentication providers configured
□ Realtime enabled for chat_messages
□ Frontend services updated

🎉 Your Supabase backend is ready!
